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
  onMessageFromContentScript(
    'signed',
    ({ event }) => {
      sendEvent(event, nip07relays);
    },
    { once: true },
  );

  sendToBackgroundScript({
    ext: 'share-on-nostr',
    kind: 'sign',
    tabId,
    text,
    url,
  });
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

  sendEvent(event, relays);
}

function sendEvent(event: string, relays: string[]) {
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
let nip07relays: string[] = [];
let onReceiveRelaysHandler: OnReceiveRelaysHandler = () => {};
export async function onReceivedRelays(callback: OnReceiveRelaysHandler) {
  const postMethod = await load('postMethod', 'v1');

  switch (postMethod) {
    case 'nip07':
      onMessageFromContentScript('relays', (packet) => {
        nip07relays = packet.relays;
        callback(packet.relays);
      });
      break;
    case 'nsec':
      onReceiveRelaysHandler = callback;
      break;
  }
}

interface OnReceivedPostResultHandler {
  (result: { url: string; success: boolean }): void;
}
let onReceivedPostResultHandler: OnReceivedPostResultHandler = () => {};
export async function onReceivedPostResult(callback: OnReceivedPostResultHandler) {
  onReceivedPostResultHandler = callback;
}

function onMessageFromContentScript<K extends Packet['kind']>(
  kind: K,
  callback: (packet: Packet & { kind: K }) => void,
  options?: { once?: boolean },
) {
  const listener = (packet: Packet) => {
    if (packet.ext !== 'share-on-nostr') {
      return;
    }

    if (packet.kind === kind) {
      callback(packet as Packet & { kind: K });

      if (options?.once) {
        chrome.runtime.onMessage.removeListener(listener);
      }
    }
  };

  chrome.runtime.onMessage.addListener(listener);
}

async function sendToBackgroundScript(packet: Packet) {
  await chrome.runtime.sendMessage(packet);
}
