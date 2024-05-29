import { MessageName } from './utils';
import type { Runtime } from 'webextension-polyfill';

export class RecordingManager {

    constructor(runtime: Runtime.Static, recordScriptUrl: string) {
        const port = runtime.connect('recording-manager');
        window.addEventListener('message', this.messageHandler(port));
        port.onMessage.addListener(this.commandHandler(runtime, recordScriptUrl));
    }

    private startRecording(runtime: Runtime.Static, recordScriptUrl: string) {
        const scriptEl = document.createElement('script');
        scriptEl.src = runtime.getURL(recordScriptUrl);
        console.log('scriptEl.src', scriptEl.src);
        document.documentElement.appendChild(scriptEl);
        scriptEl.onload = () => {
            document.documentElement.removeChild(scriptEl);
        };
    }

    private messageHandler(port: Runtime.Port) {
        return (event: MessageEvent<{ message: string }>) => {
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
                    console.log('Event emitted');
                    port.postMessage(event);
                },
            };
            if (eventHandler[data.message]) eventHandler[data.message](event);
        }
    };

    private commandHandler(runtime: Runtime.Static, recordScriptUrl: string) {
        return (message: string) => {
            const eventHandler: Record<string, () => void> = {
                [MessageName.StartRecord]: () => {
                    this.startRecording(runtime, recordScriptUrl);
                },
                [MessageName.StopRecord]: () => {
                    window.postMessage({ message: MessageName.StopRecord });
                },
                [MessageName.PauseRecord]: () => {
                    window.postMessage({ message: MessageName.StopRecord });
                },
            };
            if (eventHandler[message]) eventHandler[message]();
        }
    }
}
