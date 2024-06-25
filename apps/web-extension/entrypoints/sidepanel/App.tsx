import { galacticSidebarStore } from '@cyberguide/web-extension';
import { Show } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const { 
        tab: { 
            state: { recording },
            actions: { startRecording, stopRecording }
        },
        dbMethods: { getters: { getAllSteps }}, 
    } = galacticSidebarStore({ tabId, runtime: browser.runtime });

    const [steps, { refetch }] = getAllSteps();
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
