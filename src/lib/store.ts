export interface ShareOnNostrPreference {
  postMethod: NostrPostMethod;
  nsec: string;
  npub: string;
  relayUrls: string;
  intentUrl: string;
  noteTemplate: string;
  enableContextMenu: boolean;
}
export type NostrPostMethod = 'nip07' | 'nsec' | 'externalApp';

export async function loadPreference(): Promise<ShareOnNostrPreference> {
  return load('share-on-nostr/preference');
}

export async function savePreference(preference: ShareOnNostrPreference) {
  return save('share-on-nostr/preference', preference);
}

interface AppStorage {
  'share-on-nostr/preference': ShareOnNostrPreference;
}

async function load<K extends keyof AppStorage>(key: K): Promise<AppStorage[K]> {
  const { [key]: val } = await chrome.storage.local.get(key);
  return val;
}

async function save<K extends keyof AppStorage>(key: K, val: AppStorage[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: val });
}
