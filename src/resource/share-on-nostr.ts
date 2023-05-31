window.addEventListener('message', async ({ data }: MessageEvent<Packet>) => {
  if (data.ext !== 'share-on-nostr') {
    return;
  }

  if (data.kind === 'share') {
    shareOnNostr(data.text);
  }
});

async function shareOnNostr(message: string) {
  const nostr = window.nostr;
  if (!nostr) {
    console.warn('NIP-07 interface is not found.');
    return;
  }

  const relays = await nostr.getRelays();
  const writableRelays = Object.entries(relays)
    .filter(([, { write }]) => write)
    .map(([url]) => url);
  if (writableRelays.length <= 0) {
    console.warn('No writable relays.');
    return;
  }

  const packet: Packet = {
    ext: 'share-on-nostr',
    kind: 'relays',
    relays: writableRelays,
  };
  window.postMessage(packet);

  const event = JSON.stringify([
    'EVENT',
    await nostr.signEvent({
      kind: 1,
      tags: [],
      content: message,
      created_at: Math.floor(new Date().getTime() / 1000),
    }),
  ]);

  for (const url of writableRelays) {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      ws.send(event);
    });
    ws.addEventListener('error', () => {
      const packet: Packet = {
        ext: 'share-on-nostr',
        kind: 'result',
        url,
        success: false,
      };
      window.postMessage(packet);
    });
    ws.addEventListener('message', ({ data }) => {
      const [ok] = JSON.parse(data);
      const packet: Packet = {
        ext: 'share-on-nostr',
        kind: 'result',
        url,
        success: ok === 'OK',
      };
      window.postMessage(packet);
      ws.close();
    });
  }
}

interface Window {
  nostr?: {
    signEvent(event: UnsignedEvent): Promise<SignedEvent>;
    getRelays(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;
  };
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
