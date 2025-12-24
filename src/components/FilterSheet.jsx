import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const TYPE_COLORS = {
  airbase: 'bg-blue-500',
  naval_base: 'bg-sky-600',
  garrison: 'bg-emerald-500',
  missile_base: 'bg-red-500',
  radar_air_defense: 'bg-indigo-500',
  logistics_ammo: 'bg-amber-500',
  hq_command: 'bg-purple-500',
  industrial_defense: 'bg-gray-600',
  training: 'bg-teal-500',
  unknown: 'bg-neutral-500'
};

export default function FilterSheet({ typeLabels, selectedTypes, setSelectedTypes, typeCounts, totalCount, filteredCount, onReset, onOpenChange }) {
  const toggleType = (typeNorm) => {
    const next = new Set(selectedTypes);
    if (next.has(typeNorm)) next.delete(typeNorm); else next.add(typeNorm);
    setSelectedTypes(next);
  };

  const allTypes = Object.entries(typeLabels);
  const allSelected = selectedTypes.size === allTypes.length;

  const selectAll = () => setSelectedTypes(new Set(allTypes.map(([k]) => k)));
  const deselectAll = () => setSelectedTypes(new Set());

  return (
    <Dialog.Root onOpenChange={(open) => onOpenChange?.(open)}>
      <Dialog.Trigger asChild>
        <button className="fixed bottom-20 left-4 md:top-4 md:left-4 md:bottom-auto z-40 btn-ghost text-sm shadow-lg">
          Filters
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20" />
        {/* Mobile bottom sheet */}
        <Dialog.Content className="sheet fixed inset-x-0 bottom-0 md:inset-auto md:bottom-auto md:right-4 md:top-20 md:w-[380px] md:h-[70vh] max-h-[70vh] md:max-h-[70vh] p-5 z-50 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <Dialog.Title className="text-sm font-semibold text-slate-900">Filters</Dialog.Title>
            <Dialog.Close className="btn-quiet">Close</Dialog.Close>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 mb-3">
            <span>Showing <strong className="text-slate-900">{filteredCount}</strong> / {totalCount}</span>
            <div className="flex items-center gap-2">
              <button className="btn-quiet" onClick={selectAll} aria-label="Select all types">Select all</button>
              <button className="btn-quiet" onClick={deselectAll} aria-label="Clear all types">Clear</button>
              <button className="btn-quiet" onClick={onReset}>Reset</button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-slate-900">Types</div>
            <div className="grid grid-cols-1 gap-2">
              {allTypes.map(([typeNorm, label]) => (
                <label key={typeNorm} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50">
                  <span className={`type-dot ${TYPE_COLORS[typeNorm] || 'bg-neutral-500'}`} />
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(typeNorm)}
                    onChange={() => toggleType(typeNorm)}
                    className="accent-blue-600"
                    aria-label={`Toggle ${label || typeNorm}`}
                  />
                  <span className="truncate flex-1">{label || typeNorm}</span>
                  <span className="text-xs text-slate-500">{typeCounts?.[typeNorm] ?? 0}</span>
                </label>
              ))}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
