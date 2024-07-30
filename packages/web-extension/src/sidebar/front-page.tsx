import { type JSXElement } from 'solid-js';
import styles from './front-page.module.css';

export default function SidebarFrontPage(): JSXElement {
    return (
        <div class={styles.container}>
            <div class={styles.header}>
                <h1>CyberGuide</h1>
            </div>
            <div>
                <Show when={isRecording()} fallback={
                    <button onClick={() => startRecording()}>Start Capture</button>
                }>
                    <button onClick={() => stopRecording()}>Stop Capture</button>
                </Show>
            </div>
        </div>
    );
}
