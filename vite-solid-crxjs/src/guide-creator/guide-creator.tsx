import { createSignal, createEffect } from 'solid-js';
import browser from 'webextension-polyfill';
import RecordingCountdown from "./components/recording-countdown";

function recordClick(e: PointerEvent, bport: browser.Runtime.Port) {
    if (e.target instanceof Element === false) {
        console.error(new Error('not an Element'));
        return;
    }
    e.target.addEventListener('pointerup', function logElement(e) {
        if (e.target instanceof Element === false) {
            console.error(new Error('not an Element'));
            return;
        }
        console.log(e.target);
        let url = window.location.href;
        console.log(url);
        if (url === null) {
            console.error(new Error('url is null'));
        }
        const action = { type: 'click', url: url, elt: e.target };
        bport.postMessage({type: "action", action });
        e.target.removeEventListener('pointerup', logElement);
    });
}


function GuideCreator() {
    const [recording, setRecording] = createSignal(false);

    const bport = browser.runtime.connect({name: "gc"});
    bport.postMessage({type: "init"});
    bport.onMessage.addListener((msg) => {
        if (msg.type === "record") {
            setRecording(true);
        } else if (msg.type === "stop") {
            setRecording(false);
        }
    });

    createEffect(() => {
        // Define a persistent function that can be added or removed
        const listener = (e: PointerEvent) => recordClick(e, bport);

        if (recording()) {
            // Add the listener
            document.addEventListener('pointerdown', listener);
        } else {
            // Remove the listener
            document.removeEventListener('pointerdown', listener);
        }

        // Cleanup function to ensure no leaks when the component unmounts or effect re-runs
        return () => {
            document.removeEventListener('pointerdown', listener);
        };
    });
        
    return (
        <RecordingCountdown recording={recording}/>
    );
}

export default GuideCreator;
