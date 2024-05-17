import { MessageName } from './utils';

/** @param {string} recordScriptUrl */
function startRecording(recordScriptUrl) {
    const scriptEl = document.createElement('script');
    scriptEl.src = chrome.runtime.getURL(recordScriptUrl);
    document.documentElement.appendChild(scriptEl);
    scriptEl.onload = () => {
        document.documentElement.removeChild(scriptEl);
    };
}

/**
* @param {MessageEvent<{ message: string }>} event
* @returns void
*/
const messageHandler = (event) => {
    if (event.source !== window) return;
    const data = event.data;

    /** @type {Record<string, (event: MessageEvent) => void>} */
    const eventHandler = {
        [MessageName.RecordScriptReady]: () => {
            console.log('Record script ready');
            window.postMessage(
                {
                    message: MessageName.StartRecord,
                    config: {
                        recordCrossOriginIframes: true,
                    },
                },
                location.origin,
            );
        },
        [MessageName.EmitEvent]: (event) => {
            console.log('Event emitted', event);
        },
    };
    if (eventHandler[data.message]) eventHandler[data.message](event);
};

/** @param {string} recordScriptUrl */
export function initRecordingManager(recordScriptUrl) {
    window.addEventListener('message', messageHandler);
    startRecording(recordScriptUrl); 
    /*
    if (isInCrossOriginIFrame()) {
        void initCrossOriginIframe();
    } else if (window === window.top) {
        void initMainPage();
    }
    */
}
