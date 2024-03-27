import { createEffect, Show } from 'solid-js';
import RecordingCountdown from "./components/recording-countdown";
import FireRingClick from "./components/fire-ring-click";
import PreviewGuide from "./components/preview-guide";
import { useGuideBuilder } from './provider';
import type { GlobalClick } from '../types/state';
import { finder } from '@medv/finder';


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
        <>
            <Show when={globalRecording()}>
                <RecordingCountdown />
                <FireRingClick />
            </Show>
            <Show when={tabPreviewing()}>
                <PreviewGuide />
            </Show>
        </>
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
        const elt = e.target;
        if (elt instanceof Element === false) {
            console.error(new Error('not an Element'));
            return;
        }

        const location = window.location.href;
        if (location === '') {
            console.error(new Error('location is empty'));
            return;
        }

        let classList: string[] | null = null;
        if (elt.classList.length > 0) {
            classList = [];
            for (let i = 0; i < elt.classList.length; i++) {
                const className = elt.classList.item(i);
                if (className === null) {
                    break;
                }
                classList.push(className);
            }
        }

        const attributes = [];
        for (let i = 0; i < elt.attributes.length; i++) {
            const attr = elt.attributes.item(i);
            if (attr === null) {
                break;
            }
            const attribute: [string, string] = [attr.name, attr.value];
            attributes.push(attribute);
        }

        const selector = finder(elt);
        console.log('selector:', selector);

        const eltInfo = {
            id: elt.id === '' ? null : elt.id,
            selector,
            classList,
            href: elt.getAttribute('href'),
            attributes,
        };
        addGlobalClick({ location, eltInfo });
        elt.removeEventListener('pointerup', logElement);
    });
}

