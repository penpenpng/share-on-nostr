onMessageFromContentScript('sign', (packet) => {
  shareOnNostr(packet.text, packet.url);
});

async function shareOnNostr(message: string, url: string) {
  const nostr = window.nostr;
  if (!nostr) {
    console.warn('NIP-07 interface is not found.');
    return;
  }

  const relays = await nostr.getRelays();
  const writableRelays = Object.entries(relays)
    .filter(([, { write }]) => write)
    .map(([url]) => url);

  const packet: Packet = {
    ext: 'share-on-nostr',
    kind: 'relays',
    relays: writableRelays,
  };
  window.postMessage(packet);

  if (writableRelays.length <= 0) {
    console.warn('No writable relays.');
    return;
  }

  const signed: Packet = {
    ext: 'share-on-nostr',
    kind: 'signed',
    event: JSON.stringify([
      'EVENT',
      await nostr.signEvent({
        kind: 1,
        tags: [['r', url]],
        content: message,
        created_at: Math.floor(new Date().getTime() / 1000),
      }),
    ]),
  };
  window.postMessage(signed);
}

interface UnsignedEvent {
  kind: number;
  tags: string[][];
  content: string;
  created_at: number;
}

interface SignedEvent extends UnsignedEvent {
  id: string;
  sig: string;
  pubkey: string;
}

interface Nip07 {
  getPublicKey: () => Promise<string>;
  signEvent: (event: {
    kind: number;
    tags: string[][];
    content: string;
    created_at: number;
  }) => Promise<{
    id: string;
    sig: string;
    kind: number;
    tags: string[][];
    pubkey: string;
    content: string;
    created_at: number;
  }>;
  getRelays(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;
}

interface Window {
  nostr?: Nip07;
}

function onMessageFromContentScript<K extends Packet['kind']>(
  kind: K,
  callback: (packet: Packet & { kind: K }) => void,
) {
  window.addEventListener('message', async ({ data }: MessageEvent<Packet>) => {
    if (data.ext !== 'share-on-nostr') {
      return;
    }

    if (data.kind === kind) {
      callback(data as Packet & { kind: K });
    }
  });
}
