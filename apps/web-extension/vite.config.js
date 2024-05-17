import { globSync } from 'glob';
import path from 'node:path';

/** @type {import('vite').UserConfig} */
export default {
    root: 'src',
    build: {
        rollupOptions: {
            input: Object.fromEntries(
                globSync('src/**/*.js').map((file) => [
                    path.relative('src', file).replace(/\.js$/, ''),
            ),
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        }
    }
}
