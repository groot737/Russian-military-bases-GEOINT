import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export default function DetailsSheet({ feature, onClose, open, onOpenChange }) {
  const props = feature?.properties || {};
  const coords = feature?.geometry?.coordinates || [];
  const typeNorm = props.type_norm || 'unknown';
  const typeLabel = props.type || typeNorm;
  const [copied, setCopied] = useState(false);

  let tags = [];
  try {
    const raw = props.tags;
    if (Array.isArray(raw)) tags = raw;
    else if (typeof raw === 'string' && raw.trim()) tags = JSON.parse(raw);
  } catch {}

  const hasCoords = coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1]);
  const prettyCoords = hasCoords ? `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}` : 'N/A';

  const copyCoords = () => {
    if (!hasCoords) return;
    const text = `${coords[1]}, ${coords[0]}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { onOpenChange?.(o); if (!o) onClose?.(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        <Dialog.Content className="sheet fixed inset-x-0 bottom-0 md:inset-auto md:right-4 md:bottom-4 md:w-[380px] md:max-h-[70vh] max-h-[70vh] p-5 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <Dialog.Title className="text-base font-semibold text-slate-900">{props.name || 'Base details'}</Dialog.Title>
            <Dialog.Close className="btn-quiet">Close</Dialog.Close>
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm">
            <img src={`/svg/${typeNorm}.svg`} alt="type" className="w-5 h-5" />
            <span className="font-medium text-slate-900">{typeLabel}</span>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Coordinates:</span>
              <span className="text-slate-900">{prettyCoords}</span>
              {hasCoords ? (
                <button className="ml-auto btn-quiet" onClick={copyCoords}>{copied ? 'Copied!' : 'Copy'}</button>
              ) : null}
            </div>
            <div>
              <span className="text-gray-600">Tags:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {tags.length ? tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                )) : <span className="text-gray-500">No tags</span>}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
