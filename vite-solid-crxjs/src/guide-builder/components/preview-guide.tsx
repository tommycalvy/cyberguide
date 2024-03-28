import { createMemo, createSignal, createEffect, Show, onCleanup } from 'solid-js';
import styles from './preview-guide.module.css';
import { useGuideBuilder } from '../provider';
import { EltInfo } from '../../types/state';
import { type Result, BaseError } from '../../utils/error';

export default function PreviewGuide() {
    const [
        { global: { globalClicks }, tab: { tabCurrentStep } },
        { tab: { incrementTabCurrentStep } },
    ] = useGuideBuilder();

    const [location, setLocation] = createSignal(window.location.href);

    navigation.addEventListener('navigate', (event) => {
        console.log('navigate', event.destination.url);
        setTimeout(() => {
            setLocation(event.destination.url);
        }, 500);
    });

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
        const click = clicks[currentStep];
        if (click.location !== location()) {
            console.warn(click.location, ' !== ', location());
            console.warn('location does not match');
            return null;
        }
        console.log('location matches');
        console.log(click.location, ' === ', location());
        const eltResult = findElement(click.eltInfo);
        if (!eltResult.success) {
            console.error(eltResult.error);
            return null;
        }
        console.log('element:', eltResult.result);
        return eltResult.result;
    }, { equals: false });

    const boundingRect = createMemo(() => {
        const targetElt = elt();
        if (targetElt) {
            return targetElt.getBoundingClientRect();
        }
        return null;
    });
    let clickArea: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined = undefined;
   
    createEffect(() => {
        if (boundingRect() && clickArea instanceof HTMLDivElement) {
            clickArea.scrollIntoView({ behavior: 'smooth' });
        }
   //     const targetElt = elt();
   //     if (targetElt) {
   //         handleClick(targetElt, incrementTabCurrentStep);
   //     }
    });

    function handlePointerDown(e: PointerEvent) {
        console.log('pointerdown');
        if (e.target === elt()) {
            document.addEventListener('pointerup', function handlePointerUp(e) {
                console.log('pointerup');
                if (e.target === elt()) {
                    console.log('click matches heey');
                    incrementTabCurrentStep();
                } else {
                    console.log('click does not match on up');
                }
                document.removeEventListener('pointerup', handlePointerUp);
            });
        } else {
            console.log('click does not match');
        }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    onCleanup(() => {
        document.removeEventListener('pointerdown', handlePointerDown);
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
            }} ref={clickArea} >
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
        console.log('selector', eltInfo.selector);
        console.log('found element by selector');
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
