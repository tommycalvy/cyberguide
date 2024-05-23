import { defineProject } from 'vitest/config'

export default defineProject({
    test: {
        name: '@cyberguide/web-extension',
        include: ['src/**/*.spec.ts'],
        environment: 'node',
    }
})
