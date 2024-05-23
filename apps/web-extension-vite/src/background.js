import browser from 'webextension-polyfill';

browser.action.onClicked.addListener((tab) => {
    browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/index.js'],
    });
});

