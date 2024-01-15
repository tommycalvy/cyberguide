import browser from "webextension-polyfill";

const shadowHost = document.createElement("div");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });
shadowRoot.innerHTML = ` 
        <div id="widget" class="fixed top-52 right-5 z-[999999] bg-cyan-400
            bg-opacity-80 w-20 min-h-72 flex items-center flex-col
            justify-between pb-4 overflow-hidden border-solid border-sky-800
            border-4 rounded-full border-opacity-80">
                <button id ="widget-move" class="w-full h-8 bg-white text-black
                    hover:bg-gray-100 font-bold cursor-grab select-none">
                    M
                </button>
                <button id="widget-close" class="border-black select-none
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
if (widget instanceof HTMLDivElement) {
    dragElement(widget);
}
console.log("panel opened");

/**
    * Make the DIV element draggable:
    * @param {HTMLElement} elmnt - Element to make draggable
    * @returns {void}
    * @see {@link https://www.w3schools.com/howto/howto_js_draggable.asp}
*/
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const widgetMove = shadowRoot.getElementById("widget-move"); 
    if (widgetMove instanceof HTMLButtonElement) {
        // if present, the header is where you move the DIV from:
        widgetMove.onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }
    /**
        * Drag mouse down event
        * @param {MouseEvent} e - Mouse down event
        * @returns {void}
        * @see {@link https://www.w3schools.com/howto/howto_js_draggable.asp}
        * @listens MouseEvent
        * @memberof dragElement
        * @inner
    */
    function dragMouseDown(e) {
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }
    /**
        * Drag element
        * @param {MouseEvent} e - Mouse move event
        * @returns {void}
        * @see {@link https://www.w3schools.com/howto/howto_js_draggable.asp}
        * @listens MouseEvent
        * @memberof dragElement
        * @inner
    */
    function elementDrag(e) {
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
