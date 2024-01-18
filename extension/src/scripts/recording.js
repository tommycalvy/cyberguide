import browser from 'webextension-polyfill';

const recordingActive = browser.storage.local.get('recording-active');

if (!recordingActive) {

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

    if (countDown == null) {
        throw new Error('countDown is null');
    }
    if (countDownNumber == null) {
        throw new Error('countDownNumber is null');
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

    browser.storage.local.set({ "recording-active": true });
}

document.addEventListener('pointerdown', (e) => {
    if (e.target instanceof HTMLElement === false) {
        console.log('not an HTMLElement');
        return;
    }
    e.target.addEventListener('pointerup', function logElement(e) {
        if (e.target instanceof HTMLElement === false) {
            console.log('not an HTMLElement');
            return;
        } 
        //TODO: save element to storage
        console.log(e.target);
        e.target.removeEventListener('pointerup', logElement);
    });
});
