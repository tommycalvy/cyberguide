const recordButton = document.getElementById("recordButton");
const globalPanelCheckbox = document.getElementById("globalPanelCheckbox");

chrome.storage.sync.get("recording", (result) => {
    if (result.recording) {
        recordButton.value = "Stop Recording";
        return undefined;
    }
    recordButton.value = "Record";
    return undefined;
});

function connectToBackground() {
    const backgroundPort = chrome.runtime.connect({ name: "sidepanel" });

    backgroundPort.postMessage({
        type: "init",
        message: "init from panel open",
    });

    backgroundPort.onMessage.addListener(async (message) => {
        if (message.type === "handle-init") {
            console.log("connected to background");
        }

        if (message.type === "tab-updated") {
            backgroundPort.postMessage({
                type: "init",
                message: "init from tab connected",
            });
        }
    });
}

recordButton.addEventListener("click", () => {
    if (recordButton.value === "Record") {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs[0].url?.startsWith("chrome://")) return undefined;
                // TODO: Add error handling for when someone clicks record on a chrome:// page
                console.log("sending message to start recording");
                chrome.runtime.sendMessage({ action: "startRecording" });
                recordButton.disabled = true;
            }
        );
        return undefined;
    }
    if (recordButton.value === "Stop Recording") {
        chrome.runtime.sendMessage({ action: "stopRecording" });
        recordButton.disabled = true;
        return undefined;
    }
});

globalPanelCheckbox.addEventListener("change", () => {
    chrome.storage.sync.set({ globalPanel: globalPanelCheckbox.checked });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "recordingStarted") {
        chrome.storage.sync.set({ recording: true });
        recordButton.value = "Stop Recording";
        recordButton.disabled = false;
        return undefined;
    }
    if (request.action === "recordingStopped") {
        chrome.storage.sync.set({ recording: false });
        recordButton.value = "Record";
        return undefined;
    }
});

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}
