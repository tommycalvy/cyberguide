import { defineProject } from 'vitest/config'

export default defineProject({
    test: {
        name: '@cyberguide/web-extension',
        include: ['src/**/*.spec.js'],
        environment: 'node',
    }
})
