import { record } from 'rrweb';
import { MessageName, isInCrossOriginIFrame } from './utils';

/**
* This script is injected into both main page and cross-origin IFrames 
* through <script> tags.
*/

/** @typedef {import('@rrweb/types').eventWithTime} eventWithTime */
/** @typedef {import('rrweb').recordOptions<eventWithTime>} recordOptions */

/**
* @typedef {Object} RecordStartedMessage
* @property {typeof MessageName.RecordStarted} message
* @property {number} startTimestamp
*/


/** @type {eventWithTime[]} */
const events = [];

/** @type {(() => void) | null} */
let stopFn = null;

/** @param {recordOptions} config */
function startRecord(config) {
    events.length = 0;
    stopFn = record({
        emit: (event) => {
            events.push(event);
            postMessage({ message: MessageName.EmitEvent, event });
        },
        ...config,
    }) || null;
    postMessage(/* @type {RecordStartedMessage} */ {
        message: MessageName.RecordStarted,
        startTimestamp: Date.now(),
    });
}

/**
* @param {MessageEvent<{ message: string, config?: recordOptions }>} event
* @returns void
*/
const messageHandler = (event) => {
    if (event.source !== window) return;
    const data = event.data;

    /** @type {Record<string, () => void>} */
    const eventHandler = {
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


/**
    * Only post message in the main page.
    * @param {unknown} message
 */
function postMessage(message) {
  if (!isInCrossOriginIFrame()) window.postMessage(message, location.origin);
}

export function initRecordScript() {
    window.addEventListener('message', messageHandler);

    window.postMessage(
        { message: MessageName.RecordScriptReady },
        location.origin,
    );
}

