import { createSignal } from 'solid-js';
import Port from '../../utils/port';
import { defaultTabCurrentStep } from '../../types/defaults';

const messageType = 'tab-current-step';

export default function useTabCurrentStep(backgroundPort: Port) {
    const [tabCurrentStep, setTabCurrentStep] = createSignal(
        defaultTabCurrentStep
    );

    function initTabCurrentStep(tabCurrentStep: number | undefined) {
        if (tabCurrentStep !== undefined) {
            setTabCurrentStep(tabCurrentStep);
        } else {
            throw new Error('On init tabCurrentStep not found');
        }
    }

    backgroundPort.setMessageListener(messageType, (msg) => {
        if (msg.data) {
            if (msg.data === 'increment') {
                setTabCurrentStep((currentStep: number) => currentStep + 1);
            } else if (msg.data === 'reset') {
                setTabCurrentStep(0);
            }
        } else {
            throw new Error('On update tabCurrentStep not found in message');
        }
    });

    function incrementTabCurrentStep() {
        setTabCurrentStep((currentStep: number) => currentStep + 1);
        const sendResult = backgroundPort.send({ 
            type: messageType, 
            data: 'increment',
        });
        if (!sendResult.success) {
            throw new Error(
                'backgroundPort.send failed in incrementTabCurrentStep', 
                { cause: sendResult.error },
            );
        }
    }

    function resetTabCurrentStep() {
        setTabCurrentStep(0);
        const sendResult = backgroundPort.send({ 
            type: messageType, 
            data: 'reset', 
        });
        if (!sendResult.success) {
            throw new Error(
                'backgroundPort.send failed in resetTabCurrentStep', 
                { cause: sendResult.error },
            );
        }
    }

    return { 
        tabCurrentStep,
        initTabCurrentStep,
        incrementTabCurrentStep,
        resetTabCurrentStep,
    };
}
