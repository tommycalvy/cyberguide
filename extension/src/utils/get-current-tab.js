import browser from "webextension-polyfill";

async function getCurrentTab() {
    return new Promise((resolve, reject) => {
        let queryOptions = { active: true, lastFocusedWindow: true };
        browser.tabs.query(queryOptions).then((tab) => {
            console.log(tab);
            if (tab[0]) {
                resolve(tab[0]);
            } else {
                reject(new Error("No tab found"));
            }
        });
    });
}

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
