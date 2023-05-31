import App from './Popup.svelte';
import '../../lib/svelte-material-ui';

const app = new (App as any)({
  target: document.getElementById('app')!,
});

export default app;
