<script lang="ts">
  import Button, { Label as ButtonLabel } from '@smui/button';
  import Textfield from '@smui/textfield';
  import Lazy from '../../lib/Lazy.svelte';
  import { load } from '../../lib/store';
  import { connectToActiveTab } from './connection';
  import { share, onReceivedPostResult, onReceivedRelays } from './share';

  let note = '';
  let tabId = 0;
  let tabUrl = '';
  let sent = false;
  let relayUrls: string[] | null = null;
  let result: Record<string, 'processing' | 'success' | 'failure'> = {};
  $: noRelay = relayUrls !== null && relayUrls.length <= 0;
  $: state = relayUrls?.map((url) => ({ url, result: result[url] })) ?? [];

  let loading = setup();

  const shareOnNostr = async () => {
    await share({
      tabId,
      text: note,
      url: tabUrl,
    });
    sent = true;
  };
  const onKeydown = (ev: KeyboardEvent) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
      shareOnNostr();
    }
  };

  async function setup() {
    await onReceivedRelays((relays) => {
      relayUrls = relays;
    });
    await onReceivedPostResult(({ url, success }) => {
      result = { ...result, [url]: success ? 'success' : 'failure' };
    });

    const postMethod = await load('postMethod', 'v1');
    await connectToActiveTab({ inject: postMethod === 'nip07' }).then(async (tab) => {
      const template = await load('noteTemplate', 'v1');
      note = template.replace('{title}', tab.title ?? '').replace('{url}', tab.url ?? '');
      tabId = tab.tabId;
      tabUrl = tab.url;
    });
  }
</script>

<main>
  <Lazy promise={loading}>
    <Textfield
      textarea
      bind:value={note}
      disabled={sent}
      label="Share on Nostr"
      style="width: 100%; resize: vertical;"
      on:keydown={onKeydown}
    />
    <Button
      variant="raised"
      disabled={sent || note.length <= 0}
      style="margin-top: 5px; width: 100%;"
      on:click={shareOnNostr}
    >
      <ButtonLabel>{sent ? 'Sent' : 'Share'}</ButtonLabel>
    </Button>

    {#if sent}
      <div class="result">
        {#each state as { url, result } (url)}
          <div
            class="relay"
            class:processing={result === 'processing'}
            class:success={result === 'success'}
            class:failure={result === 'failure'}
          >
            <div class="state" />
            <span class="url">{url}</span>
          </div>
        {/each}
        {#if noRelay}
          <div>No Relays</div>
        {/if}
      </div>
    {/if}
  </Lazy>
</main>

<style>
  .result {
    margin-top: 10px;
  }
  .relay {
    margin-top: 2px;
    font-size: 15px;
  }
  .state {
    height: 7px;
    width: 7px;
    border-radius: 50%;
    display: inline-block;
  }
  .processing .state {
    background-color: rgb(216, 216, 216);
  }
  .success .state {
    background-color: #15e041;
  }
  .failure .state {
    background-color: #f10c0c;
  }
  .processing .url {
    color: #aaaaaa;
  }
  .success .url {
    color: #2c2c2c;
  }
  .failure .url {
    text-decoration: line-through;
    color: #aaaaaa;
  }
</style>
