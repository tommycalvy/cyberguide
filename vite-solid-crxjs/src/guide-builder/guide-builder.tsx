import { createSignal, createEffect, Show } from 'solid-js';
import Port from '../utils/message-producer';
import RecordingCountdown from "./components/recording-countdown";
import FireRingClick from "./components/fire-ring-click";
import PreviewGuide from "./components/preview-guide";
import { Action } from '../utils/types';

function recordClick(
    e: PointerEvent,
    bport: Port,
    actions: () => Action[],
    setActions: (actions: Action[]) => void,
) {
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
        setActions([...actions(), action]);
        e.target.removeEventListener('pointerup', logElement);
    });
}


function GuideBuilder() {
    const [recording, setRecording] = createSignal(false);
    const [actions, setActions] = createSignal<Action[]>([]);
    const [previewing, setPreviewing] = createSignal(false);

    const bport = new Port('gc');
    bport.setListener('start-recording', () => {
        setRecording(true);
    });
    bport.setListener('stop-recording', () => {
        setRecording(false);
    });
    bport.setListener('start-preview', () => {
        setPreviewing(true);
    });
    bport.setListener('stop-preview', () => {
        setPreviewing(false);
    });

    const clickListener = (e: PointerEvent) => recordClick(
        e, bport, actions, setActions
    );

    createEffect(() => {
        if (recording()) {
            document.addEventListener('pointerdown', clickListener);
        } else {
            document.removeEventListener('pointerdown', clickListener);
        }
    });
        
    return (
        <>
            <Show when={recording()}>
                <RecordingCountdown />
                <FireRingClick />
            </Show>
            <Show when={previewing()}>
                <PreviewGuide actions={actions} />
            </Show>
        </>
    );
}

export default GuideBuilder;
