import { globSync } from 'glob';
import path from 'node:path';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { fileURLToPath } from 'node:url';

/** @type {import('vite').UserConfig} */
export default {
    build: {
        rollupOptions: {
            input: Object.fromEntries(
                globSync('src/**/*.js').map((file) => [
                    path.relative(
                        'src',
                        file.slice(0, file.length - path.extname(file).length)
                    ),
                    fileURLToPath(new URL(file, import.meta.url))
                ])
            ),
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
            }
        },
        minify: false,
    },
    plugins: [
        viteStaticCopy({
            targets: [
                { src: 'src/manifest.json', dest: '.' },
                { src: 'src/icons', dest: '.' },
            ],
        }),
    ],
}

// TODO: Use Turborepo to build the library and then to build the extension
// Or at least look into it
