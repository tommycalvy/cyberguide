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

const panelToggle = document.getElementById("panel-toggle");
if (panelToggle === null) {
    console.error("panelToggle is null");
} else {
    panelToggle.addEventListener("click", async () => {
        let tab = await getCurrentTab();
        bport.postMessage({
            type: "panel",
            tabId: tab.id
        });
    });
}
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await browser.tabs.query(queryOptions);
    console.log("tab: ", tab);
    return tab;
}
