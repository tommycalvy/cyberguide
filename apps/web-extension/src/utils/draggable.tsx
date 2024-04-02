export interface DraggableOptions {
    handle: string;
    pos: {
        x: number;
        y: number;
    };
}

export function draggable(el: HTMLElement, options: DraggableOptions) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const handle = el.getElementsByClassName(options.handle)[0];
    if (handle) {
        handle.onmousedown = dragMouseDown;
    } else {
        el.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e: MouseEvent) {
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e: MouseEvent) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        el.style.top = (el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      draggable: DraggableOptions;
    }
  }
}

