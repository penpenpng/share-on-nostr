<script lang="ts" context="module">
  export type SnackbarType = 'success' | 'error';
  export interface ISnackbar {
    show(type: SnackbarType, message: string): void;
  }
</script>

<script lang="ts">
  import Snackbar, { Label as SnackbarLabel, Actions as SnackbarActions } from '@smui/snackbar';
  import IconButton from '@smui/icon-button';

  let snackbar: Snackbar;
  let snackbarType: SnackbarType = 'success';
  let snackbarMessage = '';

  export const show: ISnackbar['show'] = (type: SnackbarType, message: string) => {
    if (snackbar.isOpen()) {
      return;
    }

    snackbarType = type;
    snackbarMessage = message;
    snackbar.open();
  };
</script>

<Snackbar bind:this={snackbar} class={`snackbar-${snackbarType}`}>
  <SnackbarLabel>{snackbarMessage}</SnackbarLabel>
  <SnackbarActions>
    <IconButton class="material-icons" title="Dismiss">close</IconButton>
  </SnackbarActions>
</Snackbar>

<style lang="scss">
  @use '@material/snackbar/mixins' as snackbar;
  @use '@material/theme/color-palette';
  @use '@material/theme/theme-color';

  :global {
    .snackbar-success {
      @include snackbar.fill-color(color-palette.$green-500);
      @include snackbar.label-ink-color(theme-color.accessible-ink-color(color-palette.$green-500));
      .mdc-snackbar__label {
        color: white;
      }
    }
    .snackbar-error {
      @include snackbar.fill-color(color-palette.$red-500);
      @include snackbar.label-ink-color(theme-color.accessible-ink-color(color-palette.$red-500));
      .mdc-snackbar__label {
        color: white;
      }
    }
  }
</style>
