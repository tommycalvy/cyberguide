import { defineConfig } from 'vite';
import path from 'path';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';


const __dirname = new URL('.', import.meta.url).pathname;

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
        rollupOptions: {
            input: {
                sidebar: path.resolve(__dirname, 'src/sidebar/index.html'),
            },
        },
    },
});
