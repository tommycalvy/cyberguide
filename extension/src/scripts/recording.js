import browser from 'webextension-polyfill';

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

if (countDown instanceof HTMLDivElement) {
    countDown.addEventListener('click', () => {
        if (shadowHost instanceof HTMLDivElement) {
            shadowHost.remove();
        } else {
            console.error('countDown is not an HTMLDivElement');
        }
    });
}

setTimeout(() => {
    isHTMLElement(countDownNumber, HTMLDivElement, () => {
        countDownNumber.innerHTML = '2';
    }
    setTimeout(() => {
        if (countDownNumber instanceof HTMLDivElement) {
            countDownNumber.innerHTML = '1';
        }
        setTimeout(() => {
            if (countDownNumber instanceof HTMLDivElement) {
                countDownNumber.innerHTML = '0';
            }
            setTimeout(() => {
                if (countDown instanceof HTMLDivElement) {
                    countDown.remove();
                } else {
                    console.error('countDown is not an HTMLDivElement');
                }
            }, 1000);
        }, 1000);
    }
}, 1000);


/**
    * isHTMLElement - Check if element is an instance of HTMLElement
    * @param {HTMLElement} elt - Element to check
    * @param {HTMLElement} tagName - Tag name to check
    * @param {function} callback - Callback to execute if element is an instance of HTMLElement
    * @returns {void}
    * @memberof isHTMLElement
    * @inner
*/
function isHTMLElement(elt, tagName, callback) {
    if (elt instanceof tagName) {
        callback();
    } else {
        console.error('element is not an instance of', tagName);
    }
}
