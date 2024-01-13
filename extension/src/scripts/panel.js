import browser from "webextension-polyfill";

const shadowHost = document.createElement("div");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });
shadowRoot.innerHTML = ` 
    <div id="widget" class="absolute top-5 right-5 bg-sky-500 bg-opacity-90 
        w-20 h-50 z-[20000] border-red-500 border-solid border-2">
            <h1>Panel</h1>       
            <button id="widget-close" class="border-black 
                bg-white hover:bg-gray-100 text-black font-bold
                py-2 px-4 rounded">Close</button>
    </div>
`;

const cssUrl = browser.runtime.getURL("main.css");
const styles = await fetch(cssUrl).then((response) => response.text());
const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);
shadowRoot.adoptedStyleSheets = [stylesheet];

document.body.appendChild(shadowHost);

//const widget = shadowRoot.getElementById("widget");
const widgetClose = shadowRoot.getElementById("widget-close");
if (widgetClose instanceof HTMLButtonElement) {
    widgetClose.addEventListener("click", () => {
        if (shadowHost instanceof HTMLDivElement) {
            shadowHost.remove();
        } else {
            console.error("panel is not an HTMLDivElement");
        }
    });
} else {
    console.error("panelClose is not an HTMLButtonElement");
}
console.log("panel opened");

