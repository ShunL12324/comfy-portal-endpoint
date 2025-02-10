// Workflow conversion function
// Copy from https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/scripts/app.ts#L1227
export async function graphToPrompt(graph, clean = true) {
  // Update node widgets
  for (const outerNode of graph.computeExecutionOrder(false)) {
    if (outerNode.widgets) {
      for (const widget of outerNode.widgets) {
        // Allow widgets to run callbacks before queuing
        if (widget.beforeQueued) {
          widget.beforeQueued();
        }
      }
    }

    const innerNodes = outerNode.getInnerNodes
      ? outerNode.getInnerNodes()
      : [outerNode];
    for (const node of innerNodes) {
      if (node.isVirtualNode && node.applyToGraph) {
        node.applyToGraph();
      }
    }
  }

  // Serialize the graph
  const workflow = graph.serialize();

  // Remove localized names
  for (const node of workflow.nodes) {
    for (const slot of node.inputs || []) {
      delete slot.localized_name;
    }
    for (const slot of node.outputs || []) {
      delete slot.localized_name;
    }
  }

  const output = {};
  // Process nodes in execution order
  for (const outerNode of graph.computeExecutionOrder(false)) {
    const skipNode = outerNode.mode === 2 || outerNode.mode === 4; // NEVER or BYPASS
    const innerNodes =
      !skipNode && outerNode.getInnerNodes
        ? outerNode.getInnerNodes()
        : [outerNode];

    for (const node of innerNodes) {
      if (node.isVirtualNode) {
        continue;
      }

      if (node.mode === 2 || node.mode === 4) {
        // NEVER or BYPASS
        continue;
      }

      const inputs = {};
      const widgets = node.widgets;

      // Store all widget values
      if (widgets) {
        for (const i in widgets) {
          const widget = widgets[i];
          if (!widget.options || widget.options.serialize !== false) {
            inputs[widget.name] = widget.serializeValue
              ? await widget.serializeValue(node, i)
              : widget.value;
          }
        }
      }

      // Store all node connections
      for (let i in node.inputs) {
        let parent = node.getInputNode(i);
        if (parent) {
          let link = node.getInputLink(i);
          while (parent.mode === 4 || parent.isVirtualNode) {
            // BYPASS
            let found = false;
            if (parent.isVirtualNode) {
              link = parent.getInputLink(link.origin_slot);
              if (link) {
                parent = parent.getInputNode(link.target_slot);
                if (parent) {
                  found = true;
                }
              }
            } else if (link && parent.mode === 4) {
              // BYPASS
              let all_inputs = [link.origin_slot];
              if (parent.inputs) {
                all_inputs = all_inputs.concat(Object.keys(parent.inputs));
                for (let parent_input of all_inputs) {
                  if (
                    parent.inputs[parent_input]?.type === node.inputs[i].type
                  ) {
                    link = parent.getInputLink(parent_input);
                    if (link) {
                      parent = parent.getInputNode(parent_input);
                    }
                    found = true;
                    break;
                  }
                }
              }
            }

            if (!found) {
              break;
            }
          }

          if (link) {
            if (parent?.updateLink) {
              link = parent.updateLink(link);
            }
            if (link) {
              inputs[node.inputs[i].name] = [
                String(link.origin_id),
                parseInt(link.origin_slot),
              ];
            }
          }
        }
      }

      const node_data = {
        inputs,
        class_type: node.comfyClass,
        _meta: {
          title: node.title,
        },
      };

      output[String(node.id)] = node_data;
    }
  }

  // Remove inputs connected to deleted nodes
  if (clean) {
    for (const o in output) {
      for (const i in output[o].inputs) {
        if (
          Array.isArray(output[o].inputs[i]) &&
          output[o].inputs[i].length === 2 &&
          !output[output[o].inputs[i][0]]
        ) {
          delete output[o].inputs[i];
        }
      }
    }
  }

  return { workflow, output };
}
