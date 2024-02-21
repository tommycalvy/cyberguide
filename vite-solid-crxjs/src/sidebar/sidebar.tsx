import { createSignal, For, Show } from 'solid-js';
import styles from './sidebar.module.css';
import Port from '../utils/message-producer';

interface Action {
    type: string;
    url: string;
    elt: Element;
};


function Sidebar() {
    const [recording, setRecording] = createSignal(false);
    const [actions, setActions] = createSignal<Action[]>([]);
    let lastActionElement: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined = undefined;

    console.log('sidebar');
    
    const bport = new Port('sb');
    bport.setListener('action', (msg) => {
        setActions([...actions(), msg.data]);
        if (lastActionElement instanceof HTMLDivElement) {
            lastActionElement.scrollIntoView({ behavior: 'smooth' });
        }
    });
    bport.setListener('start-recording', () => {
        setRecording(true);
    });
    bport.setListener('stop-recording', () => {
        setRecording(false);
    });

    function record() {
        setRecording(true);
        bport.send({ type: 'start-recording' });
    }

    function stopRecording() {
        setRecording(false);
        bport.send({ type: 'stop-recording' });
    }

    return (
        <div class={styles.container}>
            <h1 class={styles.title}>Cyber Guide</h1>
            <Show when={recording()} fallback={
                <button onClick={record}>Record</button>
            }>
                <button onClick={stopRecording}>Stop Recording</button>
            </Show>
            <div class={styles.actions}>
                <For each={actions()}>{(action, i) => 
                    <div class={styles.action} ref={lastActionElement}>
                        <p>{`${i() + 1})`}</p> 
                        <p>{action.type}</p>
                        <p class={styles.action__url}>{action.url}</p>
                    </div>
                }</For>
            </div>
            <Show when={actions().length > 0 && !recording()}>
                <div class={styles.preview__container}>
                    <button class={styles.preview__button} formaction={actions()[0].url}>Preview Guide</button>
                </div>
            </Show>
        </div>
    );
}

export default Sidebar;
