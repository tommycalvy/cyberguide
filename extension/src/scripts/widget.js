import BrowserStorage from "../utils/browser-storage.js"; 
import Port from "../utils/message-producer.js";
import modernNormalizeCss from "../lib/modern-normalize-css.js";

let recordingActive = new BrowserStorage("local", "recordingActive");

const bport = new Port("widget", true);
bport.postMessage({ type: "handle-init" });
bport.onMessage("init", (msg) => {
    console.log("background: ", msg.message);
});

const wRecordButtonText = await recordingActive.get()  ? "Stop" : "Record";
console.log("wRecordButtonText: ", wRecordButtonText);
const shadowHost = document.createElement("div");
const shadowRoot = shadowHost.attachShadow({ mode: "open" });

shadowRoot.innerHTML = ` 
<div id="widget">
    <button id="widget-move">
        M
        <style>
            #widget-move { 
                cursor: grab;
                width: 100%;
                background-color: #FFFFFFCC;
                border: none;
            }
            #widget-move:hover { background-color: #F5F5F5CC; }
        </style>
    </button>
    <button id="widget-record">
        ${wRecordButtonText}
        <style>
            #widget-record { 
                width: 5.5rem;
                background-color: #FF0000CC;
                cursor: pointer;
            }
            #widget-record:hover { background-color: #8B0000CC; }
        </style>
    </button>
    <button id="widget-close">
        X
        <style>
            #widget-close {
                background-color: #FFFFFFCC;
                width: 4rem;
                border: 0.2rem solid #000000;
                border-radius: 50%;
                cursor: pointer;
            }
            #widget-close:hover { background-color: #F5F5F5CC; }
        </style>
    </button>
    <style>
        #widget {
            position: fixed;
            top: 5rem;
            right: 5rem;
            z-index: 999999;
            background-color: #00FFFFCC;
            width: 6rem;
            height: 18rem;
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: space-between;
            padding-bottom: 1rem;
            overflow: hidden;
            border: 0.2rem solid #87CEEBCC;
            border-radius: 3rem;
            transition: opacity 75ms ease-out;
        }
        #widget button {
            color: black;
            font-weight: bold;
            height: 4rem;
            select: none;
        }
    </style>
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
    bport.postMessage({ type: "widget-closed" });
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
        elt.style.cursor = "grabbing";
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
