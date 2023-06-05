<script lang="ts">
  import { preferences } from './preferences';
  import Lazy from '../../lib/Lazy.svelte';
  import Form from './Form.svelte';

  const loading = preferences();
</script>

<main>
  <h2>Preference</h2>

  <Lazy promise={loading} let:resolved={pref}>
    <Form {pref} />
  </Lazy>
</main>

<style lang="scss">
  main {
    padding: 1em 2em;
  }
</style>
