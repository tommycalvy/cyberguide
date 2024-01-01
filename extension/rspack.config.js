const rspack = require("@rspack/core");
/** @type {import('@rspack/cli').Configuration} */
const config = {
	entry: {
        backgorund: "./src/background.js",
        popup: "./src/popup/popup.js",
	},
    experiments: {
        rspackFuture: {
            disableApplyEntryLazily: true,
        },
    },
};
module.exports = config;
