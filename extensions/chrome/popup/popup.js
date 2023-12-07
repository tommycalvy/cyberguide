let recordButton = document.getElementById("recordButton");
let container = document.getElementById("container");

const countDown = document.createElement("h1");
countDown.innerText = "3";
countDown.style.color = "red";

let readyToRecord = false;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "readyToRecord") {
        readyToRecord = true;
        return undefined;
    }
    if (request.action === "recordingStarted") {
        window.close();
    }
});

recordButton.addEventListener("click", () => {
    if (recordButton.value === "Record") {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                if (tabs[0].url?.startsWith("chrome://")) return undefined;
                chrome.runtime.sendMessage({ action: "getReadyToRecord" });
                container.replaceChild(countDown, recordButton);
                setTimeout(() => {
                    countDown.innerText = "2";
                    setTimeout(() => {
                        countDown.innerText = "1";
                        setTimeout(() => {
                            countDown.innerText = "0";
                        }, "1000");
                        setTimeout(() => {
                            if (readyToRecord) {
                                chrome.runtime.sendMessage({
                                    action: "startRecording",
                                });
                                return undefined;
                            }
                            countDown.innerText = "Error";
                        }, "700");
                    }, "700");
                }, "700");
            }
        );

        return undefined;
    }
    if (recordButton.value === "Stop Recording") {
        chrome.runtime.sendMessage({ action: "stopRecording" });
        return undefined;
    }
});

chrome.action.getBadgeText({}, (result) => {
    if (result === "•REC") {
        document.getElementById("recordButton").value = "Stop Recording";
        return undefined;
    }
});
