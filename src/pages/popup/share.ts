import { createEventBySecretKey } from '../../lib/nostr/event';
import { load } from '../../lib/store';

interface ShareParams {
  tabId: number;
  text: string;
  url: string;
}

export async function share(params: ShareParams) {
  const postMethod = await load('postMethod', 'v1');
  switch (postMethod) {
    case 'nip07':
      await shareByNip07(params);
      break;
    case 'nsec':
      await shareByNsec(params);
      break;
    case 'externalApp':
      await shareByExternalApp(params);
      break;
  }
}

async function shareByNip07({ tabId, text, url }: ShareParams) {
  const packet: Packet = {
    ext: 'share-on-nostr',
    kind: 'share',
    tabId,
    text,
    url,
  };
  await chrome.runtime.sendMessage(packet);
}

async function shareByNsec({ text, url }: ShareParams) {
  const relays = await load('relayUrls', 'v1');
  onReceiveRelaysHandler(relays);

  const event = JSON.stringify([
    'EVENT',
    await createEventBySecretKey(
      {
        kind: 1,
        content: text,
        tags: [['r', url]],
      },
      await load('nsec', 'v1'),
    ),
  ]);

  for (const url of relays) {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => {
      ws.send(event);
    });
    ws.addEventListener('error', () => {
      onReceivedPostResultHandler({ url, success: false });
    });
    ws.addEventListener('message', ({ data }) => {
      const [ok] = JSON.parse(data);
      onReceivedPostResultHandler({ url, success: ok === 'OK' });
      ws.close();
    });
  }
}

export async function shareByExternalApp({ text, url }: ShareParams) {
  const intentUrl = await load('intentUrl', 'v1');
  await chrome.tabs.create({
    url: intentUrl
      .replace('{text}', encodeURIComponent(text))
      .replace('{url}', encodeURIComponent(url)),
    active: true,
  });
}

interface OnReceiveRelaysHandler {
  (relays: string[]): void;
}
let onReceiveRelaysHandler: OnReceiveRelaysHandler = () => {};
export async function onReceivedRelays(callback: OnReceiveRelaysHandler) {
  const postMethod = await load('postMethod', 'v1');

  if (postMethod === 'nip07') {
    chrome.runtime.onMessage.addListener((packet: Packet) => {
      if (packet.ext !== 'share-on-nostr') {
        return;
      }

      if (packet.kind === 'relays') {
        callback(packet.relays);
      }
    });
  }
  if (postMethod === 'nsec') {
    onReceiveRelaysHandler = callback;
  }
}

interface OnReceivedPostResultHandler {
  (result: { url: string; success: boolean }): void;
}
let onReceivedPostResultHandler: OnReceivedPostResultHandler = () => {};
export async function onReceivedPostResult(callback: OnReceivedPostResultHandler) {
  const postMethod = await load('postMethod', 'v1');

  if (postMethod === 'nip07') {
    chrome.runtime.onMessage.addListener((packet: Packet) => {
      if (packet.ext !== 'share-on-nostr') {
        return;
      }

      if (packet.kind === 'result') {
        callback(packet);
      }
    });
  }
  if (postMethod === 'nsec') {
    onReceivedPostResultHandler = callback;
  }
}
