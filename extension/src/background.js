import browser from "webextension-polyfill";
import BrowserStorage from "./utils/browser-storage.js";
import ArrayStorage from "./utils/array-storage.js";
import { MessageListener, Port } from "./utils/message-listener.js";
import { executeScript } from "./utils/execute-script.js";
import { getCurrentTabId } from "./utils/get-current-tab.js";

console.log("background.js loaded ");

const recordingActive = new BrowserStorage("local", "recordingActive", false);
const recordedElts = new ArrayStorage("local", "recordedElts", []);
const recordingTabIds = new ArrayStorage("local", "recordingTabIds", []);
const widgetActive = new BrowserStorage("local", "widgetActive", false);
const widgetTabIds = new ArrayStorage("local", "widgetTabIds", []);

const listener = new MessageListener(true);
const popupPort = new Port("popup", listener);

popupPort.onMessage("init", (msg) => {
    console.log("popup.js: ", msg.message);
});


popupPort.onMessage("show-widget", () => {
    getCurrentTabId().then((id) => {;
        return widgetTabIds.pushUnique(id);
    }).then(([ids, id]) => {
        console.log("widgetTabIds: ", ids);
        widgetActive.set(true);
        return executeScript(id, ["scripts/widget.js"]);
    }).catch((err) => {
        console.error(err);
        //TODO: Send error message to popup
    });
});

const widgetPort = new Port("widget", listener);
widgetPort.onMessage("init", () => {
    console.log("hello from background");
});

widgetPort.onMessage("start-recording", () => {
    getCurrentTabId().then((tabId) => {
        return recordingTabIds.pushUnique(tabId)
    }).then(([ids, id]) => {
        console.log("recordingTabIds: ", ids);
        recordingActive.set(true);
        return executeScript(id, ["scripts/recording.js"]);
    }).catch((err) => {
        console.error(err);
    });
});
// browser.storage.local.set({ "rActive": false });
// browser.storage.local.set({ "recordedElts": [] });
// browser.storage.local.set({ "rTabIds": [] });
// browser.storage.local.set({ "widgetOpen": false });
// browser.storage.local.set({ "wTabIds": [] });
/*
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
                } else if (msg.type === "recording-script-shutdown") {
                    if (msg.tabId == null) {
                        throw new Error("msg.tabId is null");
                    }
                    let { rTabIds } = await browser.storage.local.get('rTabIds');

                    if (rTabIds.includes(msg.tabId)) {
                        let index = rTabIds.indexOf(msg.tabId);
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

*/

