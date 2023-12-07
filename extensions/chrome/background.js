chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startRecording") {
        chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ["record.js"],
                });
            }
        );
    }
    if (request.action === "recordingStarted") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0].url?.startsWith("chrome://")) return undefined;
            chrome.action.setBadgeText({ tabId: tabs[0].id, text: "•REC" });
            chrome.action.setBadgeBackgroundColor({ color: "#FE0000" });
        });
    }
    if (request.action === "recordingStopped") {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0].url?.startsWith("chrome://")) return undefined;
            chrome.action.setBadgeText({ tabId: tabs[0].id, text: "" });
        });
    }
});

/*
chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(async msg => {

    if (port.name === PortNames.SidePanelPort) {
      if (msg.type === 'init') {
        console.log('panel opened');

        await storage.setItem('panelOpen', true);

        port.onDisconnect.addListener(async () => {
          await storage.setItem('panelOpen', false);
          console.log('panel closed');
          console.log('port disconnected: ', port.name);
        });

        const tab = await getCurrentTab();

        if (!tab?.id) {
          console.error("Couldn't get current tab");
          return;
        }

        injectContentScript(tab.id);

        port.postMessage({ 
          type: 'handle-init', 
          message: 'panel open' 
        });
      }
    }
  });
});
*/
