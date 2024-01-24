import browser from 'webextension-polyfill';

const { rActive } = await browser.storage.local.get('rActive');

if (!rActive) {

    const shadowHost = document.createElement('div');
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    shadowRoot.innerHTML = `
        <div id="count-down" class="fixed w-full h-full top-0 left-0 z-[999999]
            flex items-center justify-center bg-black bg-opacity-50">
            <div class="flex items-center justify-center w-96 h-96 bg-white
                rounded-full">
                <div id="count-down-number" class="text-9xl font-bold">3</div>
            </div>
        </div>
    `;

    const cssUrl = browser.runtime.getURL('main.css');
    const styles = await fetch(cssUrl).then((response) => response.text());
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(styles);
    shadowRoot.adoptedStyleSheets = [stylesheet];

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

    browser.storage.local.set({ "rActive": true });
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
        browser.storage.local.get('recordedElts').then((result) => {
            let recordedElts = result.recordedElts;
            recordedElts.push(recordedElt);
            browser.storage.local.set({ "recordedElts": recordedElts });
        });
        e.target.removeEventListener('pointerup', logElement);
    });
}

document.addEventListener('pointerdown', recordClick);

const bport = browser.runtime.connect({ name: "recording" });
bport.postMessage({
    type: "init",
    message: "recording script connected"
});

let tabId = null;

bport.onMessage.addListener(async (msg) => {
    if (msg.type === "handle-init") {
        console.log("background.js: ", msg.message);
        tabId = msg.tabId;
    }
    if (msg.type === "stop-recording") {
        console.log("stop recording message received");
        document.removeEventListener('pointerdown', recordClick);
        bport.postMessage({
            type: "recording-script-shutdown",
            tabId: tabId
        });
        bport.disconnect();
    }
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

