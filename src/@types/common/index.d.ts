type ExtName = 'share-on-nostr';

type Packet = { ext: ExtName } & (
  | { kind: 'sign'; tabId: number; text: string; url: string }
  | { kind: 'relays'; relays: string[] }
  | { kind: 'signed'; event: string }
  | { kind: 'updatePreferences' }
);
