import { createSignal, onCleanup, For } from "solid-js";
import styles from "./fire-ring-click.module.css";

interface Click {
    x: number;
    y: number;
}

function FireRingClick() {
    const [clicks, setClicks] = createSignal<Click[]>([]);

    const handleClick = (e: PointerEvent) => {
        setClicks([...clicks(), { x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
            setClicks(clicks => clicks.slice(1));
        }, 1000);
    };

    document.addEventListener("pointerdown", handleClick);

    onCleanup(() => {
        document.removeEventListener("pointerdown", handleClick);
    });

    return (
        <For each={ clicks() }>{ position => 
            <div class={styles.ring} style={{ 
                top: `${position.y}px`, 
                left: `${position.x}px`,
            }}></div>
        }</For>
    );
}

export default FireRingClick;
