import Port from "../utils/message-producer.js";

console.log("popup.js loaded");

// Establish connection with background.js
const bport = new Port("popup", true);
bport.postMessage({ type: "handle-init" });
bport.onMessage("init", (msg) => {
    console.log("background: ", msg.message);
});

const widgetToggle = document.getElementById("widget-toggle");
if (!widgetToggle) {
    throw new Error("widgetToggle is null");
}
widgetToggle.addEventListener("click", () => {
    bport.postMessage({ type: "show-widget" });
});


const recordButton = document.getElementById("record-button");
if (!recordButton) {
    throw new Error("recordButton is null");
}
recordButton.addEventListener("click", () => {
    bport.postMessage({ type: "start-recording" });
});

