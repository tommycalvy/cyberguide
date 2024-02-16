import { createSignal, createEffect, Show } from 'solid-js';
import CreatorWidget from "./components/creator-widget";
import browser from 'webextension-polyfill';
import RecordingCountdown from "./components/recording-countdown";


function recordClick(e: PointerEvent) {
    if (e.target instanceof Element === false) {
        console.log('not an Element');
        return;
    }
    e.target.addEventListener('pointerup', function logElement(e) {
        if (e.target instanceof Element === false) {
            console.log('not an Element');
            return;
        }
        console.log(e.target);
        let url = window.location.href;
        console.log(url);
        if (url === null) {
            throw new Error('url is null');
        }
        let recordedElt = {
            url: url,
            elt: e.target
        };
        recordedElts.pushUnique(Promise.resolve(recordedElt));
        e.target.removeEventListener('pointerup', logElement);
    });
}


function GuideCreator() {
    const [widgetOpen, setWidgetOpen] = createSignal(true);
    const [recording, setRecording] = createSignal(false);
        
    const bport = browser.runtime.connect({name: "gc"});
    bport.postMessage({type: "init"});
    bport.onMessage.addListener((msg) => {
        if (msg.type === "init") {
            console.log("Background.ts sent state: ", msg);
        } else if (msg.type === "open-widget") {
            setWidgetOpen(true);
        }
    });

    function closeWidget() {
        setWidgetOpen(false);
    }

    function stopRecording() {
        setRecording(false);
    }

    function startRecording() {
        setRecording(true);
    }

    createEffect(() => {
        if (recording()) {
            document.addEventListener('pointerdown', recordClick);
        }
    });
        
    return (
        <>
            <Show when={widgetOpen()}>
                <CreatorWidget
                    closeWidget={closeWidget}
                    recording={recording}
                    startRecording={startRecording}
                    stopRecording={stopRecording}
                />
            </Show>
            <RecordingCountdown recording={recording}/>
        </>
    );
}

export default GuideCreator;
