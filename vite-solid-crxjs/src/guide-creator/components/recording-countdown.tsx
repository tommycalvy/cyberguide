import styles from './recording-countdown.module.css';
import { createSignal, createEffect, Show } from 'solid-js';

interface RecordingCountdownProps {
    recording: () => boolean;
}

function RecordingCountdown(props: RecordingCountdownProps) {

    const [count, setCount] = createSignal(0);

    createEffect(() => {
        if (props.recording()) {
            setCount(3);
            const interval = setInterval(() => {
                setCount(c => c - 1);
                if (count() === 0) {
                    clearInterval(interval);
                }
            }, 800);
        }
    });


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
