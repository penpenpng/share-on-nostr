import { writable, get } from 'svelte/store';
import { load, getDefault, savePreferences, type NostrPostMethod } from '../../lib/store';

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
      const _nsec = get(nsec);
      let _npub = '';
      const _relayUrls = get(relayUrls)
        .split('\n')
        .map((e) => e.trimEnd());
      const _intentUrl = get(intentUrl);

      // --- begin validation ---
      let canSave = true;
      const errorMessages = {
        nsec: '',
        intentUrl: '',
        relayUrls: '',
      };

      if (_postMethod === 'nsec') {
        // TODO
      }
      if (_postMethod === 'externalApp') {
        // TODO
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
