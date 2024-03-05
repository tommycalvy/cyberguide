import { createEffect, Show } from 'solid-js';
import RecordingCountdown from "./components/recording-countdown";
import FireRingClick from "./components/fire-ring-click";
import PreviewGuide from "./components/preview-guide";
import { GuideBuilderProvider, useGuideBuilder } from './provider';
import type { Action } from '../types/extra';


export default function GuideBuilder() {

    const [state, { addGlobalAction }] = useGuideBuilder(); 

    const clickListener = (e: PointerEvent) => recordClick(e, addGlobalAction);

    createEffect(() => {
        if (state.global.recording) {
            document.addEventListener('pointerdown', clickListener);
        } else {
            document.removeEventListener('pointerdown', clickListener);
        }
    });
        
    return (
        <GuideBuilderProvider>
            <Show when={state.global.recording}>
                <RecordingCountdown />
                <FireRingClick />
            </Show>
            <Show when={state.tab.previewing}>
                <PreviewGuide />
            </Show>
        </GuideBuilderProvider>
    );
}

function recordClick(
    e: PointerEvent,
    addGlobalAction: (action: Action) => void,
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
        addGlobalAction(action);
        e.target.removeEventListener('pointerup', logElement);
    });
}
