import { useLayoutEffect, useRef } from 'react';
let openDialogs = 0;
let previousOverflow = '';

export function useDialogAccessibility(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    if (openDialogs++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    const controls = () => [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter(el => el.getClientRects().length);
    const frame = requestAnimationFrame(() => (controls()[0] || dialog).focus({ preventScroll: true }));
    const trap = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.key !== 'Tab' || !dialog.contains(document.activeElement)) return;
      const items = controls();
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    dialog.addEventListener('keydown', trap);
    return () => {
      cancelAnimationFrame(frame);
      dialog.removeEventListener('keydown', trap);
      if (--openDialogs === 0) document.body.style.overflow = previousOverflow;
      const target = previous?.isConnected && previous.getClientRects().length ? previous : document.querySelector<HTMLElement>('button[aria-controls="header-tools"]');
      target?.focus({ preventScroll: true });
    };
  }, [open]);
  return ref;
}
