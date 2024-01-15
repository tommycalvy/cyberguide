var browser = require("webextension-polyfill");
console.log("popup.js loaded");

// Establish connection with background.js
const bport = browser.runtime.connect({ name: "popup"});
bport.postMessage({ type: "init" });

bport.onMessage.addListener((msg) => {
    if (msg.type === "handle-init") {
        console.log("popup.js: ", msg.message);
    }
});

const widgetToggle = document.getElementById("widget-toggle");
if (widgetToggle instanceof HTMLButtonElement) {
    widgetToggle.addEventListener("click", async () => {
        let tab = await getCurrentTab();
        bport.postMessage({
            type: "show-widget",
            tabId: tab.id
        });
    });
} else {
    console.error("panelToggle is null");
}
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await browser.tabs.query(queryOptions);
    console.log("tab: ", tab);
    return tab;
}
