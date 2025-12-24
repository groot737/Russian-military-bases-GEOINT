import React, { useMemo, useState } from 'react';
import MapView from './components/MapView.jsx';
import TopBar from './components/TopBar.jsx';
import FilterSheet from './components/FilterSheet.jsx';
import DetailsSheet from './components/DetailsSheet.jsx';
import useCsvData from './hooks/useCsvData.js';

export default function App() {
  const { features, typeLabels, loading, error } = useCsvData('/data/RusBases.csv');
  const [selectedTypes, setSelectedTypes] = useState(() => new Set());
  const [selectedFeature, setSelectedFeature] = useState(null);

  const [search, setSearch] = useState('');
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/streets-v12');
  const [mapInstance, setMapInstance] = useState(null);

  const displayLabels = useMemo(() => {
    const map = { ...typeLabels };
    for (const f of features || []) {
      const tn = f.properties?.type_norm;
      const label = f.properties?.type || tn;
      if (tn && !map[tn]) map[tn] = label;
    }
    return map;
  }, [typeLabels, features]);

  const allTypeNorms = useMemo(() => Object.keys(displayLabels), [displayLabels]);

  // Initialize to "all selected" once types are known
  React.useEffect(() => {
    if (allTypeNorms.length && selectedTypes.size === 0) {
      setSelectedTypes(new Set(allTypeNorms));
    }
  }, [allTypeNorms]);

  const filteredFeatures = useMemo(() => {
    if (!features || features.length === 0) return [];
    const term = search.trim().toLowerCase();
    return features.filter(f => {
      const tn = f.properties?.type_norm;
      if (!selectedTypes.has(tn)) return false;
      if (term) {
        const name = (f.properties?.name || '').toLowerCase();
        return name.includes(term);
      }
      return true;
    });
  }, [features, selectedTypes, search]);

  const typeCounts = useMemo(() => {
    const counts = {};
    for (const f of features || []) {
      const tn = f.properties?.type_norm;
      if (!tn) continue;
      counts[tn] = (counts[tn] || 0) + 1;
    }
    return counts;
  }, [features]);

  const resetFilters = () => {
    setSelectedTypes(new Set(allTypeNorms));
    setSearch('');
  };

  return (
    <div className="h-screen w-screen relative bg-[radial-gradient(circle_at_20%_20%,#f8fafc_0,#e2e8f0_40%,#dfe7f5_100%)]">
      <TopBar mapStyle={mapStyle} setMapStyle={setMapStyle} search={search} setSearch={setSearch} />

      {/* Floating Filters button + sheet/drawer */}
      <FilterSheet
        typeLabels={displayLabels}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        typeCounts={typeCounts}
        totalCount={features.length}
        filteredCount={filteredFeatures.length}
        onReset={resetFilters}
        onOpenChange={(open) => { if (mapInstance) setTimeout(() => mapInstance.resize(), 50); }}
      />

      {/* Map full screen */}
      <div className="absolute inset-0">
        <MapView
          features={filteredFeatures}
          fullCount={features.length}
          typeLabels={displayLabels}
          typeCounts={typeCounts}
          onSelectFeature={setSelectedFeature}
          mapStyle={mapStyle}
          onMapReady={setMapInstance}
        />

        {/* Status + empty states */}
        {loading && (
          <div className="absolute top-6 right-6 floating-card max-w-xs">
            <div className="text-sm font-semibold text-slate-800">Loading data...</div>
            <div className="text-xs text-slate-600">Parsing CSV and preparing markers.</div>
          </div>
        )}
        {error && (
          <div className="absolute top-6 right-6 floating-card max-w-xs bg-red-50 border-red-100 text-red-800">
            <div className="text-sm font-semibold">Could not load data</div>
            <div className="text-xs">{error}</div>
          </div>
        )}
        {!loading && !error && filteredFeatures.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="floating-card text-center max-w-sm">
              <div className="text-sm font-semibold text-slate-900">No bases match your filters</div>
              <div className="text-xs text-slate-600 mt-1">Try selecting more types or clearing the search.</div>
            </div>
          </div>
        )}
      </div>

      {/* Details bottom sheet / drawer */}
      <DetailsSheet
        feature={selectedFeature}
        open={!!selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onOpenChange={(open) => { if (mapInstance) setTimeout(() => mapInstance.resize(), 50); }}
      />
    </div>
  );
}
