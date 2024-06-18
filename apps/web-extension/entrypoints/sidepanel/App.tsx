import { galacticSidebarStore } from '@cyberguide/web-extension';
import { Show } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const { 
        tab: { 
            state: { recording },
            actions: { startRecording, stopRecording }
        } 
    } = galacticSidebarStore({ tabId, runtime: browser.runtime });

    return (
        <>
            <h1>CyberGuide</h1>
            <div>
                <Show when={recording} fallback={
                    <h3>Not Recording!</h3>
                }>
                    <h3>Recording!</h3>
                </Show>
                <button onClick={() => startRecording()}>
                    Start Recording
                </button>
                <button onClick={() => stopRecording()}>
                    Stop Recording
                </button>
            </div>
        </>
    );
}

export default App;
