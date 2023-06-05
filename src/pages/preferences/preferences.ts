import { writable, get } from 'svelte/store';
import { load, savePreference, type NostrPostMethod } from '../../lib/store';

export const NostrPostMethods: Record<NostrPostMethod, NostrPostMethod> = {
  nip07: 'nip07',
  nsec: 'nsec',
  externalApp: 'externalApp',
};

export async function preferences() {
  const postMethod = writable(await load('postMethod', 'v1'));
  const nsec = writable(await load('nsec', 'v1'));
  const npub = writable(await load('npub', 'v1'));
  const relayUrls = writable((await load('relayUrls', 'v1')).join('\n'));
  const intentUrl = writable(await load('intentUrl', 'v1'));
  const noteTemplate = writable(await load('noteTemplate', 'v1'));
  const enableContextMenu = writable(await load('enableContextMenu', 'v1'));

  const errors = writable({
    nsec: '',
    relayUrls: '',
    intentUrl: '',
    noteTemplate: '',
  });

  return {
    postMethod,
    nsec,
    npub,
    relayUrls,
    intentUrl,
    noteTemplate,
    enableContextMenu,
    errors,
    useDefaultNoteTemplate() {
      noteTemplate.set('{title} {url}');
    },
    save(): 'success' | 'validation-error' | 'unknown-error' {
      const _postMethod = get(postMethod);
      const _nsec = get(nsec);
      const _intentUrl = get(intentUrl);
      const _noteTemplate = get(noteTemplate);
      const _enableContextMenu = get(enableContextMenu);

      // TODO: validate
      errors.set({
        nsec: '',
        intentUrl: '',
        relayUrls: '',
        noteTemplate: 'err!',
      });

      // TODO: save

      // TODO
      return 'success';
    },
  };
}
