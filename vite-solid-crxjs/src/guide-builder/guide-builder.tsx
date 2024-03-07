import { createEffect, Show } from 'solid-js';
import RecordingCountdown from "./components/recording-countdown";
import FireRingClick from "./components/fire-ring-click";
import PreviewGuide from "./components/preview-guide";
import { GuideBuilderProvider, useGuideBuilder } from './provider';
import type { GlobalClick } from '../types/state';


export default function GuideBuilder() {

    const [
        { global: { globalRecording }, tab: { tabPreviewing } }, 
        { global: { addGlobalClick }},
    ] = useGuideBuilder(); 

    const clickListener = (e: PointerEvent) => recordClick(e, addGlobalClick);

    createEffect(() => {
        if (globalRecording()) {
            document.addEventListener('pointerdown', clickListener);
        } else {
            document.removeEventListener('pointerdown', clickListener);
        }
    });
        
    return (
        <GuideBuilderProvider>
            <Show when={globalRecording()}>
                <RecordingCountdown />
                <FireRingClick />
            </Show>
            <Show when={tabPreviewing()}>
                <PreviewGuide />
            </Show>
        </GuideBuilderProvider>
    );
}

function recordClick(
    e: PointerEvent,
    addGlobalClick: (globalClick: GlobalClick) => void,
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
        addGlobalClick({ url: url, elt: e.target });
        e.target.removeEventListener('pointerup', logElement);
    });
}
