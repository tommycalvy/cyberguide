import { sidepanelMethods } from '@cyberguide/web-extension';
import { Show, For, createSignal } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const [guideNames, setGuideNames] = createSignal<string[]>([]);

    const {
        tab: {
            getters: {
                isRecording,
                getStepTitles
            },
            actions: {
                startRecording,
                stopRecording,
                addStepTitle,
                resetStepTitles,
            },
        },
        rpc: {
            getListOfGuides,
        },
    } = sidepanelMethods({ tabId, runtime: browser.runtime });

    console.log(addStepTitle);

    const printSteps = async () => {
        const guides = await getListOfGuides();
        console.log(guides);
        setGuideNames(guides);
        console.log(guideNames());
    };

    const [step, setStep] = createSignal<string>('');

    return (
        <>
            <h1>CyberGuide</h1>
            <div>
                <Show when={isRecording()} fallback={
                    <button onClick={() => startRecording()}>Start Capture</button>
                }>
                    <button onClick={() => stopRecording()}>Stop Capture</button>
                </Show>
            </div>
            <br />
            <div>
                <h2>Steps</h2>
                <For each={getStepTitles()}>
                    {(stepTitle) => <h3>{stepTitle}</h3>}
                </For>
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
            <input type="text" onInput={(e) => setStep(e.currentTarget.value)}/>
            <button onClick={() => addStepTitle(step())}>Add Step</button>
            <button onClick={resetStepTitles}>Reset Steps</button>
        </>
    );
}

export default App;
