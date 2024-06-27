import { MessageName } from './utils';
import type { Runtime } from 'webextension-polyfill';
import { galacticGuideCreatorStore, GalacticGuideCreatorStore } from './galactic-state';
import { createEffect } from 'solid-js';
import { EventType, eventWithTime, IncrementalSource, MouseInteractions } from 'rrweb';

type EmitEventMessage = {
    message: MessageName.EmitEvent;
    event: eventWithTime;
};

export class RecordingManager {

    private runtime: Runtime.Static;
    private recordScriptUrl: string;
    private store: GalacticGuideCreatorStore;
    private newEvents: eventWithTime[] = [];

    constructor(runtime: Runtime.Static, recordScriptUrl: string) {
        this.runtime = runtime;
        this.recordScriptUrl = recordScriptUrl;
        this.store = galacticGuideCreatorStore({ runtime });
        console.log("this.store", this.store);
        window.addEventListener('message', this.messageHandler());
        createEffect(async () => {
            if (this.store.tab.state.recording) {
                this.startRecording();
                this.newEvents = [];
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
                    this.newEvents.push((event.data as EmitEventMessage).event);
                },
                [MessageName.StepDetected]: () => {
                    this.saveNewStep();
                },
            };
            if (eventHandler[data.message]) eventHandler[data.message](event);
        }
    };

    private detectStep(event: eventWithTime) {
        if (event.type === EventType.IncrementalSnapshot) {
            if (event.data.source === IncrementalSource.MouseInteraction) {
                if (event.data.type === MouseInteractions.Click ||
                    event.data.type === MouseInteractions.MouseUp ||
                    event.data.type === MouseInteractions.DblClick ||
                    event.data.type === MouseInteractions.TouchEnd) {
                }
            }
        }
    }

    private async saveNewStep() {
        await this.store.dbMethods.setters.addStep({ events: this.newEvents });
        this.newEvents = [];
    }

    private commandHandler() {
        return (message: string) => {
            const eventHandler: Record<string, () => void> = {
                [MessageName.StartRecord]: () => {
                    this.startRecording();
                    this.newEvents = [];
                },
                [MessageName.StopRecord]: () => {
                    window.postMessage({ message: MessageName.StopRecord });
                    this.store.dbMethods.setters.addStep({ events: this.newEvents })
                    this.newEvents = [];
                },
                [MessageName.PauseRecord]: () => {
                    window.postMessage({ message: MessageName.StopRecord });
                },
            };
            if (eventHandler[message]) eventHandler[message]();
        }
    }
}
