import { sidepanelMethods } from '@cyberguide/web-extension';
import { Show, For, createSignal } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const [guideNames, setGuideNames] = createSignal<string[]>([]);

    const { 
        stores: {
            tab: { 
                state: { recording },
                actions: { startRecording, stopRecording }
            },
        },
        rpc: { getListOfGuides },
    } = sidepanelMethods({ tabId, runtime: browser.runtime });

    const printSteps = async () => {
        setGuideNames(await getListOfGuides());
        console.log(guideNames);
    };

    return (
        <>
            <h1>CyberGuide</h1>
            <div>
                <Show when={recording} fallback={
                    <button onClick={() => startRecording()}>Start Capture</button>
                }>
                    <button onClick={() => stopRecording()}>Stop Capture</button>
                </Show>
            </div>
            <br />
            <div>
                <button onClick={printSteps}>
                    Refresh Steps
                </button>
            </div>
            <For each={guideNames()}> 
                {(guideName) => <h2>{guideName}</h2>}
            </For>
        </>
    );
}

export default App;
