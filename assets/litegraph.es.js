class LLink {
  /** Link ID */
  id;
  parentId;
  type;
  /** Output node ID */
  origin_id;
  /** Output slot index */
  origin_slot;
  /** Input node ID */
  target_id;
  /** Input slot index */
  target_slot;
  data;
  _data;
  /** Centre point of the link, calculated during render only - can be inaccurate */
  _pos;
  /** @todo Clean up - never implemented in comfy. */
  _last_time;
  /** The last canvas 2D path that was used to render this link */
  path;
  /** @inheritdoc */
  _centreAngle;
  #color;
  /** Custom colour for this link only */
  get color() {
    return this.#color;
  }
  set color(value) {
    this.#color = value === "" ? null : value;
  }
  constructor(id, type, origin_id, origin_slot, target_id, target_slot, parentId) {
    this.id = id;
    this.type = type;
    this.origin_id = origin_id;
    this.origin_slot = origin_slot;
    this.target_id = target_id;
    this.target_slot = target_slot;
    this.parentId = parentId;
    this._data = null;
    this._pos = new Float32Array(2);
  }
  /** @deprecated Use {@link LLink.create} */
  static createFromArray(data) {
    return new LLink(data[0], data[5], data[1], data[2], data[3], data[4]);
  }
  /**
   * LLink static factory: creates a new LLink from the provided data.
   * @param data Serialised LLink data to create the link from
   * @returns A new LLink
   */
  static create(data) {
    return new LLink(
      data.id,
      data.type,
      data.origin_id,
      data.origin_slot,
      data.target_id,
      data.target_slot,
      data.parentId
    );
  }
  /**
   * Gets all reroutes from the output slot to this segment.  If this segment is a reroute, it will be the last element.
   * @returns An ordered array of all reroutes from the node output to
   * this reroute or the reroute before it.  Otherwise, an empty array.
   */
  static getReroutes(network, linkSegment) {
    return network.reroutes.get(linkSegment.parentId)?.getReroutes() ?? [];
  }
  /**
   * Finds the reroute in the chain after the provided reroute ID.
   * @param network The network this link belongs to
   * @param linkSegment The starting point of the search (input side).
   * Typically the LLink object itself, but can be any link segment.
   * @param rerouteId The matching reroute will have this set as its {@link parentId}.
   * @returns The reroute that was found, `undefined` if no reroute was found, or `null` if an infinite loop was detected.
   */
  static findNextReroute(network, linkSegment, rerouteId) {
    return network.reroutes.get(linkSegment.parentId)?.findNextReroute(rerouteId);
  }
  configure(o) {
    if (Array.isArray(o)) {
      this.id = o[0];
      this.origin_id = o[1];
      this.origin_slot = o[2];
      this.target_id = o[3];
      this.target_slot = o[4];
      this.type = o[5];
    } else {
      this.id = o.id;
      this.type = o.type;
      this.origin_id = o.origin_id;
      this.origin_slot = o.origin_slot;
      this.target_id = o.target_id;
      this.target_slot = o.target_slot;
      this.parentId = o.parentId;
    }
  }
  /**
   * Disconnects a link and removes it from the graph, cleaning up any reroutes that are no longer used
   * @param network The container (LGraph) where reroutes should be updated
   * @param keepReroutes If `true`, reroutes will not be garbage collected.
   */
  disconnect(network, keepReroutes) {
    const reroutes = LLink.getReroutes(network, this);
    for (const reroute of reroutes) {
      reroute.linkIds.delete(this.id);
      if (!keepReroutes && !reroute.linkIds.size)
        network.reroutes.delete(reroute.id);
    }
    network.links.delete(this.id);
  }
  /**
   * @deprecated Prefer {@link LLink.asSerialisable} (returns an object, not an array)
   * @returns An array representing this LLink
   */
  serialize() {
    return [
      this.id,
      this.origin_id,
      this.origin_slot,
      this.target_id,
      this.target_slot,
      this.type
    ];
  }
  asSerialisable() {
    const copy = {
      id: this.id,
      origin_id: this.origin_id,
      origin_slot: this.origin_slot,
      target_id: this.target_id,
      target_slot: this.target_slot,
      type: this.type
    };
    if (this.parentId) copy.parentId = this.parentId;
    return copy;
  }
}
var NodeSlotType = /* @__PURE__ */ ((NodeSlotType2) => {
  NodeSlotType2[NodeSlotType2["INPUT"] = 1] = "INPUT";
  NodeSlotType2[NodeSlotType2["OUTPUT"] = 2] = "OUTPUT";
  return NodeSlotType2;
})(NodeSlotType || {});
var RenderShape = /* @__PURE__ */ ((RenderShape2) => {
  RenderShape2[RenderShape2["BOX"] = 1] = "BOX";
  RenderShape2[RenderShape2["ROUND"] = 2] = "ROUND";
  RenderShape2[RenderShape2["CIRCLE"] = 3] = "CIRCLE";
  RenderShape2[RenderShape2["CARD"] = 4] = "CARD";
  RenderShape2[RenderShape2["ARROW"] = 5] = "ARROW";
  RenderShape2[RenderShape2["GRID"] = 6] = "GRID";
  RenderShape2[RenderShape2["HollowCircle"] = 7] = "HollowCircle";
  return RenderShape2;
})(RenderShape || {});
var CanvasItem = /* @__PURE__ */ ((CanvasItem2) => {
  CanvasItem2[CanvasItem2["Nothing"] = 0] = "Nothing";
  CanvasItem2[CanvasItem2["Node"] = 1] = "Node";
  CanvasItem2[CanvasItem2["Group"] = 2] = "Group";
  CanvasItem2[CanvasItem2["Reroute"] = 4] = "Reroute";
  CanvasItem2[CanvasItem2["Link"] = 8] = "Link";
  CanvasItem2[CanvasItem2["ResizeSe"] = 16] = "ResizeSe";
  return CanvasItem2;
})(CanvasItem || {});
var LinkDirection = /* @__PURE__ */ ((LinkDirection2) => {
  LinkDirection2[LinkDirection2["NONE"] = 0] = "NONE";
  LinkDirection2[LinkDirection2["UP"] = 1] = "UP";
  LinkDirection2[LinkDirection2["DOWN"] = 2] = "DOWN";
  LinkDirection2[LinkDirection2["LEFT"] = 3] = "LEFT";
  LinkDirection2[LinkDirection2["RIGHT"] = 4] = "RIGHT";
  LinkDirection2[LinkDirection2["CENTER"] = 5] = "CENTER";
  return LinkDirection2;
})(LinkDirection || {});
var LinkRenderType = /* @__PURE__ */ ((LinkRenderType2) => {
  LinkRenderType2[LinkRenderType2["HIDDEN_LINK"] = -1] = "HIDDEN_LINK";
  LinkRenderType2[LinkRenderType2["STRAIGHT_LINK"] = 0] = "STRAIGHT_LINK";
  LinkRenderType2[LinkRenderType2["LINEAR_LINK"] = 1] = "LINEAR_LINK";
  LinkRenderType2[LinkRenderType2["SPLINE_LINK"] = 2] = "SPLINE_LINK";
  return LinkRenderType2;
})(LinkRenderType || {});
var LinkMarkerShape = /* @__PURE__ */ ((LinkMarkerShape2) => {
  LinkMarkerShape2[LinkMarkerShape2["None"] = 0] = "None";
  LinkMarkerShape2[LinkMarkerShape2["Circle"] = 1] = "Circle";
  LinkMarkerShape2[LinkMarkerShape2["Arrow"] = 2] = "Arrow";
  return LinkMarkerShape2;
})(LinkMarkerShape || {});
var TitleMode = /* @__PURE__ */ ((TitleMode2) => {
  TitleMode2[TitleMode2["NORMAL_TITLE"] = 0] = "NORMAL_TITLE";
  TitleMode2[TitleMode2["NO_TITLE"] = 1] = "NO_TITLE";
  TitleMode2[TitleMode2["TRANSPARENT_TITLE"] = 2] = "TRANSPARENT_TITLE";
  TitleMode2[TitleMode2["AUTOHIDE_TITLE"] = 3] = "AUTOHIDE_TITLE";
  return TitleMode2;
})(TitleMode || {});
var LGraphEventMode = /* @__PURE__ */ ((LGraphEventMode2) => {
  LGraphEventMode2[LGraphEventMode2["ALWAYS"] = 0] = "ALWAYS";
  LGraphEventMode2[LGraphEventMode2["ON_EVENT"] = 1] = "ON_EVENT";
  LGraphEventMode2[LGraphEventMode2["NEVER"] = 2] = "NEVER";
  LGraphEventMode2[LGraphEventMode2["ON_TRIGGER"] = 3] = "ON_TRIGGER";
  LGraphEventMode2[LGraphEventMode2["BYPASS"] = 4] = "BYPASS";
  return LGraphEventMode2;
})(LGraphEventMode || {});
var EaseFunction = /* @__PURE__ */ ((EaseFunction2) => {
  EaseFunction2["LINEAR"] = "linear";
  EaseFunction2["EASE_IN_QUAD"] = "easeInQuad";
  EaseFunction2["EASE_OUT_QUAD"] = "easeOutQuad";
  EaseFunction2["EASE_IN_OUT_QUAD"] = "easeInOutQuad";
  return EaseFunction2;
})(EaseFunction || {});
function distance(a, b) {
  return Math.sqrt(
    (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])
  );
}
function dist2(x1, y1, x2, y2) {
  return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
}
function isInRectangle(x2, y, left, top, width2, height) {
  return x2 >= left && x2 < left + width2 && y >= top && y < top + height;
}
function isPointInRect(point, rect) {
  return point[0] >= rect[0] && point[0] < rect[0] + rect[2] && point[1] >= rect[1] && point[1] < rect[1] + rect[3];
}
function isInRect(x2, y, rect) {
  return x2 >= rect[0] && x2 < rect[0] + rect[2] && y >= rect[1] && y < rect[1] + rect[3];
}
function isInsideRectangle(x2, y, left, top, width2, height) {
  return left < x2 && left + width2 > x2 && top < y && top + height > y;
}
function isSortaInsideOctagon(x2, y, radius) {
  const sum = Math.min(radius, Math.abs(x2)) + Math.min(radius, Math.abs(y));
  return sum < radius * 0.75;
}
function overlapBounding(a, b) {
  const aRight = a[0] + a[2];
  const aBottom = a[1] + a[3];
  const bRight = b[0] + b[2];
  const bBottom = b[1] + b[3];
  return a[0] > bRight || a[1] > bBottom || aRight < b[0] || aBottom < b[1] ? false : true;
}
function containsCentre(a, b) {
  const centreX = b[0] + b[2] * 0.5;
  const centreY = b[1] + b[3] * 0.5;
  return isInRect(centreX, centreY, a);
}
function containsRect(a, b) {
  const aRight = a[0] + a[2];
  const aBottom = a[1] + a[3];
  const bRight = b[0] + b[2];
  const bBottom = b[1] + b[3];
  const identical = a[0] === b[0] && a[1] === b[1] && aRight === bRight && aBottom === bBottom;
  return !identical && a[0] <= b[0] && a[1] <= b[1] && aRight >= bRight && aBottom >= bBottom;
}
function findPointOnCurve(out, a, b, controlA, controlB, t = 0.5) {
  const iT = 1 - t;
  const c1 = iT * iT * iT;
  const c2 = 3 * (iT * iT) * t;
  const c3 = 3 * iT * (t * t);
  const c4 = t * t * t;
  out[0] = c1 * a[0] + c2 * controlA[0] + c3 * controlB[0] + c4 * b[0];
  out[1] = c1 * a[1] + c2 * controlA[1] + c3 * controlB[1] + c4 * b[1];
}
function createBounds(objects, padding = 10) {
  const bounds = new Float32Array([Infinity, Infinity, -Infinity, -Infinity]);
  for (const obj of objects) {
    const rect = obj.boundingRect;
    bounds[0] = Math.min(bounds[0], rect[0]);
    bounds[1] = Math.min(bounds[1], rect[1]);
    bounds[2] = Math.max(bounds[2], rect[0] + rect[2]);
    bounds[3] = Math.max(bounds[3], rect[1] + rect[3]);
  }
  if (!bounds.every((x2) => isFinite(x2))) return null;
  return [
    bounds[0] - padding,
    bounds[1] - padding,
    bounds[2] - bounds[0] + 2 * padding,
    bounds[3] - bounds[1] + 2 * padding
  ];
}
function snapPoint(pos, snapTo) {
  if (!snapTo) return false;
  pos[0] = snapTo * Math.round(pos[0] / snapTo);
  pos[1] = snapTo * Math.round(pos[1] / snapTo);
  return true;
}
class Reroute {
  /**
   * Initialises a new link reroute object.
   * @param id Unique identifier for this reroute
   * @param network The network of links this reroute belongs to.  Internally converted to a WeakRef.
   * @param pos Position in graph coordinates
   * @param linkIds Link IDs ({@link LLink.id}) of all links that use this reroute
   */
  constructor(id, network, pos, parentId, linkIds) {
    this.id = id;
    this.#network = new WeakRef(network);
    this.update(parentId, pos, linkIds);
    this.linkIds ??= /* @__PURE__ */ new Set();
  }
  static radius = 10;
  #malloc = new Float32Array(8);
  /** The network this reroute belongs to.  Contains all valid links and reroutes. */
  #network;
  #parentId;
  /** @inheritdoc */
  get parentId() {
    return this.#parentId;
  }
  /** Ignores attempts to create an infinite loop. @inheritdoc */
  set parentId(value) {
    if (value === this.id) return;
    if (this.getReroutes() === null) return;
    this.#parentId = value;
  }
  #pos = this.#malloc.subarray(0, 2);
  /** @inheritdoc */
  get pos() {
    return this.#pos;
  }
  set pos(value) {
    if (!(value?.length >= 2))
      throw new TypeError("Reroute.pos is an x,y point, and expects an indexable with at least two values.");
    this.#pos[0] = value[0];
    this.#pos[1] = value[1];
  }
  /** @inheritdoc */
  get boundingRect() {
    const { radius } = Reroute;
    const [x2, y] = this.#pos;
    return [x2 - radius, y - radius, 2 * radius, 2 * radius];
  }
  /** @inheritdoc */
  selected;
  /** The ID ({@link LLink.id}) of every link using this reroute */
  linkIds;
  /** The averaged angle of every link through this reroute. */
  otherAngle = 0;
  /** Cached cos */
  cos = 0;
  sin = 0;
  /** Bezier curve control point for the "target" (input) side of the link */
  controlPoint = this.#malloc.subarray(4, 6);
  /** @inheritdoc */
  path;
  /** @inheritdoc */
  _centreAngle;
  /** @inheritdoc */
  _pos = this.#malloc.subarray(6, 8);
  /** Colour of the first link that rendered this reroute */
  _colour;
  /**
   * Used to ensure reroute angles are only executed once per frame.
   * @todo Calculate on change instead.
   */
  #lastRenderTime = -Infinity;
  #buffer = this.#malloc.subarray(2, 4);
  /** @inheritdoc */
  get origin_id() {
    return this.#network.deref()?.links.get(this.linkIds.values().next().value)?.origin_id;
  }
  /** @inheritdoc */
  get origin_slot() {
    return this.#network.deref()?.links.get(this.linkIds.values().next().value)?.origin_slot;
  }
  /**
   * Applies a new parentId to the reroute, and optinoally a new position and linkId.
   * Primarily used for deserialisation.
   * @param parentId The ID of the reroute prior to this reroute, or
   * `undefined` if it is the first reroute connected to a nodes output
   * @param pos The position of this reroute
   * @param linkIds All link IDs that pass through this reroute
   */
  update(parentId, pos, linkIds) {
    this.parentId = parentId;
    if (pos) this.pos = pos;
    if (linkIds) this.linkIds = new Set(linkIds);
  }
  /**
   * Validates the linkIds this reroute has.  Removes broken links.
   * @param links Collection of valid links
   * @returns true if any links remain after validation
   */
  validateLinks(links) {
    const { linkIds } = this;
    for (const linkId of linkIds) {
      if (!links.get(linkId)) linkIds.delete(linkId);
    }
    return linkIds.size > 0;
  }
  /**
   * Retrieves an ordered array of all reroutes from the node output.
   * @param visited Internal.  A set of reroutes that this function
   * has already visited whilst recursing up the chain.
   * @returns An ordered array of all reroutes from the node output to this reroute, inclusive.
   * `null` if an infinite loop is detected.
   * `undefined` if the reroute chain or {@link LinkNetwork} are invalid.
   */
  getReroutes(visited = /* @__PURE__ */ new Set()) {
    if (this.#parentId === void 0) return [this];
    if (visited.has(this)) return null;
    visited.add(this);
    const parent = this.#network.deref()?.reroutes.get(this.#parentId);
    if (!parent) {
      this.#parentId = void 0;
      return [this];
    }
    const reroutes = parent.getReroutes(visited);
    reroutes?.push(this);
    return reroutes;
  }
  /**
   * Internal.  Called by {@link LLink.findNextReroute}.  Not intended for use by itself.
   * @param withParentId The rerouteId to look for
   * @param visited A set of reroutes that have already been visited
   * @returns The reroute that was found, `undefined` if no reroute was found, or `null` if an infinite loop was detected.
   */
  findNextReroute(withParentId, visited = /* @__PURE__ */ new Set()) {
    if (this.#parentId === withParentId) return this;
    if (visited.has(this)) return null;
    visited.add(this);
    return this.#network.deref()?.reroutes.get(this.#parentId)?.findNextReroute(withParentId, visited);
  }
  /** @inheritdoc */
  move(deltaX, deltaY) {
    this.#pos[0] += deltaX;
    this.#pos[1] += deltaY;
  }
  /** @inheritdoc */
  snapToGrid(snapTo) {
    if (!snapTo) return false;
    const { pos } = this;
    pos[0] = snapTo * Math.round(pos[0] / snapTo);
    pos[1] = snapTo * Math.round(pos[1] / snapTo);
    return true;
  }
  calculateAngle(lastRenderTime, network, linkStart) {
    if (!(lastRenderTime > this.#lastRenderTime)) return;
    this.#lastRenderTime = lastRenderTime;
    const { links } = network;
    const { linkIds, id } = this;
    const angles = [];
    let sum = 0;
    for (const linkId of linkIds) {
      const link = links.get(linkId);
      if (!link) continue;
      const pos = LLink.findNextReroute(network, link, id)?.pos ?? network.getNodeById(link.target_id)?.getConnectionPos(true, link.target_slot, this.#buffer);
      if (!pos) continue;
      const angle = Math.atan2(pos[1] - this.#pos[1], pos[0] - this.#pos[0]);
      angles.push(angle);
      sum += angle;
    }
    if (!angles.length) return;
    sum /= angles.length;
    const originToReroute = Math.atan2(
      this.#pos[1] - linkStart[1],
      this.#pos[0] - linkStart[0]
    );
    let diff = (originToReroute - sum) * 0.5;
    if (Math.abs(diff) > Math.PI * 0.5) diff += Math.PI;
    const dist = Math.min(80, distance(linkStart, this.#pos) * 0.25);
    const originDiff = originToReroute - diff;
    const cos = Math.cos(originDiff);
    const sin = Math.sin(originDiff);
    this.otherAngle = originDiff;
    this.cos = cos;
    this.sin = sin;
    this.controlPoint[0] = dist * -cos;
    this.controlPoint[1] = dist * -sin;
    return;
  }
  /**
   * Renders the reroute on the canvas.
   * @param ctx Canvas context to draw on
   * @remarks Leaves {@link ctx}.fillStyle, strokeStyle, and lineWidth dirty (perf.).
   */
  draw(ctx) {
    const { pos } = this;
    ctx.fillStyle = this._colour;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], Reroute.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = Reroute.radius * 0.1;
    ctx.strokeStyle = "rgb(0,0,0,0.5)";
    ctx.stroke();
    ctx.fillStyle = "#ffffff55";
    ctx.strokeStyle = "rgb(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], Reroute.radius * 0.8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    if (this.selected) {
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.arc(pos[0], pos[1], Reroute.radius * 1.2, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
  /** @inheritdoc */
  asSerialisable() {
    return {
      id: this.id,
      parentId: this.parentId,
      pos: [this.pos[0], this.pos[1]],
      linkIds: [...this.linkIds]
    };
  }
}
var BadgePosition = /* @__PURE__ */ ((BadgePosition2) => {
  BadgePosition2["TopLeft"] = "top-left";
  BadgePosition2["TopRight"] = "top-right";
  return BadgePosition2;
})(BadgePosition || {});
class LGraphBadge {
  text;
  fgColor;
  bgColor;
  fontSize;
  padding;
  height;
  cornerRadius;
  constructor({
    text,
    fgColor = "white",
    bgColor = "#0F1F0F",
    fontSize = 12,
    padding = 6,
    height = 20,
    cornerRadius = 5
  }) {
    this.text = text;
    this.fgColor = fgColor;
    this.bgColor = bgColor;
    this.fontSize = fontSize;
    this.padding = padding;
    this.height = height;
    this.cornerRadius = cornerRadius;
  }
  get visible() {
    return this.text.length > 0;
  }
  getWidth(ctx) {
    if (!this.visible) return 0;
    const { font } = ctx;
    ctx.font = `${this.fontSize}px sans-serif`;
    const textWidth = ctx.measureText(this.text).width;
    ctx.font = font;
    return textWidth + this.padding * 2;
  }
  draw(ctx, x2, y) {
    if (!this.visible) return;
    const { fillStyle } = ctx;
    ctx.font = `${this.fontSize}px sans-serif`;
    const badgeWidth = this.getWidth(ctx);
    const badgeX = 0;
    ctx.fillStyle = this.bgColor;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x2 + badgeX, y, badgeWidth, this.height, this.cornerRadius);
    } else {
      ctx.rect(x2 + badgeX, y, badgeWidth, this.height);
    }
    ctx.fill();
    ctx.fillStyle = this.fgColor;
    ctx.fillText(
      this.text,
      x2 + badgeX + this.padding,
      y + this.height - this.padding
    );
    ctx.fillStyle = fillStyle;
  }
}
var SlotType = /* @__PURE__ */ ((SlotType2) => {
  SlotType2["Array"] = "array";
  SlotType2[SlotType2["Event"] = -1] = "Event";
  return SlotType2;
})(SlotType || {});
var SlotShape = ((SlotShape2) => {
  SlotShape2[SlotShape2["Box"] = RenderShape.BOX] = "Box";
  SlotShape2[SlotShape2["Arrow"] = RenderShape.ARROW] = "Arrow";
  SlotShape2[SlotShape2["Grid"] = RenderShape.GRID] = "Grid";
  SlotShape2[SlotShape2["Circle"] = RenderShape.CIRCLE] = "Circle";
  SlotShape2[SlotShape2["HollowCircle"] = RenderShape.HollowCircle] = "HollowCircle";
  return SlotShape2;
})(SlotShape || {});
var SlotDirection = ((SlotDirection2) => {
  SlotDirection2[SlotDirection2["Up"] = LinkDirection.UP] = "Up";
  SlotDirection2[SlotDirection2["Right"] = LinkDirection.RIGHT] = "Right";
  SlotDirection2[SlotDirection2["Down"] = LinkDirection.DOWN] = "Down";
  SlotDirection2[SlotDirection2["Left"] = LinkDirection.LEFT] = "Left";
  return SlotDirection2;
})(SlotDirection || {});
var LabelPosition = /* @__PURE__ */ ((LabelPosition2) => {
  LabelPosition2["Left"] = "left";
  LabelPosition2["Right"] = "right";
  return LabelPosition2;
})(LabelPosition || {});
function strokeShape(ctx, area, options2 = {}) {
  const {
    shape = RenderShape.BOX,
    round_radius = LiteGraph.ROUND_RADIUS,
    title_height = LiteGraph.NODE_TITLE_HEIGHT,
    title_mode = TitleMode.NORMAL_TITLE,
    colour = LiteGraph.NODE_BOX_OUTLINE_COLOR,
    padding = 6,
    collapsed = false,
    thickness = 1
  } = options2;
  if (title_mode === TitleMode.TRANSPARENT_TITLE) {
    area[1] -= title_height;
    area[3] += title_height;
  }
  const { lineWidth, strokeStyle } = ctx;
  ctx.lineWidth = thickness;
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = colour;
  ctx.beginPath();
  const [x2, y, width2, height] = area;
  switch (shape) {
    case RenderShape.BOX: {
      ctx.rect(
        x2 - padding,
        y - padding,
        width2 + 2 * padding,
        height + 2 * padding
      );
      break;
    }
    case RenderShape.ROUND:
    case RenderShape.CARD: {
      const radius = round_radius + padding;
      const isCollapsed = shape === RenderShape.CARD && collapsed;
      const cornerRadii = isCollapsed || shape === RenderShape.ROUND ? [radius] : [radius, 2, radius, 2];
      ctx.roundRect(
        x2 - padding,
        y - padding,
        width2 + 2 * padding,
        height + 2 * padding,
        cornerRadii
      );
      break;
    }
    case RenderShape.CIRCLE: {
      const centerX = x2 + width2 / 2;
      const centerY = y + height / 2;
      const radius = Math.max(width2, height) / 2 + padding;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      break;
    }
  }
  ctx.stroke();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.globalAlpha = 1;
}
class NodeSlot {
  name;
  localized_name;
  label;
  type;
  dir;
  removable;
  shape;
  color_off;
  color_on;
  locked;
  nameLocked;
  pos;
  widget;
  constructor(slot) {
    Object.assign(this, slot);
    this.name = slot.name;
    this.type = slot.type;
  }
  /**
   * The label to display in the UI.
   */
  get renderingLabel() {
    return this.label || this.localized_name || this.name || "";
  }
  connectedColor(context) {
    return this.color_on || context.default_connection_color_byType[this.type] || context.default_connection_color.output_on;
  }
  disconnectedColor(context) {
    return this.color_off || context.default_connection_color_byTypeOff[this.type] || context.default_connection_color_byType[this.type] || context.default_connection_color.output_off;
  }
  renderingColor(context) {
    return this.isConnected() ? this.connectedColor(context) : this.disconnectedColor(context);
  }
  draw(ctx, options2) {
    const {
      pos,
      colorContext,
      labelColor = "#AAA",
      labelPosition = LabelPosition.Right,
      horizontal = false,
      lowQuality = false,
      renderText = true,
      highlight = false,
      doStroke: _doStroke = false
    } = options2;
    const originalFillStyle = ctx.fillStyle;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalLineWidth = ctx.lineWidth;
    const slot_type = this.type;
    const slot_shape = slot_type === SlotType.Array ? SlotShape.Grid : this.shape;
    ctx.beginPath();
    let doStroke = _doStroke;
    let doFill = true;
    ctx.fillStyle = this.renderingColor(colorContext);
    ctx.lineWidth = 1;
    if (slot_type === SlotType.Event || slot_shape === SlotShape.Box) {
      if (horizontal) {
        ctx.rect(pos[0] - 5 + 0.5, pos[1] - 8 + 0.5, 10, 14);
      } else {
        ctx.rect(pos[0] - 6 + 0.5, pos[1] - 5 + 0.5, 14, 10);
      }
    } else if (slot_shape === SlotShape.Arrow) {
      ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
      ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
      ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
      ctx.closePath();
    } else if (slot_shape === SlotShape.Grid) {
      const gridSize = 3;
      const cellSize = 2;
      const spacing = 3;
      for (let x2 = 0; x2 < gridSize; x2++) {
        for (let y = 0; y < gridSize; y++) {
          ctx.rect(
            pos[0] - 4 + x2 * spacing,
            pos[1] - 4 + y * spacing,
            cellSize,
            cellSize
          );
        }
      }
      doStroke = false;
    } else {
      if (lowQuality) {
        ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8);
      } else {
        let radius;
        if (slot_shape === SlotShape.HollowCircle) {
          doFill = false;
          doStroke = true;
          ctx.lineWidth = 3;
          ctx.strokeStyle = ctx.fillStyle;
          radius = highlight ? 4 : 3;
        } else {
          radius = highlight ? 5 : 4;
        }
        ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2);
      }
    }
    if (doFill) ctx.fill();
    if (!lowQuality && doStroke) ctx.stroke();
    if (renderText) {
      const text = this.renderingLabel;
      if (text) {
        ctx.fillStyle = labelColor;
        if (labelPosition === LabelPosition.Right) {
          if (horizontal || this.dir == LinkDirection.UP) {
            ctx.fillText(text, pos[0], pos[1] - 10);
          } else {
            ctx.fillText(text, pos[0] + 10, pos[1] + 5);
          }
        } else {
          if (horizontal || this.dir == LinkDirection.DOWN) {
            ctx.fillText(text, pos[0], pos[1] - 8);
          } else {
            ctx.fillText(text, pos[0] - 10, pos[1] + 5);
          }
        }
      }
    }
    ctx.fillStyle = originalFillStyle;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.lineWidth = originalLineWidth;
  }
  drawCollapsed(ctx, options2) {
    const [x2, y] = options2.pos;
    const originalFillStyle = ctx.fillStyle;
    ctx.fillStyle = "#686";
    ctx.beginPath();
    if (this.type === SlotType.Event || this.shape === RenderShape.BOX) {
      ctx.rect(x2 - 7 + 0.5, y - 4, 14, 8);
    } else if (this.shape === RenderShape.ARROW) {
      const isInput = this instanceof NodeInputSlot;
      if (isInput) {
        ctx.moveTo(x2 + 8, y);
        ctx.lineTo(x2 - 4, y - 4);
        ctx.lineTo(x2 - 4, y + 4);
      } else {
        ctx.moveTo(x2 + 6, y);
        ctx.lineTo(x2 - 6, y - 4);
        ctx.lineTo(x2 - 6, y + 4);
      }
      ctx.closePath();
    } else {
      ctx.arc(x2, y, 4, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.fillStyle = originalFillStyle;
  }
}
class NodeInputSlot extends NodeSlot {
  link;
  constructor(slot) {
    super(slot);
    this.link = slot.link;
  }
  isConnected() {
    return this.link != null;
  }
  isValidTarget(link) {
    if (!link) return true;
    return !!link.output && LiteGraph.isValidConnection(this.type, link.output.type);
  }
  draw(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    ctx.textAlign = options2.horizontal ? "center" : "left";
    super.draw(ctx, {
      ...options2,
      labelPosition: LabelPosition.Right,
      doStroke: false
    });
    ctx.textAlign = originalTextAlign;
  }
}
class NodeOutputSlot extends NodeSlot {
  links;
  _data;
  slot_index;
  constructor(slot) {
    super(slot);
    this.links = slot.links;
    this._data = slot._data;
    this.slot_index = slot.slot_index;
  }
  isValidTarget(link) {
    if (!link) return true;
    return !!link.input && LiteGraph.isValidConnection(this.type, link.input.type);
  }
  isConnected() {
    return this.links != null && this.links.length > 0;
  }
  draw(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    ctx.textAlign = options2.horizontal ? "center" : "right";
    ctx.strokeStyle = "black";
    super.draw(ctx, {
      ...options2,
      labelPosition: LabelPosition.Left,
      doStroke: true
    });
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
  }
}
class BaseWidget {
  linkedWidgets;
  options;
  marker;
  label;
  clicked;
  name;
  type;
  value;
  y;
  last_y;
  width;
  disabled;
  hidden;
  advanced;
  tooltip;
  element;
  constructor(widget) {
    Object.assign(this, widget);
    this.options = widget.options;
  }
  get outline_color() {
    return this.advanced ? LiteGraph.WIDGET_ADVANCED_OUTLINE_COLOR : LiteGraph.WIDGET_OUTLINE_COLOR;
  }
  get background_color() {
    return LiteGraph.WIDGET_BGCOLOR;
  }
  get height() {
    return LiteGraph.NODE_WIDGET_HEIGHT;
  }
  get text_color() {
    return LiteGraph.WIDGET_TEXT_COLOR;
  }
  get secondary_text_color() {
    return LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
  }
  /**
   * Handles the click event for the widget
   * @param options - The options for handling the click event
   */
  onClick(options2) {
  }
  /**
   * Handles the drag event for the widget
   * @param options - The options for handling the drag event
   */
  onDrag(options2) {
  }
  /**
   * Sets the value of the widget
   * @param value - The value to set
   * @param options - The options for setting the value
   */
  setValue(value, options2) {
    const { node: node2, canvas: canvas2, e: e2 } = options2;
    const oldValue = this.value;
    const v2 = this.type === "number" ? Number(value) : value;
    this.value = v2;
    if (this.options?.property && node2.properties[this.options.property] !== void 0) {
      node2.setProperty(this.options.property, v2);
    }
    const pos = canvas2.graph_mouse;
    this.callback?.(this.value, canvas2, node2, pos, e2);
    node2.onWidgetChanged?.(this.name ?? "", v2, oldValue, this);
    if (node2.graph) node2.graph._version++;
  }
}
class BooleanWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = "toggle";
    this.value = widget.value;
  }
  drawWidget(ctx, options2) {
    const { y, width: width2, show_text = true, margin = 15 } = options2;
    const widget_width = width2;
    const H = this.height;
    ctx.textAlign = "left";
    ctx.strokeStyle = this.outline_color;
    ctx.fillStyle = this.background_color;
    ctx.beginPath();
    if (show_text)
      ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
    else ctx.rect(margin, y, widget_width - margin * 2, H);
    ctx.fill();
    if (show_text && !this.disabled) ctx.stroke();
    ctx.fillStyle = this.value ? "#89A" : "#333";
    ctx.beginPath();
    ctx.arc(
      widget_width - margin * 2,
      y + H * 0.5,
      H * 0.36,
      0,
      Math.PI * 2
    );
    ctx.fill();
    if (show_text) {
      ctx.fillStyle = this.secondary_text_color;
      const label = this.label || this.name;
      if (label != null) {
        ctx.fillText(label, margin * 2, y + H * 0.7);
      }
      ctx.fillStyle = this.value ? this.text_color : this.secondary_text_color;
      ctx.textAlign = "right";
      ctx.fillText(
        this.value ? this.options.on || "true" : this.options.off || "false",
        widget_width - 40,
        y + H * 0.7
      );
    }
  }
  onClick(options2) {
    this.setValue(!this.value, options2);
  }
}
class ButtonWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = "button";
    this.value = widget.value ?? "";
  }
  /**
   * Draws the widget
   * @param ctx - The canvas context
   * @param options - The options for drawing the widget
   */
  drawWidget(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalFillStyle = ctx.fillStyle;
    const { y, width: width2, show_text = true, margin = 15 } = options2;
    const widget_width = width2;
    const H = this.height;
    ctx.fillStyle = this.background_color;
    if (this.clicked) {
      ctx.fillStyle = "#AAA";
      this.clicked = false;
    }
    ctx.fillRect(margin, y, widget_width - margin * 2, H);
    if (show_text && !this.disabled) {
      ctx.strokeStyle = this.outline_color;
      ctx.strokeRect(margin, y, widget_width - margin * 2, H);
    }
    if (show_text) {
      ctx.textAlign = "center";
      ctx.fillStyle = this.text_color;
      ctx.fillText(
        this.label || this.name || "",
        widget_width * 0.5,
        y + H * 0.7
      );
    }
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.fillStyle = originalFillStyle;
  }
  onClick(options2) {
    const { e: e2, node: node2, canvas: canvas2 } = options2;
    const pos = canvas2.graph_mouse;
    this.clicked = true;
    canvas2.setDirty(true);
    this.callback?.(this, canvas2, node2, pos, e2);
  }
}
class ComboWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = "combo";
    this.value = widget.value;
  }
  /**
   * Draws the widget
   * @param ctx - The canvas context
   * @param options - The options for drawing the widget
   */
  drawWidget(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalFillStyle = ctx.fillStyle;
    const { y, width: width2, show_text = true, margin = 15 } = options2;
    const widget_width = width2;
    const H = this.height;
    ctx.textAlign = "left";
    ctx.strokeStyle = this.outline_color;
    ctx.fillStyle = this.background_color;
    ctx.beginPath();
    if (show_text)
      ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
    else
      ctx.rect(margin, y, widget_width - margin * 2, H);
    ctx.fill();
    if (show_text) {
      if (!this.disabled) {
        ctx.stroke();
        ctx.fillStyle = this.text_color;
        ctx.beginPath();
        ctx.moveTo(margin + 16, y + 5);
        ctx.lineTo(margin + 6, y + H * 0.5);
        ctx.lineTo(margin + 16, y + H - 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(widget_width - margin - 16, y + 5);
        ctx.lineTo(widget_width - margin - 6, y + H * 0.5);
        ctx.lineTo(widget_width - margin - 16, y + H - 5);
        ctx.fill();
      }
      ctx.fillStyle = this.secondary_text_color;
      const label = this.label || this.name;
      if (label != null) {
        ctx.fillText(label, margin * 2 + 5, y + H * 0.7);
      }
      ctx.fillStyle = this.text_color;
      ctx.textAlign = "right";
      let displayValue = typeof this.value === "number" ? String(this.value) : this.value;
      if (this.options.values) {
        let values = this.options.values;
        if (typeof values === "function") {
          values = values();
        }
        if (values && !Array.isArray(values)) {
          displayValue = values[this.value];
        }
      }
      const labelWidth = ctx.measureText(label || "").width + margin * 2;
      const inputWidth = widget_width - margin * 4;
      const availableWidth = inputWidth - labelWidth;
      const textWidth = ctx.measureText(displayValue).width;
      if (textWidth > availableWidth) {
        const ELLIPSIS = "…";
        const ellipsisWidth = ctx.measureText(ELLIPSIS).width;
        const charWidthAvg = ctx.measureText("a").width;
        if (availableWidth <= ellipsisWidth) {
          displayValue = "․";
        } else {
          displayValue = `${displayValue}`;
          const overflowWidth = textWidth + ellipsisWidth - availableWidth;
          if (overflowWidth + charWidthAvg * 3 > availableWidth) {
            const preciseRange = availableWidth + charWidthAvg * 3;
            const preTruncateCt = Math.floor((preciseRange - ellipsisWidth) / charWidthAvg);
            displayValue = displayValue.substr(0, preTruncateCt);
          }
          while (ctx.measureText(displayValue).width + ellipsisWidth > availableWidth) {
            displayValue = displayValue.substr(0, displayValue.length - 1);
          }
          displayValue += ELLIPSIS;
        }
      }
      ctx.fillText(
        displayValue,
        widget_width - margin * 2 - 20,
        y + H * 0.7
      );
    }
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.fillStyle = originalFillStyle;
  }
  onClick(options2) {
    const { e: e2, node: node2, canvas: canvas2 } = options2;
    const x2 = e2.canvasX - node2.pos[0];
    const width2 = this.width || node2.size[0];
    const delta2 = x2 < 40 ? -1 : x2 > width2 - 40 ? 1 : 0;
    let values = this.options.values;
    if (typeof values === "function") {
      values = values(this, node2);
    }
    const values_list = Array.isArray(values) ? values : Object.keys(values);
    if (delta2) {
      let index = -1;
      canvas2.last_mouseclick = 0;
      index = typeof values === "object" ? values_list.indexOf(String(this.value)) + delta2 : values_list.indexOf(this.value) + delta2;
      if (index >= values_list.length) index = values_list.length - 1;
      if (index < 0) index = 0;
      this.setValue(
        Array.isArray(values) ? values[index] : index,
        {
          e: e2,
          node: node2,
          canvas: canvas2
        }
      );
      return;
    }
    const text_values = values != values_list ? Object.values(values) : values;
    new LiteGraph.ContextMenu(text_values, {
      scale: Math.max(1, canvas2.ds.scale),
      event: e2,
      className: "dark",
      callback: (value) => {
        this.setValue(
          values != values_list ? text_values.indexOf(value) : value,
          {
            e: e2,
            node: node2,
            canvas: canvas2
          }
        );
      }
    });
  }
}
class NumberWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = "number";
    this.value = widget.value;
  }
  /**
   * Draws the widget
   * @param ctx - The canvas context
   * @param options - The options for drawing the widget
   */
  drawWidget(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalFillStyle = ctx.fillStyle;
    const { y, width: width2, show_text = true, margin = 15 } = options2;
    const widget_width = width2;
    const H = this.height;
    ctx.textAlign = "left";
    ctx.strokeStyle = this.outline_color;
    ctx.fillStyle = this.background_color;
    ctx.beginPath();
    if (show_text)
      ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
    else
      ctx.rect(margin, y, widget_width - margin * 2, H);
    ctx.fill();
    if (show_text) {
      if (!this.disabled) {
        ctx.stroke();
        ctx.fillStyle = this.text_color;
        ctx.beginPath();
        ctx.moveTo(margin + 16, y + 5);
        ctx.lineTo(margin + 6, y + H * 0.5);
        ctx.lineTo(margin + 16, y + H - 5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(widget_width - margin - 16, y + 5);
        ctx.lineTo(widget_width - margin - 6, y + H * 0.5);
        ctx.lineTo(widget_width - margin - 16, y + H - 5);
        ctx.fill();
      }
      ctx.fillStyle = this.secondary_text_color;
      const label = this.label || this.name;
      if (label != null) {
        ctx.fillText(label, margin * 2 + 5, y + H * 0.7);
      }
      ctx.fillStyle = this.text_color;
      ctx.textAlign = "right";
      ctx.fillText(
        Number(this.value).toFixed(
          this.options.precision !== void 0 ? this.options.precision : 3
        ),
        widget_width - margin * 2 - 20,
        y + H * 0.7
      );
    }
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.fillStyle = originalFillStyle;
  }
  onClick(options) {
    const { e, node, canvas } = options;
    const x = e.canvasX - node.pos[0];
    const width = this.width || node.size[0];
    const delta = x < 40 ? -1 : x > width - 40 ? 1 : 0;
    if (delta) {
      let newValue2 = this.value + delta * 0.1 * (this.options.step || 1);
      if (this.options.min != null && newValue2 < this.options.min) {
        newValue2 = this.options.min;
      }
      if (this.options.max != null && newValue2 > this.options.max) {
        newValue2 = this.options.max;
      }
      if (newValue2 !== this.value) {
        this.setValue(newValue2, { e, node, canvas });
      }
      return;
    }
    canvas.prompt("Value", this.value, (v) => {
      if (/^[0-9+\-*/()\s]+|\d+\.\d+$/.test(v)) {
        try {
          v = eval(v);
        } catch {
        }
      }
      const newValue = Number(v);
      if (!isNaN(newValue)) {
        this.setValue(newValue, { e, node, canvas });
      }
    }, e);
  }
  /**
   * Handles drag events for the number widget
   * @param options - The options for handling the drag event
   */
  onDrag(options2) {
    const { e: e2, node: node2 } = options2;
    const width2 = this.width || node2.width;
    const x2 = e2.canvasX - node2.pos[0];
    const delta2 = x2 < 40 ? -1 : x2 > width2 - 40 ? 1 : 0;
    if (delta2 && (x2 > -3 && x2 < width2 + 3)) return;
    let newValue2 = this.value;
    if (e2.deltaX) newValue2 += e2.deltaX * 0.1 * (this.options.step || 1);
    if (this.options.min != null && newValue2 < this.options.min) {
      newValue2 = this.options.min;
    }
    if (this.options.max != null && newValue2 > this.options.max) {
      newValue2 = this.options.max;
    }
    if (newValue2 !== this.value) {
      this.value = newValue2;
      return true;
    }
    return false;
  }
}
class SliderWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = "slider";
    this.value = widget.value;
    this.options = widget.options;
  }
  /**
   * Draws the widget
   * @param ctx - The canvas context
   * @param options - The options for drawing the widget
   */
  drawWidget(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalFillStyle = ctx.fillStyle;
    const { y, width: widget_width, show_text = true, margin = 15 } = options2;
    const H = this.height;
    ctx.fillStyle = this.background_color;
    ctx.fillRect(margin, y, widget_width - margin * 2, H);
    const range = this.options.max - this.options.min;
    let nvalue = (this.value - this.options.min) / range;
    nvalue = clamp(nvalue, 0, 1);
    ctx.fillStyle = this.options.slider_color ?? "#678";
    ctx.fillRect(margin, y, nvalue * (widget_width - margin * 2), H);
    if (show_text && !this.disabled) {
      ctx.strokeStyle = this.outline_color;
      ctx.strokeRect(margin, y, widget_width - margin * 2, H);
    }
    if (this.marker != null) {
      let marker_nvalue = (this.marker - this.options.min) / range;
      marker_nvalue = clamp(marker_nvalue, 0, 1);
      ctx.fillStyle = this.options.marker_color ?? "#AA9";
      ctx.fillRect(
        margin + marker_nvalue * (widget_width - margin * 2),
        y,
        2,
        H
      );
    }
    if (show_text) {
      ctx.textAlign = "center";
      ctx.fillStyle = this.text_color;
      ctx.fillText(
        (this.label || this.name) + "  " + Number(this.value).toFixed(
          this.options.precision != null ? this.options.precision : 3
        ),
        widget_width * 0.5,
        y + H * 0.7
      );
    }
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.fillStyle = originalFillStyle;
  }
  /**
   * Handles click events for the slider widget
   */
  onClick(options2) {
    if (this.options.read_only) return;
    const { e: e2, node: node2 } = options2;
    const width2 = this.width || node2.size[0];
    const x2 = e2.canvasX - node2.pos[0];
    const slideFactor = clamp((x2 - 15) / (width2 - 30), 0, 1);
    const newValue2 = this.options.min + (this.options.max - this.options.min) * slideFactor;
    if (newValue2 !== this.value) {
      this.setValue(newValue2, options2);
    }
  }
  /**
   * Handles drag events for the slider widget
   */
  onDrag(options2) {
    if (this.options.read_only) return false;
    const { e: e2, node: node2 } = options2;
    const width2 = this.width || node2.size[0];
    const x2 = e2.canvasX - node2.pos[0];
    const slideFactor = clamp((x2 - 15) / (width2 - 30), 0, 1);
    const newValue2 = this.options.min + (this.options.max - this.options.min) * slideFactor;
    if (newValue2 !== this.value) {
      this.value = newValue2;
      return true;
    }
    return false;
  }
}
class TextWidget extends BaseWidget {
  constructor(widget) {
    super(widget);
    this.type = widget.type;
    this.value = widget.value?.toString() ?? "";
  }
  /**
   * Draws the widget
   * @param ctx - The canvas context
   * @param options - The options for drawing the widget
   */
  drawWidget(ctx, options2) {
    const originalTextAlign = ctx.textAlign;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalFillStyle = ctx.fillStyle;
    const { y, width: width2, show_text = true, margin = 15 } = options2;
    const widget_width = width2;
    const H = this.height;
    ctx.textAlign = "left";
    ctx.strokeStyle = this.outline_color;
    ctx.fillStyle = this.background_color;
    ctx.beginPath();
    if (show_text)
      ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5]);
    else
      ctx.rect(margin, y, widget_width - margin * 2, H);
    ctx.fill();
    if (show_text) {
      if (!this.disabled) ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(margin, y, widget_width - margin * 2, H);
      ctx.clip();
      ctx.fillStyle = this.secondary_text_color;
      const label = this.label || this.name;
      if (label != null) {
        ctx.fillText(label, margin * 2, y + H * 0.7);
      }
      ctx.fillStyle = this.text_color;
      ctx.textAlign = "right";
      ctx.fillText(
        String(this.value).substr(0, 30),
        // 30 chars max
        widget_width - margin * 2,
        y + H * 0.7
      );
      ctx.restore();
    }
    ctx.textAlign = originalTextAlign;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.fillStyle = originalFillStyle;
  }
  onClick(options2) {
    const { e: e2, node: node2, canvas: canvas2 } = options2;
    canvas2.prompt(
      "Value",
      this.value,
      (v2) => {
        if (v2 !== null) {
          this.setValue(v2, { e: e2, node: node2, canvas: canvas2 });
        }
      },
      e2,
      this.options?.multiline ?? false
    );
  }
}
const WIDGET_TYPE_MAP = {
  button: ButtonWidget,
  toggle: BooleanWidget,
  slider: SliderWidget,
  combo: ComboWidget,
  number: NumberWidget,
  string: TextWidget,
  text: TextWidget
};
function toClass(cls, obj) {
  return obj instanceof cls ? obj : new cls(obj);
}
class LGraphNode {
  // Static properties used by dynamic child classes
  static title;
  static MAX_CONSOLE;
  static type;
  static category;
  static filter;
  static skip_list;
  /** Default setting for {@link LGraphNode.connectInputToOutput}. @see {@link INodeFlags.keepAllLinksOnBypass} */
  static keepAllLinksOnBypass = false;
  /** The title text of the node. */
  title;
  /**
   * The font style used to render the node's title text.
   */
  get titleFontStyle() {
    return `${LiteGraph.NODE_TEXT_SIZE}px Arial`;
  }
  graph = null;
  id;
  type = null;
  inputs = [];
  outputs = [];
  // Not used
  connections = [];
  properties = {};
  properties_info = [];
  flags = {};
  widgets;
  locked;
  // Execution order, automatically computed during run
  order;
  mode;
  last_serialization;
  serialize_widgets;
  /**
   * The overridden fg color used to render the node.
   * @see {@link renderingColor}
   */
  color;
  /**
   * The overridden bg color used to render the node.
   * @see {@link renderingBgColor}
   */
  bgcolor;
  /**
   * The overridden box color used to render the node.
   * @see {@link renderingBoxColor}
   */
  boxcolor;
  /** The fg color used to render the node. */
  get renderingColor() {
    return this.color || this.constructor.color || LiteGraph.NODE_DEFAULT_COLOR;
  }
  /** The bg color used to render the node. */
  get renderingBgColor() {
    return this.bgcolor || this.constructor.bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;
  }
  /** The box color used to render the node. */
  get renderingBoxColor() {
    let colState = LiteGraph.node_box_coloured_by_mode && LiteGraph.NODE_MODES_COLORS[this.mode] ? LiteGraph.NODE_MODES_COLORS[this.mode] : void 0;
    if (LiteGraph.node_box_coloured_when_on) {
      colState = this.action_triggered ? "#FFF" : this.execute_triggered ? "#AAA" : colState;
    }
    return this.boxcolor || colState || LiteGraph.NODE_DEFAULT_BOXCOLOR;
  }
  exec_version;
  action_call;
  execute_triggered;
  action_triggered;
  widgets_up;
  widgets_start_y;
  lostFocusAt;
  gotFocusAt;
  badges = [];
  badgePosition = BadgePosition.TopLeft;
  /**
   * The width of the node when collapsed.
   * Updated by {@link LGraphCanvas.drawNode}
   */
  _collapsed_width;
  horizontal;
  console;
  _level;
  _shape;
  mouseOver;
  redraw_on_mouse;
  // Appears unused
  optional_inputs;
  // Appears unused
  optional_outputs;
  resizable;
  clonable;
  _relative_id;
  clip_area;
  ignore_remove;
  has_errors;
  removable;
  block_delete;
  selected;
  showAdvanced;
  /** @inheritdoc {@link renderArea} */
  #renderArea = new Float32Array(4);
  /**
   * Rect describing the node area, including shadows and any protrusions.
   * Determines if the node is visible.  Calculated once at the start of every frame.
   */
  get renderArea() {
    return this.#renderArea;
  }
  /** @inheritdoc {@link boundingRect} */
  #boundingRect = new Float32Array(4);
  /**
   * Cached node position & area as `x, y, width, height`.  Includes changes made by {@link onBounding}, if present.
   *
   * Determines the node hitbox and other rendering effects.  Calculated once at the start of every frame.
   */
  get boundingRect() {
    return this.#boundingRect;
  }
  /** {@link pos} and {@link size} values are backed by this {@link Rect}. */
  _posSize = new Float32Array(4);
  _pos = this._posSize.subarray(0, 2);
  _size = this._posSize.subarray(2, 4);
  get pos() {
    return this._pos;
  }
  set pos(value) {
    if (!value || value.length < 2) return;
    this._pos[0] = value[0];
    this._pos[1] = value[1];
  }
  get size() {
    return this._size;
  }
  set size(value) {
    if (!value || value.length < 2) return;
    this._size[0] = value[0];
    this._size[1] = value[1];
  }
  /**
   * The size of the node used for rendering.
   */
  get renderingSize() {
    return this.flags.collapsed ? [this._collapsed_width, 0] : this._size;
  }
  get shape() {
    return this._shape;
  }
  set shape(v2) {
    switch (v2) {
      case "default":
        delete this._shape;
        break;
      case "box":
        this._shape = RenderShape.BOX;
        break;
      case "round":
        this._shape = RenderShape.ROUND;
        break;
      case "circle":
        this._shape = RenderShape.CIRCLE;
        break;
      case "card":
        this._shape = RenderShape.CARD;
        break;
      default:
        this._shape = v2;
    }
  }
  /**
   * The shape of the node used for rendering. @see {@link RenderShape}
   */
  get renderingShape() {
    return this._shape || this.constructor.shape || LiteGraph.NODE_DEFAULT_SHAPE;
  }
  get is_selected() {
    return this.selected;
  }
  set is_selected(value) {
    this.selected = value;
  }
  get title_mode() {
    return this.constructor.title_mode ?? TitleMode.NORMAL_TITLE;
  }
  constructor(title) {
    this.id = LiteGraph.use_uuids ? LiteGraph.uuidv4() : -1;
    this.title = title || "Unnamed";
    this.size = [LiteGraph.NODE_WIDTH, 60];
    this.pos = [10, 10];
  }
  /**
   * configure a node from an object containing the serialized info
   */
  configure(info) {
    if (this.graph) {
      this.graph._version++;
    }
    for (const j in info) {
      if (j == "properties") {
        for (const k in info.properties) {
          this.properties[k] = info.properties[k];
          this.onPropertyChanged?.(k, info.properties[k]);
        }
        continue;
      }
      if (info[j] == null) {
        continue;
      } else if (typeof info[j] == "object") {
        if (this[j]?.configure) {
          this[j]?.configure(info[j]);
        } else {
          this[j] = LiteGraph.cloneObject(info[j], this[j]);
        }
      } else {
        this[j] = info[j];
      }
    }
    if (!info.title) {
      this.title = this.constructor.title;
    }
    if (this.inputs) {
      for (let i = 0; i < this.inputs.length; ++i) {
        const input = this.inputs[i];
        const link = this.graph ? this.graph._links.get(input.link) : null;
        this.onConnectionsChange?.(NodeSlotType.INPUT, i, true, link, input);
        this.onInputAdded?.(input);
      }
    }
    if (this.outputs) {
      for (let i = 0; i < this.outputs.length; ++i) {
        const output = this.outputs[i];
        if (!output.links) {
          continue;
        }
        for (let j = 0; j < output.links.length; ++j) {
          const link = this.graph ? this.graph._links.get(output.links[j]) : null;
          this.onConnectionsChange?.(NodeSlotType.OUTPUT, i, true, link, output);
        }
        this.onOutputAdded?.(output);
      }
    }
    if (this.widgets) {
      for (let i = 0; i < this.widgets.length; ++i) {
        const w = this.widgets[i];
        if (!w) continue;
        if (w.options?.property && this.properties[w.options.property] != void 0)
          w.value = JSON.parse(JSON.stringify(this.properties[w.options.property]));
      }
      if (info.widgets_values) {
        for (let i = 0; i < info.widgets_values.length; ++i) {
          if (this.widgets[i]) {
            this.widgets[i].value = info.widgets_values[i];
          }
        }
      }
    }
    if (this.pinned) this.pin(true);
    this.onConfigure?.(info);
  }
  /**
   * serialize the content
   */
  serialize() {
    const o = {
      id: this.id,
      type: this.type,
      pos: [this.pos[0], this.pos[1]],
      size: [this.size[0], this.size[1]],
      flags: LiteGraph.cloneObject(this.flags),
      order: this.order,
      mode: this.mode,
      showAdvanced: this.showAdvanced
    };
    if (this.constructor === LGraphNode && this.last_serialization)
      return this.last_serialization;
    if (this.inputs) o.inputs = this.inputs;
    if (this.outputs) {
      for (let i = 0; i < this.outputs.length; i++) {
        delete this.outputs[i]._data;
      }
      o.outputs = this.outputs;
    }
    if (this.title && this.title != this.constructor.title) o.title = this.title;
    if (this.properties) o.properties = LiteGraph.cloneObject(this.properties);
    if (this.widgets && this.serialize_widgets) {
      o.widgets_values = [];
      for (let i = 0; i < this.widgets.length; ++i) {
        if (this.widgets[i])
          o.widgets_values[i] = this.widgets[i].value;
        else
          o.widgets_values[i] = null;
      }
    }
    if (!o.type) o.type = this.constructor.type;
    if (this.color) o.color = this.color;
    if (this.bgcolor) o.bgcolor = this.bgcolor;
    if (this.boxcolor) o.boxcolor = this.boxcolor;
    if (this.shape) o.shape = this.shape;
    if (this.onSerialize?.(o)) console.warn("node onSerialize shouldnt return anything, data should be stored in the object pass in the first parameter");
    return o;
  }
  /* Creates a clone of this node */
  clone() {
    const node2 = LiteGraph.createNode(this.type);
    if (!node2) return null;
    const data = LiteGraph.cloneObject(this.serialize());
    if (data.inputs) {
      for (let i = 0; i < data.inputs.length; ++i) {
        data.inputs[i].link = null;
      }
    }
    if (data.outputs) {
      for (let i = 0; i < data.outputs.length; ++i) {
        if (data.outputs[i].links) {
          data.outputs[i].links.length = 0;
        }
      }
    }
    delete data.id;
    if (LiteGraph.use_uuids) data.id = LiteGraph.uuidv4();
    node2.configure(data);
    return node2;
  }
  /**
   * serialize and stringify
   */
  toString() {
    return JSON.stringify(this.serialize());
  }
  /**
   * get the title string
   */
  getTitle() {
    return this.title || this.constructor.title;
  }
  /**
   * sets the value of a property
   * @param name
   * @param value
   */
  setProperty(name, value) {
    this.properties ||= {};
    if (value === this.properties[name]) return;
    const prev_value = this.properties[name];
    this.properties[name] = value;
    if (this.onPropertyChanged?.(name, value, prev_value) === false)
      this.properties[name] = prev_value;
    if (this.widgets) {
      for (let i = 0; i < this.widgets.length; ++i) {
        const w = this.widgets[i];
        if (!w) continue;
        if (w.options.property == name) {
          w.value = value;
          break;
        }
      }
    }
  }
  /**
   * sets the output data
   * @param slot
   * @param data
   */
  setOutputData(slot, data) {
    if (!this.outputs) return;
    if (slot == -1 || slot >= this.outputs.length) return;
    const output_info = this.outputs[slot];
    if (!output_info) return;
    output_info._data = data;
    if (this.outputs[slot].links) {
      for (let i = 0; i < this.outputs[slot].links.length; i++) {
        const link_id = this.outputs[slot].links[i];
        const link = this.graph._links.get(link_id);
        if (link) link.data = data;
      }
    }
  }
  /**
   * sets the output data type, useful when you want to be able to overwrite the data type
   */
  setOutputDataType(slot, type) {
    if (!this.outputs) return;
    if (slot == -1 || slot >= this.outputs.length) return;
    const output_info = this.outputs[slot];
    if (!output_info) return;
    output_info.type = type;
    if (this.outputs[slot].links) {
      for (let i = 0; i < this.outputs[slot].links.length; i++) {
        const link_id = this.outputs[slot].links[i];
        this.graph._links.get(link_id).type = type;
      }
    }
  }
  /**
   * Retrieves the input data (data traveling through the connection) from one slot
   * @param slot
   * @param force_update if set to true it will force the connected node of this slot to output data into this link
   * @returns data or if it is not connected returns undefined
   */
  getInputData(slot, force_update) {
    if (!this.inputs) return;
    if (slot >= this.inputs.length || this.inputs[slot].link == null) return;
    const link_id = this.inputs[slot].link;
    const link = this.graph._links.get(link_id);
    if (!link) return null;
    if (!force_update) return link.data;
    const node2 = this.graph.getNodeById(link.origin_id);
    if (!node2) return link.data;
    if (node2.updateOutputData) {
      node2.updateOutputData(link.origin_slot);
    } else {
      node2.onExecute?.();
    }
    return link.data;
  }
  /**
   * Retrieves the input data type (in case this supports multiple input types)
   * @param slot
   * @returns datatype in string format
   */
  getInputDataType(slot) {
    if (!this.inputs) return null;
    if (slot >= this.inputs.length || this.inputs[slot].link == null) return null;
    const link_id = this.inputs[slot].link;
    const link = this.graph._links.get(link_id);
    if (!link) return null;
    const node2 = this.graph.getNodeById(link.origin_id);
    if (!node2) return link.type;
    const output_info = node2.outputs[link.origin_slot];
    return output_info ? output_info.type : null;
  }
  /**
   * Retrieves the input data from one slot using its name instead of slot number
   * @param slot_name
   * @param force_update if set to true it will force the connected node of this slot to output data into this link
   * @returns data or if it is not connected returns null
   */
  getInputDataByName(slot_name, force_update) {
    const slot = this.findInputSlot(slot_name);
    return slot == -1 ? null : this.getInputData(slot, force_update);
  }
  /**
   * tells you if there is a connection in one input slot
   * @param slot The 0-based index of the input to check
   * @returns `true` if the input slot has a link ID (does not perform validation)
   */
  isInputConnected(slot) {
    if (!this.inputs) return false;
    return slot < this.inputs.length && this.inputs[slot].link != null;
  }
  /**
   * tells you info about an input connection (which node, type, etc)
   * @returns object or null { link: id, name: string, type: string or 0 }
   */
  getInputInfo(slot) {
    return !this.inputs || !(slot < this.inputs.length) ? null : this.inputs[slot];
  }
  /**
   * Returns the link info in the connection of an input slot
   * @returns object or null
   */
  getInputLink(slot) {
    if (!this.inputs) return null;
    if (slot < this.inputs.length) {
      const slot_info = this.inputs[slot];
      return this.graph._links.get(slot_info.link);
    }
    return null;
  }
  /**
   * returns the node connected in the input slot
   * @returns node or null
   */
  getInputNode(slot) {
    if (!this.inputs) return null;
    if (slot >= this.inputs.length) return null;
    const input = this.inputs[slot];
    if (!input || input.link === null) return null;
    const link_info = this.graph._links.get(input.link);
    if (!link_info) return null;
    return this.graph.getNodeById(link_info.origin_id);
  }
  /**
   * returns the value of an input with this name, otherwise checks if there is a property with that name
   * @returns value
   */
  getInputOrProperty(name) {
    if (!this.inputs || !this.inputs.length) {
      return this.properties ? this.properties[name] : null;
    }
    for (let i = 0, l = this.inputs.length; i < l; ++i) {
      const input_info = this.inputs[i];
      if (name == input_info.name && input_info.link != null) {
        const link = this.graph._links.get(input_info.link);
        if (link) return link.data;
      }
    }
    return this.properties[name];
  }
  /**
   * tells you the last output data that went in that slot
   * @returns object or null
   */
  getOutputData(slot) {
    if (!this.outputs) return null;
    if (slot >= this.outputs.length) return null;
    const info = this.outputs[slot];
    return info._data;
  }
  /**
   * tells you info about an output connection (which node, type, etc)
   * @returns object or null { name: string, type: string, links: [ ids of links in number ] }
   */
  getOutputInfo(slot) {
    return !this.outputs || !(slot < this.outputs.length) ? null : this.outputs[slot];
  }
  /**
   * tells you if there is a connection in one output slot
   */
  isOutputConnected(slot) {
    if (!this.outputs) return false;
    return slot < this.outputs.length && this.outputs[slot].links?.length > 0;
  }
  /**
   * tells you if there is any connection in the output slots
   */
  isAnyOutputConnected() {
    if (!this.outputs) return false;
    for (let i = 0; i < this.outputs.length; ++i) {
      if (this.outputs[i].links && this.outputs[i].links.length) {
        return true;
      }
    }
    return false;
  }
  /**
   * retrieves all the nodes connected to this output slot
   */
  getOutputNodes(slot) {
    if (!this.outputs || this.outputs.length == 0) return null;
    if (slot >= this.outputs.length) return null;
    const output = this.outputs[slot];
    if (!output.links || output.links.length == 0) return null;
    const r = [];
    for (let i = 0; i < output.links.length; i++) {
      const link_id = output.links[i];
      const link = this.graph._links.get(link_id);
      if (link) {
        const target_node = this.graph.getNodeById(link.target_id);
        if (target_node) {
          r.push(target_node);
        }
      }
    }
    return r;
  }
  addOnTriggerInput() {
    const trigS = this.findInputSlot("onTrigger");
    if (trigS == -1) {
      this.addInput("onTrigger", LiteGraph.EVENT, {
        optional: true,
        nameLocked: true
      });
      return this.findInputSlot("onTrigger");
    }
    return trigS;
  }
  addOnExecutedOutput() {
    const trigS = this.findOutputSlot("onExecuted");
    if (trigS == -1) {
      this.addOutput("onExecuted", LiteGraph.ACTION, {
        optional: true,
        nameLocked: true
      });
      return this.findOutputSlot("onExecuted");
    }
    return trigS;
  }
  onAfterExecuteNode(param, options2) {
    const trigS = this.findOutputSlot("onExecuted");
    if (trigS != -1) {
      this.triggerSlot(trigS, param, null, options2);
    }
  }
  changeMode(modeTo) {
    switch (modeTo) {
      case LGraphEventMode.ON_EVENT:
        break;
      case LGraphEventMode.ON_TRIGGER:
        this.addOnTriggerInput();
        this.addOnExecutedOutput();
        break;
      case LGraphEventMode.NEVER:
        break;
      case LGraphEventMode.ALWAYS:
        break;
      case LiteGraph.ON_REQUEST:
        break;
      default:
        return false;
    }
    this.mode = modeTo;
    return true;
  }
  /**
   * Triggers the node code execution, place a boolean/counter to mark the node as being executed
   */
  doExecute(param, options2) {
    options2 = options2 || {};
    if (this.onExecute) {
      options2.action_call ||= this.id + "_exec_" + Math.floor(Math.random() * 9999);
      this.graph.nodes_executing[this.id] = true;
      this.onExecute(param, options2);
      this.graph.nodes_executing[this.id] = false;
      this.exec_version = this.graph.iteration;
      if (options2?.action_call) {
        this.action_call = options2.action_call;
        this.graph.nodes_executedAction[this.id] = options2.action_call;
      }
    }
    this.execute_triggered = 2;
    this.onAfterExecuteNode?.(param, options2);
  }
  /**
   * Triggers an action, wrapped by logics to control execution flow
   * @param action name
   */
  actionDo(action, param, options2) {
    options2 = options2 || {};
    if (this.onAction) {
      options2.action_call ||= this.id + "_" + (action ? action : "action") + "_" + Math.floor(Math.random() * 9999);
      this.graph.nodes_actioning[this.id] = action ? action : "actioning";
      this.onAction(action, param, options2);
      this.graph.nodes_actioning[this.id] = false;
      if (options2?.action_call) {
        this.action_call = options2.action_call;
        this.graph.nodes_executedAction[this.id] = options2.action_call;
      }
    }
    this.action_triggered = 2;
    this.onAfterExecuteNode?.(param, options2);
  }
  /**
   * Triggers an event in this node, this will trigger any output with the same name
   * @param action name ( "on_play", ... ) if action is equivalent to false then the event is send to all
   */
  trigger(action, param, options2) {
    if (!this.outputs || !this.outputs.length) {
      return;
    }
    if (this.graph) this.graph._last_trigger_time = LiteGraph.getTime();
    for (let i = 0; i < this.outputs.length; ++i) {
      const output = this.outputs[i];
      if (!output || output.type !== LiteGraph.EVENT || action && output.name != action)
        continue;
      this.triggerSlot(i, param, null, options2);
    }
  }
  /**
   * Triggers a slot event in this node: cycle output slots and launch execute/action on connected nodes
   * @param slot the index of the output slot
   * @param link_id [optional] in case you want to trigger and specific output link in a slot
   */
  triggerSlot(slot, param, link_id, options2) {
    options2 = options2 || {};
    if (!this.outputs) return;
    if (slot == null) {
      console.error("slot must be a number");
      return;
    }
    if (typeof slot !== "number")
      console.warn("slot must be a number, use node.trigger('name') if you want to use a string");
    const output = this.outputs[slot];
    if (!output) return;
    const links = output.links;
    if (!links || !links.length) return;
    if (this.graph) this.graph._last_trigger_time = LiteGraph.getTime();
    for (let k = 0; k < links.length; ++k) {
      const id = links[k];
      if (link_id != null && link_id != id) continue;
      const link_info = this.graph._links.get(id);
      if (!link_info) continue;
      link_info._last_time = LiteGraph.getTime();
      const node2 = this.graph.getNodeById(link_info.target_id);
      if (!node2) continue;
      if (node2.mode === LGraphEventMode.ON_TRIGGER) {
        if (!options2.action_call)
          options2.action_call = this.id + "_trigg_" + Math.floor(Math.random() * 9999);
        node2.doExecute?.(param, options2);
      } else if (node2.onAction) {
        if (!options2.action_call)
          options2.action_call = this.id + "_act_" + Math.floor(Math.random() * 9999);
        const target_connection = node2.inputs[link_info.target_slot];
        node2.actionDo(target_connection.name, param, options2);
      }
    }
  }
  /**
   * clears the trigger slot animation
   * @param slot the index of the output slot
   * @param link_id [optional] in case you want to trigger and specific output link in a slot
   */
  clearTriggeredSlot(slot, link_id) {
    if (!this.outputs) return;
    const output = this.outputs[slot];
    if (!output) return;
    const links = output.links;
    if (!links || !links.length) return;
    for (let k = 0; k < links.length; ++k) {
      const id = links[k];
      if (link_id != null && link_id != id) continue;
      const link_info = this.graph._links.get(id);
      if (!link_info) continue;
      link_info._last_time = 0;
    }
  }
  /**
   * changes node size and triggers callback
   */
  setSize(size) {
    this.size = size;
    this.onResize?.(this.size);
  }
  /**
   * add a new property to this node
   * @param type string defining the output type ("vec3","number",...)
   * @param extra_info this can be used to have special properties of the property (like values, etc)
   */
  addProperty(name, default_value, type, extra_info) {
    const o = {
      name,
      type,
      default_value
    };
    if (extra_info) {
      for (const i in extra_info) {
        o[i] = extra_info[i];
      }
    }
    this.properties_info ||= [];
    this.properties_info.push(o);
    this.properties ||= {};
    this.properties[name] = default_value;
    return o;
  }
  /**
   * add a new output slot to use in this node
   * @param type string defining the output type ("vec3","number",...)
   * @param extra_info this can be used to have special properties of an output (label, special color, position, etc)
   */
  addOutput(name, type, extra_info) {
    const output = new NodeOutputSlot({ name, type, links: null });
    if (extra_info) {
      for (const i in extra_info) {
        output[i] = extra_info[i];
      }
    }
    this.outputs ||= [];
    this.outputs.push(output);
    this.onOutputAdded?.(output);
    if (LiteGraph.auto_load_slot_types)
      LiteGraph.registerNodeAndSlotType(this, type, true);
    this.setSize(this.computeSize());
    this.setDirtyCanvas(true, true);
    return output;
  }
  /**
   * add a new output slot to use in this node
   * @param array of triplets like [[name,type,extra_info],[...]]
   */
  addOutputs(array) {
    for (let i = 0; i < array.length; ++i) {
      const info = array[i];
      const o = new NodeOutputSlot({ name: info[0], type: info[1], links: null });
      if (array[2]) {
        for (const j in info[2]) {
          o[j] = info[2][j];
        }
      }
      this.outputs ||= [];
      this.outputs.push(o);
      this.onOutputAdded?.(o);
      if (LiteGraph.auto_load_slot_types)
        LiteGraph.registerNodeAndSlotType(this, info[1], true);
    }
    this.setSize(this.computeSize());
    this.setDirtyCanvas(true, true);
  }
  /**
   * remove an existing output slot
   */
  removeOutput(slot) {
    this.disconnectOutput(slot);
    this.outputs.splice(slot, 1);
    for (let i = slot; i < this.outputs.length; ++i) {
      if (!this.outputs[i] || !this.outputs[i].links) continue;
      const links = this.outputs[i].links;
      for (let j = 0; j < links.length; ++j) {
        const link = this.graph._links.get(links[j]);
        if (!link) continue;
        link.origin_slot -= 1;
      }
    }
    this.setSize(this.computeSize());
    this.onOutputRemoved?.(slot);
    this.setDirtyCanvas(true, true);
  }
  /**
   * add a new input slot to use in this node
   * @param type string defining the input type ("vec3","number",...), it its a generic one use 0
   * @param extra_info this can be used to have special properties of an input (label, color, position, etc)
   */
  addInput(name, type, extra_info) {
    type = type || 0;
    const input = new NodeInputSlot({ name, type, link: null });
    if (extra_info) {
      for (const i in extra_info) {
        input[i] = extra_info[i];
      }
    }
    this.inputs ||= [];
    this.inputs.push(input);
    this.setSize(this.computeSize());
    this.onInputAdded?.(input);
    LiteGraph.registerNodeAndSlotType(this, type);
    this.setDirtyCanvas(true, true);
    return input;
  }
  /**
   * add several new input slots in this node
   * @param array of triplets like [[name,type,extra_info],[...]]
   */
  addInputs(array) {
    for (let i = 0; i < array.length; ++i) {
      const info = array[i];
      const o = new NodeInputSlot({ name: info[0], type: info[1], link: null });
      if (array[2]) {
        for (const j in info[2]) {
          o[j] = info[2][j];
        }
      }
      this.inputs ||= [];
      this.inputs.push(o);
      this.onInputAdded?.(o);
      LiteGraph.registerNodeAndSlotType(this, info[1]);
    }
    this.setSize(this.computeSize());
    this.setDirtyCanvas(true, true);
  }
  /**
   * remove an existing input slot
   */
  removeInput(slot) {
    this.disconnectInput(slot);
    const slot_info = this.inputs.splice(slot, 1);
    for (let i = slot; i < this.inputs.length; ++i) {
      if (!this.inputs[i]) continue;
      const link = this.graph._links.get(this.inputs[i].link);
      if (!link) continue;
      link.target_slot -= 1;
    }
    this.setSize(this.computeSize());
    this.onInputRemoved?.(slot, slot_info[0]);
    this.setDirtyCanvas(true, true);
  }
  /**
   * add an special connection to this node (used for special kinds of graphs)
   * @param type string defining the input type ("vec3","number",...)
   * @param pos position of the connection inside the node
   * @param direction if is input or output
   */
  addConnection(name, type, pos, direction) {
    const o = {
      name,
      type,
      pos,
      direction,
      links: null
    };
    this.connections.push(o);
    return o;
  }
  /**
   * computes the minimum size of a node according to its inputs and output slots
   * @returns the total size
   */
  computeSize(out) {
    const ctorSize = this.constructor.size;
    if (ctorSize) return [ctorSize[0], ctorSize[1]];
    let rows = Math.max(
      this.inputs ? this.inputs.length : 1,
      this.outputs ? this.outputs.length : 1
    );
    const size = out || new Float32Array([0, 0]);
    rows = Math.max(rows, 1);
    const font_size = LiteGraph.NODE_TEXT_SIZE;
    const title_width = compute_text_size(this.title);
    let input_width = 0;
    let output_width = 0;
    if (this.inputs) {
      for (let i = 0, l = this.inputs.length; i < l; ++i) {
        const input = this.inputs[i];
        const text = input.label || input.localized_name || input.name || "";
        const text_width = compute_text_size(text);
        if (input_width < text_width)
          input_width = text_width;
      }
    }
    if (this.outputs) {
      for (let i = 0, l = this.outputs.length; i < l; ++i) {
        const output = this.outputs[i];
        const text = output.label || output.localized_name || output.name || "";
        const text_width = compute_text_size(text);
        if (output_width < text_width)
          output_width = text_width;
      }
    }
    size[0] = Math.max(input_width + output_width + 10, title_width);
    size[0] = Math.max(size[0], LiteGraph.NODE_WIDTH);
    if (this.widgets?.length)
      size[0] = Math.max(size[0], LiteGraph.NODE_WIDTH * 1.5);
    size[1] = (this.constructor.slot_start_y || 0) + rows * LiteGraph.NODE_SLOT_HEIGHT;
    let widgets_height = 0;
    if (this.widgets?.length) {
      for (let i = 0, l = this.widgets.length; i < l; ++i) {
        const widget = this.widgets[i];
        if (widget.hidden || widget.advanced && !this.showAdvanced) continue;
        widgets_height += widget.computeSize ? widget.computeSize(size[0])[1] + 4 : LiteGraph.NODE_WIDGET_HEIGHT + 4;
      }
      widgets_height += 8;
    }
    if (this.widgets_up)
      size[1] = Math.max(size[1], widgets_height);
    else if (this.widgets_start_y != null)
      size[1] = Math.max(size[1], widgets_height + this.widgets_start_y);
    else
      size[1] += widgets_height;
    function compute_text_size(text) {
      return text ? font_size * text.length * 0.6 : 0;
    }
    if (this.constructor.min_height && size[1] < this.constructor.min_height) {
      size[1] = this.constructor.min_height;
    }
    size[1] += 6;
    return size;
  }
  inResizeCorner(canvasX, canvasY) {
    const rows = this.outputs ? this.outputs.length : 1;
    const outputs_offset = (this.constructor.slot_start_y || 0) + rows * LiteGraph.NODE_SLOT_HEIGHT;
    return isInRectangle(
      canvasX,
      canvasY,
      this.pos[0] + this.size[0] - 15,
      this.pos[1] + Math.max(this.size[1] - 15, outputs_offset),
      20,
      20
    );
  }
  /**
   * returns all the info available about a property of this node.
   * @param property name of the property
   * @returns the object with all the available info
   */
  getPropertyInfo(property) {
    let info = null;
    if (this.properties_info) {
      for (let i = 0; i < this.properties_info.length; ++i) {
        if (this.properties_info[i].name == property) {
          info = this.properties_info[i];
          break;
        }
      }
    }
    if (this.constructor["@" + property])
      info = this.constructor["@" + property];
    if (this.constructor.widgets_info?.[property])
      info = this.constructor.widgets_info[property];
    if (!info && this.onGetPropertyInfo) {
      info = this.onGetPropertyInfo(property);
    }
    info ||= {};
    info.type ||= typeof this.properties[property];
    if (info.widget == "combo") info.type = "enum";
    return info;
  }
  /**
   * Defines a widget inside the node, it will be rendered on top of the node, you can control lots of properties
   * @param type the widget type (could be "number","string","combo"
   * @param name the text to show on the widget
   * @param value the default value
   * @param callback function to call when it changes (optionally, it can be the name of the property to modify)
   * @param options the object that contains special properties of this widget
   * @returns the created widget object
   */
  addWidget(type, name, value, callback, options2) {
    this.widgets ||= [];
    if (!options2 && callback && typeof callback === "object") {
      options2 = callback;
      callback = null;
    }
    if (options2 && typeof options2 === "string")
      options2 = { property: options2 };
    if (callback && typeof callback === "string") {
      options2 ||= {};
      options2.property = callback;
      callback = null;
    }
    if (callback && typeof callback !== "function") {
      console.warn("addWidget: callback must be a function");
      callback = null;
    }
    const w = {
      // @ts-expect-error Type check or just assert?
      type: type.toLowerCase(),
      name,
      value,
      callback,
      options: options2 || {}
    };
    if (w.options.y !== void 0) {
      w.y = w.options.y;
    }
    if (!callback && !w.options.callback && !w.options.property) {
      console.warn("LiteGraph addWidget(...) without a callback or property assigned");
    }
    if (type == "combo" && !w.options.values) {
      throw "LiteGraph addWidget('combo',...) requires to pass values in options: { values:['red','blue'] }";
    }
    const widget = this.addCustomWidget(w);
    this.setSize(this.computeSize());
    return widget;
  }
  addCustomWidget(custom_widget) {
    this.widgets ||= [];
    const WidgetClass = WIDGET_TYPE_MAP[custom_widget.type];
    const widget = WidgetClass ? new WidgetClass(custom_widget) : custom_widget;
    this.widgets.push(widget);
    return widget;
  }
  move(deltaX, deltaY) {
    if (this.pinned) return;
    this.pos[0] += deltaX;
    this.pos[1] += deltaY;
  }
  /**
   * Internal method to measure the node for rendering.  Prefer {@link boundingRect} where possible.
   *
   * Populates {@link out} with the results in graph space.
   * Adjusts for title and collapsed status, but does not call {@link onBounding}.
   * @param out `x, y, width, height` are written to this array.
   * @param pad Expands the area by this amount on each side.  Default: 0
   */
  measure(out, pad = 0) {
    const titleMode = this.title_mode;
    const renderTitle = titleMode != TitleMode.TRANSPARENT_TITLE && titleMode != TitleMode.NO_TITLE;
    const titleHeight = renderTitle ? LiteGraph.NODE_TITLE_HEIGHT : 0;
    out[0] = this.pos[0] - pad;
    out[1] = this.pos[1] + -titleHeight - pad;
    if (!this.flags?.collapsed) {
      out[2] = this.size[0] + 2 * pad;
      out[3] = this.size[1] + titleHeight + 2 * pad;
    } else {
      out[2] = (this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH) + 2 * pad;
      out[3] = LiteGraph.NODE_TITLE_HEIGHT + 2 * pad;
    }
  }
  /**
   * returns the bounding of the object, used for rendering purposes
   * @param out {Float32Array[4]?} [optional] a place to store the output, to free garbage
   * @param includeExternal {boolean?} [optional] set to true to
   * include the shadow and connection points in the bounding calculation
   * @returns the bounding box in format of [topleft_cornerx, topleft_cornery, width, height]
   */
  getBounding(out, includeExternal) {
    out ||= new Float32Array(4);
    const rect = includeExternal ? this.renderArea : this.boundingRect;
    out[0] = rect[0];
    out[1] = rect[1];
    out[2] = rect[2];
    out[3] = rect[3];
    return out;
  }
  /**
   * Calculates the render area of this node, populating both {@link boundingRect} and {@link renderArea}.
   * Called automatically at the start of every frame.
   */
  updateArea() {
    const bounds = this.#boundingRect;
    this.measure(bounds);
    this.onBounding?.(bounds);
    const renderArea = this.#renderArea;
    renderArea.set(bounds);
    renderArea[0] -= 4;
    renderArea[1] -= 4;
    renderArea[2] += 6 + 4;
    renderArea[3] += 5 + 4;
  }
  /**
   * checks if a point is inside the shape of a node
   */
  isPointInside(x2, y) {
    return isInRect(x2, y, this.boundingRect);
  }
  /**
   * Checks if the provided point is inside this node's collapse button area.
   * @param x X co-ordinate to check
   * @param y Y co-ordinate to check
   * @returns true if the x,y point is in the collapse button area, otherwise false
   */
  isPointInCollapse(x2, y) {
    const squareLength = LiteGraph.NODE_TITLE_HEIGHT;
    return isInRectangle(
      x2,
      y,
      this.pos[0],
      this.pos[1] - squareLength,
      squareLength,
      squareLength
    );
  }
  /**
   * checks if a point is inside a node slot, and returns info about which slot
   * @param x
   * @param y
   * @returns if found the object contains { input|output: slot object, slot: number, link_pos: [x,y] }
   */
  getSlotInPosition(x2, y) {
    const link_pos = new Float32Array(2);
    if (this.inputs) {
      for (let i = 0, l = this.inputs.length; i < l; ++i) {
        const input = this.inputs[i];
        this.getConnectionPos(true, i, link_pos);
        if (isInRectangle(x2, y, link_pos[0] - 10, link_pos[1] - 5, 20, 10)) {
          return { input, slot: i, link_pos };
        }
      }
    }
    if (this.outputs) {
      for (let i = 0, l = this.outputs.length; i < l; ++i) {
        const output = this.outputs[i];
        this.getConnectionPos(false, i, link_pos);
        if (isInRectangle(x2, y, link_pos[0] - 10, link_pos[1] - 5, 20, 10)) {
          return { output, slot: i, link_pos };
        }
      }
    }
    return null;
  }
  /**
   * Gets the widget on this node at the given co-ordinates.
   * @param canvasX X co-ordinate in graph space
   * @param canvasY Y co-ordinate in graph space
   * @returns The widget found, otherwise `null`
   */
  getWidgetOnPos(canvasX, canvasY, includeDisabled = false) {
    const { widgets, pos, size } = this;
    if (!widgets?.length) return null;
    const x2 = canvasX - pos[0];
    const y = canvasY - pos[1];
    const nodeWidth = size[0];
    for (const widget of widgets) {
      if (!widget || widget.disabled && !includeDisabled || widget.hidden || widget.advanced && !this.showAdvanced)
        continue;
      const h = widget.computeSize ? widget.computeSize(nodeWidth)[1] : LiteGraph.NODE_WIDGET_HEIGHT;
      const w = widget.width || nodeWidth;
      if (widget.last_y !== void 0 && isInRectangle(x2, y, 6, widget.last_y, w - 12, h))
        return widget;
    }
    return null;
  }
  findInputSlot(name, returnObj = false) {
    if (!this.inputs) return -1;
    for (let i = 0, l = this.inputs.length; i < l; ++i) {
      if (name == this.inputs[i].name) {
        return !returnObj ? i : this.inputs[i];
      }
    }
    return -1;
  }
  findOutputSlot(name, returnObj = false) {
    if (!this.outputs) return -1;
    for (let i = 0, l = this.outputs.length; i < l; ++i) {
      if (name == this.outputs[i].name) {
        return !returnObj ? i : this.outputs[i];
      }
    }
    return -1;
  }
  findInputSlotFree(optsIn) {
    return this.#findFreeSlot(this.inputs, optsIn);
  }
  findOutputSlotFree(optsIn) {
    return this.#findFreeSlot(this.outputs, optsIn);
  }
  /**
   * Finds the next free slot
   * @param slots The slots to search, i.e. this.inputs or this.outputs
   */
  #findFreeSlot(slots, options2) {
    const defaults = {
      returnObj: false,
      typesNotAccepted: []
    };
    const opts = Object.assign(defaults, options2 || {});
    const length = slots?.length;
    if (!(length > 0)) return -1;
    for (let i = 0; i < length; ++i) {
      const slot = slots[i];
      if (!slot || slot.link || slot.links?.length) continue;
      if (opts.typesNotAccepted?.includes?.(slot.type)) continue;
      return !opts.returnObj ? i : slot;
    }
    return -1;
  }
  findInputSlotByType(type, returnObj, preferFreeSlot, doNotUseOccupied) {
    return this.#findSlotByType(
      this.inputs,
      type,
      returnObj,
      preferFreeSlot,
      doNotUseOccupied
    );
  }
  findOutputSlotByType(type, returnObj, preferFreeSlot, doNotUseOccupied) {
    return this.#findSlotByType(
      this.outputs,
      type,
      returnObj,
      preferFreeSlot,
      doNotUseOccupied
    );
  }
  findSlotByType(input, type, returnObj, preferFreeSlot, doNotUseOccupied) {
    return input ? this.#findSlotByType(
      this.inputs,
      type,
      returnObj,
      preferFreeSlot,
      doNotUseOccupied
    ) : this.#findSlotByType(
      this.outputs,
      type,
      returnObj,
      preferFreeSlot,
      doNotUseOccupied
    );
  }
  /**
   * Finds a matching slot from those provided, returning the slot itself or its index in {@link slots}.
   * @param slots Slots to search (this.inputs or this.outputs)
   * @param type Type of slot to look for
   * @param returnObj If true, returns the slot itself.  Otherwise, the index.
   * @param preferFreeSlot Prefer a free slot, but if none are found, fall back to an occupied slot.
   * @param doNotUseOccupied Do not fall back to occupied slots.
   * @see {findSlotByType}
   * @see {findOutputSlotByType}
   * @see {findInputSlotByType}
   * @returns If a match is found, the slot if returnObj is true, otherwise the index.  If no matches are found, -1
   */
  #findSlotByType(slots, type, returnObj, preferFreeSlot, doNotUseOccupied) {
    const length = slots?.length;
    if (!length) return -1;
    if (type == "" || type == "*") type = 0;
    const sourceTypes = String(type).toLowerCase().split(",");
    let occupiedSlot = null;
    for (let i = 0; i < length; ++i) {
      const slot = slots[i];
      const destTypes = slot.type == "0" || slot.type == "*" ? ["0"] : String(slot.type).toLowerCase().split(",");
      for (const sourceType of sourceTypes) {
        const source = sourceType == "_event_" ? LiteGraph.EVENT : sourceType;
        for (const destType of destTypes) {
          const dest = destType == "_event_" ? LiteGraph.EVENT : destType;
          if (source == dest || source === "*" || dest === "*") {
            if (preferFreeSlot && (slot.links?.length || slot.link != null)) {
              occupiedSlot ??= returnObj ? slot : i;
              continue;
            }
            return returnObj ? slot : i;
          }
        }
      }
    }
    return doNotUseOccupied ? -1 : occupiedSlot ?? -1;
  }
  /**
   * Determines the slot index to connect to when attempting to connect by type.
   * @param findInputs If true, searches for an input.  Otherwise, an output.
   * @param node The node at the other end of the connection.
   * @param slotType The type of slot at the other end of the connection.
   * @param options Search restrictions to adhere to.
   * @see {connectByType}
   * @see {connectByTypeOutput}
   */
  findConnectByTypeSlot(findInputs, node2, slotType, options2) {
    if (options2 && typeof options2 === "object") {
      if ("firstFreeIfInputGeneralInCase" in options2) options2.wildcardToTyped = !!options2.firstFreeIfInputGeneralInCase;
      if ("firstFreeIfOutputGeneralInCase" in options2) options2.wildcardToTyped = !!options2.firstFreeIfOutputGeneralInCase;
      if ("generalTypeInCase" in options2) options2.typedToWildcard = !!options2.generalTypeInCase;
    }
    const optsDef = {
      createEventInCase: true,
      wildcardToTyped: true,
      typedToWildcard: true
    };
    const opts = Object.assign(optsDef, options2);
    if (node2 && typeof node2 === "number") {
      node2 = this.graph.getNodeById(node2);
    }
    const slot = node2.findSlotByType(findInputs, slotType, false, true);
    if (slot >= 0 && slot !== null) return slot;
    if (opts.createEventInCase && slotType == LiteGraph.EVENT) {
      if (findInputs) return -1;
      if (LiteGraph.do_add_triggers_slots) return node2.addOnExecutedOutput();
    }
    if (opts.typedToWildcard) {
      const generalSlot = node2.findSlotByType(findInputs, 0, false, true, true);
      if (generalSlot >= 0) return generalSlot;
    }
    if (opts.wildcardToTyped && (slotType == 0 || slotType == "*" || slotType == "")) {
      const opt = { typesNotAccepted: [LiteGraph.EVENT] };
      const nonEventSlot = findInputs ? node2.findInputSlotFree(opt) : node2.findOutputSlotFree(opt);
      if (nonEventSlot >= 0) return nonEventSlot;
    }
    return null;
  }
  /**
   * connect this node output to the input of another node BY TYPE
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param target_node the target node
   * @param target_slotType the input slot type of the target node
   * @returns the link_info is created, otherwise null
   */
  connectByType(slot, target_node, target_slotType, optsIn) {
    const slotIndex = this.findConnectByTypeSlot(
      true,
      target_node,
      target_slotType,
      optsIn
    );
    if (slotIndex !== null)
      return this.connect(slot, target_node, slotIndex, optsIn?.afterRerouteId);
    console.debug("[connectByType]: no way to connect type: ", target_slotType, " to node: ", target_node);
    return null;
  }
  /**
   * connect this node input to the output of another node BY TYPE
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param source_node the target node
   * @param source_slotType the output slot type of the target node
   * @returns the link_info is created, otherwise null
   */
  connectByTypeOutput(slot, source_node, source_slotType, optsIn) {
    if (typeof optsIn === "object") {
      if ("firstFreeIfInputGeneralInCase" in optsIn) optsIn.wildcardToTyped = !!optsIn.firstFreeIfInputGeneralInCase;
      if ("generalTypeInCase" in optsIn) optsIn.typedToWildcard = !!optsIn.generalTypeInCase;
    }
    const slotIndex = this.findConnectByTypeSlot(
      false,
      source_node,
      source_slotType,
      optsIn
    );
    if (slotIndex !== null)
      return source_node.connect(slotIndex, this, slot, optsIn?.afterRerouteId);
    console.debug("[connectByType]: no way to connect type: ", source_slotType, " to node: ", source_node);
    return null;
  }
  /**
   * Connect an output of this node to an input of another node
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param target_node the target node
   * @param target_slot the input slot of the target node (could be the number of the slot or the string with the name of the slot, or -1 to connect a trigger)
   * @returns the link_info is created, otherwise null
   */
  connect(slot, target_node, target_slot, afterRerouteId) {
    let targetIndex;
    const graph = this.graph;
    if (!graph) {
      console.log("Connect: Error, node doesn't belong to any graph. Nodes must be added first to a graph before connecting them.");
      return null;
    }
    if (typeof slot === "string") {
      slot = this.findOutputSlot(slot);
      if (slot == -1) {
        if (LiteGraph.debug) console.log("Connect: Error, no slot of name " + slot);
        return null;
      }
    } else if (!this.outputs || slot >= this.outputs.length) {
      if (LiteGraph.debug) console.log("Connect: Error, slot number not found");
      return null;
    }
    if (target_node && typeof target_node === "number") {
      target_node = graph.getNodeById(target_node);
    }
    if (!target_node) throw "target node is null";
    if (target_node == this) return null;
    if (typeof target_slot === "string") {
      targetIndex = target_node.findInputSlot(target_slot);
      if (targetIndex == -1) {
        if (LiteGraph.debug) console.log("Connect: Error, no slot of name " + targetIndex);
        return null;
      }
    } else if (target_slot === LiteGraph.EVENT) {
      if (LiteGraph.do_add_triggers_slots) {
        target_node.changeMode(LGraphEventMode.ON_TRIGGER);
        targetIndex = target_node.findInputSlot("onTrigger");
      } else {
        return null;
      }
    } else if (typeof target_slot === "number") {
      targetIndex = target_slot;
    } else {
      targetIndex = 0;
    }
    if (target_node.onBeforeConnectInput) {
      const requestedIndex = target_node.onBeforeConnectInput(targetIndex, target_slot);
      targetIndex = typeof requestedIndex === "number" ? requestedIndex : null;
    }
    if (targetIndex === null || !target_node.inputs || targetIndex >= target_node.inputs.length) {
      if (LiteGraph.debug) console.log("Connect: Error, slot number not found");
      return null;
    }
    let changed = false;
    const input = target_node.inputs[targetIndex];
    let link_info = null;
    const output = this.outputs[slot];
    if (!this.outputs[slot]) return null;
    if (!LiteGraph.isValidConnection(output.type, input.type)) {
      this.setDirtyCanvas(false, true);
      if (changed) graph.connectionChange(this, link_info);
      return null;
    }
    if (target_node.onConnectInput?.(targetIndex, output.type, output, this, slot) === false)
      return null;
    if (this.onConnectOutput?.(slot, input.type, input, target_node, targetIndex) === false)
      return null;
    if (target_node.inputs[targetIndex]?.link != null) {
      graph.beforeChange();
      target_node.disconnectInput(targetIndex, true);
      changed = true;
    }
    if (output.links?.length) {
      if (output.type === LiteGraph.EVENT && !LiteGraph.allow_multi_output_for_events) {
        graph.beforeChange();
        this.disconnectOutput(slot, false, { doProcessChange: false });
        changed = true;
      }
    }
    const nextId = ++graph.state.lastLinkId;
    link_info = new LLink(
      nextId,
      input.type || output.type,
      this.id,
      slot,
      target_node.id,
      targetIndex,
      afterRerouteId
    );
    graph._links.set(link_info.id, link_info);
    output.links ??= [];
    output.links.push(link_info.id);
    target_node.inputs[targetIndex].link = link_info.id;
    LLink.getReroutes(graph, link_info).forEach((x2) => x2?.linkIds.add(nextId));
    graph._version++;
    this.onConnectionsChange?.(
      NodeSlotType.OUTPUT,
      slot,
      true,
      link_info,
      output
    );
    target_node.onConnectionsChange?.(
      NodeSlotType.INPUT,
      targetIndex,
      true,
      link_info,
      input
    );
    graph.onNodeConnectionChange?.(
      NodeSlotType.INPUT,
      target_node,
      targetIndex,
      this,
      slot
    );
    graph.onNodeConnectionChange?.(
      NodeSlotType.OUTPUT,
      this,
      slot,
      target_node,
      targetIndex
    );
    this.setDirtyCanvas(false, true);
    graph.afterChange();
    graph.connectionChange(this);
    return link_info;
  }
  /**
   * disconnect one output to an specific node
   * @param slot (could be the number of the slot or the string with the name of the slot)
   * @param target_node the target node to which this slot is connected [Optional,
   * if not target_node is specified all nodes will be disconnected]
   * @returns if it was disconnected successfully
   */
  disconnectOutput(slot, target_node) {
    if (typeof slot === "string") {
      slot = this.findOutputSlot(slot);
      if (slot == -1) {
        if (LiteGraph.debug) console.log("Connect: Error, no slot of name " + slot);
        return false;
      }
    } else if (!this.outputs || slot >= this.outputs.length) {
      if (LiteGraph.debug) console.log("Connect: Error, slot number not found");
      return false;
    }
    const output = this.outputs[slot];
    if (!output || !output.links || output.links.length == 0) return false;
    const graph = this.graph;
    if (target_node) {
      if (typeof target_node === "number")
        target_node = graph.getNodeById(target_node);
      if (!target_node) throw "Target Node not found";
      for (let i = 0, l = output.links.length; i < l; i++) {
        const link_id = output.links[i];
        const link_info = graph._links.get(link_id);
        if (link_info.target_id == target_node.id) {
          output.links.splice(i, 1);
          const input = target_node.inputs[link_info.target_slot];
          input.link = null;
          graph._links.delete(link_id);
          graph._version++;
          target_node.onConnectionsChange?.(
            NodeSlotType.INPUT,
            link_info.target_slot,
            false,
            link_info,
            input
          );
          this.onConnectionsChange?.(
            NodeSlotType.OUTPUT,
            slot,
            false,
            link_info,
            output
          );
          graph.onNodeConnectionChange?.(NodeSlotType.OUTPUT, this, slot);
          graph.onNodeConnectionChange?.(NodeSlotType.INPUT, target_node, link_info.target_slot);
          break;
        }
      }
    } else {
      for (let i = 0, l = output.links.length; i < l; i++) {
        const link_id = output.links[i];
        const link_info = graph._links.get(link_id);
        if (!link_info) continue;
        target_node = graph.getNodeById(link_info.target_id);
        graph._version++;
        if (target_node) {
          const input = target_node.inputs[link_info.target_slot];
          input.link = null;
          target_node.onConnectionsChange?.(
            NodeSlotType.INPUT,
            link_info.target_slot,
            false,
            link_info,
            input
          );
        }
        graph._links.delete(link_id);
        this.onConnectionsChange?.(
          NodeSlotType.OUTPUT,
          slot,
          false,
          link_info,
          output
        );
        graph.onNodeConnectionChange?.(NodeSlotType.OUTPUT, this, slot);
        graph.onNodeConnectionChange?.(NodeSlotType.INPUT, target_node, link_info.target_slot);
      }
      output.links = null;
    }
    this.setDirtyCanvas(false, true);
    graph.connectionChange(this);
    return true;
  }
  /**
   * Disconnect one input
   * @param slot Input slot index, or the name of the slot
   * @param keepReroutes If `true`, reroutes will not be garbage collected.
   * @returns true if disconnected successfully or already disconnected, otherwise false
   */
  disconnectInput(slot, keepReroutes) {
    if (typeof slot === "string") {
      slot = this.findInputSlot(slot);
      if (slot == -1) {
        if (LiteGraph.debug) console.log("Connect: Error, no slot of name " + slot);
        return false;
      }
    } else if (!this.inputs || slot >= this.inputs.length) {
      if (LiteGraph.debug) {
        console.log("Connect: Error, slot number not found");
      }
      return false;
    }
    const input = this.inputs[slot];
    if (!input) return false;
    const link_id = this.inputs[slot].link;
    if (link_id != null) {
      this.inputs[slot].link = null;
      const link_info = this.graph._links.get(link_id);
      if (link_info) {
        const target_node = this.graph.getNodeById(link_info.origin_id);
        if (!target_node) return false;
        const output = target_node.outputs[link_info.origin_slot];
        if (!(output?.links?.length > 0)) return false;
        let i = 0;
        for (const l = output.links.length; i < l; i++) {
          if (output.links[i] == link_id) {
            output.links.splice(i, 1);
            break;
          }
        }
        link_info.disconnect(this.graph, keepReroutes);
        if (this.graph) this.graph._version++;
        this.onConnectionsChange?.(
          NodeSlotType.INPUT,
          slot,
          false,
          link_info,
          input
        );
        target_node.onConnectionsChange?.(
          NodeSlotType.OUTPUT,
          i,
          false,
          link_info,
          output
        );
        this.graph?.onNodeConnectionChange?.(NodeSlotType.OUTPUT, target_node, i);
        this.graph?.onNodeConnectionChange?.(NodeSlotType.INPUT, this, slot);
      }
    }
    this.setDirtyCanvas(false, true);
    this.graph?.connectionChange(this);
    return true;
  }
  /**
   * returns the center of a connection point in canvas coords
   * @param is_input true if if a input slot, false if it is an output
   * @param slot_number (could be the number of the slot or the string with the name of the slot)
   * @param out [optional] a place to store the output, to free garbage
   * @returns the position
   */
  getConnectionPos(is_input, slot_number, out) {
    out ||= new Float32Array(2);
    const num_slots = is_input ? this.inputs?.length ?? 0 : this.outputs?.length ?? 0;
    const offset = LiteGraph.NODE_SLOT_HEIGHT * 0.5;
    if (this.flags.collapsed) {
      const w = this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH;
      if (this.horizontal) {
        out[0] = this.pos[0] + w * 0.5;
        out[1] = is_input ? this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT : this.pos[1];
      } else {
        out[0] = is_input ? this.pos[0] : this.pos[0] + w;
        out[1] = this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT * 0.5;
      }
      return out;
    }
    if (is_input && slot_number == -1) {
      out[0] = this.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
      out[1] = this.pos[1] + LiteGraph.NODE_TITLE_HEIGHT * 0.5;
      return out;
    }
    if (is_input && num_slots > slot_number && this.inputs[slot_number].pos) {
      out[0] = this.pos[0] + this.inputs[slot_number].pos[0];
      out[1] = this.pos[1] + this.inputs[slot_number].pos[1];
      return out;
    } else if (!is_input && num_slots > slot_number && this.outputs[slot_number].pos) {
      out[0] = this.pos[0] + this.outputs[slot_number].pos[0];
      out[1] = this.pos[1] + this.outputs[slot_number].pos[1];
      return out;
    }
    if (this.horizontal) {
      out[0] = this.pos[0] + (slot_number + 0.5) * (this.size[0] / num_slots);
      out[1] = is_input ? this.pos[1] - LiteGraph.NODE_TITLE_HEIGHT : this.pos[1] + this.size[1];
      return out;
    }
    out[0] = is_input ? this.pos[0] + offset : this.pos[0] + this.size[0] + 1 - offset;
    out[1] = this.pos[1] + (slot_number + 0.7) * LiteGraph.NODE_SLOT_HEIGHT + (this.constructor.slot_start_y || 0);
    return out;
  }
  /** @inheritdoc */
  snapToGrid(snapTo) {
    return this.pinned ? false : snapPoint(this.pos, snapTo);
  }
  /** @see {@link snapToGrid} */
  alignToGrid() {
    this.snapToGrid(LiteGraph.CANVAS_GRID_SIZE);
  }
  /* Console output */
  trace(msg) {
    this.console ||= [];
    this.console.push(msg);
    if (this.console.length > LGraphNode.MAX_CONSOLE)
      this.console.shift();
    this.graph.onNodeTrace?.(this, msg);
  }
  /* Forces to redraw or the main canvas (LGraphNode) or the bg canvas (links) */
  setDirtyCanvas(dirty_foreground, dirty_background) {
    this.graph?.canvasAction((c) => c.setDirty(dirty_foreground, dirty_background));
  }
  loadImage(url) {
    const img = new Image();
    img.src = LiteGraph.node_images_path + url;
    img.ready = false;
    const that = this;
    img.onload = function() {
      this.ready = true;
      that.setDirtyCanvas(true);
    };
    return img;
  }
  /* Allows to get onMouseMove and onMouseUp events even if the mouse is out of focus */
  captureInput(v2) {
    if (!this.graph || !this.graph.list_of_graphcanvas) return;
    const list = this.graph.list_of_graphcanvas;
    for (let i = 0; i < list.length; ++i) {
      const c = list[i];
      if (!v2 && c.node_capturing_input != this) continue;
      c.node_capturing_input = v2 ? this : null;
    }
  }
  get collapsed() {
    return !!this.flags.collapsed;
  }
  get collapsible() {
    return !this.pinned && this.constructor.collapsable !== false;
  }
  /**
   * Toggle node collapse (makes it smaller on the canvas)
   */
  collapse(force) {
    if (!this.collapsible && !force) return;
    this.graph._version++;
    this.flags.collapsed = !this.flags.collapsed;
    this.setDirtyCanvas(true, true);
  }
  /**
   * Toggles advanced mode of the node, showing advanced widgets
   */
  toggleAdvanced() {
    if (!this.widgets?.some((w) => w.advanced)) return;
    this.graph._version++;
    this.showAdvanced = !this.showAdvanced;
    const prefSize = this.computeSize();
    if (this.size[0] < prefSize[0] || this.size[1] < prefSize[1]) {
      this.setSize([
        Math.max(this.size[0], prefSize[0]),
        Math.max(this.size[1], prefSize[1])
      ]);
    }
    this.setDirtyCanvas(true, true);
  }
  get pinned() {
    return !!this.flags.pinned;
  }
  /**
   * Prevents the node being accidentally moved or resized by mouse interaction.
   * Toggles pinned state if no value is provided.
   */
  pin(v2) {
    if (this.graph) {
      this.graph._version++;
    }
    this.flags.pinned = v2 ?? !this.flags.pinned;
    this.resizable = !this.pinned;
    if (!this.pinned) delete this.flags.pinned;
  }
  unpin() {
    this.pin(false);
  }
  localToScreen(x2, y, dragAndScale) {
    return [
      (x2 + this.pos[0]) * dragAndScale.scale + dragAndScale.offset[0],
      (y + this.pos[1]) * dragAndScale.scale + dragAndScale.offset[1]
    ];
  }
  get width() {
    return this.collapsed ? this._collapsed_width || LiteGraph.NODE_COLLAPSED_WIDTH : this.size[0];
  }
  /**
   * Returns the height of the node, including the title bar.
   */
  get height() {
    const bodyHeight = this.collapsed ? 0 : this.size[1];
    return LiteGraph.NODE_TITLE_HEIGHT + bodyHeight;
  }
  drawBadges(ctx, { gap = 2 } = {}) {
    const badgeInstances = this.badges.map((badge) => badge instanceof LGraphBadge ? badge : badge());
    const isLeftAligned = this.badgePosition === BadgePosition.TopLeft;
    let currentX = isLeftAligned ? 0 : this.width - badgeInstances.reduce((acc, badge) => acc + badge.getWidth(ctx) + gap, 0);
    const y = -(LiteGraph.NODE_TITLE_HEIGHT + gap);
    for (const badge of badgeInstances) {
      badge.draw(ctx, currentX, y - badge.height);
      currentX += badge.getWidth(ctx) + gap;
    }
  }
  /**
   * Renders the node's title bar background
   */
  drawTitleBarBackground(ctx, options2) {
    const {
      scale,
      title_height = LiteGraph.NODE_TITLE_HEIGHT,
      low_quality = false
    } = options2;
    const fgcolor = this.renderingColor;
    const shape = this.renderingShape;
    const size = this.renderingSize;
    if (this.onDrawTitleBar) {
      this.onDrawTitleBar(ctx, title_height, size, scale, fgcolor);
      return;
    }
    if (this.title_mode === TitleMode.TRANSPARENT_TITLE) {
      return;
    }
    if (this.collapsed) {
      ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
    }
    ctx.fillStyle = this.constructor.title_color || fgcolor;
    ctx.beginPath();
    if (shape == RenderShape.BOX || low_quality) {
      ctx.rect(0, -title_height, size[0], title_height);
    } else if (shape == RenderShape.ROUND || shape == RenderShape.CARD) {
      ctx.roundRect(
        0,
        -title_height,
        size[0],
        title_height,
        this.collapsed ? [LiteGraph.ROUND_RADIUS] : [LiteGraph.ROUND_RADIUS, LiteGraph.ROUND_RADIUS, 0, 0]
      );
    }
    ctx.fill();
    ctx.shadowColor = "transparent";
  }
  /**
   * Renders the node's title box, i.e. the dot in front of the title text that
   * when clicked toggles the node's collapsed state. The term `title box` comes
   * from the original LiteGraph implementation.
   */
  drawTitleBox(ctx, options2) {
    const {
      scale,
      low_quality = false,
      title_height = LiteGraph.NODE_TITLE_HEIGHT,
      box_size = 10
    } = options2;
    const size = this.renderingSize;
    const shape = this.renderingShape;
    if (this.onDrawTitleBox) {
      this.onDrawTitleBox(ctx, title_height, size, scale);
      return;
    }
    if ([RenderShape.ROUND, RenderShape.CIRCLE, RenderShape.CARD].includes(shape)) {
      if (low_quality) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(
          title_height * 0.5,
          title_height * -0.5,
          box_size * 0.5 + 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.fillStyle = this.renderingBoxColor;
      if (low_quality)
        ctx.fillRect(
          title_height * 0.5 - box_size * 0.5,
          title_height * -0.5 - box_size * 0.5,
          box_size,
          box_size
        );
      else {
        ctx.beginPath();
        ctx.arc(
          title_height * 0.5,
          title_height * -0.5,
          box_size * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    } else {
      if (low_quality) {
        ctx.fillStyle = "black";
        ctx.fillRect(
          (title_height - box_size) * 0.5 - 1,
          (title_height + box_size) * -0.5 - 1,
          box_size + 2,
          box_size + 2
        );
      }
      ctx.fillStyle = this.renderingBoxColor;
      ctx.fillRect(
        (title_height - box_size) * 0.5,
        (title_height + box_size) * -0.5,
        box_size,
        box_size
      );
    }
  }
  /**
   * Renders the node's title text.
   */
  drawTitleText(ctx, options2) {
    const {
      scale,
      default_title_color,
      low_quality = false,
      title_height = LiteGraph.NODE_TITLE_HEIGHT
    } = options2;
    const size = this.renderingSize;
    const selected = this.selected;
    if (this.onDrawTitleText) {
      this.onDrawTitleText(
        ctx,
        title_height,
        size,
        scale,
        this.titleFontStyle,
        selected
      );
      return;
    }
    if (low_quality) {
      return;
    }
    ctx.font = this.titleFontStyle;
    const rawTitle = this.getTitle() ?? `❌ ${this.type}`;
    const title = String(rawTitle) + (this.pinned ? "📌" : "");
    if (title) {
      if (selected) {
        ctx.fillStyle = LiteGraph.NODE_SELECTED_TITLE_COLOR;
      } else {
        ctx.fillStyle = this.constructor.title_text_color || default_title_color;
      }
      if (this.collapsed) {
        ctx.textAlign = "left";
        ctx.fillText(
          title.substr(0, 20),
          // avoid urls too long
          title_height,
          // + measure.width * 0.5,
          LiteGraph.NODE_TITLE_TEXT_Y - title_height
        );
        ctx.textAlign = "left";
      } else {
        ctx.textAlign = "left";
        ctx.fillText(
          title,
          title_height,
          LiteGraph.NODE_TITLE_TEXT_Y - title_height
        );
      }
    }
  }
  /**
   * Attempts to gracefully bypass this node in all of its connections by reconnecting all links.
   *
   * Each input is checked against each output.  This is done on a matching index basis, i.e. input 3 -> output 3.
   * If there are any input links remaining,
   * and {@link flags}.{@link INodeFlags.keepAllLinksOnBypass keepAllLinksOnBypass} is `true`,
   * each input will check for outputs that match, and take the first one that matches
   * `true`: Try the index matching first, then every input to every output.
   * `false`: Only matches indexes, e.g. input 3 to output 3.
   *
   * If {@link flags}.{@link INodeFlags.keepAllLinksOnBypass keepAllLinksOnBypass} is `undefined`, it will fall back to
   * the static {@link keepAllLinksOnBypass}.
   * @returns `true` if any new links were established, otherwise `false`.
   * @todo Decision: Change API to return array of new links instead?
   */
  connectInputToOutput() {
    const { inputs, outputs, graph } = this;
    if (!inputs || !outputs) return;
    const { _links } = graph;
    let madeAnyConnections = false;
    for (const [index, input] of inputs.entries()) {
      const output = outputs[index];
      if (!output || !LiteGraph.isValidConnection(input.type, output.type)) continue;
      const inLink = _links.get(input.link);
      const inNode = graph.getNodeById(inLink?.origin_id);
      if (!inNode) continue;
      bypassAllLinks(output, inNode, inLink);
    }
    if (!(this.flags.keepAllLinksOnBypass ?? LGraphNode.keepAllLinksOnBypass))
      return madeAnyConnections;
    for (const input of inputs) {
      const inLink = _links.get(input.link);
      const inNode = graph.getNodeById(inLink?.origin_id);
      if (!inNode) continue;
      for (const output of outputs) {
        if (!LiteGraph.isValidConnection(input.type, output.type)) continue;
        bypassAllLinks(output, inNode, inLink);
        break;
      }
    }
    return madeAnyConnections;
    function bypassAllLinks(output, inNode, inLink) {
      const outLinks = output.links?.map((x2) => _links.get(x2)).filter((x2) => !!x2);
      if (!outLinks?.length) return;
      for (const outLink of outLinks) {
        const outNode = graph.getNodeById(outLink.target_id);
        if (!outNode) return;
        const result = inNode.connect(
          inLink.origin_slot,
          outNode,
          outLink.target_slot,
          inLink.parentId
        );
        madeAnyConnections ||= !!result;
      }
    }
  }
  drawWidgets(ctx, options2) {
    if (!this.widgets) return;
    const { y, colorContext, linkOverWidget, linkOverWidgetType, lowQuality = false, editorAlpha = 1 } = options2;
    let posY = y;
    if (this.horizontal || this.widgets_up) {
      posY = 2;
    }
    if (this.widgets_start_y != null) posY = this.widgets_start_y;
    const width2 = this.size[0];
    const widgets = this.widgets;
    posY += 2;
    const H = LiteGraph.NODE_WIDGET_HEIGHT;
    const show_text = !lowQuality;
    ctx.save();
    ctx.globalAlpha = editorAlpha;
    const margin = 15;
    for (const w of widgets) {
      if (w.hidden || w.advanced && !this.showAdvanced) continue;
      const y2 = w.y || posY;
      const outline_color = w.advanced ? LiteGraph.WIDGET_ADVANCED_OUTLINE_COLOR : LiteGraph.WIDGET_OUTLINE_COLOR;
      if (w === linkOverWidget) {
        new NodeInputSlot({
          name: "",
          type: linkOverWidgetType,
          link: 0
        }).draw(ctx, { pos: [10, y2 + 10], colorContext });
      }
      w.last_y = y2;
      ctx.strokeStyle = outline_color;
      ctx.fillStyle = "#222";
      ctx.textAlign = "left";
      if (w.disabled) ctx.globalAlpha *= 0.5;
      const widget_width = w.width || width2;
      const WidgetClass = WIDGET_TYPE_MAP[w.type];
      if (WidgetClass) {
        toClass(WidgetClass, w).drawWidget(ctx, { y: y2, width: widget_width, show_text, margin });
      } else {
        w.draw?.(ctx, this, widget_width, y2, H);
      }
      posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4;
      ctx.globalAlpha = editorAlpha;
    }
    ctx.restore();
  }
  /**
   * When {@link LGraphNode.collapsed} is `true`, this method draws the node's collapsed slots.
   */
  drawCollapsedSlots(ctx) {
    let input_slot = null;
    let output_slot = null;
    for (const slot of this.inputs ?? []) {
      if (slot.link == null) {
        continue;
      }
      input_slot = slot;
      break;
    }
    for (const slot of this.outputs ?? []) {
      if (!slot.links || !slot.links.length) {
        continue;
      }
      output_slot = slot;
      break;
    }
    if (input_slot) {
      let x2 = 0;
      let y = LiteGraph.NODE_TITLE_HEIGHT * -0.5;
      if (this.horizontal) {
        x2 = this._collapsed_width * 0.5;
        y = -LiteGraph.NODE_TITLE_HEIGHT;
      }
      toClass(NodeInputSlot, input_slot).drawCollapsed(ctx, {
        pos: [x2, y]
      });
    }
    if (output_slot) {
      let x2 = this._collapsed_width;
      let y = LiteGraph.NODE_TITLE_HEIGHT * -0.5;
      if (this.horizontal) {
        x2 = this._collapsed_width * 0.5;
        y = 0;
      }
      toClass(NodeOutputSlot, output_slot).drawCollapsed(ctx, {
        pos: [x2, y]
      });
    }
  }
  get highlightColor() {
    return LiteGraph.NODE_TEXT_HIGHLIGHT_COLOR ?? LiteGraph.NODE_SELECTED_TITLE_COLOR ?? LiteGraph.NODE_TEXT_COLOR;
  }
  /**
   * Draws the node's input and output slots.
   * @returns The maximum y-coordinate of the slots.
   * TODO: Calculate the bounding box of the slots and return it instead of the maximum y-coordinate.
   */
  drawSlots(ctx, options2) {
    const { colorContext, connectingLink, editorAlpha, lowQuality } = options2;
    let max_y = 0;
    const slot_pos = new Float32Array(2);
    for (const [i, input] of (this.inputs ?? []).entries()) {
      const slot = toClass(NodeInputSlot, input);
      const isValid = slot.isValidTarget(connectingLink);
      const highlight = isValid && this.mouseOver?.inputId === i;
      const label_color = highlight ? this.highlightColor : LiteGraph.NODE_TEXT_COLOR;
      ctx.globalAlpha = isValid ? editorAlpha : 0.4 * editorAlpha;
      const pos = this.getConnectionPos(
        true,
        i,
        /* out= */
        slot_pos
      );
      pos[0] -= this.pos[0];
      pos[1] -= this.pos[1];
      max_y = Math.max(max_y, pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5);
      slot.draw(ctx, {
        pos,
        colorContext,
        labelColor: label_color,
        horizontal: this.horizontal,
        lowQuality,
        renderText: !lowQuality,
        highlight
      });
    }
    for (const [i, output] of (this.outputs ?? []).entries()) {
      const slot = toClass(NodeOutputSlot, output);
      const isValid = slot.isValidTarget(connectingLink);
      const highlight = isValid && this.mouseOver?.outputId === i;
      const label_color = highlight ? this.highlightColor : LiteGraph.NODE_TEXT_COLOR;
      ctx.globalAlpha = isValid ? editorAlpha : 0.4 * editorAlpha;
      const pos = this.getConnectionPos(
        false,
        i,
        /* out= */
        slot_pos
      );
      pos[0] -= this.pos[0];
      pos[1] -= this.pos[1];
      max_y = Math.max(max_y, pos[1] + LiteGraph.NODE_SLOT_HEIGHT * 0.5);
      slot.draw(ctx, {
        pos,
        colorContext,
        labelColor: label_color,
        horizontal: this.horizontal,
        lowQuality,
        renderText: !lowQuality,
        highlight
      });
    }
    return max_y;
  }
}
class LGraphGroup {
  static minWidth = 140;
  static minHeight = 80;
  static resizeLength = 10;
  static padding = 4;
  static defaultColour = "#335";
  id;
  color;
  title;
  font;
  font_size = LiteGraph.DEFAULT_GROUP_FONT || 24;
  _bounding = new Float32Array([
    10,
    10,
    LGraphGroup.minWidth,
    LGraphGroup.minHeight
  ]);
  _pos = this._bounding.subarray(0, 2);
  _size = this._bounding.subarray(2, 4);
  /** @deprecated See {@link _children} */
  _nodes = [];
  _children = /* @__PURE__ */ new Set();
  graph = null;
  flags = {};
  selected;
  constructor(title, id) {
    this.id = id ?? -1;
    this.title = title || "Group";
    this.color = LGraphCanvas.node_colors.pale_blue ? LGraphCanvas.node_colors.pale_blue.groupcolor : "#AAA";
  }
  /** Position of the group, as x,y co-ordinates in graph space */
  get pos() {
    return this._pos;
  }
  set pos(v2) {
    if (!v2 || v2.length < 2) return;
    this._pos[0] = v2[0];
    this._pos[1] = v2[1];
  }
  /** Size of the group, as width,height in graph units */
  get size() {
    return this._size;
  }
  set size(v2) {
    if (!v2 || v2.length < 2) return;
    this._size[0] = Math.max(LGraphGroup.minWidth, v2[0]);
    this._size[1] = Math.max(LGraphGroup.minHeight, v2[1]);
  }
  get boundingRect() {
    return this._bounding;
  }
  get nodes() {
    return this._nodes;
  }
  get titleHeight() {
    return this.font_size * 1.4;
  }
  get children() {
    return this._children;
  }
  get pinned() {
    return !!this.flags.pinned;
  }
  /**
   * Prevents the group being accidentally moved or resized by mouse interaction.
   * Toggles pinned state if no value is provided.
   */
  pin(value) {
    const newState = value === void 0 ? !this.pinned : value;
    if (newState) this.flags.pinned = true;
    else delete this.flags.pinned;
  }
  unpin() {
    this.pin(false);
  }
  configure(o) {
    this.id = o.id;
    this.title = o.title;
    this._bounding.set(o.bounding);
    this.color = o.color;
    this.flags = o.flags || this.flags;
    if (o.font_size) this.font_size = o.font_size;
  }
  serialize() {
    const b = this._bounding;
    return {
      id: this.id,
      title: this.title,
      bounding: [...b],
      color: this.color,
      font_size: this.font_size,
      flags: this.flags
    };
  }
  /**
   * Draws the group on the canvas
   * @param graphCanvas
   * @param ctx
   */
  draw(graphCanvas, ctx) {
    const { padding, resizeLength, defaultColour } = LGraphGroup;
    const font_size = this.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
    const [x2, y] = this._pos;
    const [width2, height] = this._size;
    ctx.globalAlpha = 0.25 * graphCanvas.editor_alpha;
    ctx.fillStyle = this.color || defaultColour;
    ctx.strokeStyle = this.color || defaultColour;
    ctx.beginPath();
    ctx.rect(x2 + 0.5, y + 0.5, width2, font_size * 1.4);
    ctx.fill();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    ctx.rect(x2 + 0.5, y + 0.5, width2, height);
    ctx.fill();
    ctx.globalAlpha = graphCanvas.editor_alpha;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2 + width2, y + height);
    ctx.lineTo(x2 + width2 - resizeLength, y + height);
    ctx.lineTo(x2 + width2, y + height - resizeLength);
    ctx.fill();
    ctx.font = font_size + "px Arial";
    ctx.textAlign = "left";
    ctx.fillText(this.title + (this.pinned ? "📌" : ""), x2 + padding, y + font_size);
    if (LiteGraph.highlight_selected_group && this.selected) {
      strokeShape(ctx, this._bounding, {
        title_height: this.titleHeight,
        padding
      });
    }
  }
  resize(width2, height) {
    if (this.pinned) return false;
    this._size[0] = Math.max(LGraphGroup.minWidth, width2);
    this._size[1] = Math.max(LGraphGroup.minHeight, height);
    return true;
  }
  move(deltaX, deltaY, skipChildren = false) {
    if (this.pinned) return;
    this._pos[0] += deltaX;
    this._pos[1] += deltaY;
    if (skipChildren === true) return;
    for (const item of this._children) {
      item.move(deltaX, deltaY);
    }
  }
  /** @inheritdoc */
  snapToGrid(snapTo) {
    return this.pinned ? false : snapPoint(this.pos, snapTo);
  }
  recomputeInsideNodes() {
    const { nodes, reroutes, groups } = this.graph;
    const children = this._children;
    this._nodes.length = 0;
    children.clear();
    for (const node2 of nodes) {
      if (containsCentre(this._bounding, node2.boundingRect)) {
        this._nodes.push(node2);
        children.add(node2);
      }
    }
    for (const reroute of reroutes.values()) {
      if (isPointInRect(reroute.pos, this._bounding))
        children.add(reroute);
    }
    for (const group of groups) {
      if (containsRect(this._bounding, group._bounding))
        children.add(group);
    }
    groups.sort((a, b) => {
      if (a === this) {
        return children.has(b) ? -1 : 0;
      } else if (b === this) {
        return children.has(a) ? 1 : 0;
      }
    });
  }
  /**
   * Resizes and moves the group to neatly fit all given {@link objects}.
   * @param objects All objects that should be inside the group
   * @param padding Value in graph units to add to all sides of the group.  Default: 10
   */
  resizeTo(objects, padding = 10) {
    const boundingBox = createBounds(objects, padding);
    if (boundingBox === null) return;
    this.pos[0] = boundingBox[0];
    this.pos[1] = boundingBox[1] - this.titleHeight;
    this.size[0] = boundingBox[2];
    this.size[1] = boundingBox[3] + this.titleHeight;
  }
  /**
   * Add nodes to the group and adjust the group's position and size accordingly
   * @param nodes The nodes to add to the group
   * @param padding The padding around the group
   */
  addNodes(nodes, padding = 10) {
    if (!this._nodes && nodes.length === 0) return;
    this.resizeTo([...this.children, ...this._nodes, ...nodes], padding);
  }
  getMenuOptions() {
    return [
      {
        content: this.pinned ? "Unpin" : "Pin",
        callback: () => {
          if (this.pinned) this.unpin();
          else this.pin();
          this.setDirtyCanvas(false, true);
        }
      },
      null,
      { content: "Title", callback: LGraphCanvas.onShowPropertyEditor },
      {
        content: "Color",
        has_submenu: true,
        callback: LGraphCanvas.onMenuNodeColors
      },
      {
        content: "Font size",
        property: "font_size",
        type: "Number",
        callback: LGraphCanvas.onShowPropertyEditor
      },
      null,
      { content: "Remove", callback: LGraphCanvas.onMenuNodeRemove }
    ];
  }
  isPointInTitlebar(x2, y) {
    const b = this.boundingRect;
    return isInRectangle(x2, y, b[0], b[1], b[2], this.titleHeight);
  }
  isInResize(x2, y) {
    const b = this.boundingRect;
    const right = b[0] + b[2];
    const bottom = b[1] + b[3];
    return x2 < right && y < bottom && x2 - right + (y - bottom) > -LGraphGroup.resizeLength;
  }
  isPointInside = LGraphNode.prototype.isPointInside;
  setDirtyCanvas = LGraphNode.prototype.setDirtyCanvas;
}
class DragAndScale {
  /**
   * The state of this DragAndScale instance.
   *
   * Implemented as a POCO that can be proxied without side-effects.
   */
  state;
  /** Maximum scale (zoom in) */
  max_scale;
  /** Minimum scale (zoom out) */
  min_scale;
  enabled;
  last_mouse;
  element;
  visible_area;
  _binded_mouse_callback;
  dragging;
  viewport;
  get offset() {
    return this.state.offset;
  }
  set offset(value) {
    this.state.offset = value;
  }
  get scale() {
    return this.state.scale;
  }
  set scale(value) {
    this.state.scale = value;
  }
  constructor(element, skip_events) {
    this.state = {
      offset: new Float32Array([0, 0]),
      scale: 1
    };
    this.max_scale = 10;
    this.min_scale = 0.1;
    this.onredraw = null;
    this.enabled = true;
    this.last_mouse = [0, 0];
    this.element = null;
    this.visible_area = new Float32Array(4);
    if (element) {
      this.element = element;
      if (!skip_events) {
        this.bindEvents(element);
      }
    }
  }
  /** @deprecated Has not been kept up to date */
  bindEvents(element) {
    this.last_mouse = new Float32Array(2);
    this._binded_mouse_callback = this.onMouse.bind(this);
    LiteGraph.pointerListenerAdd(element, "down", this._binded_mouse_callback);
    LiteGraph.pointerListenerAdd(element, "move", this._binded_mouse_callback);
    LiteGraph.pointerListenerAdd(element, "up", this._binded_mouse_callback);
    element.addEventListener("mousewheel", this._binded_mouse_callback, false);
    element.addEventListener("wheel", this._binded_mouse_callback, false);
  }
  computeVisibleArea(viewport) {
    if (!this.element) {
      this.visible_area[0] = this.visible_area[1] = this.visible_area[2] = this.visible_area[3] = 0;
      return;
    }
    let width2 = this.element.width;
    let height = this.element.height;
    let startx = -this.offset[0];
    let starty = -this.offset[1];
    if (viewport) {
      startx += viewport[0] / this.scale;
      starty += viewport[1] / this.scale;
      width2 = viewport[2];
      height = viewport[3];
    }
    const endx = startx + width2 / this.scale;
    const endy = starty + height / this.scale;
    this.visible_area[0] = startx;
    this.visible_area[1] = starty;
    this.visible_area[2] = endx - startx;
    this.visible_area[3] = endy - starty;
  }
  /** @deprecated Has not been kept up to date */
  onMouse(e2) {
    if (!this.enabled) {
      return;
    }
    const canvas2 = this.element;
    const rect = canvas2.getBoundingClientRect();
    const x2 = e2.clientX - rect.left;
    const y = e2.clientY - rect.top;
    e2.canvasx = x2;
    e2.canvasy = y;
    e2.dragging = this.dragging;
    const is_inside = !this.viewport || isInRect(x2, y, this.viewport);
    let ignore = false;
    if (this.onmouse) {
      ignore = this.onmouse(e2);
    }
    if (e2.type == LiteGraph.pointerevents_method + "down" && is_inside) {
      this.dragging = true;
      LiteGraph.pointerListenerRemove(canvas2, "move", this._binded_mouse_callback);
      LiteGraph.pointerListenerAdd(document, "move", this._binded_mouse_callback);
      LiteGraph.pointerListenerAdd(document, "up", this._binded_mouse_callback);
    } else if (e2.type == LiteGraph.pointerevents_method + "move") {
      if (!ignore) {
        const deltax = x2 - this.last_mouse[0];
        const deltay = y - this.last_mouse[1];
        if (this.dragging) {
          this.mouseDrag(deltax, deltay);
        }
      }
    } else if (e2.type == LiteGraph.pointerevents_method + "up") {
      this.dragging = false;
      LiteGraph.pointerListenerRemove(document, "move", this._binded_mouse_callback);
      LiteGraph.pointerListenerRemove(document, "up", this._binded_mouse_callback);
      LiteGraph.pointerListenerAdd(canvas2, "move", this._binded_mouse_callback);
    } else if (is_inside && (e2.type == "mousewheel" || e2.type == "wheel" || e2.type == "DOMMouseScroll")) {
      e2.eventType = "mousewheel";
      if (e2.type == "wheel") e2.wheel = -e2.deltaY;
      else e2.wheel = e2.wheelDeltaY != null ? e2.wheelDeltaY : e2.detail * -60;
      e2.delta = e2.wheelDelta ? e2.wheelDelta / 40 : e2.deltaY ? -e2.deltaY / 3 : 0;
      this.changeDeltaScale(1 + e2.delta * 0.05);
    }
    this.last_mouse[0] = x2;
    this.last_mouse[1] = y;
    if (is_inside) {
      e2.preventDefault();
      e2.stopPropagation();
      return false;
    }
  }
  toCanvasContext(ctx) {
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.offset[0], this.offset[1]);
  }
  convertOffsetToCanvas(pos) {
    return [
      (pos[0] + this.offset[0]) * this.scale,
      (pos[1] + this.offset[1]) * this.scale
    ];
  }
  convertCanvasToOffset(pos, out) {
    out = out || [0, 0];
    out[0] = pos[0] / this.scale - this.offset[0];
    out[1] = pos[1] / this.scale - this.offset[1];
    return out;
  }
  /** @deprecated Has not been kept up to date */
  mouseDrag(x2, y) {
    this.offset[0] += x2 / this.scale;
    this.offset[1] += y / this.scale;
    this.onredraw?.(this);
  }
  changeScale(value, zooming_center) {
    if (value < this.min_scale) {
      value = this.min_scale;
    } else if (value > this.max_scale) {
      value = this.max_scale;
    }
    if (value == this.scale) return;
    if (!this.element) return;
    const rect = this.element.getBoundingClientRect();
    if (!rect) return;
    zooming_center = zooming_center ?? [rect.width * 0.5, rect.height * 0.5];
    const normalizedCenter = [
      zooming_center[0] - rect.x,
      zooming_center[1] - rect.y
    ];
    const center = this.convertCanvasToOffset(normalizedCenter);
    this.scale = value;
    if (Math.abs(this.scale - 1) < 0.01) this.scale = 1;
    const new_center = this.convertCanvasToOffset(normalizedCenter);
    const delta_offset = [
      new_center[0] - center[0],
      new_center[1] - center[1]
    ];
    this.offset[0] += delta_offset[0];
    this.offset[1] += delta_offset[1];
    this.onredraw?.(this);
  }
  changeDeltaScale(value, zooming_center) {
    this.changeScale(this.scale * value, zooming_center);
  }
  reset() {
    this.scale = 1;
    this.offset[0] = 0;
    this.offset[1] = 0;
  }
}
function stringOrNull(value) {
  return value == null ? null : String(value);
}
function stringOrEmpty(value) {
  return value == null ? "" : String(value);
}
function getBoundaryNodes(nodes) {
  const valid = nodes?.find((x2) => x2);
  if (!valid) return null;
  let top = valid;
  let right = valid;
  let bottom = valid;
  let left = valid;
  for (const node2 of nodes) {
    if (!node2) continue;
    const [x2, y] = node2.pos;
    const [width2, height] = node2.size;
    if (y < top.pos[1]) top = node2;
    if (x2 + width2 > right.pos[0] + right.size[0]) right = node2;
    if (y + height > bottom.pos[1] + bottom.size[1]) bottom = node2;
    if (x2 < left.pos[0]) left = node2;
  }
  return {
    top,
    right,
    bottom,
    left
  };
}
function distributeNodes(nodes, horizontal) {
  const nodeCount = nodes?.length;
  if (!(nodeCount > 1)) return;
  const index = horizontal ? 0 : 1;
  let total = 0;
  let highest = -Infinity;
  for (const node2 of nodes) {
    total += node2.size[index];
    const high = node2.pos[index] + node2.size[index];
    if (high > highest) highest = high;
  }
  const sorted = [...nodes].sort((a, b) => a.pos[index] - b.pos[index]);
  const lowest = sorted[0].pos[index];
  const gap = (highest - lowest - total) / (nodeCount - 1);
  let startAt = lowest;
  for (let i = 0; i < nodeCount; i++) {
    const node2 = sorted[i];
    node2.pos[index] = startAt + gap * i;
    startAt += node2.size[index];
  }
}
function alignNodes(nodes, direction, align_to) {
  if (!nodes) return;
  const boundary = align_to === void 0 ? getBoundaryNodes(nodes) : { top: align_to, right: align_to, bottom: align_to, left: align_to };
  if (boundary === null) return;
  for (const node2 of nodes) {
    switch (direction) {
      case "right":
        node2.pos[0] = boundary.right.pos[0] + boundary.right.size[0] - node2.size[0];
        break;
      case "left":
        node2.pos[0] = boundary.left.pos[0];
        break;
      case "top":
        node2.pos[1] = boundary.top.pos[1];
        break;
      case "bottom":
        node2.pos[1] = boundary.bottom.pos[1] + boundary.bottom.size[1] - node2.size[1];
        break;
    }
  }
}
function getAllNestedItems(items) {
  const allItems = /* @__PURE__ */ new Set();
  items?.forEach((x2) => addRecursively(x2, allItems));
  return allItems;
  function addRecursively(item, flatSet) {
    if (flatSet.has(item) || item.pinned) return;
    flatSet.add(item);
    item.children?.forEach((x2) => addRecursively(x2, flatSet));
  }
}
function findFirstNode(items) {
  for (const item of items) {
    if (item instanceof LGraphNode) return item;
  }
}
class CanvasPointer {
  /** Maximum time in milliseconds to ignore click drift */
  static bufferTime = 150;
  /** Maximum gap between pointerup and pointerdown events to be considered as a double click */
  static doubleClickTime = 300;
  /** Maximum offset from click location */
  static get maxClickDrift() {
    return this.#maxClickDrift;
  }
  static set maxClickDrift(value) {
    this.#maxClickDrift = value;
    this.#maxClickDrift2 = value * value;
  }
  static #maxClickDrift = 6;
  /** {@link maxClickDrift} squared.  Used to calculate click drift without `sqrt`. */
  static #maxClickDrift2 = this.#maxClickDrift ** 2;
  /** The element this PointerState should capture input against when dragging. */
  element;
  /** Pointer ID used by drag capture. */
  pointerId;
  /** Set to true when if the pointer moves far enough after a down event, before the corresponding up event is fired. */
  dragStarted = false;
  /** The {@link eUp} from the last successful click */
  eLastDown;
  /** Used downstream for touch event support. */
  isDouble = false;
  /** Used downstream for touch event support. */
  isDown = false;
  /**
   * If `true`, {@link eDown}, {@link eMove}, and {@link eUp} will be set to
   * `null` when {@link reset} is called.
   *
   * Default: `true`
   */
  clearEventsOnReset = true;
  /** The last pointerdown event for the primary button */
  eDown = null;
  /** The last pointermove event for the primary button */
  eMove = null;
  /** The last pointerup event for the primary button */
  eUp = null;
  /**
   * Run-once callback, called at the end of any click or drag, whether or not it was successful in any way.
   *
   * The setter of this callback will call the existing value before replacing it.
   * Therefore, simply setting this value twice will execute the first callback.
   */
  get finally() {
    return this.#finally;
  }
  set finally(value) {
    try {
      this.#finally?.();
    } finally {
      this.#finally = value;
    }
  }
  #finally;
  constructor(element) {
    this.element = element;
  }
  /**
   * Callback for `pointerdown` events.  To be used as the event handler (or called by it).
   * @param e The `pointerdown` event
   */
  down(e2) {
    this.reset();
    this.eDown = e2;
    this.pointerId = e2.pointerId;
    this.element.setPointerCapture(e2.pointerId);
  }
  /**
   * Callback for `pointermove` events.  To be used as the event handler (or called by it).
   * @param e The `pointermove` event
   */
  move(e2) {
    const { eDown } = this;
    if (!eDown) return;
    if (!e2.buttons) {
      this.reset();
      return;
    }
    if (!(e2.buttons & eDown.buttons)) {
      this.#completeClick(e2);
      this.reset();
      return;
    }
    this.eMove = e2;
    this.onDrag?.(e2);
    if (this.dragStarted) return;
    const longerThanBufferTime = e2.timeStamp - eDown.timeStamp > CanvasPointer.bufferTime;
    if (longerThanBufferTime || !this.#hasSamePosition(e2, eDown)) {
      this.#setDragStarted();
    }
  }
  /**
   * Callback for `pointerup` events.  To be used as the event handler (or called by it).
   * @param e The `pointerup` event
   */
  up(e2) {
    if (e2.button !== this.eDown?.button) return false;
    this.#completeClick(e2);
    const { dragStarted } = this;
    this.reset();
    return !dragStarted;
  }
  #completeClick(e2) {
    const { eDown } = this;
    if (!eDown) return;
    this.eUp = e2;
    if (this.dragStarted) {
      this.onDragEnd?.(e2);
    } else if (!this.#hasSamePosition(e2, eDown)) {
      this.#setDragStarted();
      this.onDragEnd?.(e2);
    } else if (this.onDoubleClick && this.#isDoubleClick()) {
      this.onDoubleClick(e2);
      this.eLastDown = void 0;
    } else {
      this.onClick?.(e2);
      this.eLastDown = eDown;
    }
  }
  /**
   * Checks if two events occurred near each other - not further apart than the maximum click drift.
   * @param a The first event to compare
   * @param b The second event to compare
   * @param tolerance2 The maximum distance (squared) before the positions are considered different
   * @returns `true` if the two events were no more than {@link maxClickDrift} apart, otherwise `false`
   */
  #hasSamePosition(a, b, tolerance2 = CanvasPointer.#maxClickDrift2) {
    const drift = dist2(a.clientX, a.clientY, b.clientX, b.clientY);
    return drift <= tolerance2;
  }
  /**
   * Checks whether the pointer is currently past the max click drift threshold.
   * @returns `true` if the latest pointer event is past the the click drift threshold
   */
  #isDoubleClick() {
    const { eDown, eLastDown } = this;
    if (!eDown || !eLastDown) return false;
    const tolerance2 = (3 * CanvasPointer.#maxClickDrift) ** 2;
    const diff = eDown.timeStamp - eLastDown.timeStamp;
    return diff > 0 && diff < CanvasPointer.doubleClickTime && this.#hasSamePosition(eDown, eLastDown, tolerance2);
  }
  #setDragStarted() {
    this.dragStarted = true;
    this.onDragStart?.(this);
    delete this.onDragStart;
  }
  /**
   * Resets the state of this {@link CanvasPointer} instance.
   *
   * The {@link finally} callback is first executed, then all callbacks and intra-click
   * state is cleared.
   */
  reset() {
    this.finally = void 0;
    delete this.onClick;
    delete this.onDoubleClick;
    delete this.onDragStart;
    delete this.onDrag;
    delete this.onDragEnd;
    this.isDown = false;
    this.isDouble = false;
    this.dragStarted = false;
    if (this.clearEventsOnReset) {
      this.eDown = null;
      this.eMove = null;
      this.eUp = null;
    }
    const { element, pointerId } = this;
    if (element.hasPointerCapture(pointerId))
      element.releasePointerCapture(pointerId);
  }
}
class LGraphCanvas {
  // Optimised buffers used during rendering
  static #temp = new Float32Array(4);
  static #temp_vec2 = new Float32Array(2);
  static #tmp_area = new Float32Array(4);
  static #margin_area = new Float32Array(4);
  static #link_bounding = new Float32Array(4);
  static #tempA = new Float32Array(2);
  static #tempB = new Float32Array(2);
  static #lTempA = new Float32Array(2);
  static #lTempB = new Float32Array(2);
  static #lTempC = new Float32Array(2);
  static DEFAULT_BACKGROUND_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=";
  /** Initialised from LiteGraphGlobal static block to avoid circular dependency. */
  static link_type_colors;
  static gradients = {};
  // cache of gradients
  static search_limit = -1;
  static node_colors = {
    red: { color: "#322", bgcolor: "#533", groupcolor: "#A88" },
    brown: { color: "#332922", bgcolor: "#593930", groupcolor: "#b06634" },
    green: { color: "#232", bgcolor: "#353", groupcolor: "#8A8" },
    blue: { color: "#223", bgcolor: "#335", groupcolor: "#88A" },
    pale_blue: {
      color: "#2a363b",
      bgcolor: "#3f5159",
      groupcolor: "#3f789e"
    },
    cyan: { color: "#233", bgcolor: "#355", groupcolor: "#8AA" },
    purple: { color: "#323", bgcolor: "#535", groupcolor: "#a1309b" },
    yellow: { color: "#432", bgcolor: "#653", groupcolor: "#b58b2a" },
    black: { color: "#222", bgcolor: "#000", groupcolor: "#444" }
  };
  /**
   * The state of this canvas, e.g. whether it is being dragged, or read-only.
   *
   * Implemented as a POCO that can be proxied without side-effects.
   */
  state = {
    draggingItems: false,
    draggingCanvas: false,
    readOnly: false,
    hoveringOver: CanvasItem.Nothing,
    shouldSetCursor: true
  };
  #updateCursorStyle() {
    if (this.state.shouldSetCursor) {
      let cursor = "default";
      if (this.state.draggingCanvas) {
        cursor = "grabbing";
      } else if (this.state.readOnly) {
        cursor = "grab";
      } else if (this.state.hoveringOver & CanvasItem.ResizeSe) {
        cursor = "se-resize";
      } else if (this.state.hoveringOver & CanvasItem.Node) {
        cursor = "crosshair";
      }
      this.canvas.style.cursor = cursor;
    }
  }
  // Whether the canvas was previously being dragged prior to pressing space key.
  // null if space key is not pressed.
  _previously_dragging_canvas = null;
  // #region Legacy accessors
  /** @deprecated @inheritdoc {@link LGraphCanvasState.readOnly} */
  get read_only() {
    return this.state.readOnly;
  }
  set read_only(value) {
    this.state.readOnly = value;
    this.#updateCursorStyle();
  }
  get isDragging() {
    return this.state.draggingItems;
  }
  set isDragging(value) {
    this.state.draggingItems = value;
  }
  get hoveringOver() {
    return this.state.hoveringOver;
  }
  set hoveringOver(value) {
    this.state.hoveringOver = value;
    this.#updateCursorStyle();
  }
  /** @deprecated Replace all references with {@link pointer}.{@link CanvasPointer.isDown isDown}. */
  get pointer_is_down() {
    return this.pointer.isDown;
  }
  /** @deprecated Replace all references with {@link pointer}.{@link CanvasPointer.isDouble isDouble}. */
  get pointer_is_double() {
    return this.pointer.isDouble;
  }
  /** @deprecated @inheritdoc {@link LGraphCanvasState.draggingCanvas} */
  get dragging_canvas() {
    return this.state.draggingCanvas;
  }
  set dragging_canvas(value) {
    this.state.draggingCanvas = value;
    this.#updateCursorStyle();
  }
  // #endregion Legacy accessors
  /**
   * @deprecated Use {@link LGraphNode.titleFontStyle} instead.
   */
  get title_text_font() {
    return `${LiteGraph.NODE_TEXT_SIZE}px Arial`;
  }
  get inner_text_font() {
    return `normal ${LiteGraph.NODE_SUBTEXT_SIZE}px Arial`;
  }
  #maximumFrameGap = 0;
  /** Maximum frames per second to render. 0: unlimited. Default: 0 */
  get maximumFps() {
    return this.#maximumFrameGap > Number.EPSILON ? this.#maximumFrameGap / 1e3 : 0;
  }
  set maximumFps(value) {
    this.#maximumFrameGap = value > Number.EPSILON ? 1e3 / value : 0;
  }
  /**
   * @deprecated Use {@link LiteGraphGlobal.ROUND_RADIUS} instead.
   */
  get round_radius() {
    return LiteGraph.ROUND_RADIUS;
  }
  /**
   * @deprecated Use {@link LiteGraphGlobal.ROUND_RADIUS} instead.
   */
  set round_radius(value) {
    LiteGraph.ROUND_RADIUS = value;
  }
  /**
   * Render low quality when zoomed out.
   */
  get low_quality() {
    return this.ds.scale < this.low_quality_zoom_threshold;
  }
  options;
  background_image;
  ds;
  pointer;
  zoom_modify_alpha;
  zoom_speed;
  node_title_color;
  default_link_color;
  default_connection_color;
  default_connection_color_byType;
  default_connection_color_byTypeOff;
  highquality_render;
  use_gradients;
  editor_alpha;
  pause_rendering;
  clear_background;
  clear_background_color;
  render_only_selected;
  show_info;
  allow_dragcanvas;
  allow_dragnodes;
  allow_interaction;
  multi_select;
  allow_searchbox;
  allow_reconnect_links;
  align_to_grid;
  drag_mode;
  dragging_rectangle;
  filter;
  set_canvas_dirty_on_mouse_event;
  always_render_background;
  render_shadows;
  render_canvas_border;
  render_connections_shadows;
  render_connections_border;
  render_curved_connections;
  render_connection_arrows;
  render_collapsed_slots;
  render_execution_order;
  render_link_tooltip;
  /** Controls whether reroutes are rendered at all. */
  reroutesEnabled = false;
  /** Shape of the markers shown at the midpoint of links.  Default: Circle */
  linkMarkerShape = LinkMarkerShape.Circle;
  links_render_mode;
  /** Zoom threshold for low quality rendering. Zoom below this threshold will render low quality. */
  low_quality_zoom_threshold = 0.6;
  /** mouse in canvas coordinates, where 0,0 is the top-left corner of the blue rectangle */
  mouse;
  /** mouse in graph coordinates, where 0,0 is the top-left corner of the blue rectangle */
  graph_mouse;
  /** @deprecated LEGACY: REMOVE THIS, USE {@link graph_mouse} INSTEAD */
  canvas_mouse;
  /** to personalize the search box */
  onSearchBox;
  onSearchBoxSelection;
  onMouse;
  /** to render background objects (behind nodes and connections) in the canvas affected by transform */
  onDrawBackground;
  /** to render foreground objects (above nodes and connections) in the canvas affected by transform */
  onDrawForeground;
  connections_width;
  /** The current node being drawn by {@link drawNode}.  This should NOT be used to determine the currently selected node.  See {@link selectedItems} */
  current_node;
  /** used for widgets */
  node_widget;
  /** The link to draw a tooltip for. */
  over_link_center;
  last_mouse_position;
  /** The visible area of this canvas.  Tightly coupled with {@link ds}. */
  visible_area;
  /** Contains all links and reroutes that were rendered.  Repopulated every render cycle. */
  renderedPaths = /* @__PURE__ */ new Set();
  visible_links;
  connecting_links;
  /** The viewport of this canvas.  Tightly coupled with {@link ds}. */
  viewport;
  autoresize;
  static active_canvas;
  frame = 0;
  last_draw_time = 0;
  render_time = 0;
  fps = 0;
  /** @deprecated See {@link LGraphCanvas.selectedItems} */
  selected_nodes = {};
  /** All selected nodes, groups, and reroutes */
  selectedItems = /* @__PURE__ */ new Set();
  /** The group currently being resized. */
  resizingGroup = null;
  /** @deprecated See {@link LGraphCanvas.selectedItems} */
  selected_group = null;
  visible_nodes = [];
  node_over;
  node_capturing_input;
  highlighted_links = {};
  link_over_widget;
  link_over_widget_type;
  dirty_canvas = true;
  dirty_bgcanvas = true;
  /** A map of nodes that require selective-redraw */
  dirty_nodes = /* @__PURE__ */ new Map();
  dirty_area;
  /** @deprecated Unused */
  node_in_panel;
  last_mouse = [0, 0];
  last_mouseclick = 0;
  graph;
  canvas;
  bgcanvas;
  ctx;
  _events_binded;
  /** @deprecated WebGL */
  gl;
  bgctx;
  is_rendering;
  /** @deprecated Panels */
  block_click;
  /** @deprecated Panels */
  last_click_position;
  resizing_node;
  /** @deprecated See {@link LGraphCanvas.resizingGroup} */
  selected_group_resizing;
  /** @deprecated See {@link pointer}.{@link CanvasPointer.dragStarted dragStarted} */
  last_mouse_dragging;
  onMouseDown;
  _highlight_pos;
  _highlight_input;
  // TODO: Check if panels are used
  /** @deprecated Panels */
  node_panel;
  /** @deprecated Panels */
  options_panel;
  onDropItem;
  _bg_img;
  _pattern;
  _pattern_img;
  // TODO: This looks like another panel thing
  prompt_box;
  search_box;
  /** @deprecated Panels */
  SELECTED_NODE;
  /** @deprecated Panels */
  NODEPANEL_IS_OPEN;
  /** Once per frame check of snap to grid value.  @todo Update on change. */
  #snapToGrid;
  /** Set on keydown, keyup. @todo */
  #shiftDown = false;
  /** If true, enable drag zoom. Ctrl+Shift+Drag Up/Down: zoom canvas. */
  dragZoomEnabled = false;
  /** The start position of the drag zoom. */
  #dragZoomStart = null;
  static active_node;
  onClear;
  /** called after moving a node @deprecated Does not handle multi-node move, and can return the wrong node. */
  onNodeMoved;
  /** called if the selection changes */
  onSelectionChange;
  /** called when rendering a tooltip */
  onDrawLinkTooltip;
  /** to render foreground objects not affected by transform (for GUIs) */
  onDrawOverlay;
  onRenderBackground;
  onNodeDblClicked;
  onShowNodePanel;
  onNodeSelected;
  onNodeDeselected;
  onRender;
  /** Implement this function to allow conversion of widget types to input types, e.g. number -> INT or FLOAT for widget link validation checks */
  getWidgetLinkType;
  /**
   * Creates a new instance of LGraphCanvas.
   * @param canvas The canvas HTML element (or its id) to use, or null / undefined to leave blank.
   * @param graph The graph that owns this canvas.
   * @param options
   */
  constructor(canvas2, graph, options2) {
    options2 ||= {};
    this.options = options2;
    this.background_image = LGraphCanvas.DEFAULT_BACKGROUND_IMAGE;
    this.ds = new DragAndScale();
    this.pointer = new CanvasPointer(this.canvas);
    this.zoom_modify_alpha = true;
    this.zoom_speed = 1.1;
    this.node_title_color = LiteGraph.NODE_TITLE_COLOR;
    this.default_link_color = LiteGraph.LINK_COLOR;
    this.default_connection_color = {
      input_off: "#778",
      input_on: "#7F7",
      // "#BBD"
      output_off: "#778",
      output_on: "#7F7"
      // "#BBD"
    };
    this.default_connection_color_byType = {
      /* number: "#7F7",
            string: "#77F",
            boolean: "#F77", */
    };
    this.default_connection_color_byTypeOff = {
      /* number: "#474",
            string: "#447",
            boolean: "#744", */
    };
    this.highquality_render = true;
    this.use_gradients = false;
    this.editor_alpha = 1;
    this.pause_rendering = false;
    this.clear_background = true;
    this.clear_background_color = "#222";
    this.render_only_selected = true;
    this.show_info = true;
    this.allow_dragcanvas = true;
    this.allow_dragnodes = true;
    this.allow_interaction = true;
    this.multi_select = false;
    this.allow_searchbox = true;
    this.allow_reconnect_links = true;
    this.align_to_grid = false;
    this.drag_mode = false;
    this.dragging_rectangle = null;
    this.filter = null;
    this.set_canvas_dirty_on_mouse_event = true;
    this.always_render_background = false;
    this.render_shadows = true;
    this.render_canvas_border = true;
    this.render_connections_shadows = false;
    this.render_connections_border = true;
    this.render_curved_connections = false;
    this.render_connection_arrows = false;
    this.render_collapsed_slots = true;
    this.render_execution_order = false;
    this.render_link_tooltip = true;
    this.links_render_mode = LinkRenderType.SPLINE_LINK;
    this.mouse = [0, 0];
    this.graph_mouse = [0, 0];
    this.canvas_mouse = this.graph_mouse;
    this.onSearchBox = null;
    this.onSearchBoxSelection = null;
    this.onMouse = null;
    this.onDrawBackground = null;
    this.onDrawForeground = null;
    this.onDrawOverlay = null;
    this.onDrawLinkTooltip = null;
    this.onNodeMoved = null;
    this.onSelectionChange = null;
    this.onBeforeChange = null;
    this.onAfterChange = null;
    this.connections_width = 3;
    this.current_node = null;
    this.node_widget = null;
    this.over_link_center = null;
    this.last_mouse_position = [0, 0];
    this.visible_area = this.ds.visible_area;
    this.visible_links = [];
    this.connecting_links = null;
    this.viewport = options2.viewport || null;
    graph?.attachCanvas(this);
    this.setCanvas(canvas2, options2.skip_events);
    this.clear();
    if (!options2.skip_render) {
      this.startRendering();
    }
    this.autoresize = options2.autoresize;
  }
  static getFileExtension(url) {
    const question = url.indexOf("?");
    if (question !== -1) url = url.substring(0, question);
    const point = url.lastIndexOf(".");
    return point === -1 ? "" : url.substring(point + 1).toLowerCase();
  }
  static onGroupAdd(info, entry, mouse_event) {
    const canvas2 = LGraphCanvas.active_canvas;
    const group = new LiteGraph.LGraphGroup();
    group.pos = canvas2.convertEventToCanvasOffset(mouse_event);
    canvas2.graph.add(group);
  }
  /**
   * @deprecated Functionality moved to {@link getBoundaryNodes}.  The new function returns null on failure, instead of an object with all null properties.
   * Determines the furthest nodes in each direction
   * @param nodes the nodes to from which boundary nodes will be extracted
   * @returns
   */
  static getBoundaryNodes(nodes) {
    const _nodes = Array.isArray(nodes) ? nodes : Object.values(nodes);
    return getBoundaryNodes(_nodes) ?? {
      top: null,
      right: null,
      bottom: null,
      left: null
    };
  }
  /**
   * @deprecated Functionality moved to {@link alignNodes}.  The new function does not set dirty canvas.
   * @param nodes a list of nodes
   * @param direction Direction to align the nodes
   * @param align_to Node to align to (if null, align to the furthest node in the given direction)
   */
  static alignNodes(nodes, direction, align_to) {
    alignNodes(Object.values(nodes), direction, align_to);
    LGraphCanvas.active_canvas.setDirty(true, true);
  }
  static onNodeAlign(value, options2, event, prev_menu, node2) {
    new LiteGraph.ContextMenu(["Top", "Bottom", "Left", "Right"], {
      event,
      callback: inner_clicked,
      parentMenu: prev_menu
    });
    function inner_clicked(value2) {
      alignNodes(
        Object.values(LGraphCanvas.active_canvas.selected_nodes),
        value2.toLowerCase(),
        node2
      );
      LGraphCanvas.active_canvas.setDirty(true, true);
    }
  }
  static onGroupAlign(value, options2, event, prev_menu) {
    new LiteGraph.ContextMenu(["Top", "Bottom", "Left", "Right"], {
      event,
      callback: inner_clicked,
      parentMenu: prev_menu
    });
    function inner_clicked(value2) {
      alignNodes(
        Object.values(LGraphCanvas.active_canvas.selected_nodes),
        value2.toLowerCase()
      );
      LGraphCanvas.active_canvas.setDirty(true, true);
    }
  }
  static createDistributeMenu(value, options2, event, prev_menu, node2) {
    new LiteGraph.ContextMenu(["Vertically", "Horizontally"], {
      event,
      callback: inner_clicked,
      parentMenu: prev_menu
    });
    function inner_clicked(value2) {
      const canvas2 = LGraphCanvas.active_canvas;
      distributeNodes(Object.values(canvas2.selected_nodes), value2 === "Horizontally");
      canvas2.setDirty(true, true);
    }
  }
  static onMenuAdd(node2, options2, e2, prev_menu, callback) {
    const canvas2 = LGraphCanvas.active_canvas;
    const ref_window = canvas2.getCanvasWindow();
    const graph = canvas2.graph;
    if (!graph) return;
    function inner_onMenuAdded(base_category, prev_menu2) {
      const categories = LiteGraph.getNodeTypesCategories(canvas2.filter || graph.filter).filter(function(category) {
        return category.startsWith(base_category);
      });
      const entries = [];
      categories.map(function(category) {
        if (!category) return;
        const base_category_regex = new RegExp("^(" + base_category + ")");
        const category_name = category.replace(base_category_regex, "").split("/")[0];
        const category_path = base_category === "" ? category_name + "/" : base_category + category_name + "/";
        let name = category_name;
        if (name.indexOf("::") != -1)
          name = name.split("::")[1];
        const index = entries.findIndex(function(entry) {
          return entry.value === category_path;
        });
        if (index === -1) {
          entries.push({
            value: category_path,
            content: name,
            has_submenu: true,
            callback: function(value, event, mouseEvent, contextMenu) {
              inner_onMenuAdded(value.value, contextMenu);
            }
          });
        }
      });
      const nodes = LiteGraph.getNodeTypesInCategory(
        base_category.slice(0, -1),
        canvas2.filter || graph.filter
      );
      nodes.map(function(node22) {
        if (node22.skip_list) return;
        const entry = {
          value: node22.type,
          content: node22.title,
          has_submenu: false,
          callback: function(value, event, mouseEvent, contextMenu) {
            const first_event = contextMenu.getFirstEvent();
            canvas2.graph.beforeChange();
            const node3 = LiteGraph.createNode(value.value);
            if (node3) {
              node3.pos = canvas2.convertEventToCanvasOffset(first_event);
              canvas2.graph.add(node3);
            }
            callback?.(node3);
            canvas2.graph.afterChange();
          }
        };
        entries.push(entry);
      });
      new LiteGraph.ContextMenu(entries, { event: e2, parentMenu: prev_menu2 }, ref_window);
    }
    inner_onMenuAdded("", prev_menu);
    return false;
  }
  static onMenuCollapseAll() {
  }
  static onMenuNodeEdit() {
  }
  /** @param options Parameter is never used */
  static showMenuNodeOptionalInputs(v2, options2, e2, prev_menu, node2) {
    if (!node2) return;
    const that = this;
    const canvas2 = LGraphCanvas.active_canvas;
    const ref_window = canvas2.getCanvasWindow();
    options2 = node2.onGetInputs ? node2.onGetInputs() : node2.optional_inputs;
    let entries = [];
    if (options2) {
      for (let i = 0; i < options2.length; i++) {
        const entry = options2[i];
        if (!entry) {
          entries.push(null);
          continue;
        }
        let label = entry[0];
        entry[2] ||= {};
        if (entry[2].label) {
          label = entry[2].label;
        }
        entry[2].removable = true;
        const data = { content: label, value: entry };
        if (entry[1] == LiteGraph.ACTION) {
          data.className = "event";
        }
        entries.push(data);
      }
    }
    const retEntries = node2.onMenuNodeInputs?.(entries);
    if (retEntries) entries = retEntries;
    if (!entries.length) {
      console.log("no input entries");
      return;
    }
    new LiteGraph.ContextMenu(
      entries,
      {
        event: e2,
        callback: inner_clicked,
        parentMenu: prev_menu,
        node: node2
      },
      // @ts-expect-error Unused param
      ref_window
    );
    function inner_clicked(v22, e22, prev) {
      if (!node2) return;
      v22.callback?.call(that, node2, v22, e22, prev);
      if (!v22.value) return;
      node2.graph.beforeChange();
      node2.addInput(v22.value[0], v22.value[1], v22.value[2]);
      node2.onNodeInputAdd?.(v22.value);
      canvas2.setDirty(true, true);
      node2.graph.afterChange();
    }
    return false;
  }
  /** @param options Parameter is never used */
  static showMenuNodeOptionalOutputs(v2, options2, e2, prev_menu, node2) {
    if (!node2) return;
    const that = this;
    const canvas2 = LGraphCanvas.active_canvas;
    const ref_window = canvas2.getCanvasWindow();
    options2 = node2.onGetOutputs ? node2.onGetOutputs() : node2.optional_outputs;
    let entries = [];
    if (options2) {
      for (let i = 0; i < options2.length; i++) {
        const entry = options2[i];
        if (!entry) {
          entries.push(null);
          continue;
        }
        if (node2.flags && node2.flags.skip_repeated_outputs && node2.findOutputSlot(entry[0]) != -1) {
          continue;
        }
        let label = entry[0];
        entry[2] ||= {};
        if (entry[2].label) {
          label = entry[2].label;
        }
        entry[2].removable = true;
        const data = { content: label, value: entry };
        if (entry[1] == LiteGraph.EVENT) {
          data.className = "event";
        }
        entries.push(data);
      }
    }
    if (this.onMenuNodeOutputs) entries = this.onMenuNodeOutputs(entries);
    if (LiteGraph.do_add_triggers_slots) {
      if (node2.findOutputSlot("onExecuted") == -1) {
        entries.push({ content: "On Executed", value: ["onExecuted", LiteGraph.EVENT, { nameLocked: true }], className: "event" });
      }
    }
    const retEntries = node2.onMenuNodeOutputs?.(entries);
    if (retEntries) entries = retEntries;
    if (!entries.length) return;
    new LiteGraph.ContextMenu(
      entries,
      {
        event: e2,
        callback: inner_clicked,
        parentMenu: prev_menu,
        node: node2
      },
      // @ts-expect-error Unused
      ref_window
    );
    function inner_clicked(v22, e22, prev) {
      if (!node2) return;
      if (v22.callback) v22.callback.call(that, node2, v22, e22, prev);
      if (!v22.value) return;
      const value = v22.value[1];
      if (value && (typeof value === "object" || Array.isArray(value))) {
        const entries2 = [];
        for (const i in value) {
          entries2.push({ content: i, value: value[i] });
        }
        new LiteGraph.ContextMenu(entries2, {
          event: e22,
          callback: inner_clicked,
          parentMenu: prev_menu,
          node: node2
        });
        return false;
      }
      const graph = node2.graph;
      graph.beforeChange();
      node2.addOutput(v22.value[0], v22.value[1], v22.value[2]);
      node2.onNodeOutputAdd?.(v22.value);
      canvas2.setDirty(true, true);
      graph.afterChange();
    }
    return false;
  }
  /** @param value Parameter is never used */
  static onShowMenuNodeProperties(value, options2, e2, prev_menu, node2) {
    if (!node2 || !node2.properties) return;
    const canvas2 = LGraphCanvas.active_canvas;
    const ref_window = canvas2.getCanvasWindow();
    const entries = [];
    for (const i in node2.properties) {
      value = node2.properties[i] !== void 0 ? node2.properties[i] : " ";
      if (typeof value == "object")
        value = JSON.stringify(value);
      const info = node2.getPropertyInfo(i);
      if (info.type == "enum" || info.type == "combo")
        value = LGraphCanvas.getPropertyPrintableValue(value, info.values);
      value = LGraphCanvas.decodeHTML(stringOrNull(value));
      entries.push({
        content: "<span class='property_name'>" + (info.label || i) + "</span><span class='property_value'>" + value + "</span>",
        value: i
      });
    }
    if (!entries.length) {
      return;
    }
    new LiteGraph.ContextMenu(
      entries,
      {
        event: e2,
        callback: inner_clicked,
        parentMenu: prev_menu,
        allow_html: true,
        node: node2
      },
      // @ts-expect-error Unused
      ref_window
    );
    function inner_clicked(v2) {
      if (!node2) return;
      const rect = this.getBoundingClientRect();
      canvas2.showEditPropertyValue(node2, v2.value, {
        position: [rect.left, rect.top]
      });
    }
    return false;
  }
  static decodeHTML(str) {
    const e2 = document.createElement("div");
    e2.innerText = str;
    return e2.innerHTML;
  }
  static onMenuResizeNode(value, options2, e2, menu, node2) {
    if (!node2) return;
    const fApplyMultiNode = function(node22) {
      node22.size = node22.computeSize();
      node22.onResize?.(node22.size);
    };
    const canvas2 = LGraphCanvas.active_canvas;
    if (!canvas2.selected_nodes || Object.keys(canvas2.selected_nodes).length <= 1) {
      fApplyMultiNode(node2);
    } else {
      for (const i in canvas2.selected_nodes) {
        fApplyMultiNode(canvas2.selected_nodes[i]);
      }
    }
    canvas2.setDirty(true, true);
  }
  // TODO refactor :: this is used fot title but not for properties!
  static onShowPropertyEditor(item, options2, e2, menu, node2) {
    const property = item.property || "title";
    const value = node2[property];
    const dialog = document.createElement("div");
    dialog.is_modified = false;
    dialog.className = "graphdialog";
    dialog.innerHTML = "<span class='name'></span><input autofocus type='text' class='value'/><button>OK</button>";
    dialog.close = function() {
      dialog.parentNode?.removeChild(dialog);
    };
    const title = dialog.querySelector(".name");
    title.innerText = property;
    const input = dialog.querySelector(".value");
    if (input) {
      input.value = value;
      input.addEventListener("blur", function() {
        this.focus();
      });
      input.addEventListener("keydown", function(e22) {
        dialog.is_modified = true;
        if (e22.keyCode == 27) {
          dialog.close();
        } else if (e22.keyCode == 13) {
          inner();
        } else if (e22.keyCode != 13 && e22.target.localName != "textarea") {
          return;
        }
        e22.preventDefault();
        e22.stopPropagation();
      });
    }
    const canvas2 = LGraphCanvas.active_canvas;
    const canvasEl = canvas2.canvas;
    const rect = canvasEl.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
      offsetx -= rect.left;
      offsety -= rect.top;
    }
    if (e2) {
      dialog.style.left = e2.clientX + offsetx + "px";
      dialog.style.top = e2.clientY + offsety + "px";
    } else {
      dialog.style.left = canvasEl.width * 0.5 + offsetx + "px";
      dialog.style.top = canvasEl.height * 0.5 + offsety + "px";
    }
    const button = dialog.querySelector("button");
    button.addEventListener("click", inner);
    canvasEl.parentNode.appendChild(dialog);
    input?.focus();
    let dialogCloseTimer = null;
    dialog.addEventListener("mouseleave", function() {
      if (LiteGraph.dialog_close_on_mouse_leave) {
        if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
          dialogCloseTimer = setTimeout(
            dialog.close,
            LiteGraph.dialog_close_on_mouse_leave_delay
          );
      }
    });
    dialog.addEventListener("mouseenter", function() {
      if (LiteGraph.dialog_close_on_mouse_leave) {
        if (dialogCloseTimer) clearTimeout(dialogCloseTimer);
      }
    });
    function inner() {
      if (input) setValue(input.value);
    }
    function setValue(value2) {
      if (item.type == "Number") {
        value2 = Number(value2);
      } else if (item.type == "Boolean") {
        value2 = Boolean(value2);
      }
      node2[property] = value2;
      dialog.parentNode?.removeChild(dialog);
      canvas2.setDirty(true, true);
    }
  }
  static getPropertyPrintableValue(value, values) {
    if (!values) return String(value);
    if (Array.isArray(values)) {
      return String(value);
    }
    if (typeof values === "object") {
      let desc_value = "";
      for (const k in values) {
        if (values[k] != value) continue;
        desc_value = k;
        break;
      }
      return String(value) + " (" + desc_value + ")";
    }
  }
  static onMenuNodeCollapse(value, options2, e2, menu, node2) {
    node2.graph.beforeChange(
      /* ? */
    );
    const fApplyMultiNode = function(node22) {
      node22.collapse();
    };
    const graphcanvas = LGraphCanvas.active_canvas;
    if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1) {
      fApplyMultiNode(node2);
    } else {
      for (const i in graphcanvas.selected_nodes) {
        fApplyMultiNode(graphcanvas.selected_nodes[i]);
      }
    }
    node2.graph.afterChange(
      /* ? */
    );
  }
  static onMenuToggleAdvanced(value, options2, e2, menu, node2) {
    node2.graph.beforeChange(
      /* ? */
    );
    const fApplyMultiNode = function(node22) {
      node22.toggleAdvanced();
    };
    const graphcanvas = LGraphCanvas.active_canvas;
    if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1) {
      fApplyMultiNode(node2);
    } else {
      for (const i in graphcanvas.selected_nodes) {
        fApplyMultiNode(graphcanvas.selected_nodes[i]);
      }
    }
    node2.graph.afterChange(
      /* ? */
    );
  }
  static onMenuNodePin(value, options2, e2, menu, node2) {
  }
  static onMenuNodeMode(value, options2, e2, menu, node2) {
    new LiteGraph.ContextMenu(
      LiteGraph.NODE_MODES,
      { event: e2, callback: inner_clicked, parentMenu: menu, node: node2 }
    );
    function inner_clicked(v2) {
      if (!node2) return;
      const kV = Object.values(LiteGraph.NODE_MODES).indexOf(v2);
      const fApplyMultiNode = function(node22) {
        if (kV >= 0 && LiteGraph.NODE_MODES[kV])
          node22.changeMode(kV);
        else {
          console.warn("unexpected mode: " + v2);
          node22.changeMode(LGraphEventMode.ALWAYS);
        }
      };
      const graphcanvas = LGraphCanvas.active_canvas;
      if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1) {
        fApplyMultiNode(node2);
      } else {
        for (const i in graphcanvas.selected_nodes) {
          fApplyMultiNode(graphcanvas.selected_nodes[i]);
        }
      }
    }
    return false;
  }
  /** @param value Parameter is never used */
  static onMenuNodeColors(value, options2, e2, menu, node2) {
    if (!node2) throw "no node for color";
    const values = [];
    values.push({
      value: null,
      content: "<span style='display: block; padding-left: 4px;'>No color</span>"
    });
    for (const i in LGraphCanvas.node_colors) {
      const color = LGraphCanvas.node_colors[i];
      value = {
        value: i,
        content: "<span style='display: block; color: #999; padding-left: 4px; border-left: 8px solid " + color.color + "; background-color:" + color.bgcolor + "'>" + i + "</span>"
      };
      values.push(value);
    }
    new LiteGraph.ContextMenu(values, {
      event: e2,
      callback: inner_clicked,
      parentMenu: menu,
      node: node2
    });
    function inner_clicked(v2) {
      if (!node2) return;
      const color = v2.value ? LGraphCanvas.node_colors[v2.value] : null;
      const fApplyColor = function(node22) {
        if (color) {
          if (node22 instanceof LGraphGroup) {
            node22.color = color.groupcolor;
          } else {
            node22.color = color.color;
            node22.bgcolor = color.bgcolor;
          }
        } else {
          delete node22.color;
          delete node22.bgcolor;
        }
      };
      const canvas2 = LGraphCanvas.active_canvas;
      if (!canvas2.selected_nodes || Object.keys(canvas2.selected_nodes).length <= 1) {
        fApplyColor(node2);
      } else {
        for (const i in canvas2.selected_nodes) {
          fApplyColor(canvas2.selected_nodes[i]);
        }
      }
      canvas2.setDirty(true, true);
    }
    return false;
  }
  static onMenuNodeShapes(value, options2, e2, menu, node2) {
    if (!node2) throw "no node passed";
    new LiteGraph.ContextMenu(LiteGraph.VALID_SHAPES, {
      event: e2,
      callback: inner_clicked,
      parentMenu: menu,
      node: node2
    });
    function inner_clicked(v2) {
      if (!node2) return;
      node2.graph.beforeChange(
        /* ? */
      );
      const fApplyMultiNode = function(node22) {
        node22.shape = v2;
      };
      const canvas2 = LGraphCanvas.active_canvas;
      if (!canvas2.selected_nodes || Object.keys(canvas2.selected_nodes).length <= 1) {
        fApplyMultiNode(node2);
      } else {
        for (const i in canvas2.selected_nodes) {
          fApplyMultiNode(canvas2.selected_nodes[i]);
        }
      }
      node2.graph.afterChange(
        /* ? */
      );
      canvas2.setDirty(true);
    }
    return false;
  }
  static onMenuNodeRemove(value, options2, e2, menu, node2) {
    if (!node2) throw "no node passed";
    const graph = node2.graph;
    graph.beforeChange();
    const fApplyMultiNode = function(node22) {
      if (node22.removable === false) return;
      graph.remove(node22);
    };
    const canvas2 = LGraphCanvas.active_canvas;
    if (!canvas2.selected_nodes || Object.keys(canvas2.selected_nodes).length <= 1) {
      fApplyMultiNode(node2);
    } else {
      for (const i in canvas2.selected_nodes) {
        fApplyMultiNode(canvas2.selected_nodes[i]);
      }
    }
    graph.afterChange();
    canvas2.setDirty(true, true);
  }
  static onMenuNodeClone(value, options2, e2, menu, node2) {
    const graph = node2.graph;
    graph.beforeChange();
    const newSelected = /* @__PURE__ */ new Set();
    const fApplyMultiNode = function(node22, newNodes) {
      if (node22.clonable === false) return;
      const newnode = node22.clone();
      if (!newnode) return;
      newnode.pos = [node22.pos[0] + 5, node22.pos[1] + 5];
      node22.graph.add(newnode);
      newNodes.add(newnode);
    };
    const canvas2 = LGraphCanvas.active_canvas;
    if (!canvas2.selected_nodes || Object.keys(canvas2.selected_nodes).length <= 1) {
      fApplyMultiNode(node2, newSelected);
    } else {
      for (const i in canvas2.selected_nodes) {
        fApplyMultiNode(canvas2.selected_nodes[i], newSelected);
      }
    }
    if (newSelected.size) {
      canvas2.selectNodes([...newSelected]);
    }
    graph.afterChange();
    canvas2.setDirty(true, true);
  }
  /**
   * clears all the data inside
   *
   */
  clear() {
    this.frame = 0;
    this.last_draw_time = 0;
    this.render_time = 0;
    this.fps = 0;
    this.dragging_rectangle = null;
    this.selected_nodes = {};
    this.selected_group = null;
    this.visible_nodes = [];
    this.node_over = null;
    this.node_capturing_input = null;
    this.connecting_links = null;
    this.highlighted_links = {};
    this.dragging_canvas = false;
    this.#dirty();
    this.dirty_area = null;
    this.node_in_panel = null;
    this.node_widget = null;
    this.last_mouse = [0, 0];
    this.last_mouseclick = 0;
    this.pointer.reset();
    this.visible_area.set([0, 0, 0, 0]);
    this.onClear?.();
  }
  /**
   * assigns a graph, you can reassign graphs to the same canvas
   * @param graph
   */
  setGraph(graph, skip_clear) {
    if (this.graph == graph) return;
    if (!skip_clear) this.clear();
    if (!graph && this.graph) {
      this.graph.detachCanvas(this);
      return;
    }
    graph.attachCanvas(this);
    this.setDirty(true, true);
  }
  /**
   * @returns the visually active graph (in case there are more in the stack)
   */
  getCurrentGraph() {
    return this.graph;
  }
  /**
   * Finds the canvas if required, throwing on failure.
   * @param canvas Canvas element, or its element ID
   * @returns The canvas element
   * @throws If {@link canvas} is an element ID that does not belong to a valid HTML canvas element
   */
  #validateCanvas(canvas2) {
    if (typeof canvas2 === "string") {
      const el = document.getElementById(canvas2);
      if (!(el instanceof HTMLCanvasElement)) throw "Error validating LiteGraph canvas: Canvas element not found";
      return el;
    }
    return canvas2;
  }
  /**
   * Sets the current HTML canvas element.
   * Calls bindEvents to add input event listeners, and (re)creates the background canvas.
   * @param canvas The canvas element to assign, or its HTML element ID.  If null or undefined, the current reference is cleared.
   * @param skip_events If true, events on the previous canvas will not be removed.  Has no effect on the first invocation.
   */
  setCanvas(canvas2, skip_events) {
    const element = this.#validateCanvas(canvas2);
    if (element === this.canvas) return;
    if (!element && this.canvas && !skip_events) this.unbindEvents();
    this.canvas = element;
    this.ds.element = element;
    this.pointer.element = element;
    if (!element) return;
    element.className += " lgraphcanvas";
    element.data = this;
    element.tabindex = "1";
    this.bgcanvas = null;
    if (!this.bgcanvas) {
      this.bgcanvas = document.createElement("canvas");
      this.bgcanvas.width = this.canvas.width;
      this.bgcanvas.height = this.canvas.height;
    }
    if (element.getContext == null) {
      if (element.localName != "canvas") {
        throw "Element supplied for LGraphCanvas must be a <canvas> element, you passed a " + element.localName;
      }
      throw "This browser doesn't support Canvas";
    }
    const ctx = this.ctx = element.getContext("2d");
    if (ctx == null) {
      if (!element.webgl_enabled) {
        console.warn("This canvas seems to be WebGL, enabling WebGL renderer");
      }
      this.enableWebGL();
    }
    if (!skip_events) this.bindEvents();
  }
  /** Captures an event and prevents default - returns false. */
  _doNothing(e2) {
    e2.preventDefault();
    return false;
  }
  /** Captures an event and prevents default - returns true. */
  _doReturnTrue(e2) {
    e2.preventDefault();
    return true;
  }
  /**
   * binds mouse, keyboard, touch and drag events to the canvas
   */
  bindEvents() {
    if (this._events_binded) {
      console.warn("LGraphCanvas: events already binded");
      return;
    }
    const canvas2 = this.canvas;
    const ref_window = this.getCanvasWindow();
    const document2 = ref_window.document;
    this._mousedown_callback = this.processMouseDown.bind(this);
    this._mousewheel_callback = this.processMouseWheel.bind(this);
    this._mousemove_callback = this.processMouseMove.bind(this);
    this._mouseup_callback = this.processMouseUp.bind(this);
    this._mouseout_callback = this.processMouseOut.bind(this);
    this._mousecancel_callback = this.processMouseCancel.bind(this);
    LiteGraph.pointerListenerAdd(canvas2, "down", this._mousedown_callback, true);
    canvas2.addEventListener("mousewheel", this._mousewheel_callback, false);
    LiteGraph.pointerListenerAdd(canvas2, "up", this._mouseup_callback, true);
    LiteGraph.pointerListenerAdd(canvas2, "move", this._mousemove_callback);
    canvas2.addEventListener("pointerout", this._mouseout_callback);
    canvas2.addEventListener("pointercancel", this._mousecancel_callback, true);
    canvas2.addEventListener("contextmenu", this._doNothing);
    canvas2.addEventListener(
      "DOMMouseScroll",
      this._mousewheel_callback,
      false
    );
    this._key_callback = this.processKey.bind(this);
    canvas2.addEventListener("keydown", this._key_callback, true);
    document2.addEventListener("keyup", this._key_callback, true);
    this._ondrop_callback = this.processDrop.bind(this);
    canvas2.addEventListener("dragover", this._doNothing, false);
    canvas2.addEventListener("dragend", this._doNothing, false);
    canvas2.addEventListener("drop", this._ondrop_callback, false);
    canvas2.addEventListener("dragenter", this._doReturnTrue, false);
    this._events_binded = true;
  }
  /**
   * unbinds mouse events from the canvas
   */
  unbindEvents() {
    if (!this._events_binded) {
      console.warn("LGraphCanvas: no events binded");
      return;
    }
    const ref_window = this.getCanvasWindow();
    const document2 = ref_window.document;
    this.canvas.removeEventListener("pointercancel", this._mousecancel_callback);
    this.canvas.removeEventListener("pointerout", this._mouseout_callback);
    LiteGraph.pointerListenerRemove(this.canvas, "move", this._mousemove_callback);
    LiteGraph.pointerListenerRemove(this.canvas, "up", this._mouseup_callback);
    LiteGraph.pointerListenerRemove(this.canvas, "down", this._mousedown_callback);
    this.canvas.removeEventListener(
      "mousewheel",
      this._mousewheel_callback
    );
    this.canvas.removeEventListener(
      "DOMMouseScroll",
      this._mousewheel_callback
    );
    this.canvas.removeEventListener("keydown", this._key_callback);
    document2.removeEventListener("keyup", this._key_callback);
    this.canvas.removeEventListener("contextmenu", this._doNothing);
    this.canvas.removeEventListener("drop", this._ondrop_callback);
    this.canvas.removeEventListener("dragenter", this._doReturnTrue);
    this._mousedown_callback = null;
    this._mousewheel_callback = null;
    this._key_callback = null;
    this._ondrop_callback = null;
    this._events_binded = false;
  }
  /**
   * this function allows to render the canvas using WebGL instead of Canvas2D
   * this is useful if you plant to render 3D objects inside your nodes, it uses litegl.js for webgl and canvas2DtoWebGL to emulate the Canvas2D calls in webGL
   */
  enableWebGL() {
    if (typeof GL === "undefined") {
      throw "litegl.js must be included to use a WebGL canvas";
    }
    if (typeof enableWebGLCanvas === "undefined") {
      throw "webglCanvas.js must be included to use this feature";
    }
    this.gl = this.ctx = enableWebGLCanvas(this.canvas);
    this.ctx.webgl = true;
    this.bgcanvas = this.canvas;
    this.bgctx = this.gl;
    this.canvas.webgl_enabled = true;
  }
  /**
   * Ensures the canvas will be redrawn on the next frame by setting the dirty flag(s).
   * Without parameters, this function does nothing.
   * @todo Impl. `setDirty()` or similar as shorthand to redraw everything.
   * @param fgcanvas If true, marks the foreground canvas as dirty (nodes and anything drawn on top of them).  Default: false
   * @param bgcanvas If true, mark the background canvas as dirty (background, groups, links).  Default: false
   */
  setDirty(fgcanvas, bgcanvas) {
    if (fgcanvas) this.dirty_canvas = true;
    if (bgcanvas) this.dirty_bgcanvas = true;
  }
  /** Marks the entire canvas as dirty. */
  #dirty() {
    this.dirty_canvas = true;
    this.dirty_bgcanvas = true;
  }
  /**
   * Used to attach the canvas in a popup
   * @returns returns the window where the canvas is attached (the DOM root node)
   */
  getCanvasWindow() {
    if (!this.canvas) return window;
    const doc = this.canvas.ownerDocument;
    return doc.defaultView || doc.parentWindow;
  }
  /**
   * starts rendering the content of the canvas when needed
   *
   */
  startRendering() {
    if (this.is_rendering) return;
    this.is_rendering = true;
    renderFrame.call(this);
    function renderFrame() {
      if (!this.pause_rendering) {
        this.draw();
      }
      const window2 = this.getCanvasWindow();
      if (this.is_rendering) {
        if (this.#maximumFrameGap > 0) {
          const gap = this.#maximumFrameGap - (LiteGraph.getTime() - this.last_draw_time);
          setTimeout(renderFrame.bind(this), Math.max(1, gap));
        } else {
          window2.requestAnimationFrame(renderFrame.bind(this));
        }
      }
    }
  }
  /**
   * stops rendering the content of the canvas (to save resources)
   *
   */
  stopRendering() {
    this.is_rendering = false;
  }
  /* LiteGraphCanvas input */
  // used to block future mouse events (because of im gui)
  blockClick() {
    this.block_click = true;
    this.last_mouseclick = 0;
  }
  /**
   * Gets the widget at the current cursor position
   * @param node Optional node to check for widgets under cursor
   * @returns The widget located at the current cursor position or null
   */
  getWidgetAtCursor(node2) {
    node2 ??= this.node_over;
    if (!node2.widgets) return null;
    const graphPos = this.graph_mouse;
    const x2 = graphPos[0] - node2.pos[0];
    const y = graphPos[1] - node2.pos[1];
    for (const widget of node2.widgets) {
      if (widget.hidden || widget.advanced && !node2.showAdvanced) continue;
      let widgetWidth, widgetHeight;
      if (widget.computeSize) {
        [widgetWidth, widgetHeight] = widget.computeSize(node2.size[0]);
      } else {
        widgetWidth = widget.width || node2.size[0];
        widgetHeight = LiteGraph.NODE_WIDGET_HEIGHT;
      }
      if (widget.last_y !== void 0 && x2 >= 6 && x2 <= widgetWidth - 12 && y >= widget.last_y && y <= widget.last_y + widgetHeight) {
        return widget;
      }
    }
    return null;
  }
  /**
   * Clears highlight and mouse-over information from nodes that should not have it.
   *
   * Intended to be called when the pointer moves away from a node.
   * @param node The node that the mouse is now over
   * @param e MouseEvent that is triggering this
   */
  updateMouseOverNodes(node2, e2) {
    const nodes = this.graph._nodes;
    const l = nodes.length;
    for (let i = 0; i < l; ++i) {
      if (nodes[i].mouseOver && node2 != nodes[i]) {
        nodes[i].mouseOver = null;
        this._highlight_input = null;
        this._highlight_pos = null;
        this.link_over_widget = null;
        nodes[i].lostFocusAt = LiteGraph.getTime();
        this.node_over?.onMouseLeave?.(e2);
        this.node_over = null;
        this.dirty_canvas = true;
      }
    }
  }
  processMouseDown(e2) {
    if (this.dragZoomEnabled && e2.ctrlKey && e2.shiftKey && !e2.altKey && e2.buttons) {
      this.#dragZoomStart = { pos: [e2.x, e2.y], scale: this.ds.scale };
      return;
    }
    const { graph, pointer } = this;
    this.adjustMouseEvent(e2);
    if (e2.isPrimary) pointer.down(e2);
    if (this.set_canvas_dirty_on_mouse_event) this.dirty_canvas = true;
    if (!graph) return;
    const ref_window = this.getCanvasWindow();
    LGraphCanvas.active_canvas = this;
    const x2 = e2.clientX;
    const y = e2.clientY;
    this.ds.viewport = this.viewport;
    const is_inside = !this.viewport || isInRect(x2, y, this.viewport);
    if (!is_inside) return;
    const node2 = graph.getNodeOnPos(e2.canvasX, e2.canvasY, this.visible_nodes);
    this.mouse[0] = x2;
    this.mouse[1] = y;
    this.graph_mouse[0] = e2.canvasX;
    this.graph_mouse[1] = e2.canvasY;
    this.last_click_position = [this.mouse[0], this.mouse[1]];
    pointer.isDouble = pointer.isDown && e2.isPrimary;
    pointer.isDown = true;
    this.canvas.focus();
    LiteGraph.closeAllContextMenus(ref_window);
    if (this.onMouse?.(e2) == true) return;
    if (e2.button === 0 && !pointer.isDouble) {
      this.#processPrimaryButton(e2, node2);
    } else if (e2.button === 1) {
      this.#processMiddleButton(e2, node2);
    } else if ((e2.button === 2 || pointer.isDouble) && this.allow_interaction && !this.read_only) {
      if (node2) this.processSelect(node2, e2, true);
      this.processContextMenu(node2, e2);
    }
    this.last_mouse = [x2, y];
    this.last_mouseclick = LiteGraph.getTime();
    this.last_mouse_dragging = true;
    graph.change();
    if (!ref_window.document.activeElement || ref_window.document.activeElement.nodeName.toLowerCase() != "input" && ref_window.document.activeElement.nodeName.toLowerCase() != "textarea") {
      e2.preventDefault();
    }
    e2.stopPropagation();
    this.onMouseDown?.(e2);
  }
  #processPrimaryButton(e2, node2) {
    const { pointer, graph } = this;
    const x2 = e2.canvasX;
    const y = e2.canvasY;
    const ctrlOrMeta = e2.ctrlKey || e2.metaKey;
    if (ctrlOrMeta && !e2.altKey) {
      const dragRect = new Float32Array(4);
      dragRect[0] = x2;
      dragRect[1] = y;
      dragRect[2] = 1;
      dragRect[3] = 1;
      pointer.onClick = (eUp) => {
        const clickedItem = node2 ?? (this.reroutesEnabled ? graph.getRerouteOnPos(eUp.canvasX, eUp.canvasY) : null) ?? graph.getGroupTitlebarOnPos(eUp.canvasX, eUp.canvasY);
        this.processSelect(clickedItem, eUp);
      };
      pointer.onDragStart = () => this.dragging_rectangle = dragRect;
      pointer.onDragEnd = (upEvent) => this.#handleMultiSelect(upEvent, dragRect);
      pointer.finally = () => this.dragging_rectangle = null;
      return;
    }
    if (this.read_only) {
      pointer.finally = () => this.dragging_canvas = false;
      this.dragging_canvas = true;
      return;
    }
    if (LiteGraph.alt_drag_do_clone_nodes && e2.altKey && !e2.ctrlKey && node2 && this.allow_interaction) {
      const node_data = node2.clone()?.serialize();
      const cloned = LiteGraph.createNode(node_data.type);
      if (cloned) {
        cloned.configure(node_data);
        cloned.pos[0] += 5;
        cloned.pos[1] += 5;
        if (this.allow_dragnodes) {
          pointer.onDragStart = (pointer2) => {
            graph.add(cloned, false);
            this.#startDraggingItems(cloned, pointer2);
          };
          pointer.onDragEnd = (e22) => this.#processDraggedItems(e22);
        } else {
          graph.beforeChange();
          graph.add(cloned, false);
          graph.afterChange();
        }
        return;
      }
    }
    if (node2 && (this.allow_interaction || node2.flags.allow_interaction)) {
      this.#processNodeClick(e2, ctrlOrMeta, node2);
    } else {
      if (this.reroutesEnabled && this.links_render_mode !== LinkRenderType.HIDDEN_LINK) {
        const reroute = graph.getRerouteOnPos(x2, y);
        if (reroute) {
          if (e2.shiftKey) {
            const link = graph._links.get(reroute.linkIds.values().next().value);
            const outputNode = graph.getNodeById(link.origin_id);
            const slot = link.origin_slot;
            const connecting = {
              node: outputNode,
              slot,
              input: null,
              pos: outputNode.getConnectionPos(false, slot),
              afterRerouteId: reroute.id
            };
            this.connecting_links = [connecting];
            pointer.onDragStart = () => connecting.output = outputNode.outputs[slot];
            this.dirty_bgcanvas = true;
          }
          pointer.onClick = () => this.processSelect(reroute, e2);
          if (!pointer.onDragStart) {
            pointer.onDragStart = (pointer2) => this.#startDraggingItems(reroute, pointer2, true);
            pointer.onDragEnd = (e22) => this.#processDraggedItems(e22);
          }
          return;
        }
      }
      const { lineWidth } = this.ctx;
      this.ctx.lineWidth = this.connections_width + 7;
      const dpi = window?.devicePixelRatio || 1;
      for (const linkSegment of this.renderedPaths) {
        const centre = linkSegment._pos;
        if (!centre) continue;
        if ((e2.shiftKey || e2.altKey) && linkSegment.path && this.ctx.isPointInStroke(linkSegment.path, x2 * dpi, y * dpi)) {
          this.ctx.lineWidth = lineWidth;
          if (e2.shiftKey && !e2.altKey) {
            const slot = linkSegment.origin_slot;
            const originNode = graph._nodes_by_id[linkSegment.origin_id];
            const connecting = {
              node: originNode,
              slot,
              pos: originNode.getConnectionPos(false, slot)
            };
            this.connecting_links = [connecting];
            if (linkSegment.parentId) connecting.afterRerouteId = linkSegment.parentId;
            pointer.onDragStart = () => connecting.output = originNode.outputs[slot];
            return;
          } else if (this.reroutesEnabled && e2.altKey && !e2.shiftKey) {
            const newReroute = graph.createReroute([x2, y], linkSegment);
            pointer.onDragStart = (pointer2) => this.#startDraggingItems(newReroute, pointer2);
            pointer.onDragEnd = (e22) => this.#processDraggedItems(e22);
            return;
          }
        } else if (isInRectangle(x2, y, centre[0] - 4, centre[1] - 4, 8, 8)) {
          this.ctx.lineWidth = lineWidth;
          pointer.onClick = () => this.showLinkMenu(linkSegment, e2);
          pointer.onDragStart = () => this.dragging_canvas = true;
          pointer.finally = () => this.dragging_canvas = false;
          this.over_link_center = null;
          return;
        }
      }
      this.ctx.lineWidth = lineWidth;
      const group = graph.getGroupOnPos(x2, y);
      this.selected_group = group;
      if (group) {
        if (group.isInResize(x2, y)) {
          const b = group.boundingRect;
          const offsetX = x2 - (b[0] + b[2]);
          const offsetY = y - (b[1] + b[3]);
          pointer.onDragStart = () => this.resizingGroup = group;
          pointer.onDrag = (eMove) => {
            if (this.read_only) return;
            const pos = [
              eMove.canvasX - group.pos[0] - offsetX,
              eMove.canvasY - group.pos[1] - offsetY
            ];
            snapPoint(pos, this.#snapToGrid);
            const resized = group.resize(pos[0], pos[1]);
            if (resized) this.dirty_bgcanvas = true;
          };
          pointer.finally = () => this.resizingGroup = null;
        } else {
          const f = group.font_size || LiteGraph.DEFAULT_GROUP_FONT_SIZE;
          const headerHeight = f * 1.4;
          if (isInRectangle(
            x2,
            y,
            group.pos[0],
            group.pos[1],
            group.size[0],
            headerHeight
          )) {
            pointer.onClick = () => this.processSelect(group, e2);
            pointer.onDragStart = (pointer2) => {
              group.recomputeInsideNodes();
              this.#startDraggingItems(group, pointer2, true);
            };
            pointer.onDragEnd = (e22) => this.#processDraggedItems(e22);
          }
        }
        pointer.onDoubleClick = () => {
          this.emitEvent({
            subType: "group-double-click",
            originalEvent: e2,
            group
          });
        };
      } else {
        pointer.onDoubleClick = () => {
          if (this.allow_searchbox) {
            this.showSearchBox(e2);
            e2.preventDefault();
          }
          this.emitEvent({
            subType: "empty-double-click",
            originalEvent: e2
          });
        };
      }
    }
    if (!pointer.onDragStart && !pointer.onClick && !pointer.onDrag && this.allow_dragcanvas) {
      pointer.onClick = () => this.processSelect(null, e2);
      pointer.finally = () => this.dragging_canvas = false;
      this.dragging_canvas = true;
    }
  }
  /**
   * Processes a pointerdown event inside the bounds of a node.  Part of {@link processMouseDown}.
   * @param e The pointerdown event
   * @param ctrlOrMeta Ctrl or meta key is pressed
   * @param node The node to process a click event for
   */
  #processNodeClick(e2, ctrlOrMeta, node2) {
    const { pointer, graph } = this;
    const x2 = e2.canvasX;
    const y = e2.canvasY;
    pointer.onClick = () => this.processSelect(node2, e2);
    if (!node2.flags.pinned) {
      this.bringToFront(node2);
    }
    const inCollapse = node2.isPointInCollapse(x2, y);
    if (inCollapse) {
      pointer.onClick = () => {
        node2.collapse();
        this.setDirty(true, true);
      };
    } else if (!node2.flags.collapsed) {
      if (node2.resizable !== false && node2.inResizeCorner(x2, y)) {
        const b = node2.boundingRect;
        const offsetX = x2 - (b[0] + b[2]);
        const offsetY = y - (b[1] + b[3]);
        pointer.onDragStart = () => {
          graph.beforeChange();
          this.resizing_node = node2;
        };
        pointer.onDrag = (eMove) => {
          if (this.read_only) return;
          const pos2 = [
            eMove.canvasX - node2.pos[0] - offsetX,
            eMove.canvasY - node2.pos[1] - offsetY
          ];
          snapPoint(pos2, this.#snapToGrid);
          const min = node2.computeSize();
          pos2[0] = Math.max(min[0], pos2[0]);
          pos2[1] = Math.max(min[1], pos2[1]);
          node2.setSize(pos2);
          this.#dirty();
        };
        pointer.onDragEnd = (upEvent) => {
          this.#dirty();
          graph.afterChange(this.resizing_node);
        };
        pointer.finally = () => this.resizing_node = null;
        this.canvas.style.cursor = "se-resize";
        return;
      }
      if (node2.outputs) {
        for (let i = 0, l = node2.outputs.length; i < l; ++i) {
          const output = node2.outputs[i];
          const link_pos = node2.getConnectionPos(false, i);
          if (isInRectangle(x2, y, link_pos[0] - 15, link_pos[1] - 10, 30, 20)) {
            if (e2.shiftKey && output.links?.length > 0) {
              this.connecting_links = [];
              for (const linkId of output.links) {
                const link = graph._links.get(linkId);
                const slot = link.target_slot;
                const linked_node = graph._nodes_by_id[link.target_id];
                const input = linked_node.inputs[slot];
                const pos2 = linked_node.getConnectionPos(true, slot);
                this.connecting_links.push({
                  node: linked_node,
                  slot,
                  input,
                  output: null,
                  pos: pos2,
                  direction: node2.horizontal !== true ? LinkDirection.RIGHT : LinkDirection.CENTER
                });
              }
              return;
            }
            output.slot_index = i;
            this.connecting_links = [
              {
                node: node2,
                slot: i,
                input: null,
                output,
                pos: link_pos
              }
            ];
            if (LiteGraph.shift_click_do_break_link_from) {
              if (e2.shiftKey) {
                node2.disconnectOutput(i);
              }
            } else if (LiteGraph.ctrl_alt_click_do_break_link) {
              if (ctrlOrMeta && e2.altKey && !e2.shiftKey) {
                node2.disconnectOutput(i);
              }
            }
            pointer.onDoubleClick = () => node2.onOutputDblClick?.(i, e2);
            pointer.onClick = () => node2.onOutputClick?.(i, e2);
            return;
          }
        }
      }
      if (node2.inputs) {
        for (let i = 0, l = node2.inputs.length; i < l; ++i) {
          const input = node2.inputs[i];
          const link_pos = node2.getConnectionPos(true, i);
          if (isInRectangle(x2, y, link_pos[0] - 15, link_pos[1] - 10, 30, 20)) {
            pointer.onDoubleClick = () => node2.onInputDblClick?.(i, e2);
            pointer.onClick = () => node2.onInputClick?.(i, e2);
            if (input.link !== null) {
              const link_info = graph._links.get(input.link);
              const slot = link_info.origin_slot;
              const linked_node = graph._nodes_by_id[link_info.origin_id];
              if (LiteGraph.click_do_break_link_to || LiteGraph.ctrl_alt_click_do_break_link && ctrlOrMeta && e2.altKey && !e2.shiftKey) {
                node2.disconnectInput(i);
              } else if (e2.shiftKey || this.allow_reconnect_links) {
                const connecting = {
                  node: linked_node,
                  slot,
                  output: linked_node.outputs[slot],
                  pos: linked_node.getConnectionPos(false, slot)
                };
                this.connecting_links = [connecting];
                pointer.onDragStart = () => {
                  if (this.allow_reconnect_links && !LiteGraph.click_do_break_link_to)
                    node2.disconnectInput(i);
                  connecting.output = linked_node.outputs[slot];
                };
                this.dirty_bgcanvas = true;
              }
            }
            if (!pointer.onDragStart) {
              const connecting = {
                node: node2,
                slot: i,
                output: null,
                pos: link_pos
              };
              this.connecting_links = [connecting];
              pointer.onDragStart = () => connecting.input = input;
              this.dirty_bgcanvas = true;
            }
            return;
          }
        }
      }
    }
    const pos = [x2 - node2.pos[0], y - node2.pos[1]];
    const widget = node2.getWidgetOnPos(x2, y);
    if (widget) {
      this.#processWidgetClick(e2, node2, widget);
      this.node_widget = [node2, widget];
    } else {
      pointer.onDoubleClick = () => {
        if (pos[1] < 0 && !inCollapse) {
          node2.onNodeTitleDblClick?.(e2, pos, this);
        }
        node2.onDblClick?.(e2, pos, this);
        this.emitEvent({
          subType: "node-double-click",
          originalEvent: e2,
          node: node2
        });
        this.processNodeDblClicked(node2);
      };
      if (node2.onMouseDown?.(e2, pos, this) || !this.allow_dragnodes)
        return;
      pointer.onDragStart = (pointer2) => this.#startDraggingItems(node2, pointer2, true);
      pointer.onDragEnd = (e22) => this.#processDraggedItems(e22);
    }
    this.dirty_canvas = true;
  }
  #processWidgetClick(e2, node2, widget) {
    const { pointer } = this;
    if (typeof widget.onPointerDown === "function") {
      const handled = widget.onPointerDown(pointer, node2, this);
      if (handled) return;
    }
    const oldValue = widget.value;
    const pos = this.graph_mouse;
    const x2 = pos[0] - node2.pos[0];
    const y = pos[1] - node2.pos[1];
    const WidgetClass = WIDGET_TYPE_MAP[widget.type];
    if (WidgetClass) {
      const widgetInstance = toClass(WidgetClass, widget);
      pointer.onClick = () => widgetInstance.onClick({
        e: e2,
        node: node2,
        canvas: this
      });
      pointer.onDrag = (eMove) => widgetInstance.onDrag({
        e: eMove,
        node: node2
      });
    } else {
      if (widget.mouse) {
        const result = widget.mouse(e2, [x2, y], node2);
        if (result != null) this.dirty_canvas = result;
      }
    }
    if (oldValue != widget.value) {
      node2.onWidgetChanged?.(widget.name, widget.value, oldValue, widget);
      node2.graph._version++;
    }
    pointer.finally = () => {
      if (widget.mouse) {
        const { eUp } = pointer;
        const { canvasX, canvasY } = eUp;
        widget.mouse(eUp, [canvasX - node2.pos[0], canvasY - node2.pos[1]], node2);
      }
      this.node_widget = null;
    };
  }
  /**
   * Pointer middle button click processing.  Part of {@link processMouseDown}.
   * @param e The pointerdown event
   * @param node The node to process a click event for
   */
  #processMiddleButton(e2, node2) {
    const { pointer } = this;
    if (LiteGraph.middle_click_slot_add_default_node && node2 && this.allow_interaction && !this.read_only && !this.connecting_links && !node2.flags.collapsed) {
      let mClikSlot = false;
      let mClikSlot_index = false;
      let mClikSlot_isOut = false;
      if (node2.outputs) {
        for (let i = 0, l = node2.outputs.length; i < l; ++i) {
          const output = node2.outputs[i];
          const link_pos = node2.getConnectionPos(false, i);
          if (isInRectangle(e2.canvasX, e2.canvasY, link_pos[0] - 15, link_pos[1] - 10, 30, 20)) {
            mClikSlot = output;
            mClikSlot_index = i;
            mClikSlot_isOut = true;
            break;
          }
        }
      }
      if (node2.inputs) {
        for (let i = 0, l = node2.inputs.length; i < l; ++i) {
          const input = node2.inputs[i];
          const link_pos = node2.getConnectionPos(true, i);
          if (isInRectangle(e2.canvasX, e2.canvasY, link_pos[0] - 15, link_pos[1] - 10, 30, 20)) {
            mClikSlot = input;
            mClikSlot_index = i;
            mClikSlot_isOut = false;
            break;
          }
        }
      }
      if (mClikSlot && mClikSlot_index !== false) {
        const alphaPosY = 0.5 - (mClikSlot_index + 1) / (mClikSlot_isOut ? node2.outputs.length : node2.inputs.length);
        const node_bounding = node2.getBounding();
        const posRef = [
          !mClikSlot_isOut ? node_bounding[0] : node_bounding[0] + node_bounding[2],
          e2.canvasY - 80
        ];
        pointer.onClick = () => this.createDefaultNodeForSlot({
          nodeFrom: !mClikSlot_isOut ? null : node2,
          slotFrom: !mClikSlot_isOut ? null : mClikSlot_index,
          nodeTo: !mClikSlot_isOut ? node2 : null,
          slotTo: !mClikSlot_isOut ? mClikSlot_index : null,
          position: posRef,
          nodeType: "AUTO",
          posAdd: [!mClikSlot_isOut ? -30 : 30, -alphaPosY * 130],
          posSizeFix: [!mClikSlot_isOut ? -1 : 0, 0]
        });
      }
    }
    if (this.allow_dragcanvas) {
      pointer.onDragStart = () => this.dragging_canvas = true;
      pointer.finally = () => this.dragging_canvas = false;
    }
  }
  #processDragZoom(e2) {
    if (!e2.buttons) {
      this.#dragZoomStart = null;
      return;
    }
    const deltaY = e2.y - this.#dragZoomStart.pos[1];
    const startScale = this.#dragZoomStart.scale;
    const scale = startScale - deltaY / 100;
    this.ds.changeScale(scale, this.#dragZoomStart.pos);
    this.graph.change();
  }
  /**
   * Called when a mouse move event has to be processed
   */
  processMouseMove(e2) {
    if (this.dragZoomEnabled && e2.ctrlKey && e2.shiftKey && this.#dragZoomStart) {
      this.#processDragZoom(e2);
      return;
    }
    if (this.autoresize) this.resize();
    if (this.set_canvas_dirty_on_mouse_event) this.dirty_canvas = true;
    if (!this.graph) return;
    LGraphCanvas.active_canvas = this;
    this.adjustMouseEvent(e2);
    const mouse = [e2.clientX, e2.clientY];
    this.mouse[0] = mouse[0];
    this.mouse[1] = mouse[1];
    const delta2 = [
      mouse[0] - this.last_mouse[0],
      mouse[1] - this.last_mouse[1]
    ];
    this.last_mouse = mouse;
    this.graph_mouse[0] = e2.canvasX;
    this.graph_mouse[1] = e2.canvasY;
    if (e2.isPrimary) this.pointer.move(e2);
    if (this.block_click) {
      e2.preventDefault();
      return;
    }
    e2.dragging = this.last_mouse_dragging;
    if (this.node_widget) {
      const [node22, widget] = this.node_widget;
      if (widget?.mouse) {
        const x2 = e2.canvasX - node22.pos[0];
        const y = e2.canvasY - node22.pos[1];
        const result = widget.mouse(e2, [x2, y], node22);
        if (result != null) this.dirty_canvas = result;
      }
    }
    let underPointer = CanvasItem.Nothing;
    const node2 = this.graph.getNodeOnPos(
      e2.canvasX,
      e2.canvasY,
      this.visible_nodes
    );
    const { resizingGroup } = this;
    const dragRect = this.dragging_rectangle;
    if (dragRect) {
      dragRect[2] = e2.canvasX - dragRect[0];
      dragRect[3] = e2.canvasY - dragRect[1];
      this.dirty_canvas = true;
    } else if (resizingGroup) {
      underPointer |= CanvasItem.ResizeSe | CanvasItem.Group;
    } else if (this.dragging_canvas) {
      this.ds.offset[0] += delta2[0] / this.ds.scale;
      this.ds.offset[1] += delta2[1] / this.ds.scale;
      this.#dirty();
    } else if ((this.allow_interaction || node2 && node2.flags.allow_interaction) && !this.read_only) {
      if (this.connecting_links) this.dirty_canvas = true;
      this.updateMouseOverNodes(node2, e2);
      if (node2) {
        underPointer |= CanvasItem.Node;
        if (node2.redraw_on_mouse) this.dirty_canvas = true;
        const pos = [0, 0];
        const inputId = this.isOverNodeInput(node2, e2.canvasX, e2.canvasY, pos);
        const outputId = this.isOverNodeOutput(node2, e2.canvasX, e2.canvasY, pos);
        const overWidget = this.getWidgetAtCursor(node2);
        if (!node2.mouseOver) {
          node2.mouseOver = {
            inputId: null,
            outputId: null,
            overWidget: null
          };
          this.node_over = node2;
          this.dirty_canvas = true;
          node2.onMouseEnter?.(e2);
        }
        node2.onMouseMove?.(e2, [e2.canvasX - node2.pos[0], e2.canvasY - node2.pos[1]], this);
        if (node2.mouseOver.inputId !== inputId || node2.mouseOver.outputId !== outputId || node2.mouseOver.overWidget !== overWidget) {
          node2.mouseOver.inputId = inputId;
          node2.mouseOver.outputId = outputId;
          node2.mouseOver.overWidget = overWidget;
          if (this.connecting_links?.length) {
            const firstLink = this.connecting_links[0];
            let highlightPos = null;
            let highlightInput = null;
            let linkOverWidget = null;
            if (firstLink.node === node2) ;
            else if (firstLink.output) {
              if (inputId === -1 && outputId === -1) {
                if (this.getWidgetLinkType && overWidget) {
                  const widgetLinkType = this.getWidgetLinkType(overWidget, node2);
                  if (widgetLinkType && LiteGraph.isValidConnection(firstLink.output.type, widgetLinkType)) {
                    if (firstLink.node.isValidWidgetLink?.(firstLink.output.slot_index, node2, overWidget) !== false) {
                      linkOverWidget = overWidget;
                      this.link_over_widget_type = widgetLinkType;
                    }
                  }
                }
                if (!linkOverWidget) {
                  const targetSlotId = firstLink.node.findConnectByTypeSlot(true, node2, firstLink.output.type);
                  if (targetSlotId !== null && targetSlotId >= 0) {
                    node2.getConnectionPos(true, targetSlotId, pos);
                    highlightPos = pos;
                    highlightInput = node2.inputs[targetSlotId];
                  }
                }
              } else if (inputId != -1 && node2.inputs[inputId] && LiteGraph.isValidConnection(firstLink.output.type, node2.inputs[inputId].type)) {
                if (inputId != -1 && node2.inputs[inputId] && LiteGraph.isValidConnection(firstLink.output.type, node2.inputs[inputId].type)) {
                  highlightPos = pos;
                  highlightInput = node2.inputs[inputId];
                }
              }
            } else if (firstLink.input) {
              if (inputId === -1 && outputId === -1) {
                const targetSlotId = firstLink.node.findConnectByTypeSlot(false, node2, firstLink.input.type);
                if (targetSlotId !== null && targetSlotId >= 0) {
                  node2.getConnectionPos(false, targetSlotId, pos);
                  highlightPos = pos;
                }
              } else {
                if (outputId != -1 && node2.outputs[outputId] && LiteGraph.isValidConnection(firstLink.input.type, node2.outputs[outputId].type)) {
                  highlightPos = pos;
                }
              }
            }
            this._highlight_pos = highlightPos;
            this._highlight_input = highlightInput;
            this.link_over_widget = linkOverWidget;
          }
          this.dirty_canvas = true;
        }
        if (node2.inResizeCorner(e2.canvasX, e2.canvasY)) {
          underPointer |= CanvasItem.ResizeSe;
        }
      } else {
        const segment = this.#getLinkCentreOnPos(e2);
        if (this.over_link_center !== segment) {
          underPointer |= CanvasItem.Link;
          this.over_link_center = segment;
          this.dirty_bgcanvas = true;
        }
        if (this.canvas) {
          const group = this.graph.getGroupOnPos(e2.canvasX, e2.canvasY);
          if (group && !e2.ctrlKey && !this.read_only && group.isInResize(e2.canvasX, e2.canvasY)) {
            underPointer |= CanvasItem.ResizeSe;
          }
        }
      }
      if (this.node_capturing_input && this.node_capturing_input != node2) {
        this.node_capturing_input.onMouseMove?.(
          e2,
          [
            e2.canvasX - this.node_capturing_input.pos[0],
            e2.canvasY - this.node_capturing_input.pos[1]
          ],
          this
        );
      }
      if (this.isDragging) {
        const selected = this.selectedItems;
        const allItems = e2.ctrlKey ? selected : getAllNestedItems(selected);
        const deltaX = delta2[0] / this.ds.scale;
        const deltaY = delta2[1] / this.ds.scale;
        for (const item of allItems) {
          item.move(deltaX, deltaY, true);
        }
        this.#dirty();
      }
      if (this.resizing_node) underPointer |= CanvasItem.ResizeSe;
    }
    this.hoveringOver = underPointer;
    e2.preventDefault();
    return;
  }
  /**
   * Start dragging an item, optionally including all other selected items.
   *
   * ** This function sets the {@link CanvasPointer.finally}() callback. **
   * @param item The item that the drag event started on
   * @param pointer The pointer event that initiated the drag, e.g. pointerdown
   * @param sticky If `true`, the item is added to the selection - see {@link processSelect}
   */
  #startDraggingItems(item, pointer, sticky = false) {
    this.emitBeforeChange();
    this.graph.beforeChange();
    pointer.finally = () => {
      this.isDragging = false;
      this.graph.afterChange();
      this.emitAfterChange();
    };
    this.processSelect(item, pointer.eDown, sticky);
    this.isDragging = true;
  }
  /**
   * Handles shared clean up and placement after items have been dragged.
   * @param e The event that completed the drag, e.g. pointerup, pointermove
   */
  #processDraggedItems(e2) {
    const { graph } = this;
    if (e2.shiftKey || LiteGraph.alwaysSnapToGrid)
      graph.snapToGrid(this.selectedItems);
    this.dirty_canvas = true;
    this.dirty_bgcanvas = true;
    this.onNodeMoved?.(findFirstNode(this.selectedItems));
  }
  /**
   * Called when a mouse up event has to be processed
   */
  processMouseUp(e2) {
    if (e2.isPrimary === false) return;
    const { graph, pointer } = this;
    if (!graph) return;
    LGraphCanvas.active_canvas = this;
    this.adjustMouseEvent(e2);
    const now = LiteGraph.getTime();
    e2.click_time = now - this.last_mouseclick;
    const isClick = pointer.up(e2);
    if (isClick === true) {
      pointer.isDown = false;
      pointer.isDouble = false;
      this.connecting_links = null;
      this.dragging_canvas = false;
      graph.change();
      e2.stopPropagation();
      e2.preventDefault();
      return;
    }
    this.last_mouse_dragging = false;
    this.last_click_position = null;
    this.block_click &&= false;
    if (e2.button === 0) {
      this.selected_group = null;
      this.isDragging = false;
      const x2 = e2.canvasX;
      const y = e2.canvasY;
      const node2 = graph.getNodeOnPos(x2, y, this.visible_nodes);
      if (this.connecting_links?.length) {
        const firstLink = this.connecting_links[0];
        if (node2) {
          for (const link of this.connecting_links) {
            this.#dirty();
            if (link.output) {
              const slot = this.isOverNodeInput(node2, x2, y);
              if (slot != -1) {
                link.node.connect(link.slot, node2, slot, link.afterRerouteId);
              } else if (this.link_over_widget) {
                this.emitEvent({
                  subType: "connectingWidgetLink",
                  link,
                  node: node2,
                  widget: this.link_over_widget
                });
                this.link_over_widget = null;
              } else {
                link.node.connectByType(link.slot, node2, link.output.type, {
                  afterRerouteId: link.afterRerouteId
                });
              }
            } else if (link.input) {
              const slot = this.isOverNodeOutput(node2, x2, y);
              if (slot != -1) {
                node2.connect(slot, link.node, link.slot, link.afterRerouteId);
              } else {
                link.node.connectByTypeOutput(
                  link.slot,
                  node2,
                  link.input.type,
                  { afterRerouteId: link.afterRerouteId }
                );
              }
            }
          }
        } else if (firstLink.input || firstLink.output) {
          const linkReleaseContext = firstLink.output ? {
            node_from: firstLink.node,
            slot_from: firstLink.output,
            type_filter_in: firstLink.output.type
          } : {
            node_to: firstLink.node,
            slot_from: firstLink.input,
            type_filter_out: firstLink.input.type
          };
          const linkReleaseContextExtended = {
            links: this.connecting_links
          };
          this.emitEvent({
            subType: "empty-release",
            originalEvent: e2,
            linkReleaseContext: linkReleaseContextExtended
          });
          if (LiteGraph.release_link_on_empty_shows_menu) {
            if (e2.shiftKey) {
              if (this.allow_searchbox) {
                this.showSearchBox(e2, linkReleaseContext);
              }
            } else {
              if (firstLink.output) {
                this.showConnectionMenu({ nodeFrom: firstLink.node, slotFrom: firstLink.output, e: e2 });
              } else if (firstLink.input) {
                this.showConnectionMenu({ nodeTo: firstLink.node, slotTo: firstLink.input, e: e2 });
              }
            }
          }
        }
      } else {
        this.dirty_canvas = true;
        this.node_over?.onMouseUp?.(e2, [x2 - this.node_over.pos[0], y - this.node_over.pos[1]], this);
        this.node_capturing_input?.onMouseUp?.(e2, [
          x2 - this.node_capturing_input.pos[0],
          y - this.node_capturing_input.pos[1]
        ]);
      }
      this.connecting_links = null;
    } else if (e2.button === 1) {
      this.dirty_canvas = true;
      this.dragging_canvas = false;
    } else if (e2.button === 2) {
      this.dirty_canvas = true;
    }
    pointer.isDown = false;
    pointer.isDouble = false;
    graph.change();
    e2.stopPropagation();
    e2.preventDefault();
    return;
  }
  /**
   * Called when the mouse moves off the canvas.  Clears all node hover states.
   * @param e
   */
  processMouseOut(e2) {
    this.adjustMouseEvent(e2);
    this.updateMouseOverNodes(null, e2);
  }
  processMouseCancel(e2) {
    console.warn("Pointer cancel!");
    this.pointer.reset();
  }
  /**
   * Called when a mouse wheel event has to be processed
   */
  processMouseWheel(e2) {
    if (!this.graph || !this.allow_dragcanvas) return;
    const delta2 = e2.wheelDeltaY ?? e2.detail * -60;
    this.adjustMouseEvent(e2);
    const pos = [e2.clientX, e2.clientY];
    if (this.viewport && !isPointInRect(pos, this.viewport)) return;
    let scale = this.ds.scale;
    if (delta2 > 0) scale *= this.zoom_speed;
    else if (delta2 < 0) scale *= 1 / this.zoom_speed;
    this.ds.changeScale(scale, [e2.clientX, e2.clientY]);
    this.graph.change();
    e2.preventDefault();
    return;
  }
  /**
   * returns the INDEX if a position (in graph space) is on top of a node input slot
   */
  isOverNodeInput(node2, canvasx, canvasy, slot_pos) {
    if (node2.inputs) {
      for (let i = 0, l = node2.inputs.length; i < l; ++i) {
        const input = node2.inputs[i];
        const link_pos = node2.getConnectionPos(true, i);
        let is_inside = false;
        if (node2.horizontal) {
          is_inside = isInRectangle(
            canvasx,
            canvasy,
            link_pos[0] - 5,
            link_pos[1] - 10,
            10,
            20
          );
        } else {
          const width2 = 20 + ((input.label?.length ?? input.localized_name?.length ?? input.name?.length) || 3) * 7;
          is_inside = isInRectangle(
            canvasx,
            canvasy,
            link_pos[0] - 10,
            link_pos[1] - 10,
            width2,
            20
          );
        }
        if (is_inside) {
          if (slot_pos) {
            slot_pos[0] = link_pos[0];
            slot_pos[1] = link_pos[1];
          }
          return i;
        }
      }
    }
    return -1;
  }
  /**
   * returns the INDEX if a position (in graph space) is on top of a node output slot
   */
  isOverNodeOutput(node2, canvasx, canvasy, slot_pos) {
    if (node2.outputs) {
      for (let i = 0, l = node2.outputs.length; i < l; ++i) {
        const link_pos = node2.getConnectionPos(false, i);
        let is_inside = false;
        if (node2.horizontal) {
          is_inside = isInRectangle(
            canvasx,
            canvasy,
            link_pos[0] - 5,
            link_pos[1] - 10,
            10,
            20
          );
        } else {
          is_inside = isInRectangle(
            canvasx,
            canvasy,
            link_pos[0] - 10,
            link_pos[1] - 10,
            40,
            20
          );
        }
        if (is_inside) {
          if (slot_pos) {
            slot_pos[0] = link_pos[0];
            slot_pos[1] = link_pos[1];
          }
          return i;
        }
      }
    }
    return -1;
  }
  /**
   * process a key event
   */
  processKey(e2) {
    this.#shiftDown = e2.shiftKey;
    if (!this.graph) return;
    let block_default = false;
    if (e2.target.localName == "input") return;
    if (e2.type == "keydown") {
      if (e2.keyCode == 32) {
        this.read_only = true;
        if (this._previously_dragging_canvas === null) {
          this._previously_dragging_canvas = this.dragging_canvas;
        }
        this.dragging_canvas = this.pointer.isDown;
        block_default = true;
      } else if (e2.keyCode == 27) {
        this.node_panel?.close();
        this.options_panel?.close();
        block_default = true;
      } else if (e2.keyCode == 65 && e2.ctrlKey) {
        this.selectItems();
        block_default = true;
      } else if (e2.keyCode === 67 && (e2.metaKey || e2.ctrlKey) && !e2.shiftKey) {
        if (this.selected_nodes) {
          this.copyToClipboard();
          block_default = true;
        }
      } else if (e2.keyCode === 86 && (e2.metaKey || e2.ctrlKey)) {
        this.pasteFromClipboard({ connectInputs: e2.shiftKey });
      } else if (e2.keyCode == 46 || e2.keyCode == 8) {
        if (e2.target.localName != "input" && e2.target.localName != "textarea") {
          this.deleteSelected();
          block_default = true;
        }
      }
      if (this.selected_nodes) {
        for (const i in this.selected_nodes) {
          this.selected_nodes[i].onKeyDown?.(e2);
        }
      }
    } else if (e2.type == "keyup") {
      if (e2.keyCode == 32) {
        this.read_only = false;
        this.dragging_canvas = (this._previously_dragging_canvas ?? false) && this.pointer.isDown;
        this._previously_dragging_canvas = null;
      }
      if (this.selected_nodes) {
        for (const i in this.selected_nodes) {
          this.selected_nodes[i].onKeyUp?.(e2);
        }
      }
    }
    this.graph.change();
    if (block_default) {
      e2.preventDefault();
      e2.stopImmediatePropagation();
      return false;
    }
  }
  /**
   * Copies canvas items to an internal, app-specific clipboard backed by local storage.
   * When called without parameters, it copies {@link selectedItems}.
   * @param items The items to copy.  If nullish, all selected items are copied.
   */
  copyToClipboard(items) {
    const serialisable = {
      nodes: [],
      groups: [],
      reroutes: [],
      links: []
    };
    for (const item of items ?? this.selectedItems) {
      if (item instanceof LGraphNode) {
        if (item.clonable === false) continue;
        const cloned = item.clone()?.serialize();
        if (!cloned) continue;
        cloned.id = item.id;
        serialisable.nodes.push(cloned);
        const links = item.inputs?.map((input) => this.graph._links.get(input?.link)?.asSerialisable()).filter((x2) => !!x2);
        if (!links) continue;
        serialisable.links.push(...links);
      } else if (item instanceof LGraphGroup) {
        serialisable.groups.push(item.serialize());
      } else if (this.reroutesEnabled && item instanceof Reroute) {
        serialisable.reroutes.push(item.asSerialisable());
      }
    }
    localStorage.setItem(
      "litegrapheditor_clipboard",
      JSON.stringify(serialisable)
    );
  }
  emitEvent(detail) {
    this.canvas.dispatchEvent(
      new CustomEvent("litegraph:canvas", {
        bubbles: true,
        detail
      })
    );
  }
  /** @todo Refactor to where it belongs - e.g. Deleting / creating nodes is not actually canvas event. */
  emitBeforeChange() {
    this.emitEvent({
      subType: "before-change"
    });
  }
  /** @todo See {@link emitBeforeChange} */
  emitAfterChange() {
    this.emitEvent({
      subType: "after-change"
    });
  }
  /**
   * Pastes the items from the canvas "clipbaord" - a local storage variable.
   * @param connectInputs If `true`, always attempt to connect inputs of pasted nodes - including to nodes that were not pasted.
   */
  _pasteFromClipboard(options2 = {}) {
    const {
      connectInputs = false,
      position = this.graph_mouse
    } = options2;
    if (!LiteGraph.ctrl_shift_v_paste_connect_unselected_outputs && connectInputs) return;
    const data = localStorage.getItem("litegrapheditor_clipboard");
    if (!data) return;
    const { graph } = this;
    graph.beforeChange();
    const parsed = JSON.parse(data);
    parsed.nodes ??= [];
    parsed.groups ??= [];
    parsed.reroutes ??= [];
    parsed.links ??= [];
    let offsetX = Infinity;
    let offsetY = Infinity;
    for (const item of [...parsed.nodes, ...parsed.reroutes]) {
      if (item.pos[0] < offsetX) offsetX = item.pos[0];
      if (item.pos[1] < offsetY) offsetY = item.pos[1];
    }
    if (parsed.groups) {
      for (const group of parsed.groups) {
        if (group.bounding[0] < offsetX) offsetX = group.bounding[0];
        if (group.bounding[1] < offsetY) offsetY = group.bounding[1];
      }
    }
    const results = {
      created: [],
      nodes: /* @__PURE__ */ new Map(),
      links: /* @__PURE__ */ new Map(),
      reroutes: /* @__PURE__ */ new Map()
    };
    const { created, nodes, links, reroutes } = results;
    for (const info of parsed.groups) {
      info.id = void 0;
      const group = new LGraphGroup();
      group.configure(info);
      graph.add(group);
      created.push(group);
    }
    for (const info of parsed.nodes) {
      const node2 = LiteGraph.createNode(info.type);
      if (!node2) {
        continue;
      }
      nodes.set(info.id, node2);
      info.id = void 0;
      node2.configure(info);
      graph.add(node2);
      created.push(node2);
    }
    for (const info of parsed.reroutes) {
      const { id } = info;
      info.id = void 0;
      const reroute = graph.setReroute(info);
      created.push(reroute);
      reroutes.set(id, reroute);
    }
    for (const reroute of reroutes.values()) {
      const mapped = reroutes.get(reroute.parentId);
      if (mapped) reroute.parentId = mapped.id;
    }
    for (const info of parsed.links) {
      let outNode = nodes.get(info.origin_id);
      let afterRerouteId = reroutes.get(info.parentId)?.id;
      if (connectInputs && LiteGraph.ctrl_shift_v_paste_connect_unselected_outputs) {
        outNode ??= graph.getNodeById(info.origin_id);
        afterRerouteId ??= info.parentId;
      }
      const inNode = nodes.get(info.target_id);
      if (inNode) {
        const link = outNode?.connect(
          info.origin_slot,
          inNode,
          info.target_slot,
          afterRerouteId
        );
        if (link) links.set(info.id, link);
      }
    }
    for (const reroute of reroutes.values()) {
      const ids = [...reroute.linkIds].map((x2) => links.get(x2)?.id ?? x2);
      reroute.update(reroute.parentId, void 0, ids);
      if (!reroute.validateLinks(graph.links)) graph.removeReroute(reroute.id);
    }
    for (const item of created) {
      item.pos[0] += position[0] - offsetX;
      item.pos[1] += position[1] - offsetY;
    }
    this.selectItems(created);
    graph.afterChange();
    return results;
  }
  pasteFromClipboard(options2 = {}) {
    this.emitBeforeChange();
    try {
      this._pasteFromClipboard(options2);
    } finally {
      this.emitAfterChange();
    }
  }
  /**
   * process a item drop event on top the canvas
   */
  processDrop(e2) {
    e2.preventDefault();
    this.adjustMouseEvent(e2);
    const x2 = e2.clientX;
    const y = e2.clientY;
    const is_inside = !this.viewport || isInRect(x2, y, this.viewport);
    if (!is_inside) return;
    const pos = [e2.canvasX, e2.canvasY];
    const node2 = this.graph ? this.graph.getNodeOnPos(pos[0], pos[1]) : null;
    if (!node2) {
      const r = this.onDropItem?.(e2);
      if (!r) this.checkDropItem(e2);
      return;
    }
    if (node2.onDropFile || node2.onDropData) {
      const files = e2.dataTransfer.files;
      if (files && files.length) {
        for (let i = 0; i < files.length; i++) {
          const file = e2.dataTransfer.files[0];
          const filename = file.name;
          node2.onDropFile?.(file);
          if (node2.onDropData) {
            const reader = new FileReader();
            reader.onload = function(event) {
              const data = event.target.result;
              node2.onDropData(data, filename, file);
            };
            const type = file.type.split("/")[0];
            if (type == "text" || type == "") {
              reader.readAsText(file);
            } else if (type == "image") {
              reader.readAsDataURL(file);
            } else {
              reader.readAsArrayBuffer(file);
            }
          }
        }
      }
    }
    if (node2.onDropItem?.(e2)) return true;
    return this.onDropItem ? this.onDropItem(e2) : false;
  }
  // called if the graph doesn't have a default drop item behaviour
  checkDropItem(e2) {
    if (!e2.dataTransfer.files.length) return;
    const file = e2.dataTransfer.files[0];
    const ext = LGraphCanvas.getFileExtension(file.name).toLowerCase();
    const nodetype = LiteGraph.node_types_by_file_extension[ext];
    if (!nodetype) return;
    this.graph.beforeChange();
    const node2 = LiteGraph.createNode(nodetype.type);
    node2.pos = [e2.canvasX, e2.canvasY];
    this.graph.add(node2);
    node2.onDropFile?.(file);
    this.graph.afterChange();
  }
  processNodeDblClicked(n) {
    this.onShowNodePanel?.(n);
    this.onNodeDblClicked?.(n);
    this.setDirty(true);
  }
  #handleMultiSelect(e2, dragRect) {
    const { graph, selectedItems } = this;
    const w = Math.abs(dragRect[2]);
    const h = Math.abs(dragRect[3]);
    if (dragRect[2] < 0) dragRect[0] -= w;
    if (dragRect[3] < 0) dragRect[1] -= h;
    dragRect[2] = w;
    dragRect[3] = h;
    const isSelected = [];
    const notSelected = [];
    for (const nodeX of graph._nodes) {
      if (!overlapBounding(dragRect, nodeX.boundingRect)) continue;
      if (!nodeX.selected || !selectedItems.has(nodeX))
        notSelected.push(nodeX);
      else isSelected.push(nodeX);
    }
    for (const group of graph.groups) {
      if (!containsRect(dragRect, group._bounding)) continue;
      group.recomputeInsideNodes();
      if (!group.selected || !selectedItems.has(group))
        notSelected.push(group);
      else isSelected.push(group);
    }
    for (const reroute of graph.reroutes.values()) {
      if (!isPointInRect(reroute.pos, dragRect)) continue;
      selectedItems.add(reroute);
      reroute.selected = true;
      if (!reroute.selected || !selectedItems.has(reroute))
        notSelected.push(reroute);
      else isSelected.push(reroute);
    }
    if (e2.shiftKey) {
      for (const item of notSelected) this.select(item);
    } else if (e2.altKey) {
      for (const item of isSelected) this.deselect(item);
    } else {
      for (const item of selectedItems.values()) {
        if (!isSelected.includes(item)) this.deselect(item);
      }
      for (const item of notSelected) this.select(item);
    }
  }
  /**
   * Determines whether to select or deselect an item that has received a pointer event.  Will deselect other nodes if
   * @param item Canvas item to select/deselect
   * @param e The MouseEvent to handle
   * @param sticky Prevents deselecting individual nodes (as used by aux/right-click)
   * @remarks
   * Accessibility: anyone using {@link mutli_select} always deselects when clicking empty space.
   */
  processSelect(item, e2, sticky = false) {
    const addModifier = e2?.shiftKey;
    const subtractModifier = e2 != null && (e2.metaKey || e2.ctrlKey);
    const eitherModifier = addModifier || subtractModifier;
    const modifySelection = eitherModifier || this.multi_select;
    if (!item) {
      if (!eitherModifier || this.multi_select) this.deselectAll();
    } else if (!item.selected || !this.selectedItems.has(item)) {
      if (!modifySelection) this.deselectAll(item);
      this.select(item);
    } else if (modifySelection && !sticky) {
      this.deselect(item);
    } else if (!sticky) {
      this.deselectAll(item);
    } else {
      return;
    }
    this.onSelectionChange?.(this.selected_nodes);
    this.setDirty(true);
  }
  /**
   * Selects a {@link Positionable} item.
   * @param item The canvas item to add to the selection.
   */
  select(item) {
    if (item.selected && this.selectedItems.has(item)) return;
    item.selected = true;
    this.selectedItems.add(item);
    if (!(item instanceof LGraphNode)) return;
    item.onSelected?.();
    this.selected_nodes[item.id] = item;
    this.onNodeSelected?.(item);
    item.inputs?.forEach((input) => this.highlighted_links[input.link] = true);
    item.outputs?.flatMap((x2) => x2.links).forEach((id) => this.highlighted_links[id] = true);
  }
  /**
   * Deselects a {@link Positionable} item.
   * @param item The canvas item to remove from the selection.
   */
  deselect(item) {
    if (!item.selected && !this.selectedItems.has(item)) return;
    item.selected = false;
    this.selectedItems.delete(item);
    if (!(item instanceof LGraphNode)) return;
    item.onDeselected?.();
    delete this.selected_nodes[item.id];
    this.onNodeDeselected?.(item);
    item.inputs?.forEach((input) => delete this.highlighted_links[input.link]);
    item.outputs?.flatMap((x2) => x2.links).forEach((id) => delete this.highlighted_links[id]);
  }
  /** @deprecated See {@link LGraphCanvas.processSelect} */
  processNodeSelected(item, e2) {
    this.processSelect(
      item,
      e2,
      e2 && (e2.shiftKey || e2.metaKey || e2.ctrlKey || this.multi_select)
    );
  }
  /** @deprecated See {@link LGraphCanvas.select} */
  selectNode(node2, add_to_current_selection) {
    if (node2 == null) {
      this.deselectAll();
    } else {
      this.selectNodes([node2], add_to_current_selection);
    }
  }
  get empty() {
    return this.graph.empty;
  }
  get positionableItems() {
    return this.graph.positionableItems();
  }
  /**
   * Selects several items.
   * @param items Items to select - if falsy, all items on the canvas will be selected
   * @param add_to_current_selection If set, the items will be added to the current selection instead of replacing it
   */
  selectItems(items, add_to_current_selection) {
    const itemsToSelect = items ?? this.positionableItems;
    if (!add_to_current_selection) this.deselectAll();
    for (const item of itemsToSelect) this.select(item);
    this.onSelectionChange?.(this.selected_nodes);
    this.setDirty(true);
  }
  /**
   * selects several nodes (or adds them to the current selection)
   * @deprecated See {@link LGraphCanvas.selectItems}
   */
  selectNodes(nodes, add_to_current_selection) {
    this.selectItems(nodes, add_to_current_selection);
  }
  /** @deprecated See {@link LGraphCanvas.deselect} */
  deselectNode(node2) {
    this.deselect(node2);
  }
  /**
   * Deselects all items on the canvas.
   * @param keepSelected If set, this item will not be removed from the selection.
   */
  deselectAll(keepSelected) {
    if (!this.graph) return;
    const selected = this.selectedItems;
    let wasSelected;
    for (const sel of selected) {
      if (sel === keepSelected) {
        wasSelected = sel;
        continue;
      }
      sel.onDeselected?.();
      sel.selected = false;
    }
    selected.clear();
    if (wasSelected) selected.add(wasSelected);
    this.setDirty(true);
    const oldNode = keepSelected?.id == null ? null : this.selected_nodes[keepSelected.id];
    this.selected_nodes = {};
    this.current_node = null;
    this.highlighted_links = {};
    if (keepSelected instanceof LGraphNode) {
      if (oldNode) this.selected_nodes[oldNode.id] = oldNode;
      keepSelected.inputs?.forEach((input) => this.highlighted_links[input.link] = true);
      keepSelected.outputs?.flatMap((x2) => x2.links).forEach((id) => this.highlighted_links[id] = true);
    }
    this.onSelectionChange?.(this.selected_nodes);
  }
  /** @deprecated See {@link LGraphCanvas.deselectAll} */
  deselectAllNodes() {
    this.deselectAll();
  }
  /**
   * Deletes all selected items from the graph.
   * @todo Refactor deletion task to LGraph.  Selection is a canvas property, delete is a graph action.
   */
  deleteSelected() {
    const { graph } = this;
    this.emitBeforeChange();
    graph.beforeChange();
    for (const item of this.selectedItems) {
      if (item instanceof LGraphNode) {
        const node2 = item;
        if (node2.block_delete) continue;
        node2.connectInputToOutput();
        graph.remove(node2);
        this.onNodeDeselected?.(node2);
      } else if (item instanceof LGraphGroup) {
        graph.remove(item);
      } else if (item instanceof Reroute) {
        graph.removeReroute(item.id);
      }
    }
    this.selectedItems.clear();
    this.selected_nodes = {};
    this.selectedItems.clear();
    this.current_node = null;
    this.highlighted_links = {};
    this.setDirty(true);
    graph.afterChange();
    this.emitAfterChange();
  }
  /**
   * deletes all nodes in the current selection from the graph
   * @deprecated See {@link LGraphCanvas.deleteSelected}
   */
  deleteSelectedNodes() {
    this.deleteSelected();
  }
  /**
   * centers the camera on a given node
   */
  centerOnNode(node2) {
    const dpi = window?.devicePixelRatio || 1;
    this.ds.offset[0] = -node2.pos[0] - node2.size[0] * 0.5 + this.canvas.width * 0.5 / (this.ds.scale * dpi);
    this.ds.offset[1] = -node2.pos[1] - node2.size[1] * 0.5 + this.canvas.height * 0.5 / (this.ds.scale * dpi);
    this.setDirty(true, true);
  }
  /**
   * adds some useful properties to a mouse event, like the position in graph coordinates
   */
  adjustMouseEvent(e2) {
    let clientX_rel = e2.clientX;
    let clientY_rel = e2.clientY;
    if (this.canvas) {
      const b = this.canvas.getBoundingClientRect();
      clientX_rel -= b.left;
      clientY_rel -= b.top;
    }
    e2.safeOffsetX = clientX_rel;
    e2.safeOffsetY = clientY_rel;
    if (e2.deltaX === void 0)
      e2.deltaX = clientX_rel - this.last_mouse_position[0];
    if (e2.deltaY === void 0)
      e2.deltaY = clientY_rel - this.last_mouse_position[1];
    this.last_mouse_position[0] = clientX_rel;
    this.last_mouse_position[1] = clientY_rel;
    e2.canvasX = clientX_rel / this.ds.scale - this.ds.offset[0];
    e2.canvasY = clientY_rel / this.ds.scale - this.ds.offset[1];
  }
  /**
   * changes the zoom level of the graph (default is 1), you can pass also a place used to pivot the zoom
   */
  setZoom(value, zooming_center) {
    this.ds.changeScale(value, zooming_center);
    this.#dirty();
  }
  /**
   * converts a coordinate from graph coordinates to canvas2D coordinates
   */
  convertOffsetToCanvas(pos, out) {
    return this.ds.convertOffsetToCanvas(pos, out);
  }
  /**
   * converts a coordinate from Canvas2D coordinates to graph space
   */
  convertCanvasToOffset(pos, out) {
    return this.ds.convertCanvasToOffset(pos, out);
  }
  // converts event coordinates from canvas2D to graph coordinates
  convertEventToCanvasOffset(e2) {
    const rect = this.canvas.getBoundingClientRect();
    return this.convertCanvasToOffset([
      e2.clientX - rect.left,
      e2.clientY - rect.top
    ]);
  }
  /**
   * brings a node to front (above all other nodes)
   */
  bringToFront(node2) {
    const i = this.graph._nodes.indexOf(node2);
    if (i == -1) return;
    this.graph._nodes.splice(i, 1);
    this.graph._nodes.push(node2);
  }
  /**
   * sends a node to the back (below all other nodes)
   */
  sendToBack(node2) {
    const i = this.graph._nodes.indexOf(node2);
    if (i == -1) return;
    this.graph._nodes.splice(i, 1);
    this.graph._nodes.unshift(node2);
  }
  /**
   * Determines which nodes are visible and populates {@link out} with the results.
   * @param nodes The list of nodes to check - if falsy, all nodes in the graph will be checked
   * @param out Array to write visible nodes into - if falsy, a new array is created instead
   * @returns Array passed ({@link out}), or a new array containing all visible nodes
   */
  computeVisibleNodes(nodes, out) {
    const visible_nodes = out || [];
    visible_nodes.length = 0;
    const _nodes = nodes || this.graph._nodes;
    for (const node2 of _nodes) {
      node2.updateArea();
      if (!overlapBounding(this.visible_area, node2.renderArea)) continue;
      visible_nodes.push(node2);
    }
    return visible_nodes;
  }
  /**
   * renders the whole canvas content, by rendering in two separated canvas, one containing the background grid and the connections, and one containing the nodes)
   */
  draw(force_canvas, force_bgcanvas) {
    if (!this.canvas || this.canvas.width == 0 || this.canvas.height == 0) return;
    const now = LiteGraph.getTime();
    this.render_time = (now - this.last_draw_time) * 1e-3;
    this.last_draw_time = now;
    if (this.graph) this.ds.computeVisibleArea(this.viewport);
    if (this.dirty_canvas || force_canvas)
      this.computeVisibleNodes(null, this.visible_nodes);
    if (this.dirty_bgcanvas || force_bgcanvas || this.always_render_background || this.graph?._last_trigger_time && now - this.graph._last_trigger_time < 1e3) {
      this.drawBackCanvas();
    }
    if (this.dirty_canvas || force_canvas) this.drawFrontCanvas();
    this.fps = this.render_time ? 1 / this.render_time : 0;
    this.frame++;
  }
  /**
   * draws the front canvas (the one containing all the nodes)
   */
  drawFrontCanvas() {
    this.dirty_canvas = false;
    if (!this.ctx) {
      this.ctx = this.bgcanvas.getContext("2d");
    }
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas2 = this.canvas;
    if (ctx.start2D && !this.viewport) {
      ctx.start2D();
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const area = this.viewport || this.dirty_area;
    if (area) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area[0], area[1], area[2], area[3]);
      ctx.clip();
    }
    this.#snapToGrid = this.#shiftDown || LiteGraph.alwaysSnapToGrid ? this.graph.getSnapToGridSize() : void 0;
    if (this.clear_background) {
      if (area) ctx.clearRect(area[0], area[1], area[2], area[3]);
      else ctx.clearRect(0, 0, canvas2.width, canvas2.height);
    }
    if (this.bgcanvas == this.canvas) {
      this.drawBackCanvas();
    } else {
      const scale = window.devicePixelRatio;
      ctx.drawImage(
        this.bgcanvas,
        0,
        0,
        this.bgcanvas.width / scale,
        this.bgcanvas.height / scale
      );
    }
    this.onRender?.(canvas2, ctx);
    if (this.show_info) {
      this.renderInfo(ctx, area ? area[0] : 0, area ? area[1] : 0);
    }
    if (this.graph) {
      ctx.save();
      this.ds.toCanvasContext(ctx);
      const visible_nodes = this.visible_nodes;
      const drawSnapGuides = this.#snapToGrid && this.isDragging;
      for (let i = 0; i < visible_nodes.length; ++i) {
        const node2 = visible_nodes[i];
        ctx.save();
        if (drawSnapGuides && this.selectedItems.has(node2))
          this.drawSnapGuide(ctx, node2);
        ctx.translate(node2.pos[0], node2.pos[1]);
        this.drawNode(node2, ctx);
        ctx.restore();
      }
      if (this.render_execution_order) {
        this.drawExecutionOrder(ctx);
      }
      if (this.graph.config.links_ontop) {
        this.drawConnections(ctx);
      }
      if (this.connecting_links?.length) {
        for (const link of this.connecting_links) {
          ctx.lineWidth = this.connections_width;
          let link_color = null;
          const connInOrOut = link.output || link.input;
          const connType = connInOrOut?.type;
          let connDir = connInOrOut?.dir;
          if (connDir == null) {
            if (link.output)
              connDir = link.node.horizontal ? LinkDirection.DOWN : LinkDirection.RIGHT;
            else
              connDir = link.node.horizontal ? LinkDirection.UP : LinkDirection.LEFT;
          }
          const connShape = connInOrOut?.shape;
          switch (connType) {
            case LiteGraph.EVENT:
              link_color = LiteGraph.EVENT_LINK_COLOR;
              break;
            default:
              link_color = LiteGraph.CONNECTING_LINK_COLOR;
          }
          const pos = this.graph.reroutes.get(link.afterRerouteId)?.pos ?? link.pos;
          const highlightPos = this.#getHighlightPosition();
          this.renderLink(
            ctx,
            pos,
            highlightPos,
            null,
            false,
            null,
            link_color,
            connDir,
            link.direction ?? LinkDirection.CENTER
          );
          ctx.beginPath();
          if (connType === LiteGraph.EVENT || connShape === RenderShape.BOX) {
            ctx.rect(pos[0] - 6 + 0.5, pos[1] - 5 + 0.5, 14, 10);
            ctx.fill();
            ctx.beginPath();
            ctx.rect(
              this.graph_mouse[0] - 6 + 0.5,
              this.graph_mouse[1] - 5 + 0.5,
              14,
              10
            );
          } else if (connShape === RenderShape.ARROW) {
            ctx.moveTo(pos[0] + 8, pos[1] + 0.5);
            ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5);
            ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5);
            ctx.closePath();
          } else {
            ctx.arc(pos[0], pos[1], 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.graph_mouse[0], this.graph_mouse[1], 4, 0, Math.PI * 2);
          }
          ctx.fill();
          this.#renderSnapHighlight(ctx, highlightPos);
        }
      }
      if (this.dragging_rectangle) {
        const { eDown, eMove } = this.pointer;
        ctx.strokeStyle = "#FFF";
        if (eDown && eMove) {
          const transform = ctx.getTransform();
          const ratio = window.devicePixelRatio;
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          const x2 = eDown.safeOffsetX;
          const y = eDown.safeOffsetY;
          ctx.strokeRect(x2, y, eMove.safeOffsetX - x2, eMove.safeOffsetY - y);
          ctx.setTransform(transform);
        } else {
          const [x2, y, w, h] = this.dragging_rectangle;
          ctx.strokeRect(x2, y, w, h);
        }
      }
      if (this.over_link_center && this.render_link_tooltip)
        this.drawLinkTooltip(ctx, this.over_link_center);
      else
        this.onDrawLinkTooltip?.(ctx, null);
      this.onDrawForeground?.(ctx, this.visible_area);
      ctx.restore();
    }
    this.onDrawOverlay?.(ctx);
    if (area) ctx.restore();
    if (ctx.finish2D) ctx.finish2D();
  }
  /** @returns If the pointer is over a link centre marker, the link segment it belongs to.  Otherwise, `undefined`.  */
  #getLinkCentreOnPos(e2) {
    for (const linkSegment of this.renderedPaths) {
      const centre = linkSegment._pos;
      if (!centre) continue;
      if (isInRectangle(e2.canvasX, e2.canvasY, centre[0] - 4, centre[1] - 4, 8, 8)) {
        return linkSegment;
      }
    }
  }
  /** Get the target snap / highlight point in graph space */
  #getHighlightPosition() {
    return LiteGraph.snaps_for_comfy ? this._highlight_pos ?? this.graph_mouse : this.graph_mouse;
  }
  /**
   * Renders indicators showing where a link will connect if released.
   * Partial border over target node and a highlight over the slot itself.
   * @param ctx Canvas 2D context
   */
  #renderSnapHighlight(ctx, highlightPos) {
    if (!this._highlight_pos) return;
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    const shape = this._highlight_input?.shape;
    if (shape === RenderShape.ARROW) {
      ctx.moveTo(highlightPos[0] + 8, highlightPos[1] + 0.5);
      ctx.lineTo(highlightPos[0] - 4, highlightPos[1] + 6 + 0.5);
      ctx.lineTo(highlightPos[0] - 4, highlightPos[1] - 6 + 0.5);
      ctx.closePath();
    } else {
      ctx.arc(highlightPos[0], highlightPos[1], 6, 0, Math.PI * 2);
    }
    ctx.fill();
    if (!LiteGraph.snap_highlights_node) return;
    const node2 = this.node_over;
    if (!(node2 && this.connecting_links?.[0])) return;
    const { strokeStyle, lineWidth } = ctx;
    const area = node2.boundingRect;
    const gap = 3;
    const radius = LiteGraph.ROUND_RADIUS + gap;
    const x2 = area[0] - gap;
    const y = area[1] - gap;
    const width2 = area[2] + gap * 2;
    const height = area[3] + gap * 2;
    ctx.beginPath();
    ctx.roundRect(x2, y, width2, height, radius);
    const start = this.connecting_links[0].output === null ? 0 : 1;
    const inverter = start ? -1 : 1;
    const hx = highlightPos[0];
    const hy = highlightPos[1];
    const gRadius = width2 < height ? width2 : width2 * Math.max(height / width2, 0.5);
    const gradient = ctx.createRadialGradient(hx, hy, 0, hx, hy, gRadius);
    gradient.addColorStop(1, "#00000000");
    gradient.addColorStop(0, "#ffcc00aa");
    const linearGradient = ctx.createLinearGradient(x2, y, x2 + width2, y);
    linearGradient.addColorStop(0.5, "#00000000");
    linearGradient.addColorStop(start + 0.67 * inverter, "#ddeeff33");
    linearGradient.addColorStop(start + inverter, "#ffcc0055");
    ctx.setLineDash([radius, radius * 1e-3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = linearGradient;
    ctx.stroke();
    ctx.strokeStyle = gradient;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
  }
  /**
   * draws some useful stats in the corner of the canvas
   */
  renderInfo(ctx, x2, y) {
    x2 = x2 || 10;
    y = y || this.canvas.offsetHeight - 80;
    ctx.save();
    ctx.translate(x2, y);
    ctx.font = "10px Arial";
    ctx.fillStyle = "#888";
    ctx.textAlign = "left";
    if (this.graph) {
      ctx.fillText("T: " + this.graph.globaltime.toFixed(2) + "s", 5, 13 * 1);
      ctx.fillText("I: " + this.graph.iteration, 5, 13 * 2);
      ctx.fillText("N: " + this.graph._nodes.length + " [" + this.visible_nodes.length + "]", 5, 13 * 3);
      ctx.fillText("V: " + this.graph._version, 5, 13 * 4);
      ctx.fillText("FPS:" + this.fps.toFixed(2), 5, 13 * 5);
    } else {
      ctx.fillText("No graph selected", 5, 13 * 1);
    }
    ctx.restore();
  }
  /**
   * draws the back canvas (the one containing the background and the connections)
   */
  drawBackCanvas() {
    const canvas2 = this.bgcanvas;
    if (canvas2.width != this.canvas.width || canvas2.height != this.canvas.height) {
      canvas2.width = this.canvas.width;
      canvas2.height = this.canvas.height;
    }
    if (!this.bgctx) {
      this.bgctx = this.bgcanvas.getContext("2d");
    }
    const ctx = this.bgctx;
    if (ctx.start) ctx.start();
    const viewport = this.viewport || [0, 0, ctx.canvas.width, ctx.canvas.height];
    if (this.clear_background) {
      ctx.clearRect(viewport[0], viewport[1], viewport[2], viewport[3]);
    }
    const bg_already_painted = this.onRenderBackground ? this.onRenderBackground(canvas2, ctx) : false;
    if (!this.viewport) {
      const scale = window.devicePixelRatio;
      ctx.restore();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }
    this.visible_links.length = 0;
    if (this.graph) {
      ctx.save();
      this.ds.toCanvasContext(ctx);
      if (this.ds.scale < 1.5 && !bg_already_painted && this.clear_background_color) {
        ctx.fillStyle = this.clear_background_color;
        ctx.fillRect(
          this.visible_area[0],
          this.visible_area[1],
          this.visible_area[2],
          this.visible_area[3]
        );
      }
      if (this.background_image && this.ds.scale > 0.5 && !bg_already_painted) {
        if (this.zoom_modify_alpha) {
          ctx.globalAlpha = (1 - 0.5 / this.ds.scale) * this.editor_alpha;
        } else {
          ctx.globalAlpha = this.editor_alpha;
        }
        ctx.imageSmoothingEnabled = false;
        if (!this._bg_img || this._bg_img.name != this.background_image) {
          this._bg_img = new Image();
          this._bg_img.name = this.background_image;
          this._bg_img.src = this.background_image;
          const that = this;
          this._bg_img.onload = function() {
            that.draw(true, true);
          };
        }
        let pattern = this._pattern;
        if (pattern == null && this._bg_img.width > 0) {
          pattern = ctx.createPattern(this._bg_img, "repeat");
          this._pattern_img = this._bg_img;
          this._pattern = pattern;
        }
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(
            this.visible_area[0],
            this.visible_area[1],
            this.visible_area[2],
            this.visible_area[3]
          );
          ctx.fillStyle = "transparent";
        }
        ctx.globalAlpha = 1;
        ctx.imageSmoothingEnabled = true;
      }
      if (this.graph._groups.length) {
        this.drawGroups(canvas2, ctx);
      }
      this.onDrawBackground?.(ctx, this.visible_area);
      if (this.render_canvas_border) {
        ctx.strokeStyle = "#235";
        ctx.strokeRect(0, 0, canvas2.width, canvas2.height);
      }
      if (this.render_connections_shadows) {
        ctx.shadowColor = "#000";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowColor = "rgba(0,0,0,0)";
      }
      this.drawConnections(ctx);
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.restore();
    }
    ctx.finish?.();
    this.dirty_bgcanvas = false;
    this.dirty_canvas = true;
  }
  /**
   * draws the given node inside the canvas
   */
  drawNode(node2, ctx) {
    this.current_node = node2;
    const color = node2.renderingColor;
    const bgcolor = node2.renderingBgColor;
    const low_quality = this.low_quality;
    const editor_alpha = this.editor_alpha;
    ctx.globalAlpha = editor_alpha;
    if (this.render_shadows && !low_quality) {
      ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
      ctx.shadowOffsetX = 2 * this.ds.scale;
      ctx.shadowOffsetY = 2 * this.ds.scale;
      ctx.shadowBlur = 3 * this.ds.scale;
    } else {
      ctx.shadowColor = "transparent";
    }
    if (node2.flags.collapsed && node2.onDrawCollapsed?.(ctx, this) == true)
      return;
    const shape = node2._shape || RenderShape.BOX;
    const size = LGraphCanvas.#temp_vec2;
    LGraphCanvas.#temp_vec2.set(node2.size);
    if (node2.flags.collapsed) {
      ctx.font = this.inner_text_font;
      const title = node2.getTitle ? node2.getTitle() : node2.title;
      if (title != null) {
        node2._collapsed_width = Math.min(
          node2.size[0],
          ctx.measureText(title).width + LiteGraph.NODE_TITLE_HEIGHT * 2
        );
        size[0] = node2._collapsed_width;
        size[1] = 0;
      }
    }
    if (node2.clip_area) {
      ctx.save();
      ctx.beginPath();
      if (shape == RenderShape.BOX) {
        ctx.rect(0, 0, size[0], size[1]);
      } else if (shape == RenderShape.ROUND) {
        ctx.roundRect(0, 0, size[0], size[1], [10]);
      } else if (shape == RenderShape.CIRCLE) {
        ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2);
      }
      ctx.clip();
    }
    this.drawNodeShape(
      node2,
      ctx,
      size,
      color,
      bgcolor,
      node2.selected
    );
    if (!low_quality) {
      node2.drawBadges(ctx);
    }
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = LiteGraph.NODE_BOX_OUTLINE_COLOR;
    node2.onDrawForeground?.(ctx, this, this.canvas);
    ctx.font = this.inner_text_font;
    if (!node2.collapsed) {
      const max_y = node2.drawSlots(ctx, {
        colorContext: this,
        connectingLink: this.connecting_links?.[0],
        editorAlpha: this.editor_alpha,
        lowQuality: this.low_quality
      });
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
      this.drawNodeWidgets(node2, max_y, ctx);
    } else if (this.render_collapsed_slots) {
      node2.drawCollapsedSlots(ctx);
    }
    if (node2.clip_area) {
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  /**
   * Draws the link mouseover effect and tooltip.
   * @param ctx Canvas 2D context to draw on
   * @param link The link to render the mouseover effect for
   * @remarks
   * Called against {@link LGraphCanvas.over_link_center}.
   * @todo Split tooltip from hover, so it can be drawn / eased separately
   */
  drawLinkTooltip(ctx, link) {
    const pos = link._pos;
    ctx.fillStyle = "black";
    ctx.beginPath();
    if (this.linkMarkerShape === LinkMarkerShape.Arrow) {
      const transform = ctx.getTransform();
      ctx.translate(pos[0], pos[1]);
      if (Number.isFinite(link._centreAngle)) ctx.rotate(link._centreAngle);
      ctx.moveTo(-2, -3);
      ctx.lineTo(4, 0);
      ctx.lineTo(-2, 3);
      ctx.setTransform(transform);
    } else if (this.linkMarkerShape == null || this.linkMarkerShape === LinkMarkerShape.Circle) {
      ctx.arc(pos[0], pos[1], 3, 0, Math.PI * 2);
    }
    ctx.fill();
    const data = link.data;
    if (data == null) return;
    if (this.onDrawLinkTooltip?.(ctx, link, this) == true) return;
    let text = null;
    if (typeof data === "number")
      text = data.toFixed(2);
    else if (typeof data === "string")
      text = '"' + data + '"';
    else if (typeof data === "boolean")
      text = String(data);
    else if (data.toToolTip)
      text = data.toToolTip();
    else
      text = "[" + data.constructor.name + "]";
    if (text == null) return;
    text = text.substring(0, 30);
    ctx.font = "14px Courier New";
    const info = ctx.measureText(text);
    const w = info.width + 20;
    const h = 24;
    ctx.shadowColor = "black";
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 3;
    ctx.fillStyle = "#454";
    ctx.beginPath();
    ctx.roundRect(pos[0] - w * 0.5, pos[1] - 15 - h, w, h, [3]);
    ctx.moveTo(pos[0] - 10, pos[1] - 15);
    ctx.lineTo(pos[0] + 10, pos[1] - 15);
    ctx.lineTo(pos[0], pos[1] - 5);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.textAlign = "center";
    ctx.fillStyle = "#CEC";
    ctx.fillText(text, pos[0], pos[1] - 15 - h * 0.3);
  }
  /**
   * Draws the shape of the given node on the canvas
   * @param node The node to draw
   * @param ctx 2D canvas rendering context used to draw
   * @param size Size of the background to draw, in graph units.  Differs from node size if collapsed, etc.
   * @param fgcolor Foreground colour - used for text
   * @param bgcolor Background colour of the node
   * @param selected Whether to render the node as selected.  Likely to be removed in future, as current usage is simply the selected property of the node.
   */
  drawNodeShape(node2, ctx, size, fgcolor, bgcolor, selected) {
    ctx.strokeStyle = fgcolor;
    ctx.fillStyle = LiteGraph.use_legacy_node_error_indicator ? "#F00" : bgcolor;
    const title_height = LiteGraph.NODE_TITLE_HEIGHT;
    const low_quality = this.low_quality;
    const { collapsed } = node2.flags;
    const shape = node2.renderingShape;
    const title_mode = node2.title_mode;
    const render_title = title_mode == TitleMode.TRANSPARENT_TITLE || title_mode == TitleMode.NO_TITLE ? false : true;
    const area = LGraphCanvas.#tmp_area;
    node2.measure(area);
    area[0] -= node2.pos[0];
    area[1] -= node2.pos[1];
    const old_alpha = ctx.globalAlpha;
    ctx.beginPath();
    if (shape == RenderShape.BOX || low_quality) {
      ctx.fillRect(area[0], area[1], area[2], area[3]);
    } else if (shape == RenderShape.ROUND || shape == RenderShape.CARD) {
      ctx.roundRect(
        area[0],
        area[1],
        area[2],
        area[3],
        shape == RenderShape.CARD ? [LiteGraph.ROUND_RADIUS, LiteGraph.ROUND_RADIUS, 0, 0] : [LiteGraph.ROUND_RADIUS]
      );
    } else if (shape == RenderShape.CIRCLE) {
      ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2);
    }
    ctx.fill();
    if (node2.has_errors && !LiteGraph.use_legacy_node_error_indicator) {
      strokeShape(ctx, area, {
        shape,
        title_mode,
        title_height,
        padding: 12,
        colour: LiteGraph.NODE_ERROR_COLOUR,
        collapsed,
        thickness: 10
      });
    }
    if (!collapsed && render_title) {
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(0, -1, area[2], 2);
    }
    ctx.shadowColor = "transparent";
    node2.onDrawBackground?.(ctx);
    if (render_title || title_mode == TitleMode.TRANSPARENT_TITLE) {
      node2.drawTitleBarBackground(ctx, {
        scale: this.ds.scale,
        low_quality
      });
      node2.drawTitleBox(ctx, {
        scale: this.ds.scale,
        low_quality,
        box_size: 10
      });
      ctx.globalAlpha = old_alpha;
      node2.drawTitleText(ctx, {
        scale: this.ds.scale,
        default_title_color: this.node_title_color,
        low_quality
      });
      node2.onDrawTitle?.(ctx);
    }
    if (selected) {
      node2.onBounding?.(area);
      const padding = node2.has_errors && !LiteGraph.use_legacy_node_error_indicator ? 20 : void 0;
      strokeShape(ctx, area, {
        shape,
        title_height,
        title_mode,
        padding,
        collapsed: node2.flags?.collapsed
      });
    }
    if (node2.execute_triggered > 0) node2.execute_triggered--;
    if (node2.action_triggered > 0) node2.action_triggered--;
  }
  /**
   * Draws a snap guide for a {@link Positionable} item.
   *
   * Initial design was a simple white rectangle representing the location the
   * item would land if dropped.
   * @param ctx The 2D canvas context to draw on
   * @param item The item to draw a snap guide for
   * @param shape The shape of the snap guide to draw
   * @todo Update to align snapping with boundingRect
   * @todo Shapes
   */
  drawSnapGuide(ctx, item, shape = RenderShape.ROUND) {
    const snapGuide = LGraphCanvas.#temp;
    snapGuide.set(item.boundingRect);
    const { pos } = item;
    const offsetX = pos[0] - snapGuide[0];
    const offsetY = pos[1] - snapGuide[1];
    snapGuide[0] += offsetX;
    snapGuide[1] += offsetY;
    snapPoint(snapGuide, this.#snapToGrid);
    snapGuide[0] -= offsetX;
    snapGuide[1] -= offsetY;
    const { globalAlpha } = ctx;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    const [x2, y, w, h] = snapGuide;
    if (shape === RenderShape.CIRCLE) {
      const midX = x2 + w * 0.5;
      const midY = y + h * 0.5;
      const radius = Math.min(w * 0.5, h * 0.5);
      ctx.arc(midX, midY, radius, 0, Math.PI * 2);
    } else {
      ctx.rect(x2, y, w, h);
    }
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#FFFFFF66";
    ctx.fillStyle = "#FFFFFF22";
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = globalAlpha;
  }
  drawConnections(ctx) {
    const rendered = this.renderedPaths;
    rendered.clear();
    if (this.links_render_mode === LinkRenderType.HIDDEN_LINK) return;
    const visibleReroutes = [];
    const now = LiteGraph.getTime();
    const visible_area = this.visible_area;
    LGraphCanvas.#margin_area[0] = visible_area[0] - 20;
    LGraphCanvas.#margin_area[1] = visible_area[1] - 20;
    LGraphCanvas.#margin_area[2] = visible_area[2] + 40;
    LGraphCanvas.#margin_area[3] = visible_area[3] + 40;
    ctx.lineWidth = this.connections_width;
    ctx.fillStyle = "#AAA";
    ctx.strokeStyle = "#AAA";
    ctx.globalAlpha = this.editor_alpha;
    const nodes = this.graph._nodes;
    for (let n = 0, l = nodes.length; n < l; ++n) {
      const node2 = nodes[n];
      if (!node2.inputs || !node2.inputs.length) continue;
      for (let i = 0; i < node2.inputs.length; ++i) {
        const input = node2.inputs[i];
        if (!input || input.link == null) continue;
        const link_id = input.link;
        const link = this.graph._links.get(link_id);
        if (!link) continue;
        const start_node = this.graph.getNodeById(link.origin_id);
        if (start_node == null) continue;
        const outputId = link.origin_slot;
        const start_node_slotpos = outputId == -1 ? [start_node.pos[0] + 10, start_node.pos[1] + 10] : start_node.getConnectionPos(false, outputId, LGraphCanvas.#tempA);
        const end_node_slotpos = node2.getConnectionPos(true, i, LGraphCanvas.#tempB);
        const reroutes = this.reroutesEnabled ? LLink.getReroutes(this.graph, link) : [];
        const points = [
          start_node_slotpos,
          ...reroutes.map((x2) => x2.pos),
          end_node_slotpos
        ];
        const pointsX = points.map((x2) => x2[0]);
        const pointsY = points.map((x2) => x2[1]);
        LGraphCanvas.#link_bounding[0] = Math.min(...pointsX);
        LGraphCanvas.#link_bounding[1] = Math.min(...pointsY);
        LGraphCanvas.#link_bounding[2] = Math.max(...pointsX) - LGraphCanvas.#link_bounding[0];
        LGraphCanvas.#link_bounding[3] = Math.max(...pointsY) - LGraphCanvas.#link_bounding[1];
        if (!overlapBounding(LGraphCanvas.#link_bounding, LGraphCanvas.#margin_area))
          continue;
        const start_slot = start_node.outputs[outputId];
        const end_slot = node2.inputs[i];
        if (!start_slot || !end_slot) continue;
        const start_dir = start_slot.dir || (start_node.horizontal ? LinkDirection.DOWN : LinkDirection.RIGHT);
        const end_dir = end_slot.dir || (node2.horizontal ? LinkDirection.UP : LinkDirection.LEFT);
        if (reroutes.length) {
          let startControl;
          const l2 = reroutes.length;
          for (let j = 0; j < l2; j++) {
            const reroute = reroutes[j];
            if (!rendered.has(reroute)) {
              rendered.add(reroute);
              visibleReroutes.push(reroute);
              reroute._colour = link.color || LGraphCanvas.link_type_colors[link.type] || this.default_link_color;
              const prevReroute = this.graph.reroutes.get(reroute.parentId);
              const startPos = prevReroute?.pos ?? start_node_slotpos;
              reroute.calculateAngle(this.last_draw_time, this.graph, startPos);
              this.renderLink(
                ctx,
                startPos,
                reroute.pos,
                link,
                false,
                0,
                null,
                start_dir,
                end_dir,
                {
                  startControl,
                  endControl: reroute.controlPoint,
                  reroute
                }
              );
            }
            const nextPos = reroutes[j + 1]?.pos ?? end_node_slotpos;
            const dist = Math.min(80, distance(reroute.pos, nextPos) * 0.25);
            startControl = [dist * reroute.cos, dist * reroute.sin];
          }
          this.renderLink(
            ctx,
            points.at(-2),
            points.at(-1),
            link,
            false,
            0,
            null,
            start_dir,
            end_dir,
            { startControl }
          );
        } else {
          this.renderLink(
            ctx,
            start_node_slotpos,
            end_node_slotpos,
            link,
            false,
            0,
            null,
            start_dir,
            end_dir
          );
        }
        rendered.add(link);
        if (link && link._last_time && now - link._last_time < 1e3) {
          const f = 2 - (now - link._last_time) * 2e-3;
          const tmp = ctx.globalAlpha;
          ctx.globalAlpha = tmp * f;
          this.renderLink(
            ctx,
            start_node_slotpos,
            end_node_slotpos,
            link,
            true,
            f,
            "white",
            start_dir,
            end_dir
          );
          ctx.globalAlpha = tmp;
        }
      }
    }
    for (const reroute of visibleReroutes) {
      if (this.#snapToGrid && this.isDragging && this.selectedItems.has(reroute))
        this.drawSnapGuide(ctx, reroute, RenderShape.CIRCLE);
      reroute.draw(ctx);
    }
    ctx.globalAlpha = 1;
  }
  /**
   * draws a link between two points
   * @param ctx Canvas 2D rendering context
   * @param a start pos
   * @param b end pos
   * @param link the link object with all the link info
   * @param skip_border ignore the shadow of the link
   * @param flow show flow animation (for events)
   * @param color the color for the link
   * @param start_dir the direction enum
   * @param end_dir the direction enum
   */
  renderLink(ctx, a, b, link, skip_border, flow, color, start_dir, end_dir, {
    startControl,
    endControl,
    reroute,
    num_sublines = 1
  } = {}) {
    if (link) this.visible_links.push(link);
    const linkColour = link != null && this.highlighted_links[link.id] ? "#FFF" : color || link?.color || LGraphCanvas.link_type_colors[link.type] || this.default_link_color;
    const startDir = start_dir || LinkDirection.RIGHT;
    const endDir = end_dir || LinkDirection.LEFT;
    const dist = this.links_render_mode == LinkRenderType.SPLINE_LINK && (!endControl || !startControl) ? distance(a, b) : null;
    if (this.render_connections_border && !this.low_quality) {
      ctx.lineWidth = this.connections_width + 4;
    }
    ctx.lineJoin = "round";
    num_sublines ||= 1;
    if (num_sublines > 1) ctx.lineWidth = 0.5;
    const path = new Path2D();
    const linkSegment = reroute ?? link;
    if (linkSegment) linkSegment.path = path;
    const innerA = LGraphCanvas.#lTempA;
    const innerB = LGraphCanvas.#lTempB;
    const pos = linkSegment?._pos ?? [0, 0];
    for (let i = 0; i < num_sublines; i += 1) {
      const offsety = (i - (num_sublines - 1) * 0.5) * 5;
      innerA[0] = a[0];
      innerA[1] = a[1];
      innerB[0] = b[0];
      innerB[1] = b[1];
      if (this.links_render_mode == LinkRenderType.SPLINE_LINK) {
        if (endControl) {
          innerB[0] = b[0] + endControl[0];
          innerB[1] = b[1] + endControl[1];
        } else {
          this.#addSplineOffset(innerB, endDir, dist);
        }
        if (startControl) {
          innerA[0] = a[0] + startControl[0];
          innerA[1] = a[1] + startControl[1];
        } else {
          this.#addSplineOffset(innerA, startDir, dist);
        }
        path.moveTo(a[0], a[1] + offsety);
        path.bezierCurveTo(
          innerA[0],
          innerA[1] + offsety,
          innerB[0],
          innerB[1] + offsety,
          b[0],
          b[1] + offsety
        );
        findPointOnCurve(pos, a, b, innerA, innerB, 0.5);
        if (linkSegment && this.linkMarkerShape === LinkMarkerShape.Arrow) {
          const justPastCentre = LGraphCanvas.#lTempC;
          findPointOnCurve(justPastCentre, a, b, innerA, innerB, 0.51);
          linkSegment._centreAngle = Math.atan2(
            justPastCentre[1] - pos[1],
            justPastCentre[0] - pos[0]
          );
        }
      } else if (this.links_render_mode == LinkRenderType.LINEAR_LINK) {
        const l = 15;
        switch (startDir) {
          case LinkDirection.LEFT:
            innerA[0] += -l;
            break;
          case LinkDirection.RIGHT:
            innerA[0] += l;
            break;
          case LinkDirection.UP:
            innerA[1] += -l;
            break;
          case LinkDirection.DOWN:
            innerA[1] += l;
            break;
        }
        switch (endDir) {
          case LinkDirection.LEFT:
            innerB[0] += -l;
            break;
          case LinkDirection.RIGHT:
            innerB[0] += l;
            break;
          case LinkDirection.UP:
            innerB[1] += -l;
            break;
          case LinkDirection.DOWN:
            innerB[1] += l;
            break;
        }
        path.moveTo(a[0], a[1] + offsety);
        path.lineTo(innerA[0], innerA[1] + offsety);
        path.lineTo(innerB[0], innerB[1] + offsety);
        path.lineTo(b[0], b[1] + offsety);
        pos[0] = (innerA[0] + innerB[0]) * 0.5;
        pos[1] = (innerA[1] + innerB[1]) * 0.5;
        if (linkSegment && this.linkMarkerShape === LinkMarkerShape.Arrow) {
          linkSegment._centreAngle = Math.atan2(
            innerB[1] - innerA[1],
            innerB[0] - innerA[0]
          );
        }
      } else if (this.links_render_mode == LinkRenderType.STRAIGHT_LINK) {
        if (startDir == LinkDirection.RIGHT) {
          innerA[0] += 10;
        } else {
          innerA[1] += 10;
        }
        if (endDir == LinkDirection.LEFT) {
          innerB[0] -= 10;
        } else {
          innerB[1] -= 10;
        }
        const midX = (innerA[0] + innerB[0]) * 0.5;
        path.moveTo(a[0], a[1]);
        path.lineTo(innerA[0], innerA[1]);
        path.lineTo(midX, innerA[1]);
        path.lineTo(midX, innerB[1]);
        path.lineTo(innerB[0], innerB[1]);
        path.lineTo(b[0], b[1]);
        pos[0] = midX;
        pos[1] = (innerA[1] + innerB[1]) * 0.5;
        if (linkSegment && this.linkMarkerShape === LinkMarkerShape.Arrow) {
          const diff = innerB[1] - innerA[1];
          if (Math.abs(diff) < 4) linkSegment._centreAngle = 0;
          else if (diff > 0) linkSegment._centreAngle = Math.PI * 0.5;
          else linkSegment._centreAngle = -(Math.PI * 0.5);
        }
      } else {
        return;
      }
    }
    if (this.render_connections_border && !this.low_quality && !skip_border) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.stroke(path);
    }
    ctx.lineWidth = this.connections_width;
    ctx.fillStyle = ctx.strokeStyle = linkColour;
    ctx.stroke(path);
    if (this.ds.scale >= 0.6 && this.highquality_render && linkSegment && // TODO: Re-assess this usage - likely a workaround that linkSegment truthy check resolves
    endDir != LinkDirection.CENTER) {
      if (this.render_connection_arrows) {
        const posA = this.computeConnectionPoint(a, b, 0.25, startDir, endDir);
        const posB = this.computeConnectionPoint(a, b, 0.26, startDir, endDir);
        const posC = this.computeConnectionPoint(a, b, 0.75, startDir, endDir);
        const posD = this.computeConnectionPoint(a, b, 0.76, startDir, endDir);
        let angleA = 0;
        let angleB = 0;
        if (this.render_curved_connections) {
          angleA = -Math.atan2(posB[0] - posA[0], posB[1] - posA[1]);
          angleB = -Math.atan2(posD[0] - posC[0], posD[1] - posC[1]);
        } else {
          angleB = angleA = b[1] > a[1] ? 0 : Math.PI;
        }
        const transform = ctx.getTransform();
        ctx.translate(posA[0], posA[1]);
        ctx.rotate(angleA);
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(0, 7);
        ctx.lineTo(5, -3);
        ctx.fill();
        ctx.setTransform(transform);
        ctx.translate(posC[0], posC[1]);
        ctx.rotate(angleB);
        ctx.beginPath();
        ctx.moveTo(-5, -3);
        ctx.lineTo(0, 7);
        ctx.lineTo(5, -3);
        ctx.fill();
        ctx.setTransform(transform);
      }
      ctx.beginPath();
      if (this.linkMarkerShape === LinkMarkerShape.Arrow) {
        const transform = ctx.getTransform();
        ctx.translate(pos[0], pos[1]);
        ctx.rotate(linkSegment._centreAngle);
        ctx.moveTo(-3.2, -5);
        ctx.lineTo(7, 0);
        ctx.lineTo(-3.2, 5);
        ctx.fill();
        ctx.setTransform(transform);
      } else if (this.linkMarkerShape == null || this.linkMarkerShape === LinkMarkerShape.Circle) {
        ctx.arc(pos[0], pos[1], 5, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    if (flow) {
      ctx.fillStyle = linkColour;
      for (let i = 0; i < 5; ++i) {
        const f = (LiteGraph.getTime() * 1e-3 + i * 0.2) % 1;
        const flowPos = this.computeConnectionPoint(a, b, f, startDir, endDir);
        ctx.beginPath();
        ctx.arc(flowPos[0], flowPos[1], 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
  /**
   * Finds a point along a spline represented by a to b, with spline endpoint directions dictacted by start_dir and end_dir.
   * @param a Start point
   * @param b End point
   * @param t Time: distance between points (e.g 0.25 is 25% along the line)
   * @param start_dir Spline start direction
   * @param end_dir Spline end direction
   * @returns The point at {@link t} distance along the spline a-b.
   */
  computeConnectionPoint(a, b, t, start_dir, end_dir) {
    start_dir ||= LinkDirection.RIGHT;
    end_dir ||= LinkDirection.LEFT;
    const dist = distance(a, b);
    const pa = [a[0], a[1]];
    const pb = [b[0], b[1]];
    this.#addSplineOffset(pa, start_dir, dist);
    this.#addSplineOffset(pb, end_dir, dist);
    const c1 = (1 - t) * (1 - t) * (1 - t);
    const c2 = 3 * ((1 - t) * (1 - t)) * t;
    const c3 = 3 * (1 - t) * (t * t);
    const c4 = t * t * t;
    const x2 = c1 * a[0] + c2 * pa[0] + c3 * pb[0] + c4 * b[0];
    const y = c1 * a[1] + c2 * pa[1] + c3 * pb[1] + c4 * b[1];
    return [x2, y];
  }
  /**
   * Modifies an existing point, adding a single-axis offset.
   * @param point The point to add the offset to
   * @param direction The direction to add the offset in
   * @param dist Distance to offset
   * @param factor Distance is mulitplied by this value.  Default: 0.25
   */
  #addSplineOffset(point, direction, dist, factor = 0.25) {
    switch (direction) {
      case LinkDirection.LEFT:
        point[0] += dist * -factor;
        break;
      case LinkDirection.RIGHT:
        point[0] += dist * factor;
        break;
      case LinkDirection.UP:
        point[1] += dist * -factor;
        break;
      case LinkDirection.DOWN:
        point[1] += dist * factor;
        break;
    }
  }
  drawExecutionOrder(ctx) {
    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 0.25;
    ctx.textAlign = "center";
    ctx.strokeStyle = "white";
    ctx.globalAlpha = 0.75;
    const visible_nodes = this.visible_nodes;
    for (let i = 0; i < visible_nodes.length; ++i) {
      const node2 = visible_nodes[i];
      ctx.fillStyle = "black";
      ctx.fillRect(
        node2.pos[0] - LiteGraph.NODE_TITLE_HEIGHT,
        node2.pos[1] - LiteGraph.NODE_TITLE_HEIGHT,
        LiteGraph.NODE_TITLE_HEIGHT,
        LiteGraph.NODE_TITLE_HEIGHT
      );
      if (node2.order == 0) {
        ctx.strokeRect(
          node2.pos[0] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
          node2.pos[1] - LiteGraph.NODE_TITLE_HEIGHT + 0.5,
          LiteGraph.NODE_TITLE_HEIGHT,
          LiteGraph.NODE_TITLE_HEIGHT
        );
      }
      ctx.fillStyle = "#FFF";
      ctx.fillText(
        stringOrEmpty(node2.order),
        node2.pos[0] + LiteGraph.NODE_TITLE_HEIGHT * -0.5,
        node2.pos[1] - 6
      );
    }
    ctx.globalAlpha = 1;
  }
  /**
   * draws the widgets stored inside a node
   * @deprecated Use {@link LGraphNode.drawWidgets} instead.
   * @note Currently there are extensions hijacking this function, so we cannot remove it.
   */
  drawNodeWidgets(node2, posY, ctx) {
    node2.drawWidgets(ctx, {
      y: posY,
      colorContext: this,
      linkOverWidget: this.link_over_widget,
      linkOverWidgetType: this.link_over_widget_type,
      lowQuality: this.low_quality,
      editorAlpha: this.editor_alpha
    });
  }
  /**
   * draws every group area in the background
   */
  drawGroups(canvas2, ctx) {
    if (!this.graph) return;
    const groups = this.graph._groups;
    ctx.save();
    ctx.globalAlpha = 0.5 * this.editor_alpha;
    const drawSnapGuides = this.#snapToGrid && this.isDragging;
    for (let i = 0; i < groups.length; ++i) {
      const group = groups[i];
      if (!overlapBounding(this.visible_area, group._bounding)) {
        continue;
      }
      if (drawSnapGuides && this.selectedItems.has(group))
        this.drawSnapGuide(ctx, group);
      group.draw(this, ctx);
    }
    ctx.restore();
  }
  adjustNodesSize() {
    const nodes = this.graph._nodes;
    for (let i = 0; i < nodes.length; ++i) {
      nodes[i].size = nodes[i].computeSize();
    }
    this.setDirty(true, true);
  }
  /**
   * resizes the canvas to a given size, if no size is passed, then it tries to fill the parentNode
   * @todo Remove or rewrite
   */
  resize(width2, height) {
    if (!width2 && !height) {
      const parent = this.canvas.parentElement;
      width2 = parent.offsetWidth;
      height = parent.offsetHeight;
    }
    if (this.canvas.width == width2 && this.canvas.height == height) return;
    this.canvas.width = width2;
    this.canvas.height = height;
    this.bgcanvas.width = this.canvas.width;
    this.bgcanvas.height = this.canvas.height;
    this.setDirty(true, true);
  }
  onNodeSelectionChange() {
  }
  /**
   * Determines the furthest nodes in each direction for the currently selected nodes
   */
  boundaryNodesForSelection() {
    return LGraphCanvas.getBoundaryNodes(this.selected_nodes);
  }
  showLinkMenu(segment, e2) {
    const { graph } = this;
    const node_left = graph.getNodeById(segment.origin_id);
    const fromType = node_left?.outputs?.[segment.origin_slot]?.type ?? "*";
    const options2 = ["Add Node", null, "Delete", null];
    if (this.reroutesEnabled) options2.splice(1, 0, "Add Reroute");
    const title = "data" in segment && segment.data != null ? segment.data.constructor.name : null;
    const menu = new LiteGraph.ContextMenu(options2, {
      event: e2,
      title,
      callback: inner_clicked.bind(this)
    });
    function inner_clicked(v2, options22, e22) {
      switch (v2) {
        case "Add Node":
          LGraphCanvas.onMenuAdd(null, null, e22, menu, function(node2) {
            if (!node2.inputs?.length || !node2.outputs?.length) return;
            const options3 = this.reroutesEnabled ? { afterRerouteId: segment.parentId } : void 0;
            if (node_left.connectByType(segment.origin_slot, node2, fromType, options3)) {
              node2.pos[0] -= node2.size[0] * 0.5;
            }
          });
          break;
        case "Add Reroute": {
          this.adjustMouseEvent(e22);
          graph.createReroute([e22.canvasX, e22.canvasY], segment);
          this.setDirty(false, true);
          break;
        }
        case "Delete":
          graph.removeLink(segment.id);
          break;
      }
    }
    return false;
  }
  createDefaultNodeForSlot(optPass) {
    const opts = Object.assign({
      nodeFrom: null,
      slotFrom: null,
      nodeTo: null,
      slotTo: null,
      position: [0, 0],
      nodeType: null,
      posAdd: [0, 0],
      posSizeFix: [0, 0]
    }, optPass || {});
    const { afterRerouteId } = opts;
    const isFrom = opts.nodeFrom && opts.slotFrom !== null;
    const isTo = !isFrom && opts.nodeTo && opts.slotTo !== null;
    if (!isFrom && !isTo) {
      console.warn("No data passed to createDefaultNodeForSlot " + opts.nodeFrom + " " + opts.slotFrom + " " + opts.nodeTo + " " + opts.slotTo);
      return false;
    }
    if (!opts.nodeType) {
      console.warn("No type to createDefaultNodeForSlot");
      return false;
    }
    const nodeX = isFrom ? opts.nodeFrom : opts.nodeTo;
    let slotX = isFrom ? opts.slotFrom : opts.slotTo;
    let iSlotConn = false;
    switch (typeof slotX) {
      case "string":
        iSlotConn = isFrom ? nodeX.findOutputSlot(slotX, false) : nodeX.findInputSlot(slotX, false);
        slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
        break;
      case "object":
        iSlotConn = isFrom ? nodeX.findOutputSlot(slotX.name) : nodeX.findInputSlot(slotX.name);
        break;
      case "number":
        iSlotConn = slotX;
        slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
        break;
      case "undefined":
      default:
        console.warn("Cant get slot information " + slotX);
        return false;
    }
    const fromSlotType = slotX.type == LiteGraph.EVENT ? "_event_" : slotX.type;
    const slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
    if (slotTypesDefault?.[fromSlotType]) {
      let nodeNewType = false;
      if (typeof slotTypesDefault[fromSlotType] == "object") {
        for (const typeX in slotTypesDefault[fromSlotType]) {
          if (opts.nodeType == slotTypesDefault[fromSlotType][typeX] || opts.nodeType == "AUTO") {
            nodeNewType = slotTypesDefault[fromSlotType][typeX];
            break;
          }
        }
      } else if (opts.nodeType == slotTypesDefault[fromSlotType] || opts.nodeType == "AUTO") {
        nodeNewType = slotTypesDefault[fromSlotType];
      }
      if (nodeNewType) {
        let nodeNewOpts = false;
        if (typeof nodeNewType == "object" && nodeNewType.node) {
          nodeNewOpts = nodeNewType;
          nodeNewType = nodeNewType.node;
        }
        const newNode = LiteGraph.createNode(nodeNewType);
        if (newNode) {
          if (nodeNewOpts) {
            if (nodeNewOpts.properties) {
              for (const i in nodeNewOpts.properties) {
                newNode.addProperty(i, nodeNewOpts.properties[i]);
              }
            }
            if (nodeNewOpts.inputs) {
              newNode.inputs = [];
              for (const i in nodeNewOpts.inputs) {
                newNode.addOutput(
                  nodeNewOpts.inputs[i][0],
                  nodeNewOpts.inputs[i][1]
                );
              }
            }
            if (nodeNewOpts.outputs) {
              newNode.outputs = [];
              for (const i in nodeNewOpts.outputs) {
                newNode.addOutput(
                  nodeNewOpts.outputs[i][0],
                  nodeNewOpts.outputs[i][1]
                );
              }
            }
            if (nodeNewOpts.title) {
              newNode.title = nodeNewOpts.title;
            }
            if (nodeNewOpts.json) {
              newNode.configure(nodeNewOpts.json);
            }
          }
          this.graph.add(newNode);
          newNode.pos = [
            opts.position[0] + opts.posAdd[0] + (opts.posSizeFix[0] ? opts.posSizeFix[0] * newNode.size[0] : 0),
            opts.position[1] + opts.posAdd[1] + (opts.posSizeFix[1] ? opts.posSizeFix[1] * newNode.size[1] : 0)
          ];
          if (isFrom) {
            opts.nodeFrom.connectByType(iSlotConn, newNode, fromSlotType, { afterRerouteId });
          } else {
            opts.nodeTo.connectByTypeOutput(iSlotConn, newNode, fromSlotType, { afterRerouteId });
          }
          return true;
        }
        console.log("failed creating " + nodeNewType);
      }
    }
    return false;
  }
  showConnectionMenu(optPass) {
    const opts = Object.assign({
      nodeFrom: null,
      slotFrom: null,
      nodeTo: null,
      slotTo: null,
      e: null,
      allow_searchbox: this.allow_searchbox,
      showSearchBox: this.showSearchBox
    }, optPass || {});
    const that = this;
    const { afterRerouteId } = opts;
    const isFrom = opts.nodeFrom && opts.slotFrom;
    const isTo = !isFrom && opts.nodeTo && opts.slotTo;
    if (!isFrom && !isTo) {
      console.warn("No data passed to showConnectionMenu");
      return;
    }
    const nodeX = isFrom ? opts.nodeFrom : opts.nodeTo;
    let slotX = isFrom ? opts.slotFrom : opts.slotTo;
    let iSlotConn;
    switch (typeof slotX) {
      case "string":
        iSlotConn = isFrom ? nodeX.findOutputSlot(slotX, false) : nodeX.findInputSlot(slotX, false);
        slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
        break;
      case "object":
        iSlotConn = isFrom ? nodeX.findOutputSlot(slotX.name) : nodeX.findInputSlot(slotX.name);
        break;
      case "number":
        iSlotConn = slotX;
        slotX = isFrom ? nodeX.outputs[slotX] : nodeX.inputs[slotX];
        break;
      default:
        console.warn("Cant get slot information " + slotX);
        return;
    }
    const options2 = ["Add Node", null];
    if (opts.allow_searchbox) {
      options2.push("Search");
      options2.push(null);
    }
    const fromSlotType = slotX.type == LiteGraph.EVENT ? "_event_" : slotX.type;
    const slotTypesDefault = isFrom ? LiteGraph.slot_types_default_out : LiteGraph.slot_types_default_in;
    if (slotTypesDefault?.[fromSlotType]) {
      if (typeof slotTypesDefault[fromSlotType] == "object") {
        for (const typeX in slotTypesDefault[fromSlotType]) {
          options2.push(slotTypesDefault[fromSlotType][typeX]);
        }
      } else {
        options2.push(slotTypesDefault[fromSlotType]);
      }
    }
    const menu = new LiteGraph.ContextMenu(options2, {
      event: opts.e,
      title: (slotX && slotX.name != "" ? slotX.name + (fromSlotType ? " | " : "") : "") + (slotX && fromSlotType ? fromSlotType : ""),
      callback: inner_clicked
    });
    function inner_clicked(v2, options22, e2) {
      switch (v2) {
        case "Add Node":
          LGraphCanvas.onMenuAdd(null, null, e2, menu, function(node2) {
            if (isFrom) {
              opts.nodeFrom.connectByType(iSlotConn, node2, fromSlotType, { afterRerouteId });
            } else {
              opts.nodeTo.connectByTypeOutput(iSlotConn, node2, fromSlotType, { afterRerouteId });
            }
          });
          break;
        case "Search":
          if (isFrom) {
            opts.showSearchBox(e2, { node_from: opts.nodeFrom, slot_from: slotX, type_filter_in: fromSlotType });
          } else {
            opts.showSearchBox(e2, { node_to: opts.nodeTo, slot_from: slotX, type_filter_out: fromSlotType });
          }
          break;
        default: {
          that.createDefaultNodeForSlot(Object.assign(opts, {
            position: [opts.e.canvasX, opts.e.canvasY],
            nodeType: v2,
            afterRerouteId
          }));
          break;
        }
      }
    }
  }
  // refactor: there are different dialogs, some uses createDialog some dont
  prompt(title, value, callback, event, multiline) {
    const that = this;
    title = title || "";
    const dialog = document.createElement("div");
    dialog.is_modified = false;
    dialog.className = "graphdialog rounded";
    dialog.innerHTML = multiline ? "<span class='name'></span> <textarea autofocus class='value'></textarea><button class='rounded'>OK</button>" : "<span class='name'></span> <input autofocus type='text' class='value'/><button class='rounded'>OK</button>";
    dialog.close = function() {
      that.prompt_box = null;
      if (dialog.parentNode) {
        dialog.parentNode.removeChild(dialog);
      }
    };
    const graphcanvas = LGraphCanvas.active_canvas;
    const canvas2 = graphcanvas.canvas;
    canvas2.parentNode.appendChild(dialog);
    if (this.ds.scale > 1) dialog.style.transform = "scale(" + this.ds.scale + ")";
    let dialogCloseTimer = null;
    let prevent_timeout = 0;
    LiteGraph.pointerListenerAdd(dialog, "leave", function() {
      if (prevent_timeout) return;
      if (LiteGraph.dialog_close_on_mouse_leave) {
        if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
          dialogCloseTimer = setTimeout(
            dialog.close,
            LiteGraph.dialog_close_on_mouse_leave_delay
          );
      }
    });
    LiteGraph.pointerListenerAdd(dialog, "enter", function() {
      if (LiteGraph.dialog_close_on_mouse_leave && dialogCloseTimer)
        clearTimeout(dialogCloseTimer);
    });
    const selInDia = dialog.querySelectorAll("select");
    if (selInDia) {
      for (const selIn of selInDia) {
        selIn.addEventListener("click", function() {
          prevent_timeout++;
        });
        selIn.addEventListener("blur", function() {
          prevent_timeout = 0;
        });
        selIn.addEventListener("change", function() {
          prevent_timeout = -1;
        });
      }
    }
    this.prompt_box?.close();
    this.prompt_box = dialog;
    const name_element = dialog.querySelector(".name");
    name_element.innerText = title;
    const value_element = dialog.querySelector(".value");
    value_element.value = value;
    value_element.select();
    const input = value_element;
    input.addEventListener("keydown", function(e2) {
      dialog.is_modified = true;
      if (e2.keyCode == 27) {
        dialog.close();
      } else if (e2.keyCode == 13 && e2.target.localName != "textarea") {
        if (callback) {
          callback(this.value);
        }
        dialog.close();
      } else {
        return;
      }
      e2.preventDefault();
      e2.stopPropagation();
    });
    const button = dialog.querySelector("button");
    button.addEventListener("click", function() {
      callback?.(input.value);
      that.setDirty(true);
      dialog.close();
    });
    const rect = canvas2.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
      offsetx -= rect.left;
      offsety -= rect.top;
    }
    if (event) {
      dialog.style.left = event.clientX + offsetx + "px";
      dialog.style.top = event.clientY + offsety + "px";
    } else {
      dialog.style.left = canvas2.width * 0.5 + offsetx + "px";
      dialog.style.top = canvas2.height * 0.5 + offsety + "px";
    }
    setTimeout(function() {
      input.focus();
      const clickTime = Date.now();
      function handleOutsideClick(e2) {
        if (e2.target === canvas2 && Date.now() - clickTime > 256) {
          dialog.close();
          canvas2.parentNode.removeEventListener("click", handleOutsideClick);
          canvas2.parentNode.removeEventListener("touchend", handleOutsideClick);
        }
      }
      canvas2.parentNode.addEventListener("click", handleOutsideClick);
      canvas2.parentNode.addEventListener("touchend", handleOutsideClick);
    }, 10);
    return dialog;
  }
  showSearchBox(event, options2) {
    const def_options = {
      slot_from: null,
      node_from: null,
      node_to: null,
      do_type_filter: LiteGraph.search_filter_enabled,
      // TODO check for registered_slot_[in/out]_types not empty // this will be checked for functionality enabled : filter on slot type, in and out
      // @ts-expect-error
      type_filter_in: false,
      // these are default: pass to set initially set values
      type_filter_out: false,
      show_general_if_none_on_typefilter: true,
      show_general_after_typefiltered: true,
      hide_on_mouse_leave: LiteGraph.search_hide_on_mouse_leave,
      show_all_if_empty: true,
      show_all_on_open: LiteGraph.search_show_all_on_open
    };
    options2 = Object.assign(def_options, options2 || {});
    const that = this;
    const graphcanvas = LGraphCanvas.active_canvas;
    const canvas2 = graphcanvas.canvas;
    const root_document = canvas2.ownerDocument || document;
    const dialog = document.createElement("div");
    dialog.className = "litegraph litesearchbox graphdialog rounded";
    dialog.innerHTML = "<span class='name'>Search</span> <input autofocus type='text' class='value rounded'/>";
    if (options2.do_type_filter) {
      dialog.innerHTML += "<select class='slot_in_type_filter'><option value=''></option></select>";
      dialog.innerHTML += "<select class='slot_out_type_filter'><option value=''></option></select>";
    }
    dialog.innerHTML += "<div class='helper'></div>";
    if (root_document.fullscreenElement)
      root_document.fullscreenElement.appendChild(dialog);
    else {
      root_document.body.appendChild(dialog);
      root_document.body.style.overflow = "hidden";
    }
    let selIn;
    let selOut;
    if (options2.do_type_filter) {
      selIn = dialog.querySelector(".slot_in_type_filter");
      selOut = dialog.querySelector(".slot_out_type_filter");
    }
    dialog.close = function() {
      that.search_box = null;
      this.blur();
      canvas2.focus();
      root_document.body.style.overflow = "";
      setTimeout(function() {
        that.canvas.focus();
      }, 20);
      dialog.parentNode?.removeChild(dialog);
    };
    if (this.ds.scale > 1) {
      dialog.style.transform = "scale(" + this.ds.scale + ")";
    }
    if (options2.hide_on_mouse_leave) {
      let prevent_timeout = false;
      let timeout_close = null;
      LiteGraph.pointerListenerAdd(dialog, "enter", function() {
        if (timeout_close) {
          clearTimeout(timeout_close);
          timeout_close = null;
        }
      });
      LiteGraph.pointerListenerAdd(dialog, "leave", function() {
        if (prevent_timeout)
          return;
        timeout_close = setTimeout(function() {
          dialog.close();
        }, typeof options2.hide_on_mouse_leave === "number" ? options2.hide_on_mouse_leave : 500);
      });
      if (options2.do_type_filter) {
        selIn.addEventListener("click", function() {
          prevent_timeout++;
        });
        selIn.addEventListener("blur", function() {
          prevent_timeout = 0;
        });
        selIn.addEventListener("change", function() {
          prevent_timeout = -1;
        });
        selOut.addEventListener("click", function() {
          prevent_timeout++;
        });
        selOut.addEventListener("blur", function() {
          prevent_timeout = 0;
        });
        selOut.addEventListener("change", function() {
          prevent_timeout = -1;
        });
      }
    }
    that.search_box?.close();
    that.search_box = dialog;
    const helper = dialog.querySelector(".helper");
    let first = null;
    let timeout = null;
    let selected = null;
    const input = dialog.querySelector("input");
    if (input) {
      input.addEventListener("blur", function() {
        this.focus();
      });
      input.addEventListener("keydown", function(e2) {
        if (e2.keyCode == 38) {
          changeSelection(false);
        } else if (e2.keyCode == 40) {
          changeSelection(true);
        } else if (e2.keyCode == 27) {
          dialog.close();
        } else if (e2.keyCode == 13) {
          if (selected) {
            select(unescape(selected.dataset["type"]));
          } else if (first) {
            select(first);
          } else {
            dialog.close();
          }
        } else {
          if (timeout) {
            clearInterval(timeout);
          }
          timeout = setTimeout(refreshHelper, 10);
          return;
        }
        e2.preventDefault();
        e2.stopPropagation();
        e2.stopImmediatePropagation();
        return true;
      });
    }
    if (options2.do_type_filter) {
      if (selIn) {
        const aSlots = LiteGraph.slot_types_in;
        const nSlots = aSlots.length;
        if (options2.type_filter_in == LiteGraph.EVENT || options2.type_filter_in == LiteGraph.ACTION)
          options2.type_filter_in = "_event_";
        for (let iK = 0; iK < nSlots; iK++) {
          const opt = document.createElement("option");
          opt.value = aSlots[iK];
          opt.innerHTML = aSlots[iK];
          selIn.appendChild(opt);
          if (
            // @ts-expect-error
            options2.type_filter_in !== false && (options2.type_filter_in + "").toLowerCase() == (aSlots[iK] + "").toLowerCase()
          ) {
            opt.selected = true;
          }
        }
        selIn.addEventListener("change", function() {
          refreshHelper();
        });
      }
      if (selOut) {
        const aSlots = LiteGraph.slot_types_out;
        const nSlots = aSlots.length;
        if (options2.type_filter_out == LiteGraph.EVENT || options2.type_filter_out == LiteGraph.ACTION)
          options2.type_filter_out = "_event_";
        for (let iK = 0; iK < nSlots; iK++) {
          const opt = document.createElement("option");
          opt.value = aSlots[iK];
          opt.innerHTML = aSlots[iK];
          selOut.appendChild(opt);
          if (options2.type_filter_out !== false && (options2.type_filter_out + "").toLowerCase() == (aSlots[iK] + "").toLowerCase())
            opt.selected = true;
        }
        selOut.addEventListener("change", function() {
          refreshHelper();
        });
      }
    }
    const rect = canvas2.getBoundingClientRect();
    const left = (event ? event.clientX : rect.left + rect.width * 0.5) - 80;
    const top = (event ? event.clientY : rect.top + rect.height * 0.5) - 20;
    dialog.style.left = left + "px";
    dialog.style.top = top + "px";
    if (event.layerY > rect.height - 200)
      helper.style.maxHeight = rect.height - event.layerY - 20 + "px";
    requestAnimationFrame(function() {
      input.focus();
    });
    if (options2.show_all_on_open) refreshHelper();
    function select(name) {
      if (name) {
        if (that.onSearchBoxSelection) {
          that.onSearchBoxSelection(name, event, graphcanvas);
        } else {
          const extra = LiteGraph.searchbox_extras[name.toLowerCase()];
          if (extra) name = extra.type;
          graphcanvas.graph.beforeChange();
          const node2 = LiteGraph.createNode(name);
          if (node2) {
            node2.pos = graphcanvas.convertEventToCanvasOffset(event);
            graphcanvas.graph.add(node2, false);
          }
          if (extra?.data) {
            if (extra.data.properties) {
              for (const i in extra.data.properties) {
                node2.addProperty(i, extra.data.properties[i]);
              }
            }
            if (extra.data.inputs) {
              node2.inputs = [];
              for (const i in extra.data.inputs) {
                node2.addOutput(
                  extra.data.inputs[i][0],
                  extra.data.inputs[i][1]
                );
              }
            }
            if (extra.data.outputs) {
              node2.outputs = [];
              for (const i in extra.data.outputs) {
                node2.addOutput(
                  extra.data.outputs[i][0],
                  extra.data.outputs[i][1]
                );
              }
            }
            if (extra.data.title) {
              node2.title = extra.data.title;
            }
            if (extra.data.json) {
              node2.configure(extra.data.json);
            }
          }
          if (options2.node_from) {
            let iS = false;
            switch (typeof options2.slot_from) {
              case "string":
                iS = options2.node_from.findOutputSlot(options2.slot_from);
                break;
              case "object":
                iS = options2.slot_from.name ? options2.node_from.findOutputSlot(options2.slot_from.name) : -1;
                if (iS == -1 && typeof options2.slot_from.slot_index !== "undefined") iS = options2.slot_from.slot_index;
                break;
              case "number":
                iS = options2.slot_from;
                break;
              default:
                iS = 0;
            }
            if (typeof options2.node_from.outputs[iS] !== "undefined") {
              if (iS !== false && iS > -1) {
                options2.node_from.connectByType(iS, node2, options2.node_from.outputs[iS].type);
              }
            }
          }
          if (options2.node_to) {
            let iS = false;
            switch (typeof options2.slot_from) {
              case "string":
                iS = options2.node_to.findInputSlot(options2.slot_from);
                break;
              case "object":
                iS = options2.slot_from.name ? options2.node_to.findInputSlot(options2.slot_from.name) : -1;
                if (iS == -1 && typeof options2.slot_from.slot_index !== "undefined") iS = options2.slot_from.slot_index;
                break;
              case "number":
                iS = options2.slot_from;
                break;
              default:
                iS = 0;
            }
            if (typeof options2.node_to.inputs[iS] !== "undefined") {
              if (iS !== false && iS > -1) {
                options2.node_to.connectByTypeOutput(iS, node2, options2.node_to.inputs[iS].type);
              }
            }
          }
          graphcanvas.graph.afterChange();
        }
      }
      dialog.close();
    }
    function changeSelection(forward) {
      const prev = selected;
      if (!selected) {
        selected = forward ? helper.childNodes[0] : helper.childNodes[helper.childNodes.length];
      } else {
        selected.classList.remove("selected");
        selected = forward ? selected.nextSibling : selected.previousSibling;
        selected ||= prev;
      }
      if (!selected) return;
      selected.classList.add("selected");
      selected.scrollIntoView({ block: "end", behavior: "smooth" });
    }
    function refreshHelper() {
      timeout = null;
      let str = input.value;
      first = null;
      helper.innerHTML = "";
      if (!str && !options2.show_all_if_empty) return;
      if (that.onSearchBox) {
        const list = that.onSearchBox(helper, str, graphcanvas);
        if (list) {
          for (let i = 0; i < list.length; ++i) {
            addResult(list[i]);
          }
        }
      } else {
        let inner_test_filter = function(type, optsIn) {
          optsIn = optsIn || {};
          const optsDef = {
            skipFilter: false,
            inTypeOverride: false,
            outTypeOverride: false
          };
          const opts = Object.assign(optsDef, optsIn);
          const ctor = LiteGraph.registered_node_types[type];
          if (filter && ctor.filter != filter) return false;
          if ((!options2.show_all_if_empty || str) && type.toLowerCase().indexOf(str) === -1 && (!ctor.title || ctor.title.toLowerCase().indexOf(str) === -1))
            return false;
          if (options2.do_type_filter && !opts.skipFilter) {
            const sType = type;
            let sV = opts.inTypeOverride !== false ? opts.inTypeOverride : sIn.value;
            if (sIn && sV && LiteGraph.registered_slot_in_types[sV]?.nodes) {
              const doesInc = LiteGraph.registered_slot_in_types[sV].nodes.includes(sType);
              if (doesInc === false) return false;
            }
            sV = sOut.value;
            if (opts.outTypeOverride !== false) sV = opts.outTypeOverride;
            if (sOut && sV && LiteGraph.registered_slot_out_types[sV]?.nodes) {
              const doesInc = LiteGraph.registered_slot_out_types[sV].nodes.includes(sType);
              if (doesInc === false) return false;
            }
          }
          return true;
        };
        let c = 0;
        str = str.toLowerCase();
        const filter = graphcanvas.filter || graphcanvas.graph.filter;
        let sIn = false;
        let sOut = false;
        if (options2.do_type_filter && that.search_box) {
          sIn = that.search_box.querySelector(".slot_in_type_filter");
          sOut = that.search_box.querySelector(".slot_out_type_filter");
        }
        for (const i in LiteGraph.searchbox_extras) {
          const extra = LiteGraph.searchbox_extras[i];
          if ((!options2.show_all_if_empty || str) && extra.desc.toLowerCase().indexOf(str) === -1)
            continue;
          const ctor = LiteGraph.registered_node_types[extra.type];
          if (ctor && ctor.filter != filter) continue;
          if (!inner_test_filter(extra.type)) continue;
          addResult(extra.desc, "searchbox_extra");
          if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit) {
            break;
          }
        }
        let filtered = null;
        if (Array.prototype.filter) {
          const keys = Object.keys(LiteGraph.registered_node_types);
          filtered = keys.filter(inner_test_filter);
        } else {
          filtered = [];
          for (const i in LiteGraph.registered_node_types) {
            if (inner_test_filter(i)) filtered.push(i);
          }
        }
        for (let i = 0; i < filtered.length; i++) {
          addResult(filtered[i]);
          if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit)
            break;
        }
        if (options2.show_general_after_typefiltered && (sIn.value || sOut.value)) {
          filtered_extra = [];
          for (const i in LiteGraph.registered_node_types) {
            if (inner_test_filter(i, {
              inTypeOverride: sIn && sIn.value ? "*" : false,
              outTypeOverride: sOut && sOut.value ? "*" : false
            }))
              filtered_extra.push(i);
          }
          for (let i = 0; i < filtered_extra.length; i++) {
            addResult(filtered_extra[i], "generic_type");
            if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit)
              break;
          }
        }
        if ((sIn.value || sOut.value) && helper.childNodes.length == 0 && options2.show_general_if_none_on_typefilter) {
          filtered_extra = [];
          for (const i in LiteGraph.registered_node_types) {
            if (inner_test_filter(i, { skipFilter: true }))
              filtered_extra.push(i);
          }
          for (let i = 0; i < filtered_extra.length; i++) {
            addResult(filtered_extra[i], "not_in_filter");
            if (LGraphCanvas.search_limit !== -1 && c++ > LGraphCanvas.search_limit)
              break;
          }
        }
      }
      function addResult(type, className) {
        const help = document.createElement("div");
        first ||= type;
        const nodeType = LiteGraph.registered_node_types[type];
        if (nodeType?.title) {
          help.innerText = nodeType?.title;
          const typeEl = document.createElement("span");
          typeEl.className = "litegraph lite-search-item-type";
          typeEl.textContent = type;
          help.append(typeEl);
        } else {
          help.innerText = type;
        }
        help.dataset["type"] = escape(type);
        help.className = "litegraph lite-search-item";
        if (className) {
          help.className += " " + className;
        }
        help.addEventListener("click", function() {
          select(unescape(this.dataset["type"]));
        });
        helper.appendChild(help);
      }
    }
    return dialog;
  }
  showEditPropertyValue(node2, property, options2) {
    if (!node2 || node2.properties[property] === void 0) return;
    options2 = options2 || {};
    const info = node2.getPropertyInfo(property);
    const type = info.type;
    let input_html = "";
    if (type == "string" || type == "number" || type == "array" || type == "object") {
      input_html = "<input autofocus type='text' class='value'/>";
    } else if ((type == "enum" || type == "combo") && info.values) {
      input_html = "<select autofocus type='text' class='value'>";
      for (const i in info.values) {
        const v2 = Array.isArray(info.values) ? info.values[i] : i;
        input_html += "<option value='" + v2 + "' " + (v2 == node2.properties[property] ? "selected" : "") + ">" + info.values[i] + "</option>";
      }
      input_html += "</select>";
    } else if (type == "boolean" || type == "toggle") {
      input_html = "<input autofocus type='checkbox' class='value' " + (node2.properties[property] ? "checked" : "") + "/>";
    } else {
      console.warn("unknown type: " + type);
      return;
    }
    const dialog = this.createDialog(
      "<span class='name'>" + (info.label || property) + "</span>" + input_html + "<button>OK</button>",
      options2
    );
    let input;
    if ((type == "enum" || type == "combo") && info.values) {
      input = dialog.querySelector("select");
      input.addEventListener("change", function(e2) {
        dialog.modified();
        setValue(e2.target?.value);
      });
    } else if (type == "boolean" || type == "toggle") {
      input = dialog.querySelector("input");
      input?.addEventListener("click", function() {
        dialog.modified();
        setValue(!!input.checked);
      });
    } else {
      input = dialog.querySelector("input");
      if (input) {
        input.addEventListener("blur", function() {
          this.focus();
        });
        let v2 = node2.properties[property] !== void 0 ? node2.properties[property] : "";
        if (type !== "string") {
          v2 = JSON.stringify(v2);
        }
        input.value = v2;
        input.addEventListener("keydown", function(e2) {
          if (e2.keyCode == 27) {
            dialog.close();
          } else if (e2.keyCode == 13) {
            inner();
          } else if (e2.keyCode != 13) {
            dialog.modified();
            return;
          }
          e2.preventDefault();
          e2.stopPropagation();
        });
      }
    }
    input?.focus();
    const button = dialog.querySelector("button");
    button.addEventListener("click", inner);
    function inner() {
      setValue(input.value);
    }
    function setValue(value) {
      if (info?.values && typeof info.values === "object" && info.values[value] != void 0)
        value = info.values[value];
      if (typeof node2.properties[property] == "number") {
        value = Number(value);
      }
      if (type == "array" || type == "object") {
        value = JSON.parse(value);
      }
      node2.properties[property] = value;
      if (node2.graph) {
        node2.graph._version++;
      }
      node2.onPropertyChanged?.(property, value);
      options2.onclose?.();
      dialog.close();
      this.setDirty(true, true);
    }
    return dialog;
  }
  // TODO refactor, theer are different dialog, some uses createDialog, some dont
  createDialog(html, options2) {
    const def_options = {
      checkForInput: false,
      closeOnLeave: true,
      closeOnLeave_checkModified: true
    };
    options2 = Object.assign(def_options, options2 || {});
    const dialog = document.createElement("div");
    dialog.className = "graphdialog";
    dialog.innerHTML = html;
    dialog.is_modified = false;
    const rect = this.canvas.getBoundingClientRect();
    let offsetx = -20;
    let offsety = -20;
    if (rect) {
      offsetx -= rect.left;
      offsety -= rect.top;
    }
    if (options2.position) {
      offsetx += options2.position[0];
      offsety += options2.position[1];
    } else if (options2.event) {
      offsetx += options2.event.clientX;
      offsety += options2.event.clientY;
    } else {
      offsetx += this.canvas.width * 0.5;
      offsety += this.canvas.height * 0.5;
    }
    dialog.style.left = offsetx + "px";
    dialog.style.top = offsety + "px";
    this.canvas.parentNode.appendChild(dialog);
    if (options2.checkForInput) {
      const aI = dialog.querySelectorAll("input");
      aI?.forEach(function(iX) {
        iX.addEventListener("keydown", function(e2) {
          dialog.modified();
          if (e2.keyCode == 27) {
            dialog.close();
          } else if (e2.keyCode != 13) {
            return;
          }
          e2.preventDefault();
          e2.stopPropagation();
        });
        iX.focus();
      });
    }
    dialog.modified = function() {
      dialog.is_modified = true;
    };
    dialog.close = function() {
      dialog.parentNode?.removeChild(dialog);
    };
    let dialogCloseTimer = null;
    let prevent_timeout = 0;
    dialog.addEventListener("mouseleave", function() {
      if (prevent_timeout) return;
      if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
        dialogCloseTimer = setTimeout(
          dialog.close,
          LiteGraph.dialog_close_on_mouse_leave_delay
        );
    });
    dialog.addEventListener("mouseenter", function() {
      if (options2.closeOnLeave || LiteGraph.dialog_close_on_mouse_leave) {
        if (dialogCloseTimer) clearTimeout(dialogCloseTimer);
      }
    });
    const selInDia = dialog.querySelectorAll("select");
    selInDia?.forEach(function(selIn) {
      selIn.addEventListener("click", function() {
        prevent_timeout++;
      });
      selIn.addEventListener("blur", function() {
        prevent_timeout = 0;
      });
      selIn.addEventListener("change", function() {
        prevent_timeout = -1;
      });
    });
    return dialog;
  }
  createPanel(title, options2) {
    options2 = options2 || {};
    const ref_window = options2.window || window;
    const root = document.createElement("div");
    root.className = "litegraph dialog";
    root.innerHTML = "<div class='dialog-header'><span class='dialog-title'></span></div><div class='dialog-content'></div><div style='display:none;' class='dialog-alt-content'></div><div class='dialog-footer'></div>";
    root.header = root.querySelector(".dialog-header");
    if (options2.width)
      root.style.width = options2.width + (typeof options2.width === "number" ? "px" : "");
    if (options2.height)
      root.style.height = options2.height + (typeof options2.height === "number" ? "px" : "");
    if (options2.closable) {
      const close = document.createElement("span");
      close.innerHTML = "&#10005;";
      close.classList.add("close");
      close.addEventListener("click", function() {
        root.close();
      });
      root.header.appendChild(close);
    }
    root.title_element = root.querySelector(".dialog-title");
    root.title_element.innerText = title;
    root.content = root.querySelector(".dialog-content");
    root.alt_content = root.querySelector(".dialog-alt-content");
    root.footer = root.querySelector(".dialog-footer");
    root.close = function() {
      if (typeof root.onClose == "function") root.onClose();
      root.parentNode?.removeChild(root);
      this.parentNode?.removeChild(this);
    };
    root.toggleAltContent = function(force) {
      let vTo;
      let vAlt;
      if (typeof force != "undefined") {
        vTo = force ? "block" : "none";
        vAlt = force ? "none" : "block";
      } else {
        vTo = root.alt_content.style.display != "block" ? "block" : "none";
        vAlt = root.alt_content.style.display != "block" ? "none" : "block";
      }
      root.alt_content.style.display = vTo;
      root.content.style.display = vAlt;
    };
    root.toggleFooterVisibility = function(force) {
      let vTo;
      if (typeof force != "undefined") {
        vTo = force ? "block" : "none";
      } else {
        vTo = root.footer.style.display != "block" ? "block" : "none";
      }
      root.footer.style.display = vTo;
    };
    root.clear = function() {
      this.content.innerHTML = "";
    };
    root.addHTML = function(code, classname, on_footer) {
      const elem = document.createElement("div");
      if (classname) elem.className = classname;
      elem.innerHTML = code;
      if (on_footer) root.footer.appendChild(elem);
      else root.content.appendChild(elem);
      return elem;
    };
    root.addButton = function(name, callback, options22) {
      const elem = document.createElement("button");
      elem.innerText = name;
      elem.options = options22;
      elem.classList.add("btn");
      elem.addEventListener("click", callback);
      root.footer.appendChild(elem);
      return elem;
    };
    root.addSeparator = function() {
      const elem = document.createElement("div");
      elem.className = "separator";
      root.content.appendChild(elem);
    };
    root.addWidget = function(type, name, value, options22, callback) {
      options22 = options22 || {};
      let str_value = String(value);
      type = type.toLowerCase();
      if (type == "number") str_value = value.toFixed(3);
      const elem = document.createElement("div");
      elem.className = "property";
      elem.innerHTML = "<span class='property_name'></span><span class='property_value'></span>";
      elem.querySelector(".property_name").innerText = options22.label || name;
      const value_element = elem.querySelector(".property_value");
      value_element.innerText = str_value;
      elem.dataset["property"] = name;
      elem.dataset["type"] = options22.type || type;
      elem.options = options22;
      elem.value = value;
      if (type == "code")
        elem.addEventListener("click", function() {
          root.inner_showCodePad(this.dataset["property"]);
        });
      else if (type == "boolean") {
        elem.classList.add("boolean");
        if (value) elem.classList.add("bool-on");
        elem.addEventListener("click", function() {
          const propname = this.dataset["property"];
          this.value = !this.value;
          this.classList.toggle("bool-on");
          this.querySelector(".property_value").innerText = this.value ? "true" : "false";
          innerChange(propname, this.value);
        });
      } else if (type == "string" || type == "number") {
        value_element.setAttribute("contenteditable", true);
        value_element.addEventListener("keydown", function(e2) {
          if (e2.code == "Enter" && (type != "string" || !e2.shiftKey)) {
            e2.preventDefault();
            this.blur();
          }
        });
        value_element.addEventListener("blur", function() {
          let v2 = this.innerText;
          const propname = this.parentNode.dataset["property"];
          const proptype = this.parentNode.dataset["type"];
          if (proptype == "number") v2 = Number(v2);
          innerChange(propname, v2);
        });
      } else if (type == "enum" || type == "combo") {
        const str_value2 = LGraphCanvas.getPropertyPrintableValue(value, options22.values);
        value_element.innerText = str_value2;
        value_element.addEventListener("click", function(event) {
          const values = options22.values || [];
          const propname = this.parentNode.dataset["property"];
          const elem_that = this;
          new LiteGraph.ContextMenu(
            values,
            {
              event,
              className: "dark",
              callback: inner_clicked
            },
            // @ts-expect-error
            ref_window
          );
          function inner_clicked(v2) {
            elem_that.innerText = v2;
            innerChange(propname, v2);
            return false;
          }
        });
      }
      root.content.appendChild(elem);
      function innerChange(name2, value2) {
        options22.callback?.(name2, value2, options22);
        callback?.(name2, value2, options22);
      }
      return elem;
    };
    if (root.onOpen && typeof root.onOpen == "function") root.onOpen();
    return root;
  }
  closePanels() {
    document.querySelector("#node-panel")?.close();
    document.querySelector("#option-panel")?.close();
  }
  showShowNodePanel(node2) {
    this.SELECTED_NODE = node2;
    this.closePanels();
    const ref_window = this.getCanvasWindow();
    const graphcanvas = this;
    const panel = this.createPanel(node2.title || "", {
      closable: true,
      window: ref_window,
      onOpen: function() {
        graphcanvas.NODEPANEL_IS_OPEN = true;
      },
      onClose: function() {
        graphcanvas.NODEPANEL_IS_OPEN = false;
        graphcanvas.node_panel = null;
      }
    });
    graphcanvas.node_panel = panel;
    panel.id = "node-panel";
    panel.node = node2;
    panel.classList.add("settings");
    function inner_refresh() {
      panel.content.innerHTML = "";
      panel.addHTML(`<span class='node_type'>${node2.type}</span><span class='node_desc'>${node2.constructor.desc || ""}</span><span class='separator'></span>`);
      panel.addHTML("<h3>Properties</h3>");
      const fUpdate = function(name, value) {
        graphcanvas.graph.beforeChange(node2);
        switch (name) {
          case "Title":
            node2.title = value;
            break;
          case "Mode": {
            const kV = Object.values(LiteGraph.NODE_MODES).indexOf(value);
            if (kV >= 0 && LiteGraph.NODE_MODES[kV]) {
              node2.changeMode(kV);
            } else {
              console.warn("unexpected mode: " + value);
            }
            break;
          }
          case "Color":
            if (LGraphCanvas.node_colors[value]) {
              node2.color = LGraphCanvas.node_colors[value].color;
              node2.bgcolor = LGraphCanvas.node_colors[value].bgcolor;
            } else {
              console.warn("unexpected color: " + value);
            }
            break;
          default:
            node2.setProperty(name, value);
            break;
        }
        graphcanvas.graph.afterChange();
        graphcanvas.dirty_canvas = true;
      };
      panel.addWidget("string", "Title", node2.title, {}, fUpdate);
      panel.addWidget("combo", "Mode", LiteGraph.NODE_MODES[node2.mode], { values: LiteGraph.NODE_MODES }, fUpdate);
      const nodeCol = node2.color !== void 0 ? Object.keys(LGraphCanvas.node_colors).filter(function(nK) {
        return LGraphCanvas.node_colors[nK].color == node2.color;
      }) : "";
      panel.addWidget("combo", "Color", nodeCol, { values: Object.keys(LGraphCanvas.node_colors) }, fUpdate);
      for (const pName in node2.properties) {
        const value = node2.properties[pName];
        const info = node2.getPropertyInfo(pName);
        if (node2.onAddPropertyToPanel?.(pName, panel)) continue;
        panel.addWidget(info.widget || info.type, pName, value, info, fUpdate);
      }
      panel.addSeparator();
      node2.onShowCustomPanelInfo?.(panel);
      panel.footer.innerHTML = "";
      panel.addButton("Delete", function() {
        if (node2.block_delete)
          return;
        node2.graph.remove(node2);
        panel.close();
      }).classList.add("delete");
    }
    panel.inner_showCodePad = function(propname) {
      panel.classList.remove("settings");
      panel.classList.add("centered");
      panel.alt_content.innerHTML = "<textarea class='code'></textarea>";
      const textarea = panel.alt_content.querySelector("textarea");
      const fDoneWith = function() {
        panel.toggleAltContent(false);
        panel.toggleFooterVisibility(true);
        textarea.parentNode.removeChild(textarea);
        panel.classList.add("settings");
        panel.classList.remove("centered");
        inner_refresh();
      };
      textarea.value = node2.properties[propname];
      textarea.addEventListener("keydown", function(e2) {
        if (e2.code == "Enter" && e2.ctrlKey) {
          node2.setProperty(propname, textarea.value);
          fDoneWith();
        }
      });
      panel.toggleAltContent(true);
      panel.toggleFooterVisibility(false);
      textarea.style.height = "calc(100% - 40px)";
      const assign = panel.addButton("Assign", function() {
        node2.setProperty(propname, textarea.value);
        fDoneWith();
      });
      panel.alt_content.appendChild(assign);
      const button = panel.addButton("Close", fDoneWith);
      button.style.float = "right";
      panel.alt_content.appendChild(button);
    };
    inner_refresh();
    this.canvas.parentNode.appendChild(panel);
  }
  checkPanels() {
    if (!this.canvas) return;
    const panels = this.canvas.parentNode.querySelectorAll(".litegraph.dialog");
    for (let i = 0; i < panels.length; ++i) {
      const panel = panels[i];
      if (!panel.node) continue;
      if (!panel.node.graph || panel.graph != this.graph) panel.close();
    }
  }
  getCanvasMenuOptions() {
    let options2 = null;
    if (this.getMenuOptions) {
      options2 = this.getMenuOptions();
    } else {
      options2 = [
        {
          content: "Add Node",
          has_submenu: true,
          // @ts-expect-error Might be broken?  Or just param overlap
          callback: LGraphCanvas.onMenuAdd
        },
        { content: "Add Group", callback: LGraphCanvas.onGroupAdd }
        // { content: "Arrange", callback: that.graph.arrange },
        // {content:"Collapse All", callback: LGraphCanvas.onMenuCollapseAll }
      ];
      if (Object.keys(this.selected_nodes).length > 1) {
        options2.push({
          content: "Align",
          has_submenu: true,
          callback: LGraphCanvas.onGroupAlign
        });
      }
    }
    const extra = this.getExtraMenuOptions?.(this, options2);
    return Array.isArray(extra) ? options2.concat(extra) : options2;
  }
  // called by processContextMenu to extract the menu list
  getNodeMenuOptions(node2) {
    let options2 = null;
    if (node2.getMenuOptions) {
      options2 = node2.getMenuOptions(this);
    } else {
      options2 = [
        {
          content: "Inputs",
          has_submenu: true,
          disabled: true,
          callback: LGraphCanvas.showMenuNodeOptionalInputs
        },
        {
          content: "Outputs",
          has_submenu: true,
          disabled: true,
          callback: LGraphCanvas.showMenuNodeOptionalOutputs
        },
        null,
        {
          content: "Properties",
          has_submenu: true,
          callback: LGraphCanvas.onShowMenuNodeProperties
        },
        {
          content: "Properties Panel",
          callback: function(item, options22, e2, menu, node22) {
            LGraphCanvas.active_canvas.showShowNodePanel(node22);
          }
        },
        null,
        {
          content: "Title",
          callback: LGraphCanvas.onShowPropertyEditor
        },
        {
          content: "Mode",
          has_submenu: true,
          callback: LGraphCanvas.onMenuNodeMode
        }
      ];
      if (node2.resizable !== false) {
        options2.push({
          content: "Resize",
          callback: LGraphCanvas.onMenuResizeNode
        });
      }
      if (node2.collapsible) {
        options2.push({
          content: node2.collapsed ? "Expand" : "Collapse",
          callback: LGraphCanvas.onMenuNodeCollapse
        });
      }
      if (node2.widgets?.some((w) => w.advanced)) {
        options2.push({
          content: node2.showAdvanced ? "Hide Advanced" : "Show Advanced",
          callback: LGraphCanvas.onMenuToggleAdvanced
        });
      }
      options2.push(
        {
          content: node2.pinned ? "Unpin" : "Pin",
          callback: (...args) => {
            LGraphCanvas.onMenuNodePin(...args);
            for (const i in this.selected_nodes) {
              const node22 = this.selected_nodes[i];
              node22.pin();
            }
            this.setDirty(true, true);
          }
        },
        {
          content: "Colors",
          has_submenu: true,
          callback: LGraphCanvas.onMenuNodeColors
        },
        {
          content: "Shapes",
          has_submenu: true,
          callback: LGraphCanvas.onMenuNodeShapes
        },
        null
      );
    }
    const inputs = node2.onGetInputs?.();
    if (inputs?.length) options2[0].disabled = false;
    const outputs = node2.onGetOutputs?.();
    if (outputs?.length) options2[1].disabled = false;
    const extra = node2.getExtraMenuOptions?.(this, options2);
    if (Array.isArray(extra) && extra.length > 0) {
      extra.push(null);
      options2 = extra.concat(options2);
    }
    if (node2.clonable !== false) {
      options2.push({
        content: "Clone",
        callback: LGraphCanvas.onMenuNodeClone
      });
    }
    if (Object.keys(this.selected_nodes).length > 1) {
      options2.push({
        content: "Align Selected To",
        has_submenu: true,
        callback: LGraphCanvas.onNodeAlign
      });
      options2.push({
        content: "Distribute Nodes",
        has_submenu: true,
        callback: LGraphCanvas.createDistributeMenu
      });
    }
    options2.push(null, {
      content: "Remove",
      disabled: !(node2.removable !== false && !node2.block_delete),
      callback: LGraphCanvas.onMenuNodeRemove
    });
    node2.graph?.onGetNodeMenuOptions?.(options2, node2);
    return options2;
  }
  getGroupMenuOptions(group) {
    console.warn("LGraphCanvas.getGroupMenuOptions is deprecated, use LGraphGroup.getMenuOptions instead");
    return group.getMenuOptions();
  }
  processContextMenu(node2, event) {
    const that = this;
    const canvas2 = LGraphCanvas.active_canvas;
    const ref_window = canvas2.getCanvasWindow();
    let menu_info = null;
    const options2 = {
      event,
      callback: inner_option_clicked,
      extra: node2
    };
    if (node2) options2.title = node2.type;
    let slot = null;
    if (node2) {
      slot = node2.getSlotInPosition(event.canvasX, event.canvasY);
      LGraphCanvas.active_node = node2;
    }
    if (slot) {
      menu_info = [];
      if (node2.getSlotMenuOptions) {
        menu_info = node2.getSlotMenuOptions(slot);
      } else {
        if (slot?.output?.links?.length)
          menu_info.push({ content: "Disconnect Links", slot });
        const _slot = slot.input || slot.output;
        if (_slot.removable) {
          menu_info.push(
            _slot.locked ? "Cannot remove" : { content: "Remove Slot", slot }
          );
        }
        if (!_slot.nameLocked)
          menu_info.push({ content: "Rename Slot", slot });
      }
      options2.title = (slot.input ? slot.input.type : slot.output.type) || "*";
      if (slot.input && slot.input.type == LiteGraph.ACTION)
        options2.title = "Action";
      if (slot.output && slot.output.type == LiteGraph.EVENT)
        options2.title = "Event";
    } else if (node2) {
      menu_info = this.getNodeMenuOptions(node2);
    } else {
      menu_info = this.getCanvasMenuOptions();
      if (this.reroutesEnabled && this.links_render_mode !== LinkRenderType.HIDDEN_LINK) {
        const reroute = this.graph.getRerouteOnPos(event.canvasX, event.canvasY);
        if (reroute) {
          menu_info.unshift({
            content: "Delete Reroute",
            callback: () => this.graph.removeReroute(reroute.id)
          }, null);
        }
      }
      const group = this.graph.getGroupOnPos(
        event.canvasX,
        event.canvasY
      );
      if (group) {
        menu_info.push(null, {
          content: "Edit Group",
          has_submenu: true,
          submenu: {
            title: "Group",
            extra: group,
            options: group.getMenuOptions()
          }
        });
      }
    }
    if (!menu_info) return;
    new LiteGraph.ContextMenu(menu_info, options2, ref_window);
    function inner_option_clicked(v2, options22) {
      if (!v2) return;
      if (v2.content == "Remove Slot") {
        const info = v2.slot;
        node2.graph.beforeChange();
        if (info.input) {
          node2.removeInput(info.slot);
        } else if (info.output) {
          node2.removeOutput(info.slot);
        }
        node2.graph.afterChange();
        return;
      } else if (v2.content == "Disconnect Links") {
        const info = v2.slot;
        node2.graph.beforeChange();
        if (info.output) {
          node2.disconnectOutput(info.slot);
        } else if (info.input) {
          node2.disconnectInput(info.slot);
        }
        node2.graph.afterChange();
        return;
      } else if (v2.content == "Rename Slot") {
        const info = v2.slot;
        const slot_info = info.input ? node2.getInputInfo(info.slot) : node2.getOutputInfo(info.slot);
        const dialog = that.createDialog(
          "<span class='name'>Name</span><input autofocus type='text'/><button>OK</button>",
          options22
        );
        const input = dialog.querySelector("input");
        if (input && slot_info) {
          input.value = slot_info.label || "";
        }
        const inner = function() {
          node2.graph.beforeChange();
          if (input.value) {
            if (slot_info) {
              slot_info.label = input.value;
            }
            that.setDirty(true);
          }
          dialog.close();
          node2.graph.afterChange();
        };
        dialog.querySelector("button").addEventListener("click", inner);
        input.addEventListener("keydown", function(e2) {
          dialog.is_modified = true;
          if (e2.keyCode == 27) {
            dialog.close();
          } else if (e2.keyCode == 13) {
            inner();
          } else if (e2.keyCode != 13 && e2.target.localName != "textarea") {
            return;
          }
          e2.preventDefault();
          e2.stopPropagation();
        });
        input.focus();
      }
    }
  }
  /**
   * Starts an animation to fit the view around the specified selection of nodes.
   * @param bounds The bounds to animate the view to, defined by a rectangle.
   */
  animateToBounds(bounds, {
    duration = 350,
    zoom = 0.75,
    easing = EaseFunction.EASE_IN_OUT_QUAD
  } = {}) {
    const easeFunctions = {
      linear: (t) => t,
      easeInQuad: (t) => t * t,
      easeOutQuad: (t) => t * (2 - t),
      easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    };
    const easeFunction = easeFunctions[easing] ?? easeFunctions.linear;
    let animationId = null;
    const startTimestamp = performance.now();
    const startX = this.ds.offset[0];
    const startY = this.ds.offset[1];
    const startScale = this.ds.scale;
    const cw = this.canvas.width / window.devicePixelRatio;
    const ch = this.canvas.height / window.devicePixelRatio;
    let targetScale = startScale;
    let targetX = startX;
    let targetY = startY;
    if (zoom > 0) {
      const targetScaleX = zoom * cw / Math.max(bounds[2], 300);
      const targetScaleY = zoom * ch / Math.max(bounds[3], 300);
      targetScale = Math.min(targetScaleX, targetScaleY, this.ds.max_scale);
    }
    targetX = -bounds[0] - bounds[2] * 0.5 + cw * 0.5 / targetScale;
    targetY = -bounds[1] - bounds[3] * 0.5 + ch * 0.5 / targetScale;
    const animate = (timestamp) => {
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFunction(progress);
      this.ds.offset[0] = startX + (targetX - startX) * easedProgress;
      this.ds.offset[1] = startY + (targetY - startY) * easedProgress;
      if (zoom > 0) {
        this.ds.scale = startScale + (targetScale - startScale) * easedProgress;
      }
      this.setDirty(true, true);
      if (progress < 1) {
        animationId = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationId);
      }
    };
    animationId = requestAnimationFrame(animate);
  }
  /**
   * Fits the view to the selected nodes with animation.
   * If nothing is selected, the view is fitted around all items in the graph.
   */
  fitViewToSelectionAnimated(options2 = {}) {
    const items = this.selectedItems.size ? Array.from(this.selectedItems) : this.positionableItems;
    this.animateToBounds(createBounds(items), options2);
  }
}
class MapProxyHandler {
  getOwnPropertyDescriptor(target, p) {
    const value = this.get(target, p);
    if (value) return {
      configurable: true,
      enumerable: true,
      value
    };
  }
  has(target, p) {
    if (typeof p === "symbol") return false;
    const int = parseInt(p, 10);
    return target.has(!isNaN(int) ? int : p);
  }
  ownKeys(target) {
    return [...target.keys()].map((x2) => String(x2));
  }
  get(target, p) {
    if (p in target) return Reflect.get(target, p, target);
    if (typeof p === "symbol") return;
    const int = parseInt(p, 10);
    return target.get(!isNaN(int) ? int : p);
  }
  set(target, p, newValue2) {
    if (typeof p === "symbol") return false;
    const int = parseInt(p, 10);
    target.set(!isNaN(int) ? int : p, newValue2);
    return true;
  }
  deleteProperty(target, p) {
    return target.delete(p);
  }
  static bindAllMethods(map) {
    map.clear = map.clear.bind(map);
    map.delete = map.delete.bind(map);
    map.forEach = map.forEach.bind(map);
    map.get = map.get.bind(map);
    map.has = map.has.bind(map);
    map.set = map.set.bind(map);
    map.entries = map.entries.bind(map);
    map.keys = map.keys.bind(map);
    map.values = map.values.bind(map);
  }
}
class LGraph {
  static serialisedSchemaVersion = 1;
  // default supported types
  static supported_types = ["number", "string", "boolean"];
  static STATUS_STOPPED = 1;
  static STATUS_RUNNING = 2;
  _version;
  /** The backing store for links.  Keys are wrapped in String() */
  _links = /* @__PURE__ */ new Map();
  /**
   * Indexed property access is deprecated.
   * Backwards compatibility with a Proxy has been added, but will eventually be removed.
   *
   * Use {@link Map} methods:
   * ```
   * const linkId = 123
   * const link = graph.links.get(linkId)
   * // Deprecated: const link = graph.links[linkId]
   * ```
   */
  links;
  list_of_graphcanvas;
  status;
  state;
  _nodes;
  _nodes_by_id;
  _nodes_in_order;
  _nodes_executable;
  _groups;
  iteration;
  globaltime;
  runningtime;
  fixedtime;
  fixedtime_lapse;
  elapsed_time;
  last_update_time;
  starttime;
  catch_errors;
  execution_timer_id;
  errors_in_execution;
  execution_time;
  _last_trigger_time;
  filter;
  /** Must contain serialisable values, e.g. primitive types */
  config;
  vars;
  nodes_executing;
  nodes_actioning;
  nodes_executedAction;
  extra;
  inputs;
  outputs;
  /** @returns Whether the graph has no items */
  get empty() {
    return this._nodes.length + this._groups.length + this.reroutes.size === 0;
  }
  /** @returns All items on the canvas that can be selected */
  *positionableItems() {
    for (const node2 of this._nodes) yield node2;
    for (const group of this._groups) yield group;
    for (const reroute of this.reroutes.values()) yield reroute;
    return;
  }
  #reroutes = /* @__PURE__ */ new Map();
  /** All reroutes in this graph. */
  get reroutes() {
    return this.#reroutes;
  }
  set reroutes(value) {
    if (!value) throw new TypeError("Attempted to set LGraph.reroutes to a falsy value.");
    const reroutes = this.#reroutes;
    if (value.size === 0) {
      reroutes.clear();
      return;
    }
    for (const rerouteId of reroutes.keys()) {
      if (!value.has(rerouteId)) reroutes.delete(rerouteId);
    }
    for (const [id, reroute] of value) {
      reroutes.set(id, reroute);
    }
  }
  /** @deprecated See {@link state}.{@link LGraphState.lastNodeId lastNodeId} */
  get last_node_id() {
    return this.state.lastNodeId;
  }
  set last_node_id(value) {
    this.state.lastNodeId = value;
  }
  /** @deprecated See {@link state}.{@link LGraphState.lastLinkId lastLinkId} */
  get last_link_id() {
    return this.state.lastLinkId;
  }
  set last_link_id(value) {
    this.state.lastLinkId = value;
  }
  _input_nodes;
  /**
   * See {@link LGraph}
   * @param o data from previous serialization [optional]
   */
  constructor(o) {
    if (LiteGraph.debug) console.log("Graph created");
    const links = this._links;
    MapProxyHandler.bindAllMethods(links);
    const handler = new MapProxyHandler();
    this.links = new Proxy(links, handler);
    this.list_of_graphcanvas = null;
    this.clear();
    if (o) this.configure(o);
  }
  // TODO: Remove
  // used to know which types of connections support this graph (some graphs do not allow certain types)
  getSupportedTypes() {
    return this.supported_types || LGraph.supported_types;
  }
  /**
   * Removes all nodes from this graph
   */
  clear() {
    this.stop();
    this.status = LGraph.STATUS_STOPPED;
    this.state = {
      lastGroupId: 0,
      lastNodeId: 0,
      lastLinkId: 0,
      lastRerouteId: 0
    };
    this._version = -1;
    if (this._nodes) {
      for (let i = 0; i < this._nodes.length; ++i) {
        this._nodes[i].onRemoved?.();
      }
    }
    this._nodes = [];
    this._nodes_by_id = {};
    this._nodes_in_order = [];
    this._nodes_executable = null;
    this._links.clear();
    this.reroutes.clear();
    this._groups = [];
    this.iteration = 0;
    this.config = {};
    this.vars = {};
    this.extra = {};
    this.globaltime = 0;
    this.runningtime = 0;
    this.fixedtime = 0;
    this.fixedtime_lapse = 0.01;
    this.elapsed_time = 0.01;
    this.last_update_time = 0;
    this.starttime = 0;
    this.catch_errors = true;
    this.nodes_executing = [];
    this.nodes_actioning = [];
    this.nodes_executedAction = [];
    this.inputs = {};
    this.outputs = {};
    this.change();
    this.canvasAction((c) => c.clear());
  }
  get nodes() {
    return this._nodes;
  }
  get groups() {
    return this._groups;
  }
  /**
   * Attach Canvas to this graph
   */
  attachCanvas(graphcanvas) {
    if (graphcanvas.constructor != LGraphCanvas)
      throw "attachCanvas expects a LGraphCanvas instance";
    if (graphcanvas.graph != this)
      graphcanvas.graph?.detachCanvas(graphcanvas);
    graphcanvas.graph = this;
    this.list_of_graphcanvas ||= [];
    this.list_of_graphcanvas.push(graphcanvas);
  }
  /**
   * Detach Canvas from this graph
   */
  detachCanvas(graphcanvas) {
    if (!this.list_of_graphcanvas) return;
    const pos = this.list_of_graphcanvas.indexOf(graphcanvas);
    if (pos == -1) return;
    graphcanvas.graph = null;
    this.list_of_graphcanvas.splice(pos, 1);
  }
  /**
   * Starts running this graph every interval milliseconds.
   * @param interval amount of milliseconds between executions, if 0 then it renders to the monitor refresh rate
   */
  start(interval) {
    if (this.status == LGraph.STATUS_RUNNING) return;
    this.status = LGraph.STATUS_RUNNING;
    this.onPlayEvent?.();
    this.sendEventToAllNodes("onStart");
    this.starttime = LiteGraph.getTime();
    this.last_update_time = this.starttime;
    interval ||= 0;
    const that = this;
    if (interval == 0 && typeof window != "undefined" && window.requestAnimationFrame) {
      let on_frame = function() {
        if (that.execution_timer_id != -1) return;
        window.requestAnimationFrame(on_frame);
        that.onBeforeStep?.();
        that.runStep(1, !that.catch_errors);
        that.onAfterStep?.();
      };
      this.execution_timer_id = -1;
      on_frame();
    } else {
      this.execution_timer_id = setInterval(function() {
        that.onBeforeStep?.();
        that.runStep(1, !that.catch_errors);
        that.onAfterStep?.();
      }, interval);
    }
  }
  /**
   * Stops the execution loop of the graph
   */
  stop() {
    if (this.status == LGraph.STATUS_STOPPED) return;
    this.status = LGraph.STATUS_STOPPED;
    this.onStopEvent?.();
    if (this.execution_timer_id != null) {
      if (this.execution_timer_id != -1) {
        clearInterval(this.execution_timer_id);
      }
      this.execution_timer_id = null;
    }
    this.sendEventToAllNodes("onStop");
  }
  /**
   * Run N steps (cycles) of the graph
   * @param num number of steps to run, default is 1
   * @param do_not_catch_errors [optional] if you want to try/catch errors
   * @param limit max number of nodes to execute (used to execute from start to a node)
   */
  runStep(num, do_not_catch_errors, limit) {
    num = num || 1;
    const start = LiteGraph.getTime();
    this.globaltime = 1e-3 * (start - this.starttime);
    const nodes = this._nodes_executable ? this._nodes_executable : this._nodes;
    if (!nodes) return;
    limit = limit || nodes.length;
    if (do_not_catch_errors) {
      for (let i = 0; i < num; i++) {
        for (let j = 0; j < limit; ++j) {
          const node2 = nodes[j];
          if (node2.mode == LGraphEventMode.ALWAYS && node2.onExecute) {
            node2.doExecute?.();
          }
        }
        this.fixedtime += this.fixedtime_lapse;
        this.onExecuteStep?.();
      }
      this.onAfterExecute?.();
    } else {
      try {
        for (let i = 0; i < num; i++) {
          for (let j = 0; j < limit; ++j) {
            const node2 = nodes[j];
            if (node2.mode == LGraphEventMode.ALWAYS) {
              node2.onExecute?.();
            }
          }
          this.fixedtime += this.fixedtime_lapse;
          this.onExecuteStep?.();
        }
        this.onAfterExecute?.();
        this.errors_in_execution = false;
      } catch (err) {
        this.errors_in_execution = true;
        if (LiteGraph.throw_errors) throw err;
        if (LiteGraph.debug) console.log("Error during execution: " + err);
        this.stop();
      }
    }
    const now = LiteGraph.getTime();
    let elapsed = now - start;
    if (elapsed == 0) elapsed = 1;
    this.execution_time = 1e-3 * elapsed;
    this.globaltime += 1e-3 * elapsed;
    this.iteration += 1;
    this.elapsed_time = (now - this.last_update_time) * 1e-3;
    this.last_update_time = now;
    this.nodes_executing = [];
    this.nodes_actioning = [];
    this.nodes_executedAction = [];
  }
  /**
   * Updates the graph execution order according to relevance of the nodes (nodes with only outputs have more relevance than
   * nodes with only inputs.
   */
  updateExecutionOrder() {
    this._nodes_in_order = this.computeExecutionOrder(false);
    this._nodes_executable = [];
    for (let i = 0; i < this._nodes_in_order.length; ++i) {
      if (this._nodes_in_order[i].onExecute) {
        this._nodes_executable.push(this._nodes_in_order[i]);
      }
    }
  }
  // This is more internal, it computes the executable nodes in order and returns it
  computeExecutionOrder(only_onExecute, set_level) {
    const L = [];
    const S = [];
    const M = {};
    const visited_links = {};
    const remaining_links = {};
    for (let i = 0, l2 = this._nodes.length; i < l2; ++i) {
      const node2 = this._nodes[i];
      if (only_onExecute && !node2.onExecute) {
        continue;
      }
      M[node2.id] = node2;
      let num = 0;
      if (node2.inputs) {
        for (let j = 0, l22 = node2.inputs.length; j < l22; j++) {
          if (node2.inputs[j]?.link != null) {
            num += 1;
          }
        }
      }
      if (num == 0) {
        S.push(node2);
        if (set_level) node2._level = 1;
      } else {
        if (set_level) node2._level = 0;
        remaining_links[node2.id] = num;
      }
    }
    while (true) {
      const node2 = S.shift();
      if (node2 === void 0) break;
      L.push(node2);
      delete M[node2.id];
      if (!node2.outputs) continue;
      for (let i = 0; i < node2.outputs.length; i++) {
        const output = node2.outputs[i];
        if (output?.links == null || output.links.length == 0)
          continue;
        for (let j = 0; j < output.links.length; j++) {
          const link_id = output.links[j];
          const link = this._links.get(link_id);
          if (!link) continue;
          if (visited_links[link.id]) continue;
          const target_node = this.getNodeById(link.target_id);
          if (target_node == null) {
            visited_links[link.id] = true;
            continue;
          }
          if (set_level && (!target_node._level || target_node._level <= node2._level)) {
            target_node._level = node2._level + 1;
          }
          visited_links[link.id] = true;
          remaining_links[target_node.id] -= 1;
          if (remaining_links[target_node.id] == 0) S.push(target_node);
        }
      }
    }
    for (const i in M) {
      L.push(M[i]);
    }
    if (L.length != this._nodes.length && LiteGraph.debug)
      console.warn("something went wrong, nodes missing");
    L.length;
    function setOrder(nodes) {
      const l2 = nodes.length;
      for (let i = 0; i < l2; ++i) {
        nodes[i].order = i;
      }
    }
    setOrder(L);
    L.sort(function(A, B) {
      const Ap = A.constructor.priority || A.priority || 0;
      const Bp = B.constructor.priority || B.priority || 0;
      return Ap == Bp ? A.order - B.order : Ap - Bp;
    });
    setOrder(L);
    return L;
  }
  /**
   * Returns all the nodes that could affect this one (ancestors) by crawling all the inputs recursively.
   * It doesn't include the node itself
   * @returns an array with all the LGraphNodes that affect this node, in order of execution
   */
  getAncestors(node2) {
    const ancestors = [];
    const pending = [node2];
    const visited = {};
    while (pending.length) {
      const current = pending.shift();
      if (!current?.inputs) continue;
      if (!visited[current.id] && current != node2) {
        visited[current.id] = true;
        ancestors.push(current);
      }
      for (let i = 0; i < current.inputs.length; ++i) {
        const input = current.getInputNode(i);
        if (input && ancestors.indexOf(input) == -1) {
          pending.push(input);
        }
      }
    }
    ancestors.sort(function(a, b) {
      return a.order - b.order;
    });
    return ancestors;
  }
  /**
   * Positions every node in a more readable manner
   */
  arrange(margin, layout) {
    margin = margin || 100;
    const nodes = this.computeExecutionOrder(false, true);
    const columns = [];
    for (let i = 0; i < nodes.length; ++i) {
      const node2 = nodes[i];
      const col = node2._level || 1;
      columns[col] ||= [];
      columns[col].push(node2);
    }
    let x2 = margin;
    for (let i = 0; i < columns.length; ++i) {
      const column = columns[i];
      if (!column) continue;
      let max_size = 100;
      let y = margin + LiteGraph.NODE_TITLE_HEIGHT;
      for (let j = 0; j < column.length; ++j) {
        const node2 = column[j];
        node2.pos[0] = layout == LiteGraph.VERTICAL_LAYOUT ? y : x2;
        node2.pos[1] = layout == LiteGraph.VERTICAL_LAYOUT ? x2 : y;
        const max_size_index = layout == LiteGraph.VERTICAL_LAYOUT ? 1 : 0;
        if (node2.size[max_size_index] > max_size) {
          max_size = node2.size[max_size_index];
        }
        const node_size_index = layout == LiteGraph.VERTICAL_LAYOUT ? 0 : 1;
        y += node2.size[node_size_index] + margin + LiteGraph.NODE_TITLE_HEIGHT;
      }
      x2 += max_size + margin;
    }
    this.setDirtyCanvas(true, true);
  }
  /**
   * Returns the amount of time the graph has been running in milliseconds
   * @returns number of milliseconds the graph has been running
   */
  getTime() {
    return this.globaltime;
  }
  /**
   * Returns the amount of time accumulated using the fixedtime_lapse var.
   * This is used in context where the time increments should be constant
   * @returns number of milliseconds the graph has been running
   */
  getFixedTime() {
    return this.fixedtime;
  }
  /**
   * Returns the amount of time it took to compute the latest iteration.
   * Take into account that this number could be not correct
   * if the nodes are using graphical actions
   * @returns number of milliseconds it took the last cycle
   */
  getElapsedTime() {
    return this.elapsed_time;
  }
  /**
   * Sends an event to all the nodes, useful to trigger stuff
   * @param eventname the name of the event (function to be called)
   * @param params parameters in array format
   */
  sendEventToAllNodes(eventname, params, mode) {
    mode = mode || LGraphEventMode.ALWAYS;
    const nodes = this._nodes_in_order ? this._nodes_in_order : this._nodes;
    if (!nodes) return;
    for (let j = 0, l = nodes.length; j < l; ++j) {
      const node2 = nodes[j];
      if (!node2[eventname] || node2.mode != mode) continue;
      if (params === void 0) {
        node2[eventname]();
      } else if (params && params.constructor === Array) {
        node2[eventname].apply(node2, params);
      } else {
        node2[eventname](params);
      }
    }
  }
  /**
   * Runs an action on every canvas registered to this graph.
   * @param action Action to run for every canvas
   */
  canvasAction(action) {
    this.list_of_graphcanvas?.forEach(action);
  }
  /** @deprecated See {@link LGraph.canvasAction} */
  sendActionToCanvas(action, params) {
    if (!this.list_of_graphcanvas) return;
    for (let i = 0; i < this.list_of_graphcanvas.length; ++i) {
      const c = this.list_of_graphcanvas[i];
      c[action]?.apply(c, params);
    }
  }
  /**
   * Adds a new node instance to this graph
   * @param node the instance of the node
   */
  add(node2, skip_compute_order) {
    if (!node2) return;
    const { state } = this;
    if (LiteGraph.alwaysSnapToGrid) {
      const snapTo = this.getSnapToGridSize();
      if (snapTo) node2.snapToGrid(snapTo);
    }
    if (node2 instanceof LGraphGroup) {
      if (node2.id == null || node2.id === -1) node2.id = ++state.lastGroupId;
      if (node2.id > state.lastGroupId) state.lastGroupId = node2.id;
      this._groups.push(node2);
      this.setDirtyCanvas(true);
      this.change();
      node2.graph = this;
      this._version++;
      return;
    }
    if (node2.id != -1 && this._nodes_by_id[node2.id] != null) {
      console.warn(
        "LiteGraph: there is already a node with this ID, changing it"
      );
      node2.id = LiteGraph.use_uuids ? LiteGraph.uuidv4() : ++state.lastNodeId;
    }
    if (this._nodes.length >= LiteGraph.MAX_NUMBER_OF_NODES) {
      throw "LiteGraph: max number of nodes in a graph reached";
    }
    if (LiteGraph.use_uuids) {
      if (node2.id == null || node2.id == -1)
        node2.id = LiteGraph.uuidv4();
    } else {
      if (node2.id == null || node2.id == -1) {
        node2.id = ++state.lastNodeId;
      } else if (typeof node2.id === "number" && state.lastNodeId < node2.id) {
        state.lastNodeId = node2.id;
      }
    }
    node2.graph = this;
    this._version++;
    this._nodes.push(node2);
    this._nodes_by_id[node2.id] = node2;
    node2.onAdded?.(this);
    if (this.config.align_to_grid) node2.alignToGrid();
    if (!skip_compute_order) this.updateExecutionOrder();
    this.onNodeAdded?.(node2);
    this.setDirtyCanvas(true);
    this.change();
    return node2;
  }
  /**
   * Removes a node from the graph
   * @param node the instance of the node
   */
  remove(node2) {
    if (node2 instanceof LGraphGroup) {
      const index = this._groups.indexOf(node2);
      if (index != -1) {
        this._groups.splice(index, 1);
      }
      node2.graph = null;
      this._version++;
      this.setDirtyCanvas(true, true);
      this.change();
      return;
    }
    if (this._nodes_by_id[node2.id] == null) return;
    if (node2.ignore_remove) return;
    this.beforeChange();
    if (node2.inputs) {
      for (let i = 0; i < node2.inputs.length; i++) {
        const slot = node2.inputs[i];
        if (slot.link != null) node2.disconnectInput(i);
      }
    }
    if (node2.outputs) {
      for (let i = 0; i < node2.outputs.length; i++) {
        const slot = node2.outputs[i];
        if (slot.links?.length) node2.disconnectOutput(i);
      }
    }
    node2.onRemoved?.();
    node2.graph = null;
    this._version++;
    if (this.list_of_graphcanvas) {
      for (let i = 0; i < this.list_of_graphcanvas.length; ++i) {
        const canvas2 = this.list_of_graphcanvas[i];
        if (canvas2.selected_nodes[node2.id])
          delete canvas2.selected_nodes[node2.id];
      }
    }
    const pos = this._nodes.indexOf(node2);
    if (pos != -1) this._nodes.splice(pos, 1);
    delete this._nodes_by_id[node2.id];
    this.onNodeRemoved?.(node2);
    this.canvasAction((c) => c.checkPanels());
    this.setDirtyCanvas(true, true);
    this.afterChange();
    this.change();
    this.updateExecutionOrder();
  }
  /**
   * Returns a node by its id.
   */
  getNodeById(id) {
    return id != null ? this._nodes_by_id[id] : null;
  }
  /**
   * Returns a list of nodes that matches a class
   * @param classObject the class itself (not an string)
   * @returns a list with all the nodes of this type
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  findNodesByClass(classObject, result) {
    result = result || [];
    result.length = 0;
    for (let i = 0, l = this._nodes.length; i < l; ++i) {
      if (this._nodes[i].constructor === classObject)
        result.push(this._nodes[i]);
    }
    return result;
  }
  /**
   * Returns a list of nodes that matches a type
   * @param type the name of the node type
   * @returns a list with all the nodes of this type
   */
  findNodesByType(type, result) {
    const matchType = type.toLowerCase();
    result = result || [];
    result.length = 0;
    for (let i = 0, l = this._nodes.length; i < l; ++i) {
      if (this._nodes[i].type?.toLowerCase() == matchType)
        result.push(this._nodes[i]);
    }
    return result;
  }
  /**
   * Returns the first node that matches a name in its title
   * @param title the name of the node to search
   * @returns the node or null
   */
  findNodeByTitle(title) {
    for (let i = 0, l = this._nodes.length; i < l; ++i) {
      if (this._nodes[i].title == title)
        return this._nodes[i];
    }
    return null;
  }
  /**
   * Returns a list of nodes that matches a name
   * @param title the name of the node to search
   * @returns a list with all the nodes with this name
   */
  findNodesByTitle(title) {
    const result = [];
    for (let i = 0, l = this._nodes.length; i < l; ++i) {
      if (this._nodes[i].title == title)
        result.push(this._nodes[i]);
    }
    return result;
  }
  /**
   * Returns the top-most node in this position of the canvas
   * @param x the x coordinate in canvas space
   * @param y the y coordinate in canvas space
   * @param nodeList a list with all the nodes to search from, by default is all the nodes in the graph
   * @returns the node at this position or null
   */
  getNodeOnPos(x2, y, nodeList) {
    const nodes = nodeList || this._nodes;
    let i = nodes.length;
    while (--i >= 0) {
      const node2 = nodes[i];
      if (node2.isPointInside(x2, y)) return node2;
    }
    return null;
  }
  /**
   * Returns the top-most group in that position
   * @param x The x coordinate in canvas space
   * @param y The y coordinate in canvas space
   * @returns The group or null
   */
  getGroupOnPos(x2, y) {
    return this._groups.toReversed().find((g) => g.isPointInside(x2, y));
  }
  /**
   * Returns the top-most group with a titlebar in the provided position.
   * @param x The x coordinate in canvas space
   * @param y The y coordinate in canvas space
   * @returns The group or null
   */
  getGroupTitlebarOnPos(x2, y) {
    return this._groups.toReversed().find((g) => g.isPointInTitlebar(x2, y));
  }
  /**
   * Finds a reroute a the given graph point
   * @param x X co-ordinate in graph space
   * @param y Y co-ordinate in graph space
   * @returns The first reroute under the given co-ordinates, or undefined
   */
  getRerouteOnPos(x2, y) {
    for (const reroute of this.reroutes.values()) {
      const { pos } = reroute;
      if (isSortaInsideOctagon(x2 - pos[0], y - pos[1], 2 * Reroute.radius))
        return reroute;
    }
  }
  /**
   * Snaps the provided items to a grid.
   *
   * Item positions are reounded to the nearest multiple of {@link LiteGraph.CANVAS_GRID_SIZE}.
   *
   * When {@link LiteGraph.alwaysSnapToGrid} is enabled
   * and the grid size is falsy, a default of 1 is used.
   * @param items The items to be snapped to the grid
   * @todo Currently only snaps nodes.
   */
  snapToGrid(items) {
    const snapTo = this.getSnapToGridSize();
    if (!snapTo) return;
    getAllNestedItems(items).forEach((item) => {
      if (!item.pinned) item.snapToGrid(snapTo);
    });
  }
  /**
   * Finds the size of the grid that items should be snapped to when moved.
   * @returns The size of the grid that items should be snapped to
   */
  getSnapToGridSize() {
    return LiteGraph.alwaysSnapToGrid ? LiteGraph.CANVAS_GRID_SIZE || 1 : LiteGraph.CANVAS_GRID_SIZE;
  }
  /**
   * Checks that the node type matches the node type registered,
   * used when replacing a nodetype by a newer version during execution
   * this replaces the ones using the old version with the new version
   */
  checkNodeTypes() {
    for (let i = 0; i < this._nodes.length; i++) {
      const node2 = this._nodes[i];
      const ctor = LiteGraph.registered_node_types[node2.type];
      if (node2.constructor == ctor) continue;
      console.log("node being replaced by newer version: " + node2.type);
      const newnode = LiteGraph.createNode(node2.type);
      this._nodes[i] = newnode;
      newnode.configure(node2.serialize());
      newnode.graph = this;
      this._nodes_by_id[newnode.id] = newnode;
      if (node2.inputs) newnode.inputs = node2.inputs.concat();
      if (node2.outputs) newnode.outputs = node2.outputs.concat();
    }
    this.updateExecutionOrder();
  }
  // ********** GLOBALS *****************
  onAction(action, param, options2) {
    this._input_nodes = this.findNodesByClass(
      // @ts-expect-error Never impl.
      LiteGraph.GraphInput,
      this._input_nodes
    );
    for (let i = 0; i < this._input_nodes.length; ++i) {
      const node2 = this._input_nodes[i];
      if (node2.properties.name != action) continue;
      node2.actionDo(action, param, options2);
      break;
    }
  }
  trigger(action, param) {
    this.onTrigger?.(action, param);
  }
  /**
   * Tell this graph it has a global graph input of this type
   */
  addInput(name, type, value) {
    const input = this.inputs[name];
    if (input) return;
    this.beforeChange();
    this.inputs[name] = { name, type, value };
    this._version++;
    this.afterChange();
    this.onInputAdded?.(name, type);
    this.onInputsOutputsChange?.();
  }
  /**
   * Assign a data to the global graph input
   */
  setInputData(name, data) {
    const input = this.inputs[name];
    if (!input) return;
    input.value = data;
  }
  /**
   * Returns the current value of a global graph input
   */
  getInputData(name) {
    const input = this.inputs[name];
    return input ? input.value : null;
  }
  /**
   * Changes the name of a global graph input
   */
  renameInput(old_name, name) {
    if (name == old_name) return;
    if (!this.inputs[old_name]) return false;
    if (this.inputs[name]) {
      console.error("there is already one input with that name");
      return false;
    }
    this.inputs[name] = this.inputs[old_name];
    delete this.inputs[old_name];
    this._version++;
    this.onInputRenamed?.(old_name, name);
    this.onInputsOutputsChange?.();
  }
  /**
   * Changes the type of a global graph input
   */
  changeInputType(name, type) {
    if (!this.inputs[name]) return false;
    if (this.inputs[name].type && String(this.inputs[name].type).toLowerCase() == String(type).toLowerCase()) {
      return;
    }
    this.inputs[name].type = type;
    this._version++;
    this.onInputTypeChanged?.(name, type);
  }
  /**
   * Removes a global graph input
   */
  removeInput(name) {
    if (!this.inputs[name]) return false;
    delete this.inputs[name];
    this._version++;
    this.onInputRemoved?.(name);
    this.onInputsOutputsChange?.();
    return true;
  }
  /**
   * Creates a global graph output
   */
  addOutput(name, type, value) {
    this.outputs[name] = { name, type, value };
    this._version++;
    this.onOutputAdded?.(name, type);
    this.onInputsOutputsChange?.();
  }
  /**
   * Assign a data to the global output
   */
  setOutputData(name, value) {
    const output = this.outputs[name];
    if (!output) return;
    output.value = value;
  }
  /**
   * Returns the current value of a global graph output
   */
  getOutputData(name) {
    const output = this.outputs[name];
    if (!output) return null;
    return output.value;
  }
  /**
   * Renames a global graph output
   */
  renameOutput(old_name, name) {
    if (!this.outputs[old_name]) return false;
    if (this.outputs[name]) {
      console.error("there is already one output with that name");
      return false;
    }
    this.outputs[name] = this.outputs[old_name];
    delete this.outputs[old_name];
    this._version++;
    this.onOutputRenamed?.(old_name, name);
    this.onInputsOutputsChange?.();
  }
  /**
   * Changes the type of a global graph output
   */
  changeOutputType(name, type) {
    if (!this.outputs[name]) return false;
    if (this.outputs[name].type && String(this.outputs[name].type).toLowerCase() == String(type).toLowerCase()) {
      return;
    }
    this.outputs[name].type = type;
    this._version++;
    this.onOutputTypeChanged?.(name, type);
  }
  /**
   * Removes a global graph output
   */
  removeOutput(name) {
    if (!this.outputs[name]) return false;
    delete this.outputs[name];
    this._version++;
    this.onOutputRemoved?.(name);
    this.onInputsOutputsChange?.();
    return true;
  }
  /** @todo Clean up - never implemented. */
  triggerInput(name, value) {
    const nodes = this.findNodesByTitle(name);
    for (let i = 0; i < nodes.length; ++i) {
      nodes[i].onTrigger(value);
    }
  }
  /** @todo Clean up - never implemented. */
  setCallback(name, func) {
    const nodes = this.findNodesByTitle(name);
    for (let i = 0; i < nodes.length; ++i) {
      nodes[i].setTrigger(func);
    }
  }
  // used for undo, called before any change is made to the graph
  beforeChange(info) {
    this.onBeforeChange?.(this, info);
    this.canvasAction((c) => c.onBeforeChange?.(this));
  }
  // used to resend actions, called after any change is made to the graph
  afterChange(info) {
    this.onAfterChange?.(this, info);
    this.canvasAction((c) => c.onAfterChange?.(this));
  }
  connectionChange(node2) {
    this.updateExecutionOrder();
    this.onConnectionChange?.(node2);
    this._version++;
    this.canvasAction((c) => c.onConnectionChange?.());
  }
  /**
   * clears the triggered slot animation in all links (stop visual animation)
   */
  clearTriggeredSlots() {
    for (const link_info of this._links.values()) {
      if (!link_info) continue;
      if (link_info._last_time) link_info._last_time = 0;
    }
  }
  /* Called when something visually changed (not the graph!) */
  change() {
    if (LiteGraph.debug) {
      console.log("Graph changed");
    }
    this.canvasAction((c) => c.setDirty(true, true));
    this.on_change?.(this);
  }
  setDirtyCanvas(fg, bg) {
    this.canvasAction((c) => c.setDirty(fg, bg));
  }
  /**
   * Configures a reroute on the graph where ID is already known (probably deserialisation).
   * Creates the object if it does not exist.
   * @param serialisedReroute See {@link SerialisableReroute}
   */
  setReroute({ id, parentId, pos, linkIds }) {
    id ??= ++this.state.lastRerouteId;
    if (id > this.state.lastRerouteId) this.state.lastRerouteId = id;
    const reroute = this.reroutes.get(id) ?? new Reroute(id, this);
    reroute.update(parentId, pos, linkIds);
    this.reroutes.set(id, reroute);
    return reroute;
  }
  /**
   * Creates a new reroute and adds it to the graph.
   * @param pos Position in graph space
   * @param before The existing link segment (reroute, link) that will be after this reroute,
   * going from the node output to input.
   * @returns The newly created reroute - typically ignored.
   */
  createReroute(pos, before) {
    const rerouteId = ++this.state.lastRerouteId;
    const linkIds = before instanceof Reroute ? before.linkIds : [before.id];
    const reroute = new Reroute(rerouteId, this, pos, before.parentId, linkIds);
    this.reroutes.set(rerouteId, reroute);
    for (const linkId of linkIds) {
      const link = this._links.get(linkId);
      if (!link) continue;
      if (link.parentId === before.parentId) link.parentId = rerouteId;
      LLink.getReroutes(this, link)?.filter((x2) => x2.parentId === before.parentId).forEach((x2) => x2.parentId = rerouteId);
    }
    return reroute;
  }
  /**
   * Removes a reroute from the graph
   * @param id ID of reroute to remove
   */
  removeReroute(id) {
    const { reroutes } = this;
    const reroute = reroutes.get(id);
    if (!reroute) return;
    const { parentId, linkIds } = reroute;
    for (const reroute2 of reroutes.values()) {
      if (reroute2.parentId === id) reroute2.parentId = parentId;
    }
    for (const linkId of linkIds) {
      const link = this._links.get(linkId);
      if (link && link.parentId === id) link.parentId = parentId;
    }
    reroutes.delete(id);
    this.setDirtyCanvas(false, true);
  }
  /**
   * Destroys a link
   */
  removeLink(link_id) {
    const link = this._links.get(link_id);
    if (!link) return;
    const node2 = this.getNodeById(link.target_id);
    node2?.disconnectInput(link.target_slot);
    link.disconnect(this);
  }
  /**
   * Creates a Object containing all the info about this graph, it can be serialized
   * @deprecated Use {@link asSerialisable}, which returns the newer schema version.
   * @returns value of the node
   */
  serialize(option) {
    const { config, state, groups, nodes, reroutes, extra } = this.asSerialisable(option);
    const linkArray = [...this._links.values()];
    const links = linkArray.map((x2) => x2.serialize());
    if (reroutes.length) {
      extra.reroutes = reroutes;
      extra.linkExtensions = linkArray.filter((x2) => x2.parentId !== void 0).map((x2) => ({ id: x2.id, parentId: x2.parentId }));
    }
    return {
      last_node_id: state.lastNodeId,
      last_link_id: state.lastLinkId,
      nodes,
      links,
      groups,
      config,
      extra,
      version: LiteGraph.VERSION
    };
  }
  /**
   * Prepares a shallow copy of this object for immediate serialisation or structuredCloning.
   * The return value should be discarded immediately.
   * @param options Serialise options = currently `sortNodes: boolean`, whether to sort nodes by ID.
   * @returns A shallow copy of parts of this graph, with shallow copies of its serialisable objects.
   * Mutating the properties of the return object may result in changes to your graph.
   * It is intended for use with {@link structuredClone} or {@link JSON.stringify}.
   */
  asSerialisable(options2) {
    const { config, state, extra } = this;
    const nodeList = !LiteGraph.use_uuids && options2?.sortNodes ? [...this._nodes].sort((a, b) => a.id - b.id) : this._nodes;
    const nodes = nodeList.map((node2) => node2.serialize());
    const groups = this._groups.map((x2) => x2.serialize());
    const links = [...this._links.values()].map((x2) => x2.asSerialisable());
    const reroutes = [...this.reroutes.values()].map((x2) => x2.asSerialisable());
    const data = {
      version: LGraph.serialisedSchemaVersion,
      config,
      state,
      groups,
      nodes,
      links,
      reroutes,
      extra
    };
    this.onSerialize?.(data);
    return data;
  }
  /**
   * Configure a graph from a JSON string
   * @param data The deserialised object to configure this graph from
   * @param keep_old If `true`, the graph will not be cleared prior to
   * adding the configuration.
   */
  configure(data, keep_old) {
    if (!data) return;
    if (!keep_old) this.clear();
    const { extra } = data;
    let reroutes;
    if (data.version === 0.4) {
      if (Array.isArray(data.links)) {
        for (const linkData of data.links) {
          const link = LLink.createFromArray(linkData);
          this._links.set(link.id, link);
        }
      }
      if (Array.isArray(extra?.linkExtensions)) {
        for (const linkEx of extra.linkExtensions) {
          const link = this._links.get(linkEx.id);
          if (link) link.parentId = linkEx.parentId;
        }
      }
      reroutes = extra?.reroutes;
    } else {
      if (data.state) {
        const { state: { lastGroupId, lastLinkId, lastNodeId, lastRerouteId } } = data;
        if (lastGroupId != null) this.state.lastGroupId = lastGroupId;
        if (lastLinkId != null) this.state.lastLinkId = lastLinkId;
        if (lastNodeId != null) this.state.lastNodeId = lastNodeId;
        if (lastRerouteId != null) this.state.lastRerouteId = lastRerouteId;
      }
      if (Array.isArray(data.links)) {
        for (const linkData of data.links) {
          const link = LLink.create(linkData);
          this._links.set(link.id, link);
        }
      }
      reroutes = data.reroutes;
    }
    if (Array.isArray(reroutes)) {
      for (const rerouteData of reroutes) {
        const reroute = this.setReroute(rerouteData);
        if (!reroute.validateLinks(this._links))
          this.reroutes.delete(rerouteData.id);
      }
    }
    const nodesData = data.nodes;
    for (const i in data) {
      if (i == "nodes" || i == "groups" || i == "links" || i === "state" || i === "reroutes")
        continue;
      this[i] = data[i];
    }
    let error = false;
    this._nodes = [];
    if (nodesData) {
      for (let i = 0, l = nodesData.length; i < l; ++i) {
        const n_info = nodesData[i];
        let node2 = LiteGraph.createNode(n_info.type, n_info.title);
        if (!node2) {
          if (LiteGraph.debug) console.log("Node not found or has errors: " + n_info.type);
          node2 = new LGraphNode(void 0);
          node2.last_serialization = n_info;
          node2.has_errors = true;
          error = true;
        }
        node2.id = n_info.id;
        this.add(node2, true);
      }
      for (let i = 0, l = nodesData.length; i < l; ++i) {
        const n_info = nodesData[i];
        const node2 = this.getNodeById(n_info.id);
        node2?.configure(n_info);
      }
    }
    this._groups.length = 0;
    if (data.groups) {
      for (let i = 0; i < data.groups.length; ++i) {
        const group = new LiteGraph.LGraphGroup();
        group.configure(data.groups[i]);
        this.add(group);
      }
    }
    this.updateExecutionOrder();
    this.extra = data.extra || {};
    this.onConfigure?.(data);
    this._version++;
    this.setDirtyCanvas(true, true);
    return error;
  }
  load(url, callback) {
    const that = this;
    if (url instanceof Blob || url instanceof File) {
      const reader = new FileReader();
      reader.addEventListener("load", function(event) {
        const data = JSON.parse(event.target.result.toString());
        that.configure(data);
        callback?.();
      });
      reader.readAsText(url);
      return;
    }
    const req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.send(null);
    req.onload = function() {
      if (req.status !== 200) {
        console.error("Error loading graph:", req.status, req.response);
        return;
      }
      const data = JSON.parse(req.response);
      that.configure(data);
      callback?.();
    };
    req.onerror = function(err) {
      console.error("Error loading graph:", err);
    };
  }
  onNodeTrace(node2, msg) {
  }
}
class ContextMenu {
  options;
  parentMenu;
  root;
  current_submenu;
  lock;
  /**
   * @todo Interface for values requires functionality change - currently accepts
   * an array of strings, functions, objects, nulls, or undefined.
   * @param values (allows object { title: "Nice text", callback: function ... })
   * @param options [optional] Some options:\
   * - title: title to show on top of the menu
   * - callback: function to call when an option is clicked, it receives the item information
   * - ignore_item_callbacks: ignores the callback inside the item, it just calls the options.callback
   * - event: you can pass a MouseEvent, this way the ContextMenu appears in that position
   */
  constructor(values, options2) {
    options2 ||= {};
    this.options = options2;
    const parent = options2.parentMenu;
    if (parent) {
      if (!(parent instanceof ContextMenu)) {
        console.error("parentMenu must be of class ContextMenu, ignoring it");
        options2.parentMenu = null;
      } else {
        this.parentMenu = parent;
        this.parentMenu.lock = true;
        this.parentMenu.current_submenu = this;
      }
      if (parent.options?.className === "dark") {
        options2.className = "dark";
      }
    }
    const eventClass = options2.event ? options2.event.constructor.name : null;
    if (eventClass !== "MouseEvent" && eventClass !== "CustomEvent" && eventClass !== "PointerEvent") {
      console.error(`Event passed to ContextMenu is not of type MouseEvent or CustomEvent. Ignoring it. (${eventClass})`);
      options2.event = null;
    }
    const root = document.createElement("div");
    let classes = "litegraph litecontextmenu litemenubar-panel";
    if (options2.className) classes += " " + options2.className;
    root.className = classes;
    root.style.minWidth = "100";
    root.style.minHeight = "100";
    root.style.pointerEvents = "none";
    setTimeout(function() {
      root.style.pointerEvents = "auto";
    }, 100);
    LiteGraph.pointerListenerAdd(
      root,
      "up",
      function(e2) {
        e2.preventDefault();
        return true;
      },
      true
    );
    root.addEventListener(
      "contextmenu",
      function(e2) {
        if (e2.button != 2) return false;
        e2.preventDefault();
        return false;
      },
      true
    );
    LiteGraph.pointerListenerAdd(
      root,
      "down",
      (e2) => {
        if (e2.button == 2) {
          this.close();
          e2.preventDefault();
          return true;
        }
      },
      true
    );
    this.root = root;
    if (options2.title) {
      const element = document.createElement("div");
      element.className = "litemenu-title";
      element.innerHTML = options2.title;
      root.appendChild(element);
    }
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      let name = Array.isArray(values) ? value : String(i);
      if (typeof name !== "string") {
        name = name != null ? name.content === void 0 ? String(name) : name.content : name;
      }
      this.addItem(name, value, options2);
    }
    LiteGraph.pointerListenerAdd(root, "enter", function() {
      if (root.closing_timer) {
        clearTimeout(root.closing_timer);
      }
    });
    const ownerDocument = (options2.event?.target).ownerDocument;
    const root_document = ownerDocument || document;
    if (root_document.fullscreenElement)
      root_document.fullscreenElement.appendChild(root);
    else
      root_document.body.appendChild(root);
    let left = options2.left || 0;
    let top = options2.top || 0;
    if (options2.event) {
      left = options2.event.clientX - 10;
      top = options2.event.clientY - 10;
      if (options2.title) top -= 20;
      if (parent) {
        const rect = parent.root.getBoundingClientRect();
        left = rect.left + rect.width;
      }
      const body_rect = document.body.getBoundingClientRect();
      const root_rect = root.getBoundingClientRect();
      if (body_rect.height == 0)
        console.error("document.body height is 0. That is dangerous, set html,body { height: 100%; }");
      if (body_rect.width && left > body_rect.width - root_rect.width - 10)
        left = body_rect.width - root_rect.width - 10;
      if (body_rect.height && top > body_rect.height - root_rect.height - 10)
        top = body_rect.height - root_rect.height - 10;
    }
    root.style.left = left + "px";
    root.style.top = top + "px";
    if (LiteGraph.context_menu_scaling && options2.scale) {
      root.style.transform = `scale(${Math.round(options2.scale * 4) * 0.25})`;
    }
  }
  addItem(name, value, options2) {
    options2 ||= {};
    const element = document.createElement("div");
    element.className = "litemenu-entry submenu";
    let disabled = false;
    if (value === null) {
      element.classList.add("separator");
    } else {
      if (typeof value === "string") {
        element.innerHTML = name;
      } else {
        element.innerHTML = value?.title ?? name;
        if (value.disabled) {
          disabled = true;
          element.classList.add("disabled");
          element.setAttribute("aria-disabled", "true");
        }
        if (value.submenu || value.has_submenu) {
          element.classList.add("has_submenu");
          element.setAttribute("aria-haspopup", "true");
          element.setAttribute("aria-expanded", "false");
        }
        if (value.className) element.className += " " + value.className;
      }
      element.value = value;
      element.setAttribute("role", "menuitem");
      if (typeof value === "function") {
        element.dataset["value"] = name;
        element.onclick_callback = value;
      } else {
        element.dataset["value"] = String(value);
      }
    }
    this.root.appendChild(element);
    if (!disabled) element.addEventListener("click", inner_onclick);
    if (!disabled && options2.autoopen)
      LiteGraph.pointerListenerAdd(element, "enter", inner_over);
    const setAriaExpanded = () => {
      const entries = this.root.querySelectorAll("div.litemenu-entry.has_submenu");
      if (entries) {
        for (let i = 0; i < entries.length; i++) {
          entries[i].setAttribute("aria-expanded", "false");
        }
      }
      element.setAttribute("aria-expanded", "true");
    };
    function inner_over(e2) {
      const value2 = this.value;
      if (!value2 || !value2.has_submenu) return;
      inner_onclick.call(this, e2);
      setAriaExpanded();
    }
    const that = this;
    function inner_onclick(e2) {
      const value2 = this.value;
      let close_parent = true;
      that.current_submenu?.close(e2);
      if (value2?.has_submenu || value2?.submenu) {
        setAriaExpanded();
      }
      if (options2.callback) {
        const r = options2.callback.call(
          this,
          value2,
          options2,
          e2,
          that,
          options2.node
        );
        if (r === true) close_parent = false;
      }
      if (typeof value2 === "object") {
        if (value2.callback && !options2.ignore_item_callbacks && value2.disabled !== true) {
          const r = value2.callback.call(
            this,
            value2,
            options2,
            e2,
            that,
            options2.extra
          );
          if (r === true) close_parent = false;
        }
        if (value2.submenu) {
          if (!value2.submenu.options) throw "ContextMenu submenu needs options";
          new that.constructor(value2.submenu.options, {
            callback: value2.submenu.callback,
            event: e2,
            parentMenu: that,
            ignore_item_callbacks: value2.submenu.ignore_item_callbacks,
            title: value2.submenu.title,
            extra: value2.submenu.extra,
            autoopen: options2.autoopen
          });
          close_parent = false;
        }
      }
      if (close_parent && !that.lock) that.close();
    }
    return element;
  }
  close(e2, ignore_parent_menu) {
    this.root.remove();
    if (this.parentMenu && !ignore_parent_menu) {
      this.parentMenu.lock = false;
      this.parentMenu.current_submenu = null;
      if (e2 === void 0) {
        this.parentMenu.close();
      } else if (e2 && !ContextMenu.isCursorOverElement(e2, this.parentMenu.root)) {
        ContextMenu.trigger(
          this.parentMenu.root,
          LiteGraph.pointerevents_method + "leave",
          e2
        );
      }
    }
    this.current_submenu?.close(e2, true);
    if (this.root.closing_timer) clearTimeout(this.root.closing_timer);
  }
  // this code is used to trigger events easily (used in the context menu mouseleave
  static trigger(element, event_name, params, origin) {
    const evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(event_name, true, true, params);
    if (element.dispatchEvent) element.dispatchEvent(evt);
    else if (element.__events) element.__events.dispatchEvent(evt);
    return evt;
  }
  // returns the top most menu
  getTopMenu() {
    return this.options.parentMenu ? this.options.parentMenu.getTopMenu() : this;
  }
  getFirstEvent() {
    return this.options.parentMenu ? this.options.parentMenu.getFirstEvent() : this.options.event;
  }
  static isCursorOverElement(event, element) {
    const left = event.clientX;
    const top = event.clientY;
    const rect = element.getBoundingClientRect();
    if (!rect) return false;
    if (top > rect.top && top < rect.top + rect.height && left > rect.left && left < rect.left + rect.width) {
      return true;
    }
    return false;
  }
}
class CurveEditor {
  points;
  selected;
  nearest;
  size;
  must_update;
  margin;
  _nearest;
  constructor(points) {
    this.points = points;
    this.selected = -1;
    this.nearest = -1;
    this.size = null;
    this.must_update = true;
    this.margin = 5;
  }
  static sampleCurve(f, points) {
    if (!points) return;
    for (let i = 0; i < points.length - 1; ++i) {
      const p = points[i];
      const pn = points[i + 1];
      if (pn[0] < f) continue;
      const r = pn[0] - p[0];
      if (Math.abs(r) < 1e-5) return p[1];
      const local_f = (f - p[0]) / r;
      return p[1] * (1 - local_f) + pn[1] * local_f;
    }
    return 0;
  }
  draw(ctx, size, graphcanvas, background_color, line_color, inactive = false) {
    const points = this.points;
    if (!points) return;
    this.size = size;
    const w = size[0] - this.margin * 2;
    const h = size[1] - this.margin * 2;
    line_color = line_color || "#666";
    ctx.save();
    ctx.translate(this.margin, this.margin);
    if (background_color) {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#222";
      ctx.fillRect(w * 0.5, 0, 1, h);
      ctx.strokeStyle = "#333";
      ctx.strokeRect(0, 0, w, h);
    }
    ctx.strokeStyle = line_color;
    if (inactive) ctx.globalAlpha = 0.5;
    ctx.beginPath();
    for (let i = 0; i < points.length; ++i) {
      const p = points[i];
      ctx.lineTo(p[0] * w, (1 - p[1]) * h);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (!inactive)
      for (let i = 0; i < points.length; ++i) {
        const p = points[i];
        ctx.fillStyle = this.selected == i ? "#FFF" : this.nearest == i ? "#DDD" : "#AAA";
        ctx.beginPath();
        ctx.arc(p[0] * w, (1 - p[1]) * h, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.restore();
  }
  // localpos is mouse in curve editor space
  onMouseDown(localpos, graphcanvas) {
    const points = this.points;
    if (!points) return;
    if (localpos[1] < 0) return;
    const w = this.size[0] - this.margin * 2;
    const h = this.size[1] - this.margin * 2;
    const x2 = localpos[0] - this.margin;
    const y = localpos[1] - this.margin;
    const pos = [x2, y];
    const max_dist = 30 / graphcanvas.ds.scale;
    this.selected = this.getCloserPoint(pos, max_dist);
    if (this.selected == -1) {
      const point = [x2 / w, 1 - y / h];
      points.push(point);
      points.sort(function(a, b) {
        return a[0] - b[0];
      });
      this.selected = points.indexOf(point);
      this.must_update = true;
    }
    if (this.selected != -1) return true;
  }
  onMouseMove(localpos, graphcanvas) {
    const points = this.points;
    if (!points) return;
    const s = this.selected;
    if (s < 0) return;
    const x2 = (localpos[0] - this.margin) / (this.size[0] - this.margin * 2);
    const y = (localpos[1] - this.margin) / (this.size[1] - this.margin * 2);
    const curvepos = [
      localpos[0] - this.margin,
      localpos[1] - this.margin
    ];
    const max_dist = 30 / graphcanvas.ds.scale;
    this._nearest = this.getCloserPoint(curvepos, max_dist);
    const point = points[s];
    if (point) {
      const is_edge_point = s == 0 || s == points.length - 1;
      if (!is_edge_point && (localpos[0] < -10 || localpos[0] > this.size[0] + 10 || localpos[1] < -10 || localpos[1] > this.size[1] + 10)) {
        points.splice(s, 1);
        this.selected = -1;
        return;
      }
      if (!is_edge_point) point[0] = clamp(x2, 0, 1);
      else point[0] = s == 0 ? 0 : 1;
      point[1] = 1 - clamp(y, 0, 1);
      points.sort(function(a, b) {
        return a[0] - b[0];
      });
      this.selected = points.indexOf(point);
      this.must_update = true;
    }
  }
  // Former params: localpos, graphcanvas
  onMouseUp() {
    this.selected = -1;
    return false;
  }
  getCloserPoint(pos, max_dist) {
    const points = this.points;
    if (!points) return -1;
    max_dist = max_dist || 30;
    const w = this.size[0] - this.margin * 2;
    const h = this.size[1] - this.margin * 2;
    const num = points.length;
    const p2 = [0, 0];
    let min_dist = 1e6;
    let closest = -1;
    for (let i = 0; i < num; ++i) {
      const p = points[i];
      p2[0] = p[0] * w;
      p2[1] = (1 - p[1]) * h;
      const dist = distance(pos, p2);
      if (dist > min_dist || dist > max_dist) continue;
      closest = i;
      min_dist = dist;
    }
    return closest;
  }
}
class LiteGraphGlobal {
  // Enums
  SlotShape = SlotShape;
  SlotDirection = SlotDirection;
  SlotType = SlotType;
  LabelPosition = LabelPosition;
  /** Used in serialised graphs at one point. */
  VERSION = 0.4;
  CANVAS_GRID_SIZE = 10;
  NODE_TITLE_HEIGHT = 30;
  NODE_TITLE_TEXT_Y = 20;
  NODE_SLOT_HEIGHT = 20;
  NODE_WIDGET_HEIGHT = 20;
  NODE_WIDTH = 140;
  NODE_MIN_WIDTH = 50;
  NODE_COLLAPSED_RADIUS = 10;
  NODE_COLLAPSED_WIDTH = 80;
  NODE_TITLE_COLOR = "#999";
  NODE_SELECTED_TITLE_COLOR = "#FFF";
  NODE_TEXT_SIZE = 14;
  NODE_TEXT_COLOR = "#AAA";
  NODE_TEXT_HIGHLIGHT_COLOR = "#EEE";
  NODE_SUBTEXT_SIZE = 12;
  NODE_DEFAULT_COLOR = "#333";
  NODE_DEFAULT_BGCOLOR = "#353535";
  NODE_DEFAULT_BOXCOLOR = "#666";
  NODE_DEFAULT_SHAPE = RenderShape.ROUND;
  NODE_BOX_OUTLINE_COLOR = "#FFF";
  NODE_ERROR_COLOUR = "#E00";
  DEFAULT_SHADOW_COLOR = "rgba(0,0,0,0.5)";
  DEFAULT_GROUP_FONT = 24;
  DEFAULT_GROUP_FONT_SIZE;
  WIDGET_BGCOLOR = "#222";
  WIDGET_OUTLINE_COLOR = "#666";
  WIDGET_ADVANCED_OUTLINE_COLOR = "rgba(56, 139, 253, 0.8)";
  WIDGET_TEXT_COLOR = "#DDD";
  WIDGET_SECONDARY_TEXT_COLOR = "#999";
  LINK_COLOR = "#9A9";
  // TODO: This is a workaround until LGraphCanvas.link_type_colors is no longer static.
  static DEFAULT_EVENT_LINK_COLOR = "#A86";
  EVENT_LINK_COLOR = "#A86";
  CONNECTING_LINK_COLOR = "#AFA";
  /** avoid infinite loops */
  MAX_NUMBER_OF_NODES = 1e4;
  /** default node position */
  DEFAULT_POSITION = [100, 100];
  /** ,"circle" */
  VALID_SHAPES = ["default", "box", "round", "card"];
  ROUND_RADIUS = 8;
  // shapes are used for nodes but also for slots
  BOX_SHAPE = RenderShape.BOX;
  ROUND_SHAPE = RenderShape.ROUND;
  CIRCLE_SHAPE = RenderShape.CIRCLE;
  CARD_SHAPE = RenderShape.CARD;
  ARROW_SHAPE = RenderShape.ARROW;
  /** intended for slot arrays */
  GRID_SHAPE = RenderShape.GRID;
  // enums
  INPUT = NodeSlotType.INPUT;
  OUTPUT = NodeSlotType.OUTPUT;
  // TODO: -1 can lead to ambiguity in JS; these should be updated to a more explicit constant or Symbol.
  /** for outputs */
  EVENT = -1;
  /** for inputs */
  ACTION = -1;
  /** helper, will add "On Request" and more in the future */
  NODE_MODES = ["Always", "On Event", "Never", "On Trigger"];
  /** use with node_box_coloured_by_mode */
  NODE_MODES_COLORS = ["#666", "#422", "#333", "#224", "#626"];
  ALWAYS = LGraphEventMode.ALWAYS;
  ON_EVENT = LGraphEventMode.ON_EVENT;
  NEVER = LGraphEventMode.NEVER;
  ON_TRIGGER = LGraphEventMode.ON_TRIGGER;
  UP = LinkDirection.UP;
  DOWN = LinkDirection.DOWN;
  LEFT = LinkDirection.LEFT;
  RIGHT = LinkDirection.RIGHT;
  CENTER = LinkDirection.CENTER;
  /** helper */
  LINK_RENDER_MODES = ["Straight", "Linear", "Spline"];
  HIDDEN_LINK = LinkRenderType.HIDDEN_LINK;
  STRAIGHT_LINK = LinkRenderType.STRAIGHT_LINK;
  LINEAR_LINK = LinkRenderType.LINEAR_LINK;
  SPLINE_LINK = LinkRenderType.SPLINE_LINK;
  NORMAL_TITLE = TitleMode.NORMAL_TITLE;
  NO_TITLE = TitleMode.NO_TITLE;
  TRANSPARENT_TITLE = TitleMode.TRANSPARENT_TITLE;
  AUTOHIDE_TITLE = TitleMode.AUTOHIDE_TITLE;
  /** arrange nodes vertically */
  VERTICAL_LAYOUT = "vertical";
  /** used to redirect calls */
  proxy = null;
  node_images_path = "";
  debug = false;
  catch_exceptions = true;
  throw_errors = true;
  allow_scripts = false;
  // if set to true some nodes like Formula would be allowed to evaluate code that comes from unsafe sources (like node configuration), which could lead to exploits
  /** nodetypes by string */
  registered_node_types = {};
  /** used for dropping files in the canvas */
  node_types_by_file_extension = {};
  /** node types by classname */
  Nodes = {};
  /** used to store vars between graphs */
  Globals = {};
  /** used to add extra features to the search box */
  searchbox_extras = {};
  /** [true!] If set to true, will automatically sort node types / categories in the context menus */
  auto_sort_node_types = false;
  /** [true!] this make the nodes box (top left circle) coloured when triggered (execute/action), visual feedback */
  node_box_coloured_when_on = false;
  /** [true!] nodebox based on node mode, visual feedback */
  node_box_coloured_by_mode = false;
  /** [false on mobile] better true if not touch device, TODO add an helper/listener to close if false */
  dialog_close_on_mouse_leave = false;
  dialog_close_on_mouse_leave_delay = 500;
  /** [false!] prefer false if results too easy to break links - implement with ALT or TODO custom keys */
  shift_click_do_break_link_from = false;
  /** [false!]prefer false, way too easy to break links */
  click_do_break_link_to = false;
  /** [true!] who accidentally ctrl-alt-clicks on an in/output? nobody! that's who! */
  ctrl_alt_click_do_break_link = true;
  /** [true!] snaps links when dragging connections over valid targets */
  snaps_for_comfy = true;
  /** [true!] renders a partial border to highlight when a dragged link is snapped to a node */
  snap_highlights_node = true;
  /**
   * If `true`, items always snap to the grid - modifier keys are ignored.
   * When {@link snapToGrid} is falsy, a value of `1` is used.
   * Default: `false`
   */
  alwaysSnapToGrid;
  /**
   * When set to a positive number, when nodes are moved their positions will
   * be rounded to the nearest multiple of this value.  Half up.
   * Default: `undefined`
   * @todo Not implemented - see {@link LiteGraph.CANVAS_GRID_SIZE}
   */
  snapToGrid;
  /** [false on mobile] better true if not touch device, TODO add an helper/listener to close if false */
  search_hide_on_mouse_leave = true;
  /**
   * [true!] enable filtering slots type in the search widget
   * !requires auto_load_slot_types or manual set registered_slot_[in/out]_types and slot_types_[in/out]
   */
  search_filter_enabled = false;
  /** [true!] opens the results list when opening the search widget */
  search_show_all_on_open = true;
  /**
   * [if want false, use true, run, get vars values to be statically set, than disable]
   * nodes types and nodeclass association with node types need to be calculated,
   * if dont want this, calculate once and set registered_slot_[in/out]_types and slot_types_[in/out]
   */
  auto_load_slot_types = false;
  // set these values if not using auto_load_slot_types
  /** slot types for nodeclass */
  registered_slot_in_types = {};
  /** slot types for nodeclass */
  registered_slot_out_types = {};
  /** slot types IN */
  slot_types_in = [];
  /** slot types OUT */
  slot_types_out = [];
  /**
   * specify for each IN slot type a(/many) default node(s), use single string, array, or object
   * (with node, title, parameters, ..) like for search
   */
  slot_types_default_in = {};
  /**
   * specify for each OUT slot type a(/many) default node(s), use single string, array, or object
   * (with node, title, parameters, ..) like for search
   */
  slot_types_default_out = {};
  /** [true!] very handy, ALT click to clone and drag the new node */
  alt_drag_do_clone_nodes = false;
  /**
   * [true!] will create and connect event slots when using action/events connections,
   * !WILL CHANGE node mode when using onTrigger (enable mode colors), onExecuted does not need this
   */
  do_add_triggers_slots = false;
  /** [false!] being events, it is strongly reccomended to use them sequentially, one by one */
  allow_multi_output_for_events = true;
  /** [true!] allows to create and connect a ndoe clicking with the third button (wheel) */
  middle_click_slot_add_default_node = false;
  /** [true!] dragging a link to empty space will open a menu, add from list, search or defaults */
  release_link_on_empty_shows_menu = false;
  /** "mouse"|"pointer" use mouse for retrocompatibility issues? (none found @ now) */
  pointerevents_method = "pointer";
  /**
   * [true!] allows ctrl + shift + v to paste nodes with the outputs of the unselected nodes connected
   * with the inputs of the newly pasted nodes
   */
  ctrl_shift_v_paste_connect_unselected_outputs = true;
  // if true, all newly created nodes/links will use string UUIDs for their id fields instead of integers.
  // use this if you must have node IDs that are unique across all graphs and subgraphs.
  use_uuids = false;
  // Whether to highlight the bounding box of selected groups
  highlight_selected_group = true;
  /** If `true`, the old "eye-melting-red" error indicator will be used for nodes */
  use_legacy_node_error_indicator = false;
  /** Whether to scale context with the graph when zooming in.  Zooming out never makes context menus smaller. */
  context_menu_scaling = false;
  // TODO: Remove legacy accessors
  LGraph = LGraph;
  LLink = LLink;
  LGraphNode = LGraphNode;
  LGraphGroup = LGraphGroup;
  DragAndScale = DragAndScale;
  LGraphCanvas = LGraphCanvas;
  ContextMenu = ContextMenu;
  CurveEditor = CurveEditor;
  Reroute = Reroute;
  static {
    LGraphCanvas.link_type_colors = {
      "-1": LiteGraphGlobal.DEFAULT_EVENT_LINK_COLOR,
      "number": "#AAA",
      "node": "#DCA"
    };
  }
  constructor() {
    if (typeof performance != "undefined") {
      this.getTime = performance.now.bind(performance);
    } else if (typeof Date != "undefined" && Date.now) {
      this.getTime = Date.now.bind(Date);
    } else if (typeof process != "undefined") {
      this.getTime = function() {
        const t = process.hrtime();
        return t[0] * 1e-3 + t[1] * 1e-6;
      };
    } else {
      this.getTime = function() {
        return (/* @__PURE__ */ new Date()).getTime();
      };
    }
  }
  /**
   * Register a node class so it can be listed when the user wants to create a new one
   * @param type name of the node and path
   * @param base_class class containing the structure of a node
   */
  registerNodeType(type, base_class) {
    if (!base_class.prototype)
      throw "Cannot register a simple object, it must be a class with a prototype";
    base_class.type = type;
    if (this.debug) console.log("Node registered: " + type);
    const classname = base_class.name;
    const pos = type.lastIndexOf("/");
    base_class.category = type.substring(0, pos);
    base_class.title ||= classname;
    for (const i in LGraphNode.prototype) {
      base_class.prototype[i] ||= LGraphNode.prototype[i];
    }
    const prev = this.registered_node_types[type];
    if (prev) {
      console.log("replacing node type: " + type);
    }
    this.registered_node_types[type] = base_class;
    if (base_class.constructor.name) this.Nodes[classname] = base_class;
    this.onNodeTypeRegistered?.(type, base_class);
    if (prev) this.onNodeTypeReplaced?.(type, base_class, prev);
    if (base_class.prototype.onPropertyChange)
      console.warn(`LiteGraph node class ${type} has onPropertyChange method, it must be called onPropertyChanged with d at the end`);
    if (this.auto_load_slot_types) new base_class(base_class.title || "tmpnode");
  }
  /**
   * removes a node type from the system
   * @param type name of the node or the node constructor itself
   */
  unregisterNodeType(type) {
    const base_class = typeof type === "string" ? this.registered_node_types[type] : type;
    if (!base_class) throw "node type not found: " + type;
    delete this.registered_node_types[base_class.type];
    const name = base_class.constructor.name;
    if (name) delete this.Nodes[name];
  }
  /**
   * Save a slot type and his node
   * @param type name of the node or the node constructor itself
   * @param slot_type name of the slot type (variable type), eg. string, number, array, boolean, ..
   */
  registerNodeAndSlotType(type, slot_type, out) {
    out ||= false;
    const base_class = typeof type === "string" && this.registered_node_types[type] !== "anonymous" ? this.registered_node_types[type] : type;
    const class_type = base_class.constructor.type;
    let allTypes = [];
    if (typeof slot_type === "string") {
      allTypes = slot_type.split(",");
    } else if (slot_type == this.EVENT || slot_type == this.ACTION) {
      allTypes = ["_event_"];
    } else {
      allTypes = ["*"];
    }
    for (let i = 0; i < allTypes.length; ++i) {
      let slotType = allTypes[i];
      if (slotType === "") slotType = "*";
      const registerTo = out ? "registered_slot_out_types" : "registered_slot_in_types";
      if (this[registerTo][slotType] === void 0)
        this[registerTo][slotType] = { nodes: [] };
      if (!this[registerTo][slotType].nodes.includes(class_type))
        this[registerTo][slotType].nodes.push(class_type);
      const types = out ? this.slot_types_out : this.slot_types_in;
      if (!types.includes(slotType.toLowerCase())) {
        types.push(slotType.toLowerCase());
        types.sort();
      }
    }
  }
  /**
   * Removes all previously registered node's types
   */
  clearRegisteredTypes() {
    this.registered_node_types = {};
    this.node_types_by_file_extension = {};
    this.Nodes = {};
    this.searchbox_extras = {};
  }
  /**
   * Adds this method to all nodetypes, existing and to be created
   * (You can add it to LGraphNode.prototype but then existing node types wont have it)
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  addNodeMethod(name, func) {
    LGraphNode.prototype[name] = func;
    for (const i in this.registered_node_types) {
      const type = this.registered_node_types[i];
      if (type.prototype[name]) type.prototype["_" + name] = type.prototype[name];
      type.prototype[name] = func;
    }
  }
  /**
   * Create a node of a given type with a name. The node is not attached to any graph yet.
   * @param type full name of the node class. p.e. "math/sin"
   * @param title a name to distinguish from other nodes
   * @param options to set options
   */
  createNode(type, title, options2) {
    const base_class = this.registered_node_types[type];
    if (!base_class) {
      if (this.debug) console.log(`GraphNode type "${type}" not registered.`);
      return null;
    }
    title = title || base_class.title || type;
    let node2 = null;
    if (this.catch_exceptions) {
      try {
        node2 = new base_class(title);
      } catch (err) {
        console.error(err);
        return null;
      }
    } else {
      node2 = new base_class(title);
    }
    node2.type = type;
    if (!node2.title && title) node2.title = title;
    node2.properties ||= {};
    node2.properties_info ||= [];
    node2.flags ||= {};
    node2.size ||= node2.computeSize();
    node2.pos ||= this.DEFAULT_POSITION.concat();
    node2.mode ||= LGraphEventMode.ALWAYS;
    if (options2) {
      for (const i in options2) {
        node2[i] = options2[i];
      }
    }
    node2.onNodeCreated?.();
    return node2;
  }
  /**
   * Returns a registered node type with a given name
   * @param type full name of the node class. p.e. "math/sin"
   * @returns the node class
   */
  getNodeType(type) {
    return this.registered_node_types[type];
  }
  /**
   * Returns a list of node types matching one category
   * @param category category name
   * @returns array with all the node classes
   */
  getNodeTypesInCategory(category, filter) {
    const r = [];
    for (const i in this.registered_node_types) {
      const type = this.registered_node_types[i];
      if (type.filter != filter) continue;
      if (category == "") {
        if (type.category == null) r.push(type);
      } else if (type.category == category) {
        r.push(type);
      }
    }
    if (this.auto_sort_node_types) {
      r.sort(function(a, b) {
        return a.title.localeCompare(b.title);
      });
    }
    return r;
  }
  /**
   * Returns a list with all the node type categories
   * @param filter only nodes with ctor.filter equal can be shown
   * @returns array with all the names of the categories
   */
  getNodeTypesCategories(filter) {
    const categories = { "": 1 };
    for (const i in this.registered_node_types) {
      const type = this.registered_node_types[i];
      if (type.category && !type.skip_list) {
        if (type.filter != filter) continue;
        categories[type.category] = 1;
      }
    }
    const result = [];
    for (const i in categories) {
      result.push(i);
    }
    return this.auto_sort_node_types ? result.sort() : result;
  }
  // debug purposes: reloads all the js scripts that matches a wildcard
  reloadNodes(folder_wildcard) {
    const tmp = document.getElementsByTagName("script");
    const script_files = [];
    for (let i = 0; i < tmp.length; i++) {
      script_files.push(tmp[i]);
    }
    const docHeadObj = document.getElementsByTagName("head")[0];
    folder_wildcard = document.location.href + folder_wildcard;
    for (let i = 0; i < script_files.length; i++) {
      const src = script_files[i].src;
      if (!src || src.substr(0, folder_wildcard.length) != folder_wildcard)
        continue;
      try {
        if (this.debug) console.log("Reloading: " + src);
        const dynamicScript = document.createElement("script");
        dynamicScript.type = "text/javascript";
        dynamicScript.src = src;
        docHeadObj.appendChild(dynamicScript);
        docHeadObj.removeChild(script_files[i]);
      } catch (err) {
        if (this.throw_errors) throw err;
        if (this.debug) console.log("Error while reloading " + src);
      }
    }
    if (this.debug) console.log("Nodes reloaded");
  }
  // separated just to improve if it doesn't work
  cloneObject(obj, target) {
    if (obj == null) return null;
    const r = JSON.parse(JSON.stringify(obj));
    if (!target) return r;
    for (const i in r) {
      target[i] = r[i];
    }
    return target;
  }
  /*
   * https://gist.github.com/jed/982883?permalink_comment_id=852670#gistcomment-852670
   */
  uuidv4() {
    return ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, (a) => (a ^ Math.random() * 16 >> a / 4).toString(16));
  }
  /**
   * Returns if the types of two slots are compatible (taking into account wildcards, etc)
   * @param type_a output
   * @param type_b input
   * @returns true if they can be connected
   */
  isValidConnection(type_a, type_b) {
    if (type_a == "" || type_a === "*") type_a = 0;
    if (type_b == "" || type_b === "*") type_b = 0;
    if (!type_a || !type_b || type_a == type_b || type_a == this.EVENT && type_b == this.ACTION)
      return true;
    type_a = String(type_a);
    type_b = String(type_b);
    type_a = type_a.toLowerCase();
    type_b = type_b.toLowerCase();
    if (type_a.indexOf(",") == -1 && type_b.indexOf(",") == -1)
      return type_a == type_b;
    const supported_types_a = type_a.split(",");
    const supported_types_b = type_b.split(",");
    for (let i = 0; i < supported_types_a.length; ++i) {
      for (let j = 0; j < supported_types_b.length; ++j) {
        if (this.isValidConnection(supported_types_a[i], supported_types_b[j]))
          return true;
      }
    }
    return false;
  }
  /**
   * Register a string in the search box so when the user types it it will recommend this node
   * @param node_type the node recommended
   * @param description text to show next to it
   * @param data it could contain info of how the node should be configured
   */
  registerSearchboxExtra(node_type, description, data) {
    this.searchbox_extras[description.toLowerCase()] = {
      type: node_type,
      desc: description,
      data
    };
  }
  // used to create nodes from wrapping functions
  getParameterNames(func) {
    return (func + "").replace(/[/][/].*$/gm, "").replace(/\s+/g, "").replace(/[/][*][^/*]*[*][/]/g, "").split("){", 1)[0].replace(/^[^(]*[(]/, "").replace(/=[^,]+/g, "").split(",").filter(Boolean);
  }
  /* helper for interaction: pointer, touch, mouse Listeners
    used by LGraphCanvas DragAndScale ContextMenu */
  pointerListenerAdd(oDOM, sEvIn, fCall, capture = false) {
    if (!oDOM || !oDOM.addEventListener || !sEvIn || typeof fCall !== "function") return;
    let sMethod = this.pointerevents_method;
    let sEvent = sEvIn;
    if (sMethod == "pointer" && !window.PointerEvent) {
      console.warn("sMethod=='pointer' && !window.PointerEvent");
      console.log("Converting pointer[" + sEvent + "] : down move up cancel enter TO touchstart touchmove touchend, etc ..");
      switch (sEvent) {
        case "down": {
          sMethod = "touch";
          sEvent = "start";
          break;
        }
        case "move": {
          sMethod = "touch";
          break;
        }
        case "up": {
          sMethod = "touch";
          sEvent = "end";
          break;
        }
        case "cancel": {
          sMethod = "touch";
          break;
        }
        case "enter": {
          console.log("debug: Should I send a move event?");
          break;
        }
        default: {
          console.warn("PointerEvent not available in this browser ? The event " + sEvent + " would not be called");
        }
      }
    }
    switch (sEvent) {
      case "down":
      case "up":
      case "move":
      case "over":
      case "out":
      case "enter": {
        oDOM.addEventListener(sMethod + sEvent, fCall, capture);
      }
      case "leave":
      case "cancel":
      case "gotpointercapture":
      case "lostpointercapture": {
        if (sMethod != "mouse") {
          return oDOM.addEventListener(sMethod + sEvent, fCall, capture);
        }
      }
      default:
        return oDOM.addEventListener(sEvent, fCall, capture);
    }
  }
  pointerListenerRemove(oDOM, sEvent, fCall, capture = false) {
    if (!oDOM || !oDOM.removeEventListener || !sEvent || typeof fCall !== "function") return;
    switch (sEvent) {
      case "down":
      case "up":
      case "move":
      case "over":
      case "out":
      case "enter": {
        if (this.pointerevents_method == "pointer" || this.pointerevents_method == "mouse") {
          oDOM.removeEventListener(this.pointerevents_method + sEvent, fCall, capture);
        }
      }
      case "leave":
      case "cancel":
      case "gotpointercapture":
      case "lostpointercapture": {
        if (this.pointerevents_method == "pointer") {
          return oDOM.removeEventListener(this.pointerevents_method + sEvent, fCall, capture);
        }
      }
      default:
        return oDOM.removeEventListener(sEvent, fCall, capture);
    }
  }
  getTime;
  compareObjects(a, b) {
    for (const i in a) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
  distance = distance;
  colorToString(c) {
    return "rgba(" + Math.round(c[0] * 255).toFixed() + "," + Math.round(c[1] * 255).toFixed() + "," + Math.round(c[2] * 255).toFixed() + "," + (c.length == 4 ? c[3].toFixed(2) : "1.0") + ")";
  }
  isInsideRectangle = isInsideRectangle;
  // [minx,miny,maxx,maxy]
  growBounding(bounding, x2, y) {
    if (x2 < bounding[0]) {
      bounding[0] = x2;
    } else if (x2 > bounding[2]) {
      bounding[2] = x2;
    }
    if (y < bounding[1]) {
      bounding[1] = y;
    } else if (y > bounding[3]) {
      bounding[3] = y;
    }
  }
  overlapBounding = overlapBounding;
  // point inside bounding box
  isInsideBounding(p, bb) {
    if (p[0] < bb[0][0] || p[1] < bb[0][1] || p[0] > bb[1][0] || p[1] > bb[1][1]) {
      return false;
    }
    return true;
  }
  // Convert a hex value to its decimal value - the inputted hex must be in the
  // format of a hex triplet - the kind we use for HTML colours. The function
  // will return an array with three values.
  hex2num(hex) {
    if (hex.charAt(0) == "#") {
      hex = hex.slice(1);
    }
    hex = hex.toUpperCase();
    const hex_alphabets = "0123456789ABCDEF";
    const value = new Array(3);
    let k = 0;
    let int1, int2;
    for (let i = 0; i < 6; i += 2) {
      int1 = hex_alphabets.indexOf(hex.charAt(i));
      int2 = hex_alphabets.indexOf(hex.charAt(i + 1));
      value[k] = int1 * 16 + int2;
      k++;
    }
    return value;
  }
  // Give a array with three values as the argument and the function will return
  // the corresponding hex triplet.
  num2hex(triplet) {
    const hex_alphabets = "0123456789ABCDEF";
    let hex = "#";
    let int1, int2;
    for (let i = 0; i < 3; i++) {
      int1 = triplet[i] / 16;
      int2 = triplet[i] % 16;
      hex += hex_alphabets.charAt(int1) + hex_alphabets.charAt(int2);
    }
    return hex;
  }
  closeAllContextMenus(ref_window) {
    ref_window = ref_window || window;
    const elements = ref_window.document.querySelectorAll(".litecontextmenu");
    if (!elements.length) return;
    const result = [];
    for (let i = 0; i < elements.length; i++) {
      result.push(elements[i]);
    }
    for (let i = 0; i < result.length; i++) {
      if (result[i].close) {
        result[i].close();
      } else if (result[i].parentNode) {
        result[i].parentNode.removeChild(result[i]);
      }
    }
  }
  extendClass(target, origin) {
    for (const i in origin) {
      if (target.hasOwnProperty(i)) continue;
      target[i] = origin[i];
    }
    if (origin.prototype) {
      for (const i in origin.prototype) {
        if (!origin.prototype.hasOwnProperty(i)) continue;
        if (target.prototype.hasOwnProperty(i)) continue;
        if (origin.prototype.__lookupGetter__(i)) {
          target.prototype.__defineGetter__(
            i,
            origin.prototype.__lookupGetter__(i)
          );
        } else {
          target.prototype[i] = origin.prototype[i];
        }
        if (origin.prototype.__lookupSetter__(i)) {
          target.prototype.__defineSetter__(
            i,
            origin.prototype.__lookupSetter__(i)
          );
        }
      }
    }
  }
}
function loadPolyfills() {
  if (typeof window != "undefined" && window.CanvasRenderingContext2D && !window.CanvasRenderingContext2D.prototype.roundRect) {
    window.CanvasRenderingContext2D.prototype.roundRect = function(x2, y, w, h, radius, radius_low) {
      let top_left_radius = 0;
      let top_right_radius = 0;
      let bottom_left_radius = 0;
      let bottom_right_radius = 0;
      if (radius === 0) {
        this.rect(x2, y, w, h);
        return;
      }
      if (radius_low === void 0) radius_low = radius;
      if (radius != null && radius.constructor === Array) {
        if (radius.length == 1)
          top_left_radius = top_right_radius = bottom_left_radius = bottom_right_radius = radius[0];
        else if (radius.length == 2) {
          top_left_radius = bottom_right_radius = radius[0];
          top_right_radius = bottom_left_radius = radius[1];
        } else if (radius.length == 4) {
          top_left_radius = radius[0];
          top_right_radius = radius[1];
          bottom_left_radius = radius[2];
          bottom_right_radius = radius[3];
        } else {
          return;
        }
      } else {
        top_left_radius = radius || 0;
        top_right_radius = radius || 0;
        bottom_left_radius = radius_low || 0;
        bottom_right_radius = radius_low || 0;
      }
      this.moveTo(x2 + top_left_radius, y);
      this.lineTo(x2 + w - top_right_radius, y);
      this.quadraticCurveTo(x2 + w, y, x2 + w, y + top_right_radius);
      this.lineTo(x2 + w, y + h - bottom_right_radius);
      this.quadraticCurveTo(
        x2 + w,
        y + h,
        x2 + w - bottom_right_radius,
        y + h
      );
      this.lineTo(x2 + bottom_right_radius, y + h);
      this.quadraticCurveTo(x2, y + h, x2, y + h - bottom_left_radius);
      this.lineTo(x2, y + bottom_left_radius);
      this.quadraticCurveTo(x2, y, x2 + top_left_radius, y);
    };
  }
  if (typeof window != "undefined" && !window["requestAnimationFrame"]) {
    window.requestAnimationFrame = // @ts-expect-error Legacy code
    window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
      window.setTimeout(callback, 1e3 / 60);
    };
  }
}
const LiteGraph = new LiteGraphGlobal();
function clamp(v2, a, b) {
  return a > v2 ? a : b < v2 ? b : v2;
}
loadPolyfills();
export {
  BadgePosition,
  CanvasPointer,
  ContextMenu,
  CurveEditor,
  DragAndScale,
  EaseFunction,
  LGraph,
  LGraphBadge,
  LGraphCanvas,
  LGraphEventMode,
  LGraphGroup,
  LGraphNode,
  LLink,
  LinkMarkerShape,
  LiteGraph,
  Reroute,
  clamp,
  createBounds,
  strokeShape
};
//# sourceMappingURL=litegraph.es.js.map
