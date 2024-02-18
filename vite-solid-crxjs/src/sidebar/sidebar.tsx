import { createSignal, For, Show } from 'solid-js';
import styles from './sidebar.module.css';
import browser from 'webextension-polyfill';

interface Action {
    type: string;
    url: string;
    elt: Element;
};

function Sidebar() {
    const [recording, setRecording] = createSignal(false);
    const [actions, setActions] = createSignal<Action[]>([]);
    console.log('sidebar');
  
    const bport = browser.runtime.connect({ name: 'sb' });
    bport.onMessage.addListener((msg) => { 
        console.log('Sidebar received message:', msg);
        if (msg.type === 'action') {
            console.log('Sidebar received action:', msg.action);
            setActions([...actions(), msg.action]);
        }
    });

    function record() {
        chrome.permissions.request({
            permissions: ['tabs'],
            origins: ['https://www.google.com/']
          }, (granted) => {
            // The callback argument will be true if the user granted the permissions.
            if (granted) {
                setRecording(true);
                bport.postMessage({ type: 'record' });
            } else {
              doSomethingElse();
            }
      });
    }

    function stopRecording() {
        setRecording(false);
        bport.postMessage({ type: 'stop' });
    }

    return (
        <div class={styles.container}>
        <h1 class={styles.title}>Cyber Guide</h1>
        <Show when={recording()} fallback={
            <button onClick={record}>Record</button>
        }>
            <button onClick={stopRecording}>Stop Recording</button>
        </Show>
        <For each={actions()}>{(action, i) => 
            <div>
                <p>{i()}</p> 
                <p>{action.type}</p>
                <p>{action.url}</p>
                <p>{action.elt}</p>
            </div>
        }</For>
        </div>
    );
}

export default Sidebar;
