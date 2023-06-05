<script lang="ts">
  import CircularProgress from '@smui/circular-progress';

  type T = $$Generic;
  export let promise: Promise<T>;
  export let size = 32;
</script>

<main>
  {#await promise}
    <CircularProgress style={`height: ${size}px; width: ${size}px;`} indeterminate />
  {:then resolved}
    <slot {resolved} />
  {:catch error}
    <slot name="error" {error} />
  {/await}
</main>
