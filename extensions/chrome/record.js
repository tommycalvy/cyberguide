const countdownOverlay = document.createElement("div");
countdownOverlay.style.position = "fixed";
countdownOverlay.style.top = "0";
countdownOverlay.style.left = "0";
countdownOverlay.style.width = "100vw";
countdownOverlay.style.height = "100vh";
countdownOverlay.style.zIndex
countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
countdownOverlay.style.display = "flex";
countdownOverlay.style.justifyContent = "center";
countdownOverlay.style.alignItems = "center";
countdownOverlay.style.pointerEvents = "none";
countdownOverlay.style.transition = "opacity 0.5s";

const countdownH1 = document.createElement("h1");
countdownH1.style.color = "red";
countdownH1.style.fontSize = "5rem";
countdownH1.style.fontWeight = "bold";
countdownH1.style.pointerEvents = "none";
countdownH1.style.transition = "opacity 0.5s";

countdownOverlay.appendChild(countdownH1);
document.body.appendChild(countdownOverlay);

let countdownValue = 3;
const interval = setInterval(function() {
    countdownH1.textContent = countdownValue;
    countdownValue--;

    if (countdownValue < 0) {
        clearInterval(interval);
        countdownOverlay.remove();
        chrome.runtime.sendMessage({ action: "recordingStarted" });
    }
}, 1000);






chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stopRecording") {
        console.log("stop recording");
        chrome.runtime.sendMessage({ action: "recordingStoppped" });
    }
});