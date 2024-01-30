import browser from "../utils/browser-namespace.js";

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await browser.tabs.query(queryOptions);
    return tab;
}

async function getCurrentTabId() {
    let tab = await getCurrentTab();
    return tab.id;
}

export { getCurrentTab, getCurrentTabId };
