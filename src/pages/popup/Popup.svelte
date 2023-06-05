<script lang="ts">
  import Button, { Label as ButtonLabel } from '@smui/button';
  import Textfield from '@smui/textfield';
  import Lazy from '../../lib/Lazy.svelte';
  import { load } from '../../lib/store';

  let value = '';
  let tabId = 0;
  let sent = false;
  let urls: string[] | null = null;
  let result: Record<string, 'processing' | 'success' | 'failure'> = {};
  $: noRelay = urls !== null && urls.length <= 0;
  $: state = urls?.map((url) => ({ url, result: result[url] })) ?? [];

  let loading = chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(async ([tab]) => {
    const template = await load('noteTemplate', 'v1');
    value = template.replace('{title}', tab.title ?? '').replace('{url}', tab.url ?? '');
    tabId = tab.id ?? 0;
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if ((window as any).__share_on_nostr__loaded) {
          return;
        }
        (window as any).__share_on_nostr__loaded = true;

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
      },
    });
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
  <Lazy promise={loading}>
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
