import styles from './recording-countdown.module.css';
import { createSignal, onCleanup, Show } from 'solid-js';

function RecordingCountdown() {

    const [count, setCount] = createSignal(3);

    const interval = setInterval(() => {
        setCount(c => c - 1);
        if (count() === 0) {
            clearInterval(interval);
        }
    }, 800);

    onCleanup(() => clearInterval(interval));


    return (
        <Show when={count() > 0}>
            <div class={styles.container}>
                <div class={styles.circle}>
                    <div class={styles.number}>{count()}</div>
                </div>
            </div>
        </Show>
    );
}

export default RecordingCountdown;
