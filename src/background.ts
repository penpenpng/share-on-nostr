chrome.runtime.onMessage.addListener((packet: Packet) => {
  if (packet.ext !== 'share-on-nostr') {
    return;
  }

  if (packet.kind === 'share') {
    chrome.tabs.sendMessage(packet.tabId, packet);
  }
});
