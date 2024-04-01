import BrowserStorage from "../utils/browser-storage.js";
import ArrayStorage from "../utils/array-storage.js";
import Port from "../utils/message-producer.js";
import modernNormalizeCss from '../lib/modern-normalize-css.js';

const recordingActive = new BrowserStorage("local", "recordingActive");
const recordedElts = new ArrayStorage("local", "recordedElts");

if (!await recordingActive.get()) {

    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    shadowRoot.innerHTML = `
        <div id="count-down">
            <div id="count-down-circle">
                <div id="count-down-number">3</div>
                <style>
                    #count-down-circle {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 24rem;
                        height: 24rem;
                        background-color: #FFFFFF;
                        border-radius: 50%;
                    }
                    #count-down-circle div {
                        color: #000000;
                        font-size: 12rem;
                        font-weight: bold;
                    }
                </style>
            </div>
            <style>
                #count-down {
                    position: fixed;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    z-index: 999999;
                    background-color: #00000080;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            </style>
        </div>
    `;

    shadowRoot.adoptedStyleSheets = [modernNormalizeCss];

    document.body.appendChild(shadowHost);

    const countDown = shadowRoot.getElementById('count-down');
    const countDownNumber = shadowRoot.getElementById('count-down-number');

    if (countDown instanceof HTMLDivElement === false) {
        throw new Error('countDown is not an HTMLDivElement');
    }
    if (countDownNumber instanceof HTMLDivElement === false) {
        throw new Error('countDownNumber is not an HTMLDivElement');
    }


    countDown.addEventListener('click', () => {
        shadowHost.remove();
    });

    setTimeout(() => {
        countDownNumber.innerHTML = '2';
        setTimeout(() => {
            countDownNumber.innerHTML = '1';
            setTimeout(() => {
                shadowHost.remove();
            }, 1000);
        }, 1000);
    }, 1000);
    await recordingActive.set(true);
}

/**
    * Record click event
    * @param {PointerEvent} e - PointerEvent to record
    * @memberof recordClick
    * @inner
*/
function recordClick(e) {
    if (e.target instanceof Element === false) {
        console.log('not an Element');
        return;
    }
    e.target.addEventListener('pointerup', function logElement(e) {
        if (e.target instanceof Element === false) {
            console.log('not an Element');
            return;
        }
        console.log(e.target);
        let url = window.location.href;
        console.log(url);
        if (url === null) {
            throw new Error('url is null');
        }
        let recordedElt = {
            url: url,
            elt: e.target
        };
        recordedElts.pushUnique(Promise.resolve(recordedElt));
        e.target.removeEventListener('pointerup', logElement);
    });
}

document.addEventListener('pointerdown', recordClick);

const bport = new Port("recording");
bport.postMessage({ type: "handle-init" });

let tabId = null;

bport.onMessage("init", (msg) => {
    console.log("background.js: ", msg.message);
    if (!msg.data.tabId) {
        throw new Error("No tabId in init message");
    }
    tabId = msg.data.tabId;
});

bport.onMessage("stop-recording", () => {
    console.log("stop recording message received");
    document.removeEventListener('pointerdown', recordClick);
    bport.postMessage({
        type: "recording-script-shutdown",
        data: { tabId: tabId },
    });
    bport.disconnect();
});

/**
    * Check element visibility
    * @param {HTMLElement} elt - Element to check visibility of
    * @returns {boolean[]} - Array of booleans indicating visibility
    * @memberof checkVisibility
    * @inner
*/
function checkVisibility(elt) {
    console.log('checkVisibility');
    console.log('elt: ', elt);
    if (elt instanceof Element === false) {
        throw new Error('elt is not an Element');
    }
    let notHidden = true;
    let inViewport = true;

    const rect = elt.getBoundingClientRect();
    const style = window.getComputedStyle(elt);
    const display = style.getPropertyValue('display');
    console.log('display: ', display);
    const visibility = style.getPropertyValue('visibility');
    console.log('visibility: ', visibility);
    const opacity = style.getPropertyValue('opacity');
    console.log('opacity: ', opacity);
    if (
        display === 'none' || 
        visibility === 'hidden' ||
        opacity === '0' ||
        rect.width <= 0 ||
        rect.height <= 0
    ) {
        notHidden = false;
    }
    if (
        rect.top >= (
            window.innerHeight || document.documentElement.clientHeight
        ) ||
        rect.bottom <= 0 ||
        rect.left > (
            window.innerWidth || document.documentElement.clientWidth
        ) ||
        rect.right <= 0
    ) {
        inViewport = false;
    }
    return [notHidden, inViewport];
}

