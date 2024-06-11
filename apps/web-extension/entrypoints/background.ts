import { GalacticBackgroundStore } from "@cyberguide/web-extension";
export default defineBackground(() => {
    console.log('Hello background!', { id: browser.runtime.id });
    browser.action.onClicked.addListener(({ id }) => {
        console.log('Action clicked!', { id }); 
        if (!id) {
            console.error('No tab ID provided');
            return;
        }
        browser.scripting.executeScript({
            target: { tabId: id },
            files: ['recording.js'],
        });
    });

    GalacticBackgroundStore(browser.runtime, () => {
        console.error('Galactic store error');
    });
});
