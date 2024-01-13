import browser from "webextension-polyfill";

const shadowHost = document.createElement("div");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });
shadowRoot.innerHTML = ` 
    <div id="widget" class="fixed top-52 right-5 bg-cyan-400 bg-opacity-80 
        w-20 min-h-72 z-[999999] flex items-center flex-col
        justify-between pb-4 overflow-hidden
        border-solid border-sky-800 border-4 rounded-full border-opacity-80">
            <button id ="widget-move" class="w-full h-8 bg-white text-black
                font-bold cursor-grab">M</button>
            <button id="widget-close" class="border-black 
                bg-white hover:bg-gray-100 text-black font-bold
                w-8 h-8 rounded-full">X</button>
    </div>
`;

const cssUrl = browser.runtime.getURL("main.css");
const styles = await fetch(cssUrl).then((response) => response.text());
const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(styles);
shadowRoot.adoptedStyleSheets = [stylesheet];

document.body.appendChild(shadowHost);

const widget = shadowRoot.getElementById("widget");
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

let isDragging = false;
if (widget instanceof HTMLDivElement) {
    widget.addEventListener('dragstart', function() {
        isDragging = true;
        console.log("dragstart");
    });
    widget.addEventListener('dragend', function() {
        isDragging = false; 
        console.log("dragend");
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            widget.style.top = e.pageY - widget.offsetHeight / 2 + 'px';
            widget.style.left = e.pageX - widget.offsetWidth / 2 + 'px';
        }
    });
}



