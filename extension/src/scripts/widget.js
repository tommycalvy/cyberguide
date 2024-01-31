import BrowserStorage from "../utils/browser-storage.js"; 
import Port from "../utils/message-producer.js";
import modernNormalizeCss from "../lib/modern-normalize-css.js";
import cssScopeInlineShadow from "../lib/css-scope-inline-shadow.js";

let widgetActive = new BrowserStorage("local", "widgetActive", true);
let recordingActive = new BrowserStorage("local", "recordingActive");

const bport = new Port("widget", true);
bport.postMessage({ type: "init" });

bport.onMessage("handle-init", (msg) => {
    console.log("background.js: ", msg.message);
});

const wRecordButtonText = await recordingActive.get()  ? "Stop" : "Record";

const shadowHost = document.createElement("div");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });
cssScopeInlineShadow(shadowRoot);
shadowRoot.innerHTML = ` 
    <div id="widget" class="fixed top-52 right-5 z-[999999] bg-cyan-400
        bg-opacity-80 w-20 min-h-72 flex items-center flex-col
        justify-between pb-4 overflow-hidden border-solid border-sky-800
        border-4 rounded-full border-opacity-80 transition-opacity
        ease-out duration-75">
        <style>
            me {
                position: fixed;
                top: 52;
                right: 5;
                z-index: 999999;
                background-color: #00FFFFCC;
                width: 20rem;
                height: 18rem;
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: space-between;
                padding-bottom: 1rem;
                overflow: hidden;
                border: 0.2rem solid #87CEEBCC;
                border-radius: 50%;
                transition: opacity 75ms ease-out;
            }
            me button {
                color: black;
                font-weight: bold;
                height: 4rem;
                select: none;
            }
        </style>
            <button id ="widget-move" class="w-full h-8 bg-white text-black
                hover:bg-gray-100 font-bold cursor-grab select-none">
                <style>
                    me { cursor: grab; width: 100%; background-color: #FFFFFF;}
                    me:hover { background-color: #F5F5F5; }
                </style>
                M
            </button>
            <button id="widget-record" class="w-14 h-8 bg-red-500 text-black
                hover:bg-red-700 font-bold">
                <style>
                    me { width: 5.5rem; background-color: #FF0000; }
                    me:hover { background-color: #8B0000; }
                </style>
                ${wRecordButtonText}
            </button>
            <button id="widget-close" class="border-black select-none
                bg-white hover:bg-gray-100 text-black font-bold
                w-8 h-8 rounded-full">
                <style>
                    me {
                        background-color: #FFFFFF;
                        width: 4rem;
                        border: 0.2rem solid #000000;
                        border-radius: 50%;
                    }
                    me:hover { background-color: #F5F5F5; }
                </style>
                X
            </button>
    </div>
`;

shadowRoot.adoptedStyleSheets = [modernNormalizeCss];

document.body.appendChild(shadowHost);

const widget = shadowRoot.getElementById("widget");
const widgetClose = shadowRoot.getElementById("widget-close");

if (widget == null) {
    throw new Error("widget is null");
}
if (widgetClose == null) {
    throw new Error("widgetClose is null");
}

widgetClose.addEventListener("click", async () => {
    shadowHost.remove();
    await widgetActive.set(false);
});

dragElement(widget);

console.log("panel opened");

/**
    * Make the DIV element draggable:
    * @param {HTMLElement} elt - Element to make draggable
    * @returns {void}
    * @see {@link https://www.w3schools.com/howto/howto_js_draggable.asp}
*/
function dragElement(elt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const widgetMove = shadowRoot.getElementById("widget-move"); 
    if (widgetMove instanceof HTMLButtonElement) {
        // if present, the header is where you move the DIV from:
        widgetMove.onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elt.onmousedown = dragMouseDown;
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
        elt.style.top = (elt.offsetTop - pos2) + "px";
        elt.style.left = (elt.offsetLeft - pos1) + "px";
        elt.style.opacity = "0.5";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        elt.style.opacity = "1";
    }
}

const widgetRecord = shadowRoot.getElementById("widget-record");
if (widgetRecord instanceof HTMLButtonElement === false) {
    throw new Error("widgetRecord is null");
}

widgetRecord.addEventListener("click", async () => {
    if (await recordingActive.get()) {
        bport.postMessage({ type: "stop-recording" });
        widgetRecord.innerHTML = "Record";
        return;
    }
    bport.postMessage({ type: "start-recording" });
    widgetRecord.innerHTML = "Stop";
});
