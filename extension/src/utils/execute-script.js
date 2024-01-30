import browser from "../utils/browser-namespace.js";
import getCurrentTab from "../utils/get-current-tab.js";

/**
    * Execute script in specified tab
    * @param {number} tabId - Id of tab to execute script in
    * @param {string[]} files - Function to execute
    * @returns {Promise} - Promise that resolves when script is executed
*/
async function executeScript(tabId, files) {
    return browser.scripting.executeScript({
        target: { tabId: tabId },
        injectImmediately: true,
        files: files
    });
}



/**
    * Execute script in current tab
    * @param {string[]} files - Function to execute
    * @returns {Promise} - Promise that resolves when script is executed
*/
async function executeScriptInCurrentTab(files) {
    let tab = await getCurrentTab();
    return executeScript(tab.id, files);
}

export { executeScript, executeScriptInCurrentTab };
