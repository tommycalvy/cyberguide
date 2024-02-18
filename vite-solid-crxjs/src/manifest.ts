import { defineManifest } from '@crxjs/vite-plugin'
import packageJson from '../package.json'
const { version } = packageJson

// Convert from Semver (example: 0.1.0-beta6)
const [major, minor, patch] = version
  // can only contain digits, dots, or dash
  .replace(/[^\d.-]+/g, '')
  // split into version parts
  .split(/[.-]/);

export default defineManifest(async (env) => ({
    manifest_version: 3,
    name:
        env.mode === 'staging'
            ? '[INTERNAL] CRXJS Power Tools'
            : 'CRXJS Power Tools',
            // up to four numbers separated by dots
    version: `${major}.${minor}.${patch}`,
    // semver is OK in "version_name"
    version_name: version,
    description: packageJson.description,
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    action: {
        default_title: 'CyberGuide',
    },
    icons: {
        '16': 'src/icons/flame-16.png',
        '48': 'src/icons/hermit-48.png',
        '128': 'src/icons/hermit-128.png',
    }, 
    background: {
        service_worker: 'src/background.ts',
        type: 'module'
    },
    side_panel: {
        default_path: 'src/sidebar/index.html',
    } 
}))
