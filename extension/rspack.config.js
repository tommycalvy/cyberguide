import rspack from "@rspack/core";
import path from "path";
import { glob } from "glob";
import { URL } from "url";

const __dirname = new URL('.', import.meta.url).pathname;
const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@rspack/cli').Configuration} */
const config = {
    context: __dirname,
    mode: "production",
    watch: true,
    entry: Object.fromEntries(
        new Map(
            [
                ["background.js", "./src/background.js"],
                ["popup/popup.js", "./src/popup/popup.js"],
                ["settings/settings.js", "./src/settings/settings.js"]
            ].concat(glob.sync(
                path.resolve(__dirname, "src/scripts/*.js")).map((v) => {
                    return [v.split('src/')[1], v]; 
                })
            )
        )
    ),
    output: {
        filename: "[name]",
        path: path.resolve(__dirname, "dist"),
    },
    resolve: {
        preferRelative: true,
    },
    optimization: {
        minimize: isProduction,
    },
    plugins: glob.sync(path.resolve(__dirname, 'src/**/*.html')).map((v) => {
        return new rspack.HtmlRspackPlugin({
                template: v,
                filename: v.split('src/')[1],
                inject: false,
        });
    }).concat([ new rspack.CopyRspackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, 'src/manifest.json'),
                to: path.resolve(__dirname, 'dist/manifest.json'),
            },
            {
                from: path.resolve(__dirname, 'src/assets'),
                to: path.resolve(__dirname, 'dist/assets'),
            },
        ],
    })]),
    experiments: {
        rspackFuture: {
            disableApplyEntryLazily: true,
        },
    },
};
export default config;
