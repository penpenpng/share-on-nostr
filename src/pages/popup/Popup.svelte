<script lang="ts">
  import Button, { Label as ButtonLabel } from '@smui/button';
  import Textfield from '@smui/textfield';
  import CircularProgress from '@smui/circular-progress';

  let value = '';
  let tabId = 0;
  let sent = false;
  let urls: string[] | null = null;
  let result: Record<string, 'processing' | 'success' | 'failure'> = {};
  $: loading = tabId === 0;
  $: noRelay = urls !== null && urls.length <= 0;
  $: state = urls?.map((url) => ({ url, result: result[url] })) ?? [];

  chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
    value = `${tab.title} ${tab.url}`;
    tabId = tab.id ?? 0;
  });
  chrome.runtime.onMessage.addListener((packet: Packet) => {
    if (packet.ext !== 'share-on-nostr') {
      return;
    }

    if (packet.kind === 'relays') {
      urls = packet.relays;
    }
    if (packet.kind === 'result') {
      result = { ...result, [packet.url]: packet.success ? 'success' : 'failure' };
    }
  });

  const shareOnNostr = () => {
    const packet: Packet = {
      ext: 'share-on-nostr',
      kind: 'share',
      tabId,
      text: value,
    };
    chrome.runtime.sendMessage(packet);
    sent = true;
  };
  const onKeydown = (ev: KeyboardEvent) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') {
      shareOnNostr();
    }
  };
</script>

<main>
  {#if loading}
    <CircularProgress style="height: 32px; width: 32px;" indeterminate />
  {:else}
    <Textfield
      textarea
      bind:value
      disabled={sent}
      label="Share on Nostr"
      style="width: 100%; resize: vertical;"
      on:keydown={onKeydown}
    />
    <Button
      variant="raised"
      disabled={sent || value.length <= 0}
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
  {/if}
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
