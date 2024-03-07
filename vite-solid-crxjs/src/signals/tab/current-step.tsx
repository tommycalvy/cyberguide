import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { Channel } from '../../utils/channel';
import browser from 'webextension-polyfill';

export const defaultTabCurrentStep = 0;
const key = 'tab-current-step';
const msgType = 'update-' + key;

export function useTabCurrentStep(backgroundPort: Port) {
    const [tabCurrentStep, setTabCurrentStep] = createSignal(
        defaultTabCurrentStep
    );

    function initTabCurrentStep(tabCurrentStep: number | undefined) {
        if (tabCurrentStep) {
            setTabCurrentStep(tabCurrentStep);
        } else {
            console.error('On init tab current step not found');
        }
    }

    backgroundPort.setMessageListener(msgType, (msg) => {
        if (msg.data) {
            setTabCurrentStep(msg.data);
        } else {
            console.error('On update tab current step not found');
        }
    });

    function incrementTabCurrentStep() {
        setTabCurrentStep((currentStep: number) => currentStep + 1);
        backgroundPort.send({ 
            type: msgType, 
            data: tabCurrentStep() + 1,
        });
    }

    return { tabCurrentStep, initTabCurrentStep, incrementTabCurrentStep };
}

export function updateTabCurrentStepListener(channels: Channel[]) {
    channels.forEach((channel) => {
        channel.onMessage(msgType, (port, msg) => {
            const portName = port.name;
            channel.sendToAll(msg, portName);
            browser.storage.local.get('tabStates').then((r) => {
                const tabStates = r.tabStates;
                if (!Array.isArray(tabStates)) {
                    throw new Error('tabStates not found in storage');
                }
                if (tabStates.length === 0) {
                    throw new Error('tabStates is empty');
                }

                const index = tabStates.findIndex(
                    (tabState) => tabState[0] === portName
                );
                if (index === -1) {
                    throw new Error('tabState not found');
                }
                tabStates[index][1].currentStep = msg.data;
                browser.storage.local.set({ tabStates });
            });
        });
    });
}
