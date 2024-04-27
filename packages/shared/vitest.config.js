import { defineProject } from 'vitest/config'

export default defineProject({
    test: {
        name: '@cyberguide/shared',
        include: ['src/**/*.spec.js'],
        environment: 'node',
    }
})
