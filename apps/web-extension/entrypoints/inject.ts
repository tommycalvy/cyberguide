import { initRecordingManager } from '@cyberguide/web-extension';
export default defineUnlistedScript({
    main() {
        console.log('Hello content.');
        initRecordingManager(browser.runtime, 'entrypoints/inject.js');
    },
});
