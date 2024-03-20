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
        let targetElt;
        if (click.elt.id) {
            targetElt = document.querySelector(click.elt.id);
        } else if (click.elt.href) {
            targetElt = document.querySelector(`[href="${click.elt.href}"]`);
        } else {
            if (click.elt.classList) {
                let classList = '';
                for (let i = 0; i < click.elt.classList.length; i++) {
                    classList += '.' + click.elt.classList[i];
                }
                let elts: NodeListOf<Element> | Element[] = document.querySelectorAll(classList);
                if (elts.length === 1 || click.elt.attributes === null) {
                    targetElt = elts[0];
                } else {
                    for (let i = 0; i < click.elt.attributes.length; i++) {
                        const attr = click.elt.attributes[i];
                        let narrowedElts = [];
                        for (let j = 0; j < elts.length; j++) {
                            if (elts[j].getAttribute(attr[0]) === attr[1]) {
                                narrowedElts.push(elts[j]);
                            }
                        }
                        if (narrowedElts.length === 1) {
                            targetElt = narrowedElts[0];
                            break;
                        }
                        elts = narrowedElts;
                    }
                    if (elts.length === 1) {
                        targetElt = elts[0];
                    } else {
                        console.error(new Error("Has classlist but couldn't narrow down elements by attributes"));
                        return;
                    }
                }
            } else if (click.elt.attributes) {
                let elts: NodeListOf<Element> | Element[] = document.querySelectorAll(`[${click.elt.attributes[0][0]}="${click.elt.attributes[0][1]}"]`);
                if (elts.length === 1) {
                    targetElt = elts[0];
                } else {
                    for (let i = 1; i < click.elt.attributes.length; i++) {
                        const attr = click.elt.attributes[i];
                        let narrowedElts = [];
                        for (let j = 0; j < elts.length; j++) {
                            if (elts[j].getAttribute(attr[0]) === attr[1]) {
                                narrowedElts.push(elts[j]);
                            }
                        }
                        if (narrowedElts.length === 1) {
                            targetElt = narrowedElts[0];
                            break;
                        }
                        elts = narrowedElts;
                    } 
                    if (elts.length === 1) {
                        targetElt = elts[0];
                    } else {
                        console.error(new Error("Has attributes but couldn't narrow down elements by attributes"));
                        return;
                    }
                }
            } else {
                console.error(new Error('no id, classList, or attributes'));
                return;
            }

        }
        console.log('click matches');
        incrementTabCurrentStep();
        e.target.removeEventListener('pointerup', logElement);
    });
}
