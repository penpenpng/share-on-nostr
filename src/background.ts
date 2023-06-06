chrome.runtime.onMessage.addListener((packet: Packet) => {
  if (packet.ext !== 'share-on-nostr') {
    return;
  }

  if (packet.kind === 'share') {
    chrome.tabs.sendMessage(packet.tabId, packet);
  }
  if (packet.kind === 'updatePreferences') {
    resetContextMenu();
  }
});

const contextMenuId = 'share-on-nostr';

async function resetContextMenu() {
  chrome.contextMenus.removeAll();

  const enableContextMenu = await chrome.storage.local
    .get('enableContextMenu')
    .then(({ enableContextMenu }) => enableContextMenu?.[1]);
  if (!enableContextMenu) {
    return;
  }

  const postMethod = await chrome.storage.local
    .get('postMethod')
    .then(({ postMethod }) => postMethod?.[1]);
  if (postMethod === 'nsec' || postMethod === 'externalApp') {
    chrome.contextMenus.create({
      id: contextMenuId,
      title: 'Share on Nostr',
      contexts: ['page'],
    });
  }
}

resetContextMenu();

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const tabId = tab?.id ?? 0;
  if (tabId && info.menuItemId === contextMenuId) {
    chrome.tabs.create({
      url: `/src/pages/popup/index.html?t=${encodeURIComponent(
        tab?.title ?? 'No Title',
      )}&u=${encodeURIComponent(tab?.url ?? '')}`,
      active: true,
    });
  }
});
