import { graphToPrompt } from "./utils.js";
import { app } from "../../scripts/app.js";

// Recursion guard: any future extension hook we (or sibling extensions) add
// can check window.__cpe_converting to short-circuit during a headless
// conversion run. Today the registration body is empty; the flag is here
// preemptively so the architecture can't grow a recursion bug later.
app.registerExtension({
  name: "Comfy.Portal",
  // Example pattern for any future hook:
  //   nodeCreated(node) {
  //     if (window.__cpe_converting) return;
  //     ...
  //   }
});

// Expose graphToPrompt + the real ComfyUI app so the Playwright fallback
// path can call app.loadGraphData() (which registers subgraph definitions
// before the graph is walked). The primary converter is pure-Python in
// python_converter.py; this JS path is only reached when the workflow
// uses features the Python converter declines (custom serializeValue
// hooks, group nodes, etc.).
window.__cpe_graphToPrompt = graphToPrompt;
window.__cpe_app = app;
