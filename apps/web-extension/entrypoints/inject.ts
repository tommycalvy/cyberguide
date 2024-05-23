import { initRecordScript } from '@cyberguide/web-extension';
export default defineUnlistedScript({
    main() {
        console.log('Hello inject.');
        initRecordScript();
    },
});
