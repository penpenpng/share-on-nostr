import { writable, get } from 'svelte/store';
import { load, getDefault, savePreferences, type NostrPostMethod } from '../../lib/store';
import { toHex } from '../../lib/nostr/bech32';
import { getPublicKey } from '../../lib/nostr/event';

export const NostrPostMethods: Record<NostrPostMethod, NostrPostMethod> = {
  nip07: 'nip07',
  nsec: 'nsec',
  externalApp: 'externalApp',
};

export async function preferences() {
  const postMethod = writable(await load('postMethod', 'v1'));
  const nsec = writable(await load('nsec', 'v1'));
  const relayUrls = writable((await load('relayUrls', 'v1')).join('\n'));
  const intentUrl = writable(await load('intentUrl', 'v1'));
  const noteTemplate = writable(await load('noteTemplate', 'v1'));
  const enableContextMenu = writable(await load('enableContextMenu', 'v1'));

  const errors = writable({
    nsec: '',
    relayUrls: '',
    intentUrl: '',
  });

  return {
    postMethod,
    nsec,
    relayUrls,
    intentUrl,
    noteTemplate,
    enableContextMenu,
    errors,
    useDefaultNoteTemplate() {
      noteTemplate.set(getDefault('noteTemplate'));
    },
    async save(): Promise<'success' | 'validation-error' | 'unknown-error'> {
      const _postMethod = get(postMethod);
      let _nsec = get(nsec);
      let _npub = '';
      const _relayUrls = get(relayUrls)
        .split('\n')
        .map((e) => e.trimEnd())
        .filter((e) => !!e);
      const _intentUrl = get(intentUrl);

      // --- begin validation ---
      let canSave = true;
      const errorMessages = {
        nsec: '',
        intentUrl: '',
        relayUrls: '',
      };

      if (_postMethod === 'nsec') {
        if (!_nsec) {
          canSave = false;
          errorMessages.nsec = 'nsec is required.';
        } else {
          try {
            _nsec = _nsec.startsWith('nsec1') ? toHex(_nsec) : _nsec;
            _npub = getPublicKey(_nsec);
          } catch {
            canSave = false;
            errorMessages.nsec = 'Invalid format.';
          }
        }

        if (_relayUrls.length <= 0) {
          canSave = false;
          errorMessages.relayUrls = 'At least one or more relays are required.';
        } else if (
          !_relayUrls.every((url) => url.startsWith('ws://') || url.startsWith('wss://'))
        ) {
          canSave = false;
          errorMessages.relayUrls = 'Each line must be a valid relay URL.';
        }
      }
      if (_postMethod === 'externalApp') {
        if (!_intentUrl) {
          canSave = false;
          errorMessages.intentUrl = 'URL is required.';
        } else if (!(_intentUrl.startsWith('http://') || _intentUrl.startsWith('https://'))) {
          canSave = false;
          errorMessages.intentUrl = 'URL must start with http:// or https://.';
        } else if (!_intentUrl.includes('{text}')) {
          canSave = false;
          errorMessages.intentUrl = 'URL must include {text} to take text to be posted.';
        }
      }

      errors.set(errorMessages);
      // --- end validation ---

      try {
        if (canSave) {
          await savePreferences({
            postMethod: _postMethod,
            nsec: _nsec,
            npub: _npub,
            relayUrls: _relayUrls,
            intentUrl: _intentUrl,
            noteTemplate: get(noteTemplate),
            enableContextMenu: get(enableContextMenu),
          });
          const packet: Packet = {
            ext: 'share-on-nostr',
            kind: 'updatePreferences',
          };
          chrome.runtime.sendMessage(packet);
          return 'success';
        } else {
          return 'validation-error';
        }
      } catch (err) {
        console.error(err);
        return 'unknown-error';
      }
    },
  };
}
