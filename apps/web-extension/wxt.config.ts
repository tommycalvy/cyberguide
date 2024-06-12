import { defineConfig } from 'wxt';
import Solid from 'vite-plugin-solid';

// See https://wxt.dev/api/config.html
export default defineConfig({
    vite: () => ({
        build: {
            target: 'esnext',
            minify: false,
        },
        plugins: [Solid()],
    }),
    manifest: {
        permissions: ['activeTab', 'scripting', 'sidePanel'],
        action: {
            default_title: 'Cyberguide',
        },
        web_accessible_resources: [{ resources: ['inject.js'], matches: ['<all_urls>'] }],
    },
});
