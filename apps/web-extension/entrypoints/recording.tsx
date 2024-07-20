import { recordingManager } from '@cyberguide/web-extension';
import { createRoot } from 'solid-js';
export default defineUnlistedScript({
    main() {
        console.log('Hello guide creator!', { id: browser.runtime.id });
        createRoot(() => {
            recordingManager(browser.runtime, "inject.js");
        });
    },
});
