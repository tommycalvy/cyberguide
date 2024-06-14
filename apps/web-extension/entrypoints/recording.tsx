import { RecordingManager } from '@cyberguide/web-extension';
export default defineUnlistedScript({
    main() {
        console.log('Hello guide creator!', { id: browser.runtime.id });
        new RecordingManager(browser.runtime, "inject.js");
    },
});
