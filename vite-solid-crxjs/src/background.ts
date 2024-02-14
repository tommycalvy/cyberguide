import browser from 'webextension-polyfill';
import { getCurrentTabId } from '../src/utils/tab';
import guideCreatorScriptPath from '../src/guide-creator/index?script';
console.log('background.ts');

interface Cache {
    count: number;
    gcs?: string[];
}


const cache: Cache = { count: 0 };

browser.storage.local.get().then((r) => {
    Object.assign(cache, r);
});

browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
        console.log(port.name, ":" , msg);
        if (port.name === 'guide-creator') {
            cache.gcs.push(port.sender?.id);
    });
});

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


