import { MessageName } from './utils';
import type { Runtime } from 'webextension-polyfill';
import { guidecreatorMethods, type Step } from './bg-config';
import { createEffect, createSignal } from 'solid-js';
import { EventType, eventWithTime, IncrementalSource, MouseInteractions } from 'rrweb';

type EmitEventMessage = {
    message: MessageName.EmitEvent;
    event: eventWithTime;
};

export function recordingManager(runtime: Runtime.Static, recordScriptUrl: string) {
    let newEvents: eventWithTime[] = [];
    // const [clickDetected, setClickDetected] = createSignal(-1);
    // const [touchStartDetected, setTouchStartDetected] = createSignal(-1);

    const {
        tab: {
            getters: { 
                isRecording,
                getGuideName,
                getStepNumber,
            },
            actions: {
                incrementStepNumber,
                addStepTitle,
                resetStepNumber,
                resetStepTitles,
            },
        },
        rpc: {
            addStepToDB,
        },
    } = guidecreatorMethods({ runtime });

    const injectRrwebScript = () => {
        const scriptEl = document.createElement('script');
        scriptEl.src = runtime.getURL(recordScriptUrl);
        console.log('scriptEl.src', scriptEl.src);
        document.documentElement.appendChild(scriptEl);
        scriptEl.onload = () => {
            document.documentElement.removeChild(scriptEl);
        };
    }

    const messageHandler = () => {
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
                    newEvents.push((event.data as EmitEventMessage).event);
                    const stepDesc = detectStep(event.data.event);
                    if (stepDesc) {
                        console.log('Step number', getStepNumber());
                        addStepToDB({
                            guideName: getGuideName(),
                            stepName: stepDesc,
                            stepNumber: getStepNumber(), 
                            events: newEvents,
                        });
                        console.log('Step added to DB', stepDesc);
                        addStepTitle(stepDesc);
                        incrementStepNumber();
                        newEvents = [];
                    }
                },
            };
            if (eventHandler[data.message]) eventHandler[data.message](event);
        }
    }

    window.addEventListener('message', messageHandler());
    createEffect(() => {
        if (isRecording()) {
            injectRrwebScript();
            console.log('Start recording message received');
        } else {
            window.postMessage({ message: MessageName.StopRecord });
            resetStepNumber();
            resetStepTitles();
            newEvents = [];
            console.log('Stop recording message received');
        }
    });
}

function detectStep(event: eventWithTime) {
    if (event.type === EventType.IncrementalSnapshot) {
        if (event.data.source === IncrementalSource.MouseInteraction) {
            if (event.data.type === MouseInteractions.Click) {
                return 'Click Element';
            }
        }
    }
}
