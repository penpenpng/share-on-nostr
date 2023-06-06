import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  name: 'share-on-nostr',
  description: 'Share URL of active tab on Nostr',
  version: '0.2.0',
  manifest_version: 3,
  icons: {
    '16': 'img/logo-16.png',
    '32': 'img/logo-34.png',
    '48': 'img/logo-48.png',
    '128': 'img/logo-128.png',
  },
  action: {
    default_popup: 'src/pages/popup/index.html',
    default_icon: 'img/logo-48.png',
  },
  options_page: 'src/pages/preferences/index.html',
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
    {
      resources: ['js/share-on-nostr.js'],
      matches: ['https://*/*', 'http://localhost:*/*'],
    },
  ],
  permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
});
