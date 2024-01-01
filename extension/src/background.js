var browser = require("webextension-polyfill");

browser.storage.sync.set({ guideActive: false });

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener((msg) =>  {
        if (port.name === "sidepanel") {
            if (msg.type === "init") {
                console.log("panel opened");
                port.onDisconnect.addListener(async () => {
                    console.log("panel closed");
                    console.log("port disconnected: ", port.name);
                });
                port.postMessage({
                    type: "handle-init",
                    message: "panel open"
                });
            }
        }
    });
});

console.log("background.js loaded ");


