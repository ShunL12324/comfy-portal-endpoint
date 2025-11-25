// Workflow conversion function
// Updated to match ComfyUI_frontend v1.9.10+ implementation
// Based on: https://github.com/Comfy-Org/ComfyUI_frontend/blob/main/src/utils/executionUtil.ts

/**
 * Converts the current graph workflow for sending to the API.
 * @param {LGraph} graph - The graph to convert
 * @param {Object} options - Conversion options
 * @param {boolean} [options.sortNodes=false] - Whether to sort nodes by execution order
 * @returns {Promise<{workflow: Object, output: Object}>} The workflow and node links
 */
export async function graphToPrompt(graph, options = {}) {
  const { sortNodes = false } = options

  // Apply virtual nodes to graph
  for (const node of graph.computeExecutionOrder(false)) {
    const innerNodes = node.getInnerNodes
      ? node.getInnerNodes(new Map())
      : [node]
    for (const innerNode of innerNodes) {
      if (innerNode.isVirtualNode && innerNode.applyToGraph) {
        innerNode.applyToGraph()
      }
    }
  }

  // Serialize the graph
  const workflow = graph.serialize({ sortNodes })

  // Remove localized names
  for (const node of workflow.nodes) {
    for (const slot of node.inputs || []) {
      delete slot.localized_name
    }
    for (const slot of node.outputs || []) {
      delete slot.localized_name
    }
  }

  const output = {}

  // Process nodes in execution order
  for (const outerNode of graph.computeExecutionOrder(false)) {
    const skipNode = outerNode.mode === 2 || outerNode.mode === 4 // NEVER or BYPASS
    const innerNodes =
      !skipNode && outerNode.getInnerNodes
        ? outerNode.getInnerNodes(new Map())
        : [outerNode]

    for (const node of innerNodes) {
      if (node.isVirtualNode) {
        continue
      }

      if (node.mode === 2 || node.mode === 4) {
        // NEVER or BYPASS
        continue
      }

      const inputs = {}
      const widgets = node.widgets

      // Store all widget values
      if (widgets) {
        for (const i in widgets) {
          const widget = widgets[i]

          // Skip widgets without names or with serialize: false
          if (!widget.name || widget.options?.serialize === false) {
            continue
          }

          const widgetValue = widget.serializeValue
            ? await widget.serializeValue(node, i)
            : widget.value

          // CRITICAL: Wrap array values to avoid confusion with node connections
          // The backend automatically unwraps { __value__: array } to array during execution
          inputs[widget.name] = Array.isArray(widgetValue)
            ? { __value__: widgetValue }
            : widgetValue
        }
      }

      // Store all node connections
      // Use resolveInput if available (new method), otherwise fall back to manual traversal
      if (node.resolveInput) {
        // New method: cleaner and handles more edge cases
        for (const i in node.inputs) {
          const input = node.inputs[i]
          const resolvedInput = node.resolveInput(i)

          if (!resolvedInput) continue

          // Resolved to an actual widget value rather than a node connection
          if (resolvedInput.widgetInfo) {
            const value = resolvedInput.widgetInfo.value
            inputs[input.name] = Array.isArray(value)
              ? { __value__: value }
              : value
            continue
          }

          // Node connection
          inputs[input.name] = [
            String(resolvedInput.origin_id),
            parseInt(resolvedInput.origin_slot)
          ]
        }
      } else {
        // Fallback: manual link traversal (old method)
        for (let i in node.inputs) {
          let parent = node.getInputNode(i)
          if (parent) {
            let link = node.getInputLink(i)

            // Traverse through BYPASS and virtual nodes
            while (parent.mode === 4 || parent.isVirtualNode) {
              let found = false

              if (parent.isVirtualNode) {
                link = parent.getInputLink(link.origin_slot)
                if (link) {
                  parent = parent.getInputNode(link.target_slot)
                  if (parent) {
                    found = true
                  }
                }
              } else if (link && parent.mode === 4) {
                // BYPASS mode
                let all_inputs = [link.origin_slot]
                if (parent.inputs) {
                  all_inputs = all_inputs.concat(Object.keys(parent.inputs))
                  for (let parent_input of all_inputs) {
                    if (
                      parent.inputs[parent_input]?.type === node.inputs[i].type
                    ) {
                      link = parent.getInputLink(parent_input)
                      if (link) {
                        parent = parent.getInputNode(parent_input)
                      }
                      found = true
                      break
                    }
                  }
                }
              }

              if (!found) {
                break
              }
            }

            if (link) {
              if (parent?.updateLink) {
                link = parent.updateLink(link)
              }
              if (link) {
                inputs[node.inputs[i].name] = [
                  String(link.origin_id),
                  parseInt(link.origin_slot),
                ]
              }
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
      }

      output[String(node.id)] = node_data
    }
  }

  // Always clean: Remove inputs connected to deleted nodes
  for (const o in output) {
    for (const i in output[o].inputs) {
      if (
        Array.isArray(output[o].inputs[i]) &&
        output[o].inputs[i].length === 2 &&
        !output[output[o].inputs[i][0]]
      ) {
        delete output[o].inputs[i]
      }
    }
  }

  return { workflow, output }
}
