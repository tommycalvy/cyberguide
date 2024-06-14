import { GalacticSidebarStore } from '@cyberguide/web-extension';
import { testSidebarStore, TestSidebarStore } from '@cyberguide/web-extension';
import { Show } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const store = GalacticSidebarStore({ tabId, runtime: browser.runtime });

    return (
        <>
            <h1>CyberGuide</h1>
            <div>
                <Show when={store.tab.state.recording} fallback={
                    <h3>Not Recording!</h3>
                }>
                    <h3>Recording!</h3>
                </Show>
                <button onClick={() => store.tab.actions.startRecording()}>
                    Start Recording
                </button>
                <button onClick={() => store.tab.actions.stopRecording()}>
                    Stop Recording
                </button>
            </div>
        </>
    );
}

export default App;
