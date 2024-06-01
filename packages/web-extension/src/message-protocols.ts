const messaging = new MessageProtocol('cyberguide');

interface RecordingProtocol {
    start: () => void;
    stop: () => void;
    pause: () => void;
};

const recordingProtocol = {
    start: null,
    stop: null,
    pause: null,
};

export const recordingChannel = 
    messaging.create<{ receiver: RecordingProtocol }>('recording');

export const sidebarChannel =
    messaging.create<{ sender: RecordingProtocol }>('sidebar');

export const registerProtocols = messaging.register();


/*
    * I want the RecordingChannel to be consumed by the sidebar script like this:
    * const { recording } = sidebarChannel(tabId);
*   recording.start();
*   recording.stop();
*   recording.pause();
*   The recording channel is in another content script and it should listen to the messages
*   from the sidebar script.
    *   The messages should travel through the background script.
    *   The background script should register the message handlers like this:
    *   registerProtocols();
*   The content script should listen to the messages like this:
    *   const { sidebar } = recordingChannel();
*   sidebar.onRecordingStart(() => {...});
*   sidebar.onRecordingStop(() => {...});
*   sidebar.onRecordingPause(() => {...});
*/
