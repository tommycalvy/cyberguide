import { createEffect, For, Show } from 'solid-js';
import styles from './sidebar.module.css';
import { useSidebar } from './provider';

export default function Sidebar() {
    const [
        { 
            global: { globalRecording, globalClicks}, 
            tab: { tabPreviewing, tabCurrentStep },
        }, 
        { 
            global: { startGlobalRecording, stopGlobalRecording },
            tab: { startTabPreviewing, stopTabPreviewing },
        },
    ] = useSidebar();

    let lastClickStep: HTMLDivElement | 
        ((el: HTMLDivElement) => void) | undefined = undefined;

    createEffect(() => {
        if (globalClicks().length > 0) {
            if (lastClickStep instanceof HTMLDivElement) {
                lastClickStep?.scrollIntoView({ behavior: 'smooth' });
            } 
        }
    });

    return (
        <div class={styles.container}>
            <h1 class={styles.title}>Cyber Guide</h1>
            <Show when={globalRecording()} fallback={
                <button onClick={startGlobalRecording}>Record</button>
            }>
                <button onClick={stopGlobalRecording}>Stop Recording</button>
            </Show>
            <div class={styles.actions}>
                <For each={globalClicks()}>{(action, i) => 
                    <div 
                        class={styles.action} 
                        classList={{ 
                            [styles.selected]: i() === tabCurrentStep() 
                        }}
                        ref={lastClickStep}
                    >
                        <p>{`${i() + 1})`}</p> 
                        <p class={styles.action__url}>{action.url}</p>
                    </div>
                }</For>
            </div>
            <Show when={globalClicks().length > 0 && !globalRecording()}>
                <div class={styles.preview__container}>
                    <Show when={tabPreviewing()} fallback={
                        <button 
                            class={styles.preview__button}
                            onClick={startTabPreviewing}
                        >
                            Start Preview
                        </button>
                    }>
                        <button 
                            class={styles.preview__button}
                            onClick={stopTabPreviewing}
                        >
                            Stop Preview
                        </button>
                    </Show>
                </div>
            </Show>
        </div>
    );
}
