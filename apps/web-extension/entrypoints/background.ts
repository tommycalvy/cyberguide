import { GalacticBackgroundStore } from "@cyberguide/web-extension";
export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });
    browser.action.onClicked.addListener(async (tab) => {
        const tabId = tab.id;
        console.log('Action clicked!', { tabId }); 
        if (!tabId) {
            console.error('No tab ID provided');
            return;
        }
        browser.scripting.executeScript({
            target: { tabId },
            files: ['recording.js'],
        });
        /*
        browser.sidebarAction.({
            tabId,
            panel: `sidebar.html?tabId=${tabId}`,
        });
        await browser.sidebarAction.open();
        */
        chrome.sidePanel.setOptions({
            tabId,
            path: `sidepanel.html?tabId=${tabId}`,
            enabled: true,
        });
        await chrome.sidePanel.open({ tabId });
    });

    /*
        chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
      if (!tab.url) return;
      const url = new URL(tab.url);
      // Enables the side panel on google.com
      if (url.origin === GOOGLE_ORIGIN) {
        await chrome.sidePanel.setOptions({
          tabId,
          path: 'sidepanel.html',
          enabled: true
        });
      } else {
        // Disables the side panel on all other sites
        await chrome.sidePanel.setOptions({
          tabId,
          enabled: false
        });
      }
    });
*/
    GalacticBackgroundStore(browser.runtime, () => {
        console.error('Galactic store error');
    });
});
