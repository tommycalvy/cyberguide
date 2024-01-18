import browser from "webextension-polyfill";

console.log("background.js loaded ");

browser.storage.local.set({ "recordingActive": false });
browser.storage.local.set({ "rTabIds": [] });
browser.storage.local.set({ "widgetOpen": false });
browser.storage.local.set({ "wTabIds": [] });

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) =>  {
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
        } else if (port.name === "widget") {
            if (msg.type === "init") {
                console.log("port connected: ", port.name);
                port.onDisconnect.addListener(async () => {
                    console.log("port disconnected: ", port.name);
                });
                let { wTabIds } = await browser.storage.local.get('wTabIds');
                const tab = await getCurrentTab();
                if (tab.id == null) {
                    throw new Error("tab.id is null");
                }
                wTabIds.push(tab.id);
                browser.storage.local.set({ "wTabIds": wTabIds });
                port.postMessage({
                    type: "handle-init",
                    message: "widget open"
                });
            } else if (msg.type === "start-recording") {
                console.log("start recording message received");
                const tab = await getCurrentTab();
                if (tab.id == null) {
                    throw new Error("tab.id is null");
                }
                let { rTabIds } = await browser.storage.local.get("rTabIds");
                rTabIds.push(tab.id); 
                console.log("rTabIds: ", rTabIds);
                browser.storage.local.set({ "rTabIds": rTabIds });
                executeScript(tab.id, ["scripts/recording.js"]);
           } else if (msg.type === "stop-recording") {
                console.log("stop recording message received");
                browser.storage.local.set({ "recordingActive": false });
                executeScript(msg.tabId, ["scripts/recording.js"]);
            }
        }
    });
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
    if (changeInfo.status === "complete") {
        const { rTabIds } = await browser.storage.local.get("rTabIds");
        const { wTabIds } = await browser.storage.local.get("wTabIds");
        if (rTabIds.includes(tabId)) {
            executeScript(tabId, ["scripts/recording.js"]);
        }
        if (wTabIds.includes(tabId)) {
            executeScript(tabId, ["scripts/widget.js"]);
        }
    }
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
