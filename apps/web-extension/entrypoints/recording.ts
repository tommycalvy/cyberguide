import { GalacticGuideCreatorStore } from '@cyberguide/web-extension';
export default defineUnlistedScript({
    main() {
        console.log('Hello guide creator!', { id: browser.runtime.id });
        const store = GalacticGuideCreatorStore(browser);
        console.log('isRecording:', store.tab.getters.isRecording());
        store.tab.actions.startRecording();
        console.log('store.tab.actions.startRecording() called');
    },
});
