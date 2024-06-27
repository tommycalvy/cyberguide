import { record, type eventWithTime, type recordOptions, MouseInteractions } from 'rrweb';
import { MessageName, isInCrossOriginIFrame } from './utils';

/**
* This script is injected into both main page and cross-origin IFrames 
* through <script> tags.
*/

type RecordStartedMessage = {
  message: MessageName.RecordStarted;
  startTimestamp: number;
};

const events: eventWithTime[] = [];

let stopFn: (() => void) | null = null;

function startRecord(config: recordOptions<eventWithTime>) {
    events.length = 0;
    stopFn = record({
        emit: (event) => {
            events.push(event);
            postMessage({ message: MessageName.EmitEvent, event });
        },
        hooks: {
            mouseInteraction: ({ type }) => {
                if (type === MouseInteractions.Click) {
                    postMessage({ message: MessageName.StepDetected });
                }
            },
        },
        ...config,
    }) || null;
    postMessage({
        message: MessageName.RecordStarted,
        startTimestamp: Date.now(),
    } as RecordStartedMessage);
}

const messageHandler = (
    event: MessageEvent<{ message: string, config?: recordOptions<eventWithTime> }>
) => {
    if (event.source !== window) return;
    const data = event.data;

    const eventHandler: Record<string, () => void> = {
        [MessageName.StartRecord]: () => {
            startRecord(data.config || {});
        },
        [MessageName.StopRecord]: () => {
            if (stopFn) {
                try {
                    stopFn();
                } catch (e) {
                    //
                }
            }
            postMessage({
                message: MessageName.RecordStopped,
                events,
                endTimestamp: Date.now(),
            });
            window.removeEventListener('message', messageHandler);
        },
    };
    if (eventHandler[data.message]) eventHandler[data.message]();
};


/** Only post message in the main page. */
function postMessage(message: unknown) {
  if (!isInCrossOriginIFrame()) window.postMessage(message, location.origin);
}

export function initRecordScript() {
    window.addEventListener('message', messageHandler);

    window.postMessage(
        { message: MessageName.RecordScriptReady },
        location.origin,
    );
}

