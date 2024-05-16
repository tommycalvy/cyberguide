import { record } from 'rrweb';

/**
 * This script is injected into both main page and cross-origin IFrames through <script> tags.
 */

/** @typedef {import('@rrweb/types').eventWithTime} eventWithTime */
/** @typedef {import('rrweb').recordOptions<eventWithTime>} recordOptions */

/**
* @typedef {Object} RecordStartedMessage
* @property {typeof MessageName.RecordStarted} message
* @property {number} startTimestamp
*/

const MessageName = {
    RecordScriptReady: 'cyberguide-extension-record-script-ready',
    StartRecord: 'cyberguide-extension-start-record',
    RecordStarted: 'cyberguide-extension-record-started',
    StopRecord: 'cyberguide-extension-stop-record',
    RecordStopped: 'cyberguide-extension-record-stopped',
    EmitEvent: 'cyberguide-extension-emit-event',
};

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

const messageHandler = (
  event: MessageEvent<{
    message: MessageName;
    config?: recordOptions<eventWithTime>;
  }>,
) => {
  if (event.source !== window) return;
  const data = event.data;
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
  } as Record<MessageName, () => void>;
  if (eventHandler[data.message]) eventHandler[data.message]();
};

/**
    * Only post message in the main page.
    * @param {unknown} message
 */
function postMessage(message) {
  if (!isInCrossOriginIFrame()) window.postMessage(message, location.origin);
}

window.addEventListener('message', messageHandler);

window.postMessage(
  {
    message: MessageName.RecordScriptReady,
  },
  location.origin,
);
