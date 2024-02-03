import Port from "../utils/message-producer.js";
console.log("popup.js loaded");

// Establish connection with background.js
const bport = new Port("popup", true);
bport.postMessage({ type: "init", message: "hello from popup" });

bport.onMessage("hanlde-init", (msg) => {
    console.log("popup.js: ", msg.message);
});

const widgetToggle = document.getElementById("widget-toggle");
if (widgetToggle instanceof HTMLButtonElement) {
    widgetToggle.addEventListener("click", async () => {
        bport.postMessage({ type: "show-widget" });
    });
} else {
    console.error("panelToggle is null");
}
