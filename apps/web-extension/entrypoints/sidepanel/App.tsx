import { sidepanelMethods } from '@cyberguide/web-extension';
import { Show } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const { 
        stores: {
            tab: { 
                state: { recording },
                actions: { startRecording, stopRecording }
            },
        },
        rpc: { getListOfGuides },
    } = sidepanelMethods({ tabId, runtime: browser.runtime });

    const [steps, { refetch }] = getListOfGuides();
    console.log(steps());
    const printSteps = async () => {
        refetch();
        console.log(steps());
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
        </>
    );
}

export default App;
