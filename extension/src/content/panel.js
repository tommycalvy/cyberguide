/**
    * Panel that gets injected into the page
    * @extends HTMLElement 
*/
class Panel extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        if (this.shadowRoot instanceof ShadowRoot) {
            this.shadowRoot.innerHTML = ` 
                <div id="panel" class="fixed top-0 left-0 w-full h-full 
                    bg-opacity-50 z-50">
                    <div class="absolute top-1/2 left-1/2 translate-x-1/2
                        translate-y-1/2 w-1/2 h-1/2 bg-white">
                        <h1>Panel</h1>
                        <button id="panel-close" class="border-black 
                            bg-white hover:bg-gray-100 text-black font-bold
                            py-2 px-4 rounded">Close</button>
                    </div>
                </div>
            `;
            this.panel = this.shadowRoot.getElementById("panel");
            this.panelClose = this.shadowRoot.getElementById("panel-close");
            if (this.panelClose instanceof HTMLButtonElement) {
                this.panelClose.addEventListener("click", () => {
                    if (this.panel instanceof HTMLDivElement) {
                        this.panel.remove();
                    } else {
                        console.error("panel is not an HTMLDivElement");
                    }
                });
            } else {
                console.error("panelClose is not an HTMLButtonElement");
            }
        } else {
            console.error("shadowRoot is not an instance of ShadowRoot");
        }
    }
}

window.customElements.define("panel-element", Panel);
const panel = document.createElement("panel-element");
document.body.appendChild(panel);
console.log("panel opened");
