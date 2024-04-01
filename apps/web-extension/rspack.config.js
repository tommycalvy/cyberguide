import rspack from "@rspack/core";
import path from "path";
import { glob } from "glob";
import { URL } from "url";

const __dirname = new URL('.', import.meta.url).pathname;
const isDev = process.env.NODE_ENV === 'development';

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
	context: __dirname,
    mode: "production",
    watch: isDev,
	entry: {
		main: "./src/main.tsx"
	},
	module: {
		rules: [
			{
				test: /\.svg$/,
				type: "asset"
			},
            {
                test: /\.jsx$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [['solid']],
                            plugins: ['solid-refresh/babel'],
                        },
                    },
                ],
            },
		]
	},
	plugins: [
		new rspack.ProgressPlugin({}),
	]
};
