import React from 'react';

export default function Filters({ typeLabels, selectedTypes, setSelectedTypes, totalCount, filteredCount, onReset, loading, error }) {
  const toggleType = (typeNorm) => {
    const next = new Set(selectedTypes);
    if (next.has(typeNorm)) next.delete(typeNorm); else next.add(typeNorm);
    setSelectedTypes(next);
  };

  const allTypes = Object.entries(typeLabels);

  return (
    <div className="filters">
      <div className="counts">Showing {filteredCount} / {totalCount}</div>
      {loading && <div className="muted">Loading CSV…</div>}
      {error && <div className="error">{String(error)}</div>}
      <div className="filter-group">
        <div className="filter-title">Types</div>
        <div className="checkboxes">
          {allTypes.map(([typeNorm, label]) => (
            <label key={typeNorm} className="checkbox">
              <input
                type="checkbox"
                checked={selectedTypes.has(typeNorm)}
                onChange={() => toggleType(typeNorm)}
              />
              <span>{label || typeNorm}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="reset-btn" onClick={onReset}>Reset</button>
    </div>
  );
}
