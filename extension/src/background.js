var browser = require("webextension-polyfill");

console.log("background.js loaded ");

//browser.storage.sync.set({ guideActive: false });

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((msg) =>  {
        if (port.name === "popup") {
            if (msg.type === "init") {
                console.log("port connected: ", port.name);
                port.onDisconnect.addListener(async () => {
                    console.log("port disconnected: ", port.name);
                });
                port.postMessage({
                    type: "handle-init",
                    message: "popup open"
                });
            } else if (msg.type === "show-widget") {
                console.log("show widget message received");
                executeScript(msg.tabId, ["scripts/widget.js"]);
            }
        }
    });
});

/**
    * Execute script in specified tab
    * @param {number} tabId - Id of tab to execute script in
    * @param {string[]} files - Function to execute
    * @returns {Promise} - Promise that resolves when script is executed
*/
async function executeScript(tabId, files) {
    return browser.scripting.executeScript({
        target: { tabId: tabId },
        injectImmediately: true,
        files: files
    });
}

/**
    * Insert CSS in specified tab
    * @param {number} tabId - Id of tab to insert CSS in
    * @param {string[]} files - CSS files to insert
    * @returns {Promise} - Promise that resolves when CSS is inserted
*/
async function insertCSS(tabId, files) {
    return browser.scripting.insertCSS({
        target: { tabId: tabId },
        files: files
    });
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await browser.tabs.query(queryOptions);
    return tab;
}
