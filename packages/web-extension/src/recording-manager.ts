import { MessageName } from './utils';
import type { Runtime } from 'webextension-polyfill';
import { GalacticGuideCreatorStore, galacticGuideCreatorStore } from './galactic-state';
import { createEffect } from 'solid-js';

export class RecordingManager {

    private runtime: Runtime.Static;
    private recordScriptUrl: string;
    private store: GalacticGuideCreatorStore;;

    constructor(runtime: Runtime.Static, recordScriptUrl: string) {
        this.runtime = runtime;
        this.recordScriptUrl = recordScriptUrl;
        this.store = galacticGuideCreatorStore({ runtime });
        window.addEventListener('message', this.messageHandler());
        createEffect(() => {
            if (this.store.tab.state.recording) {
                this.startRecording();
                console.log('Start recording message received');
            } else {
                window.postMessage({ message: MessageName.StopRecord });
                console.log('Stop recording message received');
            }
        });
    }

    private startRecording() {
        const scriptEl = document.createElement('script');
        scriptEl.src = this.runtime.getURL(this.recordScriptUrl);
        console.log('scriptEl.src', scriptEl.src);
        document.documentElement.appendChild(scriptEl);
        scriptEl.onload = () => {
            document.documentElement.removeChild(scriptEl);
        };
    }

    private messageHandler() {
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
                    //TODO: Send some rpc to the background script to store the event
                },
            };
            if (eventHandler[data.message]) eventHandler[data.message](event);
        }
    };

    private commandHandler() {
        return (message: string) => {
            const eventHandler: Record<string, () => void> = {
                [MessageName.StartRecord]: () => {
                    this.startRecording();
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
