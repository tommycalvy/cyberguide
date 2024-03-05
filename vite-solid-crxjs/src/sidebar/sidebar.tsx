import { For, Show } from 'solid-js';
import styles from './sidebar.module.css';
import { SidebarProvider, useSidebar } from './provider';

function Sidebar() {
    const [
        state, { startRecording, stopRecording, startPreview, stopPreview }
    ] = useSidebar();

    let lastActionElement: HTMLDivElement | 
        ((el: HTMLDivElement) => void) | undefined = undefined;
    console.log('sidebar');
    
    return (
        <SidebarProvider>
            <div class={styles.container}>
                <h1 class={styles.title}>Cyber Guide</h1>
                <Show when={state.global.recording} fallback={
                    <button onClick={startRecording}>Record</button>
                }>
                    <button onClick={stopRecording}>Stop Recording</button>
                </Show>
                <div class={styles.actions}>
                    <For each={state.global.actions}>{(action, i) => 
                        <div class={styles.action} ref={lastActionElement}>
                            <p>{`${i() + 1})`}</p> 
                            <p>{action.type}</p>
                            <p class={styles.action__url}>{action.url}</p>
                        </div>
                    }</For>
                </div>
                <Show when={
                    state.global.actions.length > 0 && !state.global.recording
                }>
                    <div class={styles.preview__container}>
                        <Show when={state.tab.previewing} fallback={
                            <button 
                                class={styles.preview__button}
                                onClick={startPreview}
                            >
                                Start Preview
                            </button>
                        }>
                            <button 
                                class={styles.preview__button}
                                onClick={stopPreview}
                            >
                                Stop Preview
                            </button>
                        </Show>
                    </div>
                </Show>
            </div>
        </SidebarProvider>
    );
}

export default Sidebar;
