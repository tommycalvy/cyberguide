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
            setTabCurrentStep((currentStep: number) => currentStep + 1);
        } else {
            throw new Error('On update tabCurrentStep not found in message');
        }
    });

    function incrementTabCurrentStep() {
        setTabCurrentStep((currentStep: number) => currentStep + 1);
        const sendResult = backgroundPort.send({ 
            type: messageType, 
            data: true, //Sending true to increment the current step
        });
        if (!sendResult.success) {
            throw new Error(
                'backgroundPort.send failed in incrementTabCurrentStep', 
                { cause: sendResult.error },
            );
        }
    }

    return { tabCurrentStep, initTabCurrentStep, incrementTabCurrentStep };
}
