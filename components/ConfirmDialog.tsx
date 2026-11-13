import React, { useState, useId } from 'react';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

export function ConfirmDialog({ open, title, message, confirmLabel, onCancel, onConfirm }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onCancel: () => void; onConfirm: () => void | Promise<void>;
}) {
  const descriptionId = useId();
  const dialogRef = useDialogAccessibility(open);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useBackNavigation(open, onCancel, 150);
  if (!open) return null;
  return <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-label={title} aria-describedby={descriptionId} className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4">
    <section className="rounded-xl border border-stone-700 bg-stone-950 p-5 max-w-sm w-full space-y-4">
      <h2 className="font-cinzel text-xl font-bold text-amber-200">{title}</h2>
      <p id={descriptionId} className="text-sm text-stone-300 leading-relaxed">{message}</p>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onCancel} className="min-h-12 px-4 border border-stone-700 rounded-lg">Cancelar</button>
        <button type="button" disabled={busy} onClick={async () => {
          if (busy) return;
          setBusy(true); setError('');
          try { await onConfirm(); onCancel(); }
          catch { setError('Não foi possível concluir a ação. Tente novamente.'); }
          finally { setBusy(false); }
        }} className="min-h-12 px-4 border border-red-700 bg-red-800 text-white rounded-lg font-semibold">{busy ? 'Aguarde...' : confirmLabel}</button>
      </div>
    </section>
  </div>;
}
