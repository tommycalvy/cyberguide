const recordButton = document.getElementById("recordButton");

recordButton.addEventListener("click", () => {
    if (recordButton.value === "Record") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0].url?.startsWith("chrome://")) return undefined;
            // TODO: Add error handling for when someone clicks record on a chrome:// page
            console.log("sending message to start recording");
            chrome.runtime.sendMessage({ action: "startRecording" });
            recordButton.disabled = true;
        });
        return undefined;
    }
    if (recordButton.value === "Stop Recording") {
        chrome.runtime.sendMessage({ action: "stopRecording" });
        return undefined;
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "recordingStarted") {
        recordButton.value = "Stop Recording";
        recordButton.disabled = false;
        return undefined;
    }
    if (request.action === "recordingStopped") {
        recordButton.value = "Record";
        return undefined;
    }
});