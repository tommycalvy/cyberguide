import { Action } from '../../utils/types';
import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import styles from './preview-guide.module.css';

interface PreviewGuideProps {
    actions: () => Action[];
}

function handleClick(
              e: PointerEvent,
    currentStep: () => number,
 setCurrentStep: (step: number) => void,
        actions: () => Action[],
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
        const action = actions()[currentStep()];
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
        setCurrentStep(currentStep() + 1);
        e.target.removeEventListener('pointerup', logElement);
    });
}

function PreviewGuide(props: PreviewGuideProps) {
    const [currentStep, setCurrentStep] = createSignal(0);
    const [boundingRect, setBoundingRect] = createSignal<DOMRect | null>(null);
   
    const clickListener = (e: PointerEvent) => handleClick(
        e, currentStep, setCurrentStep, props.actions
    );

    document.addEventListener('pointerup', clickListener);

    onCleanup(() => {
        document.removeEventListener('pointerup', clickListener);
    });
    
    createEffect(() => {
        const rect = props.actions()[currentStep()].elt.getBoundingClientRect();
        if (rect instanceof DOMRect === false) {
            console.error(new Error('not a DOMRect'));
            return;
        }
        setBoundingRect(rect);
    });
    
    return (
        <Show when={boundingRect() && currentStep() < props.actions().length}>
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

export default PreviewGuide;
