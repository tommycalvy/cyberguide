
export class BackgroundManager {

    constructor() {
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

        browser.runtime.onMessage.addListener((message, sender) => {
            console.log('Message received!', { message, sender });
            if (message === 'recording') {
                browser.tabs.sendMessage(sender.tab.id, 'startRecording');
            }
        });
    }
}
