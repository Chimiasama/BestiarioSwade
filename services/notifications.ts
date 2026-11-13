export function notify(message: string) {
  window.dispatchEvent(new CustomEvent('swade:notice', { detail: message }));
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Try the local WebView fallback below. */ }
  }
  const previous = document.activeElement as HTMLElement | null;
  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  try {
    input.select();
    if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
  } finally {
    input.remove();
    previous?.focus({ preventScroll: true });
  }
}
