import { writable, get } from 'svelte/store';

export interface ShareOnNostrPreference {
  postMethod: NostrPostMethod;
  nsec: string;
  relayUrls: string;
  intentUrl: string;
  noteTemplate: string;
  enableContextMenu: boolean;
}
export type NostrPostMethod = 'nip07' | 'nsec' | 'externalApp';
export const NostrPostMethods: Record<NostrPostMethod, NostrPostMethod> = {
  nip07: 'nip07',
  nsec: 'nsec',
  externalApp: 'externalApp',
};

export function preferences() {
  // TODO: load

  const postMethod = writable<NostrPostMethod>('nip07');
  const nsec = writable('');
  const relayUrls = writable('');
  const intentUrl = writable('');
  const noteTemplate = writable('{title} {url}');
  const enableContextMenu = writable(true);

  const errors = writable({
    nsec: '',
    relayUrls: '',
    intentUrl: '',
    noteTemplate: '',
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
