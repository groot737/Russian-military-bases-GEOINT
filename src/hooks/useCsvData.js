import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';

function normalizeLatLng(row) {
  // headers are normalized to lowercase via Papa.transformHeader
  let lat = row.lat ?? row.latitude ?? row.latitudes;
  let lng = row.lng ?? row.longitude ?? row.lon ?? row.long ?? row.longtitudes;

  // Fallback: parse from `coordinates` string "lng,lat,0"
  if ((!isFinite(parseFloat(lat)) || !isFinite(parseFloat(lng))) && typeof row.coordinates === 'string') {
    const parts = row.coordinates.split(',').map(s => parseFloat(s));
    if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
      lng = parts[0];
      lat = parts[1];
    }
  }

  return { lat: parseFloat(lat), lng: parseFloat(lng) };
}

export default function useCsvData(csvPath) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Papa.parse(csvPath, {
      download: true,
      header: true,
      transformHeader: (h) => (h || '').trim().toLowerCase(),
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data || []);
        setLoading(false);
      },
      error: (err) => {
        setError(err?.message || String(err));
        setLoading(false);
      }
    });
  }, [csvPath]);

  const { features, typeLabels } = useMemo(() => {
    const feats = [];
    const labelMap = {};

    for (const row of rows) {
      const { lat, lng } = normalizeLatLng(row);
      if (!isFinite(lat) || !isFinite(lng)) continue;

      const name = row.name || row.military_base_name || '';
      const type_norm = row.type_norm || '';
      const type = row.type || '';

      // Persist any label mapping we see
      if (type_norm && !labelMap[type_norm]) labelMap[type_norm] = type || type_norm;

      // tags safe parse
      let tags = [];
      const rawTags = row.tags || '';
      if (Array.isArray(rawTags)) tags = rawTags;
      else if (typeof rawTags === 'string' && rawTags.trim()) {
        try { tags = JSON.parse(rawTags); } catch { tags = []; }
      }

      feats.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { name, type_norm, type, tags, lat, lng }
      });
    }

    return { features: feats, typeLabels: labelMap };
  }, [rows]);

  return { features, typeLabels, loading, error };
}
