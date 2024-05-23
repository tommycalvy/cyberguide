import { MessageName } from './utils';
import { WxtRuntime } from 'wxt/browser';

function startRecording(runtime: WxtRuntime, recordScriptUrl: string) {
    const scriptEl = document.createElement('script');
    scriptEl.src = runtime.getURL(recordScriptUrl);
    console.log('scriptEl.src', scriptEl.src);
    document.documentElement.appendChild(scriptEl);
    scriptEl.onload = () => {
        document.documentElement.removeChild(scriptEl);
    };
}

const messageHandler = (event: MessageEvent<{ message: string }>) => {
    if (event.source !== window) return;
    const data = event.data;

    const eventHandler: Record<string, (event: MessageEvent) => void> = {
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

export function initRecordingManager(runtime: WxtRuntime, recordScriptUrl: string) {
    window.addEventListener('message', messageHandler);
    startRecording(runtime, recordScriptUrl); 
    /*
    if (isInCrossOriginIFrame()) {
        void initCrossOriginIframe();
    } else if (window === window.top) {
        void initMainPage();
    }
    */
}
