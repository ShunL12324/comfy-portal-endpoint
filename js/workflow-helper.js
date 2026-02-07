import { graphToPrompt } from "./utils.js";
import { app } from "../../scripts/app.js";

app.registerExtension({ name: "Comfy.Portal" });

// Expose graphToPrompt to the headless browser's page.evaluate() calls
window.__cpe_graphToPrompt = graphToPrompt;
