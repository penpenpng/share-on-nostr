injectResourceScript('js/share-on-nostr.js');

window.addEventListener('message', async ({ data }: MessageEvent<Packet>) => {
  if (data.ext !== 'share-on-nostr') {
    return;
  }

  if (data.kind === 'relays' || data.kind === 'result') {
    chrome.runtime.sendMessage(data);
  }
});

chrome.runtime.onMessage.addListener((packet: Packet) => {
  if (packet.ext !== 'share-on-nostr') {
    return;
  }

  if (packet.kind === 'share') {
    window.postMessage(packet);
  }
});

function injectResourceScript(path: string) {
  const script = document.createElement('script');
  script.setAttribute('async', 'false');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', chrome.runtime.getURL(path));
  document.head.appendChild(script);
}
