"""Pure-Python UI-format -> API-format workflow converter.

Re-implements the core of ComfyUI's frontend `graphToPrompt()` in Python so
that the common cases (including subgraph expansion) require no headless
browser. The Playwright path in `browser.py` is retained as a fallback for
the few cases that need JS to run -- specifically:

- Custom-node widget `serializeValue` callbacks (transform widget value at
  serialize time).
- Custom-node dynamic input topology (JS adds/removes input slots based on
  widget state).
- Legacy `extra.groupNodes` (collapsed multi-node visuals).

`convert()` raises `UnsupportedFeature` when it detects something it cannot
faithfully reproduce; the caller can then fall back to Playwright.

The converter delegates widget-order discovery to `/object_info` (which the
running ComfyUI server already publishes), so it stays correct as custom
nodes come and go without needing a private node registry.
"""

from __future__ import annotations

from typing import Any


SUBGRAPH_INPUT_ID = -10   # ComfyUI's frontend uses -10 / -20 for subgraph interface nodes
SUBGRAPH_OUTPUT_ID = -20

# Visual-only / virtual frontend nodes that never reach the executor.
# (PrimitiveNode is removed here -- it's handled by _inline_primitive_nodes
# which folds its value into downstream slots before this set is consulted.)
VIRTUAL_NODE_TYPES = frozenset({
    "MarkdownNote",
    "Note",
})

# Modes that mean "skip me when building the prompt".
MODE_NEVER = 2
MODE_BYPASS = 4


class UnsupportedFeature(Exception):
    """Raised when the workflow contains a feature we don't model in Python."""

    def __init__(self, reasons: list[str]):
        super().__init__("; ".join(reasons))
        self.reasons = reasons


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _normalize_link(link: Any) -> dict[str, Any] | None:
    """Top-level link array OR inner subgraph link object -> dict form."""
    if isinstance(link, list) and len(link) >= 5:
        return {
            "id": link[0],
            "origin_id": link[1],
            "origin_slot": link[2],
            "target_id": link[3],
            "target_slot": link[4],
            "type": link[5] if len(link) > 5 else "",
        }
    if isinstance(link, dict) and "origin_id" in link and "target_id" in link:
        return dict(link)
    return None


def _widget_names_for_class(class_name: str, object_info: dict) -> list[str]:
    """Ordered widget-name list for a class, matching widgets_values ordering.

    Mirrors the frontend's rule:
    - iterate `input.required` then `input.optional` in dict-insertion order
    - count an input as a widget when its type is a list (combo) or one of
      the primitive types INT/FLOAT/STRING/BOOLEAN
    - options.forceInput drops a widget out of the widget array
    - if a widget option says control_after_generate, a synthetic
      "control_after_generate" widget follows immediately
    - options.serialize === False excludes the widget from serialization.
    """
    spec = object_info.get(class_name) or {}
    sections = spec.get("input") or {}
    widget_names: list[str] = []
    for section in ("required", "optional"):
        for name, val in (sections.get(section) or {}).items():
            if not isinstance(val, (list, tuple)) or not val:
                continue
            type_ = val[0]
            opts = val[1] if len(val) > 1 and isinstance(val[1], dict) else {}
            is_combo = isinstance(type_, (list, tuple))
            is_primitive = isinstance(type_, str) and type_ in (
                "INT", "FLOAT", "STRING", "BOOLEAN",
            )
            if not (is_combo or is_primitive):
                continue
            if opts.get("forceInput"):
                continue
            if opts.get("serialize") is False:
                continue
            widget_names.append(name)
            if opts.get("control_after_generate"):
                widget_names.append("control_after_generate")
    return widget_names


def _coerce_value(value: Any) -> Any:
    """Apply the {__value__: ...} wrap that ComfyUI uses for raw array widget values.

    The backend unwraps this at execution time. Without the wrap, a 2-element
    array would be misread as a [node_id, slot] connection.
    """
    if isinstance(value, list):
        return {"__value__": value}
    return value


# ---------------------------------------------------------------------------
# Subgraph expansion
# ---------------------------------------------------------------------------


def _expand_subgraphs(
    workflow: dict,
) -> tuple[list[dict], list[dict]]:
    """Flatten all subgraph instances in `workflow` into a single node list + link list.

    Algorithm:
      1. Build {subgraph_id: definition}.
      2. Walk the top-level node list. For each node whose `type` matches a
         subgraph definition id, splice the inner nodes in with renumbered
         IDs and translate the inner links.
      3. Interface links inside the subgraph (origin_id == -10 / target_id == -20)
         are rewired to / from the outer connections through the subgraph
         instance's input/output slots.
      4. Outer links that terminated on the subgraph instance are rewritten
         to target the corresponding inner node + slot.
      5. Repeat until no top-level node references a subgraph (handles
         nested subgraphs).

    Returns (flat_nodes, flat_links_normalized).
    """
    defs = {
        sg["id"]: sg
        for sg in (workflow.get("definitions") or {}).get("subgraphs") or []
    }

    nodes: list[dict] = list(workflow.get("nodes") or [])
    raw_links = workflow.get("links") or []
    links: list[dict] = [nl for nl in (_normalize_link(l) for l in raw_links) if nl]

    if not defs:
        return nodes, links

    # ID space: derive new ids from the outer-node id so the result is stable
    # across runs (no Date.now / Math.random in workflow scripts).
    def _remap(outer_node_id: int, inner_id: int) -> int:
        return outer_node_id * 100_000 + inner_id

    # Each iteration expands one subgraph instance. Real workflows expand
    # in O(total subgraph instances) -- including nested ones, which appear
    # in subsequent iterations after their parent expands. The bound here
    # is a safety net against pathological/cyclic subgraph definitions, not
    # a usability cap: it must be loose enough to cover any reasonable
    # workflow. 1024 covers every shipping template (max observed: 33).
    for _step in range(1024):
        # Find a subgraph instance to expand.
        target_idx = None
        for i, node in enumerate(nodes):
            if node.get("type") in defs:
                target_idx = i
                break
        if target_idx is None:
            break

        outer = nodes[target_idx]
        sg = defs[outer["type"]]
        outer_id = outer["id"]

        # Inner links -> normalized form.
        inner_links = [
            l for l in (_normalize_link(l) for l in (sg.get("links") or []))
            if l
        ]

        # Resolve outer connections for each subgraph interface input.
        # `interface_inputs[i]` is fed by either:
        #   - an outer link landing on outer.inputs[i] (the slot with the matching name), or
        #   - the inner node's widget default (no external connection).
        iface_inputs = sg.get("inputs") or []
        outer_inputs = outer.get("inputs") or []
        outer_input_by_name = {s.get("name"): s for s in outer_inputs}
        external_for_iface_input: dict[int, tuple[int, int]] = {}
        for iface_idx, iface in enumerate(iface_inputs):
            outer_slot = outer_input_by_name.get(iface.get("name"))
            if not outer_slot:
                continue
            link_id = outer_slot.get("link")
            if link_id is None:
                continue
            for l in links:
                if l["id"] == link_id:
                    external_for_iface_input[iface_idx] = (
                        l["origin_id"], l["origin_slot"],
                    )
                    break

        # Resolve the inner producer for each interface output.
        iface_output_origin: dict[int, tuple[int, int]] = {}
        for il in inner_links:
            if il["target_id"] == SUBGRAPH_OUTPUT_ID:
                iface_idx = il["target_slot"]
                iface_output_origin[iface_idx] = (
                    _remap(outer_id, il["origin_id"]),
                    il["origin_slot"],
                )

        # Build new links from inner links + interface inputs, AND track
        # how each old inner link id maps to its post-expansion id. The
        # inner nodes' input slots still carry the old IDs in their
        # `link` fields; we have to rewrite those too, or the per-node
        # converter can't find the connection.
        new_links: list[dict] = []
        inner_link_id_remap: dict[int, int | None] = {}
        # Stable new link IDs that don't collide with outer link IDs.
        next_link_id = 10_000_000 + outer_id * 10_000
        for il in inner_links:
            origin = il["origin_id"]
            target = il["target_id"]
            old_id = il["id"]
            if origin == SUBGRAPH_INPUT_ID:
                # interface input -> inner target
                iface_idx = il["origin_slot"]
                ext = external_for_iface_input.get(iface_idx)
                if ext is None:
                    # No external connection; inner target's widget default applies.
                    inner_link_id_remap[old_id] = None
                    continue
                ext_origin_id, ext_origin_slot = ext
                new_id = next_link_id
                next_link_id += 1
                inner_link_id_remap[old_id] = new_id
                new_links.append({
                    "id": new_id,
                    "origin_id": ext_origin_id,
                    "origin_slot": ext_origin_slot,
                    "target_id": _remap(outer_id, target),
                    "target_slot": il["target_slot"],
                    "type": il.get("type", ""),
                })
            elif target == SUBGRAPH_OUTPUT_ID:
                # interface output -- captured in iface_output_origin; the inner
                # producer's output.links entry on the inner node points at this
                # link, but per-node converter only looks at input.link, so we
                # don't need to track this one in the remap.
                inner_link_id_remap[old_id] = None
            else:
                new_id = _remap(outer_id, old_id)
                inner_link_id_remap[old_id] = new_id
                new_links.append({
                    "id": new_id,
                    "origin_id": _remap(outer_id, origin),
                    "origin_slot": il["origin_slot"],
                    "target_id": _remap(outer_id, target),
                    "target_slot": il["target_slot"],
                    "type": il.get("type", ""),
                })

        # Splice in inner nodes with remapped IDs, and rewrite each input
        # slot's `link` field through inner_link_id_remap so per-node
        # conversion finds the new link in the table.
        inner_renumbered = []
        for inner_node in sg.get("nodes") or []:
            copy = dict(inner_node)
            copy["id"] = _remap(outer_id, inner_node["id"])
            new_node_inputs = []
            for slot in (copy.get("inputs") or []):
                new_slot = dict(slot)
                lid = new_slot.get("link")
                if lid is not None:
                    new_slot["link"] = inner_link_id_remap.get(lid)
                new_node_inputs.append(new_slot)
            copy["inputs"] = new_node_inputs
            inner_renumbered.append(copy)

        # 6. Rewrite outer links that started at the subgraph instance's outputs.
        outer_outputs = outer.get("outputs") or []
        rewritten_outer_links: list[dict] = []
        for l in links:
            # Skip the link iff it terminates on the subgraph instance --
            # those targets are dead now (replaced by interface-input edges).
            if l["target_id"] == outer_id:
                continue
            if l["origin_id"] == outer_id:
                out_idx = l["origin_slot"]
                if out_idx < len(outer_outputs) and out_idx in iface_output_origin:
                    new_origin_id, new_origin_slot = iface_output_origin[out_idx]
                    rewritten_outer_links.append({
                        "id": l["id"],
                        "origin_id": new_origin_id,
                        "origin_slot": new_origin_slot,
                        "target_id": l["target_id"],
                        "target_slot": l["target_slot"],
                        "type": l.get("type", ""),
                    })
                # else: orphan output, drop
                continue
            rewritten_outer_links.append(l)

        # 7. Apply the splice.
        nodes = nodes[:target_idx] + inner_renumbered + nodes[target_idx + 1:]
        links = rewritten_outer_links + new_links

    else:
        # Loop exhausted without convergence -- pathological / cyclic input.
        raise UnsupportedFeature(["subgraph expansion did not converge within 1024 steps"])

    return nodes, links


# ---------------------------------------------------------------------------
# Per-node conversion
# ---------------------------------------------------------------------------


def _convert_node(
    node: dict,
    link_table: dict[int, dict],
    object_info: dict,
) -> dict | None:
    class_type = node.get("type")
    if not class_type:
        return None
    if class_type in VIRTUAL_NODE_TYPES:
        return None
    mode = node.get("mode", 0)
    if mode in (MODE_NEVER, MODE_BYPASS):
        return None

    # Reroute traversal would belong here. The detection happens earlier so
    # we never reach this point with reroutes in the link graph.

    inputs: dict[str, Any] = {}
    widget_names = _widget_names_for_class(class_type, object_info)
    widget_values = node.get("widgets_values") or []
    widget_idx = {name: i for i, name in enumerate(widget_names)}

    # 1. Walk the input slots. Each slot is either:
    #    - a real socket (has a link) -> emit [origin_id, origin_slot]
    #    - a widget converted to socket (`widget: {name}`) with NO link ->
    #      use the corresponding widgets_values entry as the value
    #    - fed by a PrimitiveNode (we already inlined its value as
    #      slot[_INLINE_MARKER]) -> use that value
    promoted: set[str] = set()
    for slot in node.get("inputs") or []:
        slot_name = slot.get("name")
        widget_ref = slot.get("widget")
        link_id = slot.get("link")
        if widget_ref:
            promoted.add(widget_ref.get("name"))
        if _INLINE_MARKER in slot:
            inputs[slot_name] = _coerce_value(slot[_INLINE_MARKER])
            continue
        if link_id is not None:
            link = link_table.get(link_id)
            if link:
                inputs[slot_name] = [
                    str(link["origin_id"]),
                    int(link["origin_slot"]),
                ]
        elif widget_ref:
            wname = widget_ref.get("name")
            if wname in widget_idx:
                idx = widget_idx[wname]
                if idx < len(widget_values):
                    inputs[slot_name] = _coerce_value(widget_values[idx])

    # 2. Walk widgets that weren't promoted to sockets -- emit them as inputs.
    for name in widget_names:
        if name in promoted:
            continue
        if name in inputs:
            continue
        idx = widget_idx[name]
        if idx >= len(widget_values):
            continue
        inputs[name] = _coerce_value(widget_values[idx])

    return {
        "inputs": inputs,
        "class_type": class_type,
        "_meta": {"title": node.get("title") or class_type},
    }


# ---------------------------------------------------------------------------
# Reroute collapsing
# ---------------------------------------------------------------------------


def _collapse_reroutes(
    nodes: list[dict],
    links: list[dict],
) -> tuple[list[dict], list[dict]]:
    """Eliminate Reroute pseudo-nodes by rewriting their downstream links to
    point at the real producer.

    Reroute is a frontend-only visual aid: one input, one output, identity
    semantics. The executor never sees it. graphToPrompt walks past it via
    `parent.updateLink(link)`; we do the equivalent here by following the
    chain from any Reroute output back to the first non-Reroute origin.

    Disconnected Reroutes (or unresolvable chains) produce dropped links.
    Cycles -- malformed input -- also produce dropped links rather than
    infinite recursion.
    """
    reroute_ids = {n["id"] for n in nodes if n.get("type") == "Reroute"}
    if not reroute_ids:
        return nodes, links

    # Index incoming links to Reroutes by target id.
    incoming_to_reroute: dict[int, dict] = {}
    for l in links:
        if l["target_id"] in reroute_ids:
            incoming_to_reroute[l["target_id"]] = l

    def resolve(origin_id: int, origin_slot: int, visited: set[int]) -> tuple[int, int] | None:
        if origin_id not in reroute_ids:
            return (origin_id, origin_slot)
        if origin_id in visited:
            return None
        visited.add(origin_id)
        incoming = incoming_to_reroute.get(origin_id)
        if not incoming:
            return None  # disconnected reroute
        return resolve(incoming["origin_id"], incoming["origin_slot"], visited)

    new_links: list[dict] = []
    for l in links:
        # Drop links whose target is being eliminated.
        if l["target_id"] in reroute_ids:
            continue
        if l["origin_id"] in reroute_ids:
            resolved = resolve(l["origin_id"], l["origin_slot"], set())
            if resolved is None:
                continue
            l = dict(l)
            l["origin_id"], l["origin_slot"] = resolved
        new_links.append(l)

    new_nodes = [n for n in nodes if n.get("type") != "Reroute"]
    return new_nodes, new_links


# ---------------------------------------------------------------------------
# PrimitiveNode inlining (legacy widget-as-node)
# ---------------------------------------------------------------------------

# Marker key we attach to a downstream input slot to carry a primitive's
# widget value through to per-node conversion. The marker is namespaced so
# it cannot collide with any field ComfyUI itself uses.
_INLINE_MARKER = "_cpe_inline_value"


def _inline_primitive_nodes(
    nodes: list[dict],
    links: list[dict],
) -> tuple[list[dict], list[dict]]:
    """Fold legacy `PrimitiveNode` outputs into downstream widget inputs.

    PrimitiveNode is the old "widget-as-its-own-node" pattern: when a user
    right-clicks a widget and chooses "Convert widget to input", a
    PrimitiveNode can be connected to that socket to feed a value through.
    The executor never sees the PrimitiveNode -- ComfyUI's frontend folds
    its widget value back onto the downstream node as if the input were
    still a normal widget.

    We do the same here: every link from a PrimitiveNode is replaced by
    an inline-value marker on the downstream input slot, and the
    PrimitiveNode itself plus its links are dropped from the graph.

    NOTE: `PrimitiveString`, `PrimitiveStringMultiline`, `PrimitiveInt`,
    etc. are NOT legacy PrimitiveNodes -- they are normal registered
    classes whose outputs participate in execution like any other node.
    Only the bare `PrimitiveNode` type is rewritten here.
    """
    primitives = {n["id"]: n for n in nodes if n.get("type") == "PrimitiveNode"}
    if not primitives:
        return nodes, links

    # widgets_values[0] holds the value. PrimitiveNode also stores a type
    # marker at widgets_values[1] in some workflow versions; we only need
    # the value.
    link_value: dict[int, Any] = {}
    for l in links:
        if l["origin_id"] in primitives:
            p = primitives[l["origin_id"]]
            wv = p.get("widgets_values") or []
            link_value[l["id"]] = wv[0] if wv else None

    new_nodes: list[dict] = []
    for n in nodes:
        if n.get("type") == "PrimitiveNode":
            continue
        copy = dict(n)
        new_inputs = []
        for slot in (copy.get("inputs") or []):
            lid = slot.get("link")
            if lid is not None and lid in link_value:
                new_slot = dict(slot)
                new_slot["link"] = None
                new_slot[_INLINE_MARKER] = link_value[lid]
                new_inputs.append(new_slot)
            else:
                new_inputs.append(slot)
        copy["inputs"] = new_inputs
        new_nodes.append(copy)

    new_links = [
        l for l in links
        if l["origin_id"] not in primitives and l["target_id"] not in primitives
    ]
    return new_nodes, new_links


# ---------------------------------------------------------------------------
# UI-format flattening (for clients that don't render subgraph instances)
# ---------------------------------------------------------------------------


def _link_to_array(l: dict) -> list:
    return [l["id"], l["origin_id"], l["origin_slot"],
            l["target_id"], l["target_slot"], l.get("type", "")]


def flatten_ui(workflow: dict) -> dict:
    """Return a UI-format workflow with subgraph instances expanded into
    their inner nodes.

    Mobile / lightweight UIs that haven't yet learned the subgraph instance
    node type render it as `UNKNOWN_NODE`. For those clients we serve a
    pre-expanded UI workflow whose top-level nodes are the operational
    nodes themselves -- visually identical to executing the subgraph but
    rendered with the normal per-node widget cards.

    Idempotent: if the workflow has no subgraphs, it is returned unchanged.
    Preserves canvas positions (inner nodes are offset by where the
    subgraph instance sat in the outer canvas), input/output slot link
    references (translated to the new link ID space), and all other UI
    fields the editor depends on.
    """
    if not isinstance(workflow, dict):
        return workflow
    if not (workflow.get("definitions") or {}).get("subgraphs"):
        return workflow

    defs = {sg["id"]: sg for sg in workflow["definitions"]["subgraphs"]}
    nodes = list(workflow.get("nodes") or [])
    raw_links = workflow.get("links") or []
    links = [nl for nl in (_normalize_link(l) for l in raw_links) if nl]

    def remap(outer_id: int, inner_id: int) -> int:
        return outer_id * 100_000 + inner_id

    for _step in range(1024):
        target_idx = next(
            (i for i, n in enumerate(nodes) if n.get("type") in defs),
            None,
        )
        if target_idx is None:
            break

        outer = nodes[target_idx]
        sg = defs[outer["type"]]
        outer_id = outer["id"]
        outer_pos = outer.get("pos") or [0, 0]
        offset_x, offset_y = (outer_pos[0] or 0), (outer_pos[1] or 0)

        iface_inputs = sg.get("inputs") or []
        outer_input_by_name = {s.get("name"): s for s in (outer.get("inputs") or [])}
        external_for_iface: dict[int, tuple[int, int]] = {}
        for iface_idx, iface in enumerate(iface_inputs):
            s = outer_input_by_name.get(iface.get("name"))
            if not s:
                continue
            lid = s.get("link")
            if lid is None:
                continue
            match = next((l for l in links if l["id"] == lid), None)
            if match:
                external_for_iface[iface_idx] = (match["origin_id"], match["origin_slot"])

        inner_links = [l for l in (_normalize_link(l) for l in (sg.get("links") or [])) if l]
        iface_output_origin: dict[int, tuple[int, int]] = {}
        for il in inner_links:
            if il["target_id"] == SUBGRAPH_OUTPUT_ID:
                iface_output_origin[il["target_slot"]] = (
                    remap(outer_id, il["origin_id"]),
                    il["origin_slot"],
                )

        new_links: list[dict] = []
        inner_link_remap: dict[int, int | None] = {}
        next_link_id = 10_000_000 + outer_id * 10_000
        for il in inner_links:
            origin, target, old_id = il["origin_id"], il["target_id"], il["id"]
            if origin == SUBGRAPH_INPUT_ID:
                ext = external_for_iface.get(il["origin_slot"])
                if ext is None:
                    inner_link_remap[old_id] = None
                    continue
                new_id = next_link_id; next_link_id += 1
                inner_link_remap[old_id] = new_id
                new_links.append({
                    "id": new_id,
                    "origin_id": ext[0], "origin_slot": ext[1],
                    "target_id": remap(outer_id, target), "target_slot": il["target_slot"],
                    "type": il.get("type", ""),
                })
            elif target == SUBGRAPH_OUTPUT_ID:
                inner_link_remap[old_id] = None
            else:
                new_id = remap(outer_id, old_id)
                inner_link_remap[old_id] = new_id
                new_links.append({
                    "id": new_id,
                    "origin_id": remap(outer_id, origin), "origin_slot": il["origin_slot"],
                    "target_id": remap(outer_id, target), "target_slot": il["target_slot"],
                    "type": il.get("type", ""),
                })

        # Remap inner nodes + rewrite both input.link and output.links lists.
        inner_renumbered = []
        for inner_node in sg.get("nodes") or []:
            copy = dict(inner_node)
            copy["id"] = remap(outer_id, inner_node["id"])
            new_inputs = []
            for slot in (copy.get("inputs") or []):
                new_slot = dict(slot)
                lid = new_slot.get("link")
                if lid is not None:
                    new_slot["link"] = inner_link_remap.get(lid)
                new_inputs.append(new_slot)
            copy["inputs"] = new_inputs
            new_outputs = []
            for slot in (copy.get("outputs") or []):
                new_slot = dict(slot)
                new_slot["links"] = [
                    inner_link_remap.get(lid) for lid in (slot.get("links") or [])
                    if inner_link_remap.get(lid) is not None
                ]
                new_outputs.append(new_slot)
            copy["outputs"] = new_outputs
            pos = copy.get("pos") or [0, 0]
            copy["pos"] = [pos[0] + offset_x, pos[1] + offset_y]
            inner_renumbered.append(copy)

        # Rewrite outer links: drop those that landed on the subgraph instance,
        # redirect those that originated from it through iface_output_origin.
        out_links: list[dict] = []
        for l in links:
            if l["target_id"] == outer_id:
                continue
            if l["origin_id"] == outer_id:
                iout = l["origin_slot"]
                if iout in iface_output_origin:
                    new_origin_id, new_origin_slot = iface_output_origin[iout]
                    out_links.append({
                        "id": l["id"],
                        "origin_id": new_origin_id, "origin_slot": new_origin_slot,
                        "target_id": l["target_id"], "target_slot": l["target_slot"],
                        "type": l.get("type", ""),
                    })
                continue
            out_links.append(l)

        nodes = nodes[:target_idx] + inner_renumbered + nodes[target_idx + 1:]
        links = out_links + new_links

    flat = dict(workflow)
    flat["nodes"] = nodes
    flat["links"] = [_link_to_array(l) for l in links]
    flat["definitions"] = {"subgraphs": []}
    flat["last_node_id"] = max((n["id"] for n in nodes), default=workflow.get("last_node_id", 0))
    flat["last_link_id"] = max((l["id"] for l in links), default=workflow.get("last_link_id", 0))
    return flat


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def convert(workflow_data: dict, object_info: dict) -> dict[str, Any]:
    """Convert a UI-format workflow dict into ComfyUI's API-format dict.

    Raises:
        UnsupportedFeature: workflow uses a feature we don't model.
    """
    if not isinstance(workflow_data, dict):
        raise UnsupportedFeature(["workflow root is not an object"])

    unsupported: list[str] = []

    # Group nodes (legacy collapsed multi-node visuals) need frontend logic
    # to expand into their inner nodes.
    if (workflow_data.get("extra") or {}).get("groupNodes"):
        unsupported.append("legacy extra.groupNodes")

    if unsupported:
        raise UnsupportedFeature(unsupported)

    flat_nodes, flat_links = _expand_subgraphs(workflow_data)
    flat_nodes, flat_links = _collapse_reroutes(flat_nodes, flat_links)
    flat_nodes, flat_links = _inline_primitive_nodes(flat_nodes, flat_links)

    link_table = {l["id"]: l for l in flat_links}

    output: dict[str, Any] = {}
    for node in flat_nodes:
        api_node = _convert_node(node, link_table, object_info)
        if api_node is None:
            continue
        output[str(node["id"])] = api_node

    # Clean up: drop any input referencing a node we dropped (BYPASS / virtual).
    for nid, ndata in output.items():
        for iname in list(ndata["inputs"].keys()):
            val = ndata["inputs"][iname]
            if isinstance(val, list) and len(val) == 2 and str(val[0]) not in output:
                del ndata["inputs"][iname]

    return output
