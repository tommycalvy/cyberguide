import browser from 'webextension-polyfill';
import { getCurrentTabId } from '../src/utils/tab';
import guideCreatorScriptPath from '../src/guide-creator/index?script';
console.log('background.ts');

browser.action.onClicked.addListener((tab) => {  
    console.log('browser.action.onClicked');
    if (tab.id) {
        console.log('tab.id:', tab.id);
        browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: [guideCreatorScriptPath],
        });
    } else {
        console.error('No tab.id found');
    }
});


browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
        console.log(port.name, ":" , msg);
        if (port.name === 'popup') {
            if (msg.type === 'ping') {
                port.postMessage({ message: 'Hello from background.js' });
            } else if (msg.type === 'execute-guide-creator') {
                const tabId = await getCurrentTabId();
                console.log('tabId:', tabId);
                browser.scripting.executeScript({
                    target: { tabId },
                    files: [guideCreatorScriptPath],
                });
            }
        }
    });
});


