/** @type {import('jest').Config} */
const config = {
    transform: {},
    verbose: true,
    rootDir: './',
    moduleNameMapper: {
        '^@cyberguide/(.*)$': '<rootDir>/libs/$1',
    },
};

export default config;
