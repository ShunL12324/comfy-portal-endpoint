import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";
import { graphToPrompt } from "./utils.js";

app.registerExtension({
  name: "Comfy.Portal",
});

async function handleWorkflowConvertQueue({ detail }) {
  console.log("Received data in handleWorkflowConvertQueue:", detail);
  try {
    const workflowRawData = detail.data.workflow;
    if (!workflowRawData) {
      throw new Error("No workflow data provided");
    }

    const graph = new window.LGraph();
    const workflowData = workflowRawData;
    graph.configure(workflowData, false);
    // Updated to use new signature: graphToPrompt(graph, options)
    // The function now always cleans inputs (old 'clean' parameter removed)
    const parsedWorkflow = await graphToPrompt(graph);

    const workflowApiFormat = parsedWorkflow.output;
    console.log(workflowApiFormat);
    const response = await api.fetchApi("/cpe/workflow/convert/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workflow: workflowApiFormat,
        task_id: detail.task_id,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to process workflow: ${response.status}`);
    }

    const result = await response.json();
    console.log("Workflow conversion completed:", result);
  } catch (error) {
    console.error("Error in workflow conversion:", error);
    // try to report error to server
    try {
      await api.fetchApi("/cpe/workflow/convert/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: detail.task_id,
          error: error.message,
          status: "failed",
        }),
      });
    } catch (callbackError) {
      console.error("Failed to report error to server:", callbackError);
    }
  }
}

api.addEventListener("workflow_convert_queue", handleWorkflowConvertQueue);
