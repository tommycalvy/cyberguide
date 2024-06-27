// all message names for postMessage API
export enum MessageName {
    StepDetected = 'cyberguide-extension-step-detected',
    RecordScriptReady = 'cyberguide-extension-record-script-ready',
    StartRecord = 'cyberguide-extension-start-record',
    RecordStarted = 'cyberguide-extension-record-started',
    StopRecord = 'cyberguide-extension-stop-record',
    RecordStopped = 'cyberguide-extension-record-stopped',
    EmitEvent = 'cyberguide-extension-emit-event',
    PauseRecord = 'cyberguide-extension-pause-record',
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
