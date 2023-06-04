<script lang="ts">
  import { onMount } from 'svelte';

  const id = `radio-grid-${Math.floor(Math.random() * 10000000)}`;
  let radio: HTMLElement;

  onMount(() => {
    radio?.querySelector('input')?.setAttribute('id', id);
  });
</script>

<div class="radio-grid mdc-form-field">
  <div bind:this={radio} class="radio">
    <slot name="radio" />
  </div>
  <label for={id} class="label">
    <slot name="label" />
  </label>
  <div>
    <slot />
  </div>
</div>

<style lang="scss">
  .radio-grid {
    display: grid;
    grid-template-columns: min-content 1fr;
    grid-auto-rows: min-content;
    align-items: center;

    .radio {
      grid-column: 1;
    }
    :not(.radio) {
      grid-column: 2;
    }
    .label {
      padding: 0;
    }
  }
</style>
