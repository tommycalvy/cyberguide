import { createSignal, createEffect } from 'solid-js';
import Port from '../utils/message-producer';
import RecordingCountdown from "./components/recording-countdown";

function recordClick(e: PointerEvent, bport: Port) {
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
        bport.send({type: "action", data: action });
        e.target.removeEventListener('pointerup', logElement);
    });
}


function GuideCreator() {
    const [recording, setRecording] = createSignal(false);

    const bport = new Port('gc');
    bport.setListener('start-recording', () => {
        setRecording(true);
    });
    bport.setListener('stop-recording', () => {
        setRecording(false);
    });

    const clickListener = (e: PointerEvent) => recordClick(e, bport);

    createEffect(() => {
        if (recording()) {
            document.addEventListener('pointerdown', clickListener);
        } else {
            document.removeEventListener('pointerdown', clickListener);
        }
    });
        
    return (
        <RecordingCountdown recording={recording}/>
    );
}

export default GuideCreator;
