import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
    plugins: [
        devtools(),
        solidPlugin(),
        crx({ manifest }),
    ],
    server: {
        port: 3000,
    },
    build: {
        target: 'esnext',
    },
});
