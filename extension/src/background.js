import browser from "webextension-polyfill";

console.log("background.js loaded ");

browser.storage.local.set({ "rActive": false });
browser.storage.local.set({ "recordedElts": [] });
browser.storage.local.set({ "rTabIds": [] });
browser.storage.local.set({ "widgetOpen": false });
browser.storage.local.set({ "wTabIds": [] });

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) =>  {
        try {
            console.log(port.name, ": ", msg.type);
            if (msg.type === "init") {
                port.postMessage({
                    type: "handle-init",
                    message: `${port.name} connected`
                });
            }

            if (port.name === "popup") {
                if (msg.type === "show-widget") {
                    let wTabIdsPromise = browser.storage.local.get('wTabIds');
                    let currentTabPromise = getCurrentTab();
                    let [{ wTabIds }, currentTab] = await Promise.all(
                        [wTabIdsPromise, currentTabPromise]
                    );
                    if (currentTab.id == null) {
                        throw new Error("currentTab.id is null");
                    } else if (wTabIds.includes(currentTab.id)) {
                        throw new Error("widget already open");
                    }
                    executeScript(msg.tabId, ["scripts/widget.js"]);
                }
            } else if (port.name === "widget") {
                if (msg.type === "init") {
                    let wTabIdsPromise = browser.storage.local.get('wTabIds');
                    let currentTabPromise = getCurrentTab();
                    let [{ wTabIds }, currentTab] = await Promise.all(
                        [wTabIdsPromise, currentTabPromise]
                    );
                    if (currentTab.id == null) {
                        throw new Error("currentTab.id is null");
                    }
                    if (!wTabIds.includes(currentTab.id)) {
                        wTabIds.push(currentTab.id);
                        browser.storage.local.set({ "wTabIds": wTabIds });
                    }    
                } else if (msg.type === "start-recording") {
                    let rTabIdsPromise = browser.storage.local.get('rTabIds');
                    let currentTabPromise = getCurrentTab();
                    let [{ rTabIds }, currentTab] = await Promise.all(
                        [rTabIdsPromise, currentTabPromise]
                    );
                    if (currentTab.id == null) {
                        throw new Error("currentTab.id is null");
                    } else if (rTabIds.includes(currentTab.id)) {
                        throw new Error("recording already active in tab");
                    }
                    executeScript(currentTab.id, ["scripts/recording.js"]);
               } else if (msg.type === "stop-recording") {
                    browser.storage.local.set({ "rActive": false });
                    port.postMessage({ type: "stop-recording" });
                }
            } else if (port.name === "recording") {
                if (msg.type === "init") {
                    let rTabIdsPromise = browser.storage.local.get('rTabIds');
                    let currentTabPromise = getCurrentTab();
                    let rActivePromise = browser.storage.local.get('rActive');
                    let [{ rTabIds }, currentTab, rActive] = await Promise.all(
                        [rTabIdsPromise, currentTabPromise, rActivePromise]
                    );
                    if (currentTab.id == null) {
                        throw new Error("currentTab.id is null");
                    }
                    if (!rActive) {
                        browser.storage.local.set({ "rActive": true });
                    }
                    if (!rTabIds.includes(currentTab.id)) {
                        rTabIds.push(currentTab.id);
                        browser.storage.local.set({ "rTabIds": rTabIds });
                    }
                } else if (msg.type === "stop-recording") {
                    let rTabIdsPromise = browser.storage.local.get('rTabIds');
                    let currentTabPromise = getCurrentTab();
                    let [{ rTabIds }, currentTab] = await Promise.all(
                        [rTabIdsPromise, currentTabPromise]
                    );
                    if (currentTab.id == null) {
                        throw new Error("currentTab.id is null");
                    }
                    if (rTabIds.includes(currentTab.id)) {
                        let index = rTabIds.indexOf(currentTab.id);
                        rTabIds.splice(index, 1);
                        browser.storage.local.set({ "rTabIds": rTabIds });
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    });
    port.onDisconnect.addListener(() => {
        console.log("port disconnected: ", port.name);
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
