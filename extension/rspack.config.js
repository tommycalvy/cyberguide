const rspack = require("@rspack/core");
const path = require('path');
const glob = require('glob');

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@rspack/cli').Configuration} */
const config = {
    context: __dirname,
    mode: isProduction ? 'production' : 'development',
    devtool: false,
    entry: Object.fromEntries(
        glob.sync(path.resolve(__dirname, 'src/**/*.js')).map((v) => [
            v.split('src/')[1], v,
        ]
    )),
    output: {
        filename: "[name]",
        path: path.resolve(__dirname, "dist"),
    },
    plugins: glob.sync(path.resolve(__dirname, 'src/**/*.html')).map((v) => {
        return new rspack.HtmlRspackPlugin({
                template: v,
                filename: v.split('src/')[1],
                inject: false,
        });
    }),
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: {
                                    tailwindcss: {},
                                    autoprefixer: {},
                                },
                            },
                        },
                    },
                ],
                type: 'css',
            },
        ],
    },
    experiments: {
        rspackFuture: {
            disableApplyEntryLazily: true,
        },
    },
};
module.exports = config;
/*
[
    new rspack.HtmlRspackPlugin({
        template: "./src/popup/popup.html",
        filename: "popup/popup.html",
    })
]
* */
