/** @type import('jest').Config*/
const config = {
    testEnvironment: 'jsdom',
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
    moduleFileExtensions: ['js', 'jsx'],
    coverageReporters: ['html'],
};
module.exports = config;
