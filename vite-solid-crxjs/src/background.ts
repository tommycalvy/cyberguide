import browser from 'webextension-polyfill';
import { Port, MessageListener } from '../src/utils/message-listener';
import gcScriptPath from '../src/guide-creator/index?script';
console.log('background.ts');

function getCache(): Promise<Map<string, any>> {
    return new Promise((resolve, reject) => {
        browser.storage.local.get().then((r) => {
            const cache = new Map(Object.entries(r)); 
            initCache(cache);
            resolve(cache);
        }).catch((err) => {
            reject(err);
        });
    });
}

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

let cache = await getCache().catch((err) => {
    console.error(err);
    const cache = new Map();
    initCache(cache);
    return cache;
});

const ml = new MessageListener(true);
const gcPort = new Port('gc', ml);


browser.runtime.onConnect.addListener((port) => {
    port.onMessage.addListener(async (msg) => {
        console.log(port.name, ":" , msg);
        if (port.name === 'gc') {
            if (msg.type === 'init') {
                const tabId = port.sender?.tab?.id;
                console.log('tabId:', tabId);
                if (tabId) {
                    port.postMessage({ type: 'init', state: 'sent state' });
                }
            }
        }
    });
});

browser.action.onClicked.addListener((tab) => {  
    console.log('browser.action.onClicked');
    if (tab.id) {
        console.log('tab.id:', tab.id);
        if (cache.get('gcs').includes(tab.id)) {
            console.log('tab.id already exists');
            return;
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
    } else {
        console.error('No tab.id found');
    }
});


