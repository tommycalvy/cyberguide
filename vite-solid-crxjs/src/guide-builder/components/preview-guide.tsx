import { createMemo, createEffect, Show } from 'solid-js';
import styles from './preview-guide.module.css';
import { useGuideBuilder } from '../provider';
import { EltInfo } from '../../types/state';
import { type Result, BaseError } from '../../utils/error';

export default function PreviewGuide() {
    const [
        { global: { globalClicks }, tab: { tabCurrentStep } },
        { tab: { incrementTabCurrentStep } },
    ] = useGuideBuilder();

    const elt = createMemo(() => {
        const clicks = globalClicks();
        const clicksLength = clicks.length;
        if (clicksLength === 0) {
            console.log('clicksLength === 0');
            return null;
        }
        const currentStep = tabCurrentStep();
        if (currentStep === clicksLength) {
            console.log('currentStep === clicksLength');
            return null;
        }
        const url = window.location.href;
        const click = clicks[currentStep];
        if (click.url !== url) {
            console.warn('url does not match');
            return null;
        }
        const eltResult = findElement(click.eltInfo);
        if (!eltResult.success) {
            console.error(eltResult.error);
            return null;
        }
        return eltResult.result;
    });

    const boundingRect = createMemo(() => {
        const targetElt = elt();
        if (targetElt) {
            return targetElt.getBoundingClientRect();
        }
        return null;
    });
   
    createEffect(() => {
        const targetElt = elt();
        if (targetElt) {
            handleClick(targetElt, incrementTabCurrentStep);
        }
    });

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
    elt: Element,
    incrementTabCurrentStep: () => void,
) {
    elt.addEventListener('pointerdown', function handlePointerDown() {
        elt.addEventListener('pointerup', function handlePointerUp() {
            console.log('click matches');
            incrementTabCurrentStep();
            elt.removeEventListener('pointerdown', handlePointerDown);
            elt.removeEventListener('pointerup', handlePointerUp);
        });
    });
}

//TODO: Check if element is in view
function findElement(eltInfo: EltInfo): Result<Element> {
    const elt = document.querySelector(eltInfo.selector);
    if (elt) {
        return { success: true, result: elt };
    } else {
        const err = new BaseError("couldn't find element by selector",
            { context: { selector: eltInfo.selector } },
        );
        console.warn(err);
    }

    let elts: NodeListOf<Element> | Element[] = []; 

    if (eltInfo.href) {
        elts = document.querySelectorAll(`[href="${eltInfo.href}"]`);
        if (elts.length === 1) {
            return { success: true, result: elts[0] };
        }
    } 

    if (eltInfo.classList) {
        elts = narrowElementsByClassList(elts, eltInfo.classList);
    }

    if (eltInfo.attributes) {
        elts = narrowElementsByAttributes(elts, eltInfo.attributes);
    }

    if (elts.length === 1) {
        return { success: true, result: elts[0] };
    } else if (elts.length > 1) {
        const err = new BaseError(
            "multiple elements found by classList and attributes",
            { context: { 
                classList: eltInfo.classList,
                attributes: eltInfo.attributes 
            } },
        );
        return { success: false, error: err };
    } else {
        const err = new BaseError(
            "no elements found by classList and attributes",
            { context: { 
                classList: eltInfo.classList,
                attributes: eltInfo.attributes 
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
