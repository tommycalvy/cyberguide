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
const widgetTabIds = new ArrayStorage("local", "widgetTabIds", []);

console.log("recordingActive: ", recordingActive.get());

const listener = new MessageListener(true);
const popupPort = new Port("popup", listener);
const widgetPort = new Port("widget", listener);
const rPort = new Port("recording", listener);

popupPort.onMessage("handle-init", () => {
    popupPort.postMessage({ type: "init", message: "hello from background" });
});

popupPort.onMessage("show-widget", () => {
    widgetTabIds.pushUnique(getCurrentTabId()).then(([ids, id]) => {
        console.log("widgetTabIds: ", ids);
        return executeScript(id, ["scripts/widget.js"]);
    }).catch((err) => {
        console.error(err);
        //TODO: Send error message to popup
    });
});

popupPort.onMessage("start-recording", () => {
    recordingTabIds.pushUnique(getCurrentTabId()).then(([ids, id]) => {
        console.log("recordingTabIds: ", ids);
        recordingActive.set(true);
        return executeScript(id, ["scripts/recording.js"]);
    }).catch((err) => {
        console.error(err);
    });
});

popupPort.onMessage("stop-recording", () => {
    recordingActive.set(false);
    rPort.postMessage({ type: "stop-recording" });
});

widgetPort.onMessage("handle-init", () => {
    widgetPort.postMessage({ type: "init", message: "hello from background" });
});

widgetPort.onMessage("start-recording", () => {
    recordingTabIds.pushUnique(getCurrentTabId()).then(([ids, id]) => {
        console.log("recordingTabIds: ", ids);
        recordingActive.set(true);
        return executeScript(id, ["scripts/recording.js"]);
    }).catch((err) => {
        console.error(err);
    });
});

widgetPort.onMessage("stop-recording", () => {
    recordingActive.set(false);
    rPort.postMessage({ type: "stop-recording" });
});

widgetPort.onMessage("widget-closed", () => {
    widgetTabIds.removeItem(getCurrentTabId()).then(() => {
        console.log("widgetTabIds: ", widgetTabIds);
    }).catch((err) => {
        console.error(err);
    });
});

rPort.onMessage("handle-init", () => {
    getCurrentTabId().then((id) => {
        rPort.postMessage({ 
            type: "init",
            message: "hello from background",
            data: { tabId: id }
        });
    }).catch((err) => {
        console.error(err);
    });
});

rPort.onMessage("recording-script-shutdown", (msg) => {
    if (!msg.data.tabId) {
        throw new Error("No tabId in recording-script-shutdown message");
    }
    recordingTabIds.removeItem(Promise.resolve(msg.data.tabId));
});

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "complete") {
        recordingTabIds.includes(tabId).then(() => {
            return recordingActive.get();
        }).then((active) => {
            if (active) return executeScript(tabId, ["scripts/recording.js"]);
        }).catch((err) => {
            console.error(err);
        });
        widgetTabIds.includes(tabId).then(() => {
            return executeScript(tabId, ["scripts/widget.js"]);
        }).catch((err) => {
            console.error(err);
        });
    }
});
