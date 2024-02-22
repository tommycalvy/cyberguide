import { createSignal, createEffect, For } from "solid-js";
import styles from "./fire-ring-click.module.css";

interface FireRingClickProps {
    active: () => boolean;
}

interface Click {
    x: number;
    y: number;
}

function FireRingClick(props: FireRingClickProps) {
    const [clicks, setClicks] = createSignal<Click[]>([]);

    const handleClick = (e: PointerEvent) => {
        setClicks([...clicks(), { x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
            setClicks(clicks => clicks.slice(1));
        }, 1000);
    };

    createEffect(() => {
        if (props.active()) {
            document.addEventListener("pointerdown", handleClick);
        } else {
            document.removeEventListener("pointerdown", handleClick);
        }
    });

    return (
        <For each={ clicks() }>{ position => 
            <div class={styles.ring} style={{ 
                top: `${position.y - 40}px`, 
                left: `${position.x - 40}px`,
            }}></div>
        }</For>
    );
}

export default FireRingClick;
