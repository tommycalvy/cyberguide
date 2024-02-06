import browser from "webextension-polyfill";

/**
    * Get the current tab
    * @returns {Promise<browser.Tabs.Tab>} - Resolves to the current tab
*/
async function getCurrentTab() {
    return new Promise((resolve, reject) => {
        let queryOptions = { active: true, lastFocusedWindow: true };
        browser.tabs.query(queryOptions).then((tab) => {
            if (tab[0]) {
                resolve(tab[0]);
            } else {
                reject(new Error("No tab found"));
            }
        });
    });
}

/**
    * Get the current tab id
    * @returns {Promise<number>} - Resolves to the current tab id
*/
function getCurrentTabId() {
    return new Promise((resolve, reject) => {
        getCurrentTab().then((tab) => {
            if (tab.id) {
                resolve(tab.id);
            } else {
                reject(new Error("No tab id found"));
            }
        });
    });
}

export { getCurrentTab, getCurrentTabId };
