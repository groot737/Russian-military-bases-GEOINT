import React from 'react';

function pretty(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function DetailsDrawer({ feature, onClose }) {
  if (!feature) {
    return (
      <div className="details">
        <div className="details-header">
          <div className="details-title">Details</div>
        </div>
        <div className="details-body muted">Select a marker to view details.</div>
      </div>
    );
  }

  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  let tags = [];
  try {
    const raw = props.tags;
    if (Array.isArray(raw)) tags = raw;
    else if (typeof raw === 'string' && raw.trim()) tags = JSON.parse(raw);
  } catch { /* ignore */ }

  return (
    <div className="details">
      <div className="details-header">
        <div className="details-title">{props.name || 'Unnamed'}</div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div className="details-body">
        <div className="row"><span className="key">Type:</span> <span className="val">{props.type || '—'}</span></div>
        <div className="row"><span className="key">Type Norm:</span> <span className="val">{props.type_norm || '—'}</span></div>
        <div className="row"><span className="key">Coordinates:</span> <span className="val">{coords.length ? `${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}` : '—'}</span></div>
        <div className="row"><span className="key">Tags:</span> <span className="val">{tags.length ? tags.join(', ') : '—'}</span></div>
      </div>
    </div>
  );
}
