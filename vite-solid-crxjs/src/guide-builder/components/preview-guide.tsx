import { createMemo, onCleanup, Show } from 'solid-js';
import styles from './preview-guide.module.css';
import { useGuideBuilder } from '../provider';
import { GlobalClick } from '../../types/state';

export default function PreviewGuide() {
    const [
        { global: { globalClicks }, tab: { tabCurrentStep } },
        { tab: { incrementTabCurrentStep } },
    ] = useGuideBuilder();
   
    const clickListener = (e: PointerEvent) => handleClick(
        e, 
        globalClicks,
        tabCurrentStep,
        incrementTabCurrentStep,
    );

    document.addEventListener('pointerup', clickListener);

    onCleanup(() => {
        document.removeEventListener('pointerup', clickListener);
    });
    
    const boundingRect = createMemo(() => {
        const clicks = globalClicks();
        const clicksLength = clicks.length;
        const currentStep = tabCurrentStep();
        if (clicksLength === 0) {
            return;
        }
        if (currentStep === clicksLength) {
            return;
        }
        const elt = clicks[currentStep].elt;
        const rect = elt.getBoundingClientRect();
        if (rect instanceof DOMRect === false) {
            console.error(new Error('not a DOMRect'));
            return;
        }
        return rect;
    }, { equals: false });
    
    return (
        <Show when={ 
            boundingRect() && tabCurrentStep() < globalClicks().length
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
    globalClicks: () => GlobalClick[],
    tabCurrentStep: () => number,
    incrementTabCurrentStep: () => void,
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

        const click = globalClicks()[tabCurrentStep()];
        console.log('globalClick', click);
        if (click.url !== url) {
            console.error(new Error('url does not match'));
            return;
        }
        if (!click.elt.isEqualNode(e.target)) {
            console.error(new Error('element does not match'));
            return;
        }
        console.log('click matches');
        incrementTabCurrentStep();
        e.target.removeEventListener('pointerup', logElement);
    });
}
