import { createMemo, onCleanup, Show } from 'solid-js';
import styles from './preview-guide.module.css';
import { useGuideBuilder } from '../provider';
import { GlobalClick } from '../../types/state';
import { type Result, BaseError } from '../../utils/error';

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
        console.log('elt', elt);
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
        console.log('clicked element:', click.elt);
        if (click.url !== url) {
            console.error(new Error('url does not match'));
            return;
        }

        console.log('click matches');
        incrementTabCurrentStep();
        e.target.removeEventListener('pointerup', logElement);
    });
}

//TODO: Check if element is in view
function findElement(click: GlobalClick): Result<Element> {
    const elt = document.querySelector(click.elt.selector);
    if (elt) {
        return { success: true, result: elt };
    } else {
        const err = new BaseError("couldn't find element by selector",
            { context: { selector: click.elt.selector } },
        );
        console.warn(err);
    }

    let elts: NodeListOf<Element> | Element[] = []; 

    if (click.elt.href) {
        elts = document.querySelectorAll(`[href="${click.elt.href}"]`);
        if (elts.length === 1) {
            return { success: true, result: elts[0] };
        }
    } 

    if (click.elt.classList) {
        elts = narrowElementsByClassList(elts, click.elt.classList);
    }

    if (click.elt.attributes) {
        elts = narrowElementsByAttributes(elts, click.elt.attributes);
    }

    if (elts.length === 1) {
        return { success: true, result: elts[0] };
    } else if (elts.length > 1) {
        const err = new BaseError(
            "multiple elements found by classList and attributes",
            { context: { 
                classList: click.elt.classList,
                attributes: click.elt.attributes 
            } },
        );
        return { success: false, error: err };
    } else {
        const err = new BaseError(
            "no elements found by classList and attributes",
            { context: { 
                classList: click.elt.classList,
                attributes: click.elt.attributes 
            } },
        );
        return { success: false, error: err };
    }
}

function narrowElementsByClassList(
    elts: NodeListOf<Element> | Element[],
    classList: string[],
): NodeListOf<Element> | Element[] {
    for (let i = 0; i < classList.length; i++) {
        let narrowedElts = [];
        for (let j = 0; j < elts.length; j++) {
            if (elts[j].classList.contains(classList[i])) {
                narrowedElts.push(elts[j]);
            }
        }
        if (narrowedElts.length === 1) {
            return [narrowedElts[0]];
        }
        if (narrowedElts.length > 1) {
            elts = narrowedElts;
        }
    }
    return elts;
}

function narrowElementsByAttributes(
    elts: NodeListOf<Element> | Element[],
    attributes: [string, string][],
): NodeListOf<Element> | Element[] {
    for (let i = 0; i < attributes.length; i++) {
        const attr = attributes[i];
        let narrowedElts = [];
        for (let j = 0; j < elts.length; j++) {
            if (elts[j].getAttribute(attr[0]) === attr[1]) {
                narrowedElts.push(elts[j]);
            }
        }
        if (narrowedElts.length === 1) {
            return [narrowedElts[0]];
        }
        if (narrowedElts.length > 1) {
            elts = narrowedElts;
        }
    }
    return elts;
}
