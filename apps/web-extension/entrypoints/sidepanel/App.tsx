import { sidepanelMethods } from '@cyberguide/web-extension';
import { Show, For, createSignal } from 'solid-js';

function App() {

    const tabId = location.search.split('tabId=')[1];
    if (!tabId) throw new Error('tabId not found');

    const {
        global: {
            getters: {
                guideList,
            },
            actions: {
                addGuide,
            }
        },
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
        }
    } = sidepanelMethods({ tabId, runtime: browser.runtime });

    const startCapture = () => {
        startRecording();
        addGuide('Untitled Guide');
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
            <For each={guideList()}> 
                {(guide) => <h2>{guide.guideName}</h2>}
            </For>
            <input type="text" onInput={(e) => setStep(e.currentTarget.value)}/>
            <button onClick={() => addStepTitle(step())}>Add Step</button>
            <button onClick={resetStepTitles}>Reset Steps</button>
        </>
    );
}

export default App;
