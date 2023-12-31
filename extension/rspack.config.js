const rspack = require("@rspack/core");
const path = require('path');
const glob = require('glob');

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@rspack/cli').Configuration} */
const config = {
    context: __dirname,
    mode: isProduction ? 'production' : 'development',
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
    })]).concat([ new rspack.HotModuleReplacementPlugin()]),
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
