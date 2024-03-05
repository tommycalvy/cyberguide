import { Action } from '../../types/extra';
import { createSignal, createRenderEffect, onCleanup, Show } from 'solid-js';
import styles from './preview-guide.module.css';
import { useGuideBuilder } from '../provider';

export default function PreviewGuide() {
    const [state, { incrementCurrentStep }] = useGuideBuilder();
    const [boundingRect, setBoundingRect] = createSignal<DOMRect | null>(null);
   
    const clickListener = (e: PointerEvent) => handleClick(
        e, 
        state.global.actions,
        state.tab.currentStep,
        incrementCurrentStep,
    );

    document.addEventListener('pointerup', clickListener);

    onCleanup(() => {
        document.removeEventListener('pointerup', clickListener);
    });
    
    createRenderEffect(() => {
        if (state.global.actions.length === 0) {
            return;
        }
        if (state.tab.currentStep === state.global.actions.length) {
            return;
        }
        const elt = state.global.actions[state.tab.currentStep].elt;
        const rect = elt.getBoundingClientRect();
        if (rect instanceof DOMRect === false) {
            console.error(new Error('not a DOMRect'));
            return;
        }
        setBoundingRect(rect);
    });
    
    return (
        <Show when={
            boundingRect() && 
            state.tab.currentStep < state.global.actions.length
        }>
            <div class={styles["click-area"]} style={{ 
                top: `${boundingRect()?.top}px`,
                left: `${boundingRect()?.left}px`,
                width: `${boundingRect()?.width}px`,
                height: `${boundingRect()?.height}px`,
            }}>
            </div>
        </Show>
    );
}

function handleClick(
    e: PointerEvent,
    actions: Action[],
    currentStep: number,
    incrementCurrentStep: () => void,
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
        const action = actions[currentStep];
        let error = false;
        if (action.type !== 'click') {
            console.error(new Error('action type is not click'));
            error = true;
        }
        if (action.url !== url) {
            console.error(new Error('url does not match'));
            error = true;
        }
        if (action.elt !== e.target) {
            console.error(new Error('element does not match'));
            error = true;
        }
        if (error) {
            return;
        }
        console.log('action matches');
        incrementCurrentStep();
        e.target.removeEventListener('pointerup', logElement);
    });
}
