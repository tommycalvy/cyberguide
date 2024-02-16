import browser from 'webextension-polyfill';
import { Channel, MessageListener } from '../src/utils/message-listener';
import gcScriptPath from '../src/guide-creator/index?script';
console.log('background.ts');

// Clearing storage for development purposes
browser.storage.local.clear().then(() => {
    console.log('Storage cleared');
}).catch((err) => {
    console.error(browser.runtime.lastError);
    console.error(err);
});

function initCache(cache: Map<string, any>): void {
    if (!cache.has('gcs')) {
        cache.set('gcs', []);
    }
    if (!cache.has('count')) {
        cache.set('count', 0);
    } else {
        cache.set('count', cache.get('count') + 1);
    }
}

let cache: Map<string, any> = new Map();
browser.storage.local.get().then((r) => {
    cache = new Map(Object.entries(r)); 
    initCache(cache);
}).catch((err) => {
    console.error(err);
    initCache(cache);
});

const messageListener = new MessageListener();
const gcc = new Channel('gc', messageListener);

gcc.onDisconnect((tabId) => {
    console.log('gcc onDisconnect, tabId:', tabId);
    const gcs = cache.get('gcs');
    const index = gcs.indexOf(tabId);
    if (index > -1) {
        gcs.splice(index, 1);
        cache.set('gcs', gcs);
        browser.storage.local.set({ gcs: gcs }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
});

gcc.onMessage('init', (tabId, msg) => {
    console.log('init:', tabId, msg);
    gcc.postMessage(tabId, { type: 'init', message: 'sent state' });
});

browser.action.onClicked.addListener((tab) => {  
    console.log('browser.action.onClicked');
    if (!tab.id) {
        console.error('No tab.id found');
        return;
    }
    console.log('tab.id:', tab.id);
    if (cache.get('gcs').includes(tab.id)) {
        console.log('tab.id already exists');
        gcc.postMessage(tab.id, { type: 'open-widget' });
    } else {
        browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: [gcScriptPath],
        });
        cache.set('gcs', [...cache.get('gcs'), tab.id]);
        browser.storage.local.set({ gcs: cache.get('gcs') }).catch((err) => {
            console.error(browser.runtime.lastError);
            console.error(err);
        });
    }
});


