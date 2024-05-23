// all message names for postMessage API
export enum MessageName {
    RecordScriptReady = 'rrweb-extension-record-script-ready',
    StartRecord = 'rrweb-extension-start-record',
    RecordStarted = 'rrweb-extension-record-started',
    StopRecord = 'rrweb-extension-stop-record',
    RecordStopped = 'rrweb-extension-record-stopped',
    EmitEvent = 'rrweb-extension-emit-event',
}

export function isInCrossOriginIFrame() {
    if (window.parent !== window) {
        try {
            void window.parent.location.origin;
        } catch (error) {
            return true;
        }
    }
    return false;
}
