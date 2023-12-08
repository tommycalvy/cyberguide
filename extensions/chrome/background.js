chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

/*
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    let tab = await getCurrentTab();
    if (tabs[0].url?.startsWith("chrome://")) return undefined;
    // TODO: Should 
    if (request.action === "startRecording") {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["record.js"],
        });
    }
    if (request.action === "recordingStarted") {
        if (tab.url?.startsWith("chrome://")) return undefined;
        chrome.action.setBadgeText({ tabId: tab.id, text: "•REC" });
        chrome.action.setBadgeBackgroundColor({ color: "#FE0000" });
        
    }
    if (request.action === "recordingStopped") {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                
                chrome.action.setBadgeText({ tabId: tabs[0].id, text: "" });
            }
        );
    }
});
*/

chrome.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
        if (port.name === "sidepanel") {
            if (msg.type === "init") {
                console.log("panel opened");

                await chrome.storage.sync.set({ panelOpen: true });

                port.onDisconnect.addListener(async () => {
                    await chrome.storate.sync.set({ panelOpen: false });
                    console.log("panel closed");
                    console.log("port disconnected: ", port.name);
                });

                port.postMessage({
                    type: "handle-init",
                    message: "panel open",
                });
            }
        }
    });
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function injectContentScript(tabId) {
    console.log("injecting content script");

    chrome.scripting.executeScript({
        target: { tabId },
        files: ["record.js"],
    });
}
