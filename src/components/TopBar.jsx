import React from 'react';

export default function TopBar({ mapStyle, setMapStyle, search, setSearch }) {
  return (
    <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 max-w-[1120px] w-[96vw] sm:w-[92vw] md:w-[82vw] px-3 sm:px-4 py-3 glass rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="pill">GeoINT</div>
        <div className="leading-tight">
          <div className="text-sm md:text-base font-semibold text-slate-900">Russian Bases Atlas</div>
          <div className="text-[11px] text-slate-600 hidden md:block">Search, filter, and compare facilities in one pane.</div>
        </div>
      </div>

      {/* Search input */}
      <input
        className="w-full sm:flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 bg-white/85 focus:outline-none text-sm shadow-inner transition"
        type="text"
        placeholder="Search by base name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search bases by name"
      />

      {/* Basemap selector */}
      <select
        className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm shadow-inner min-w-[150px]"
        value={mapStyle}
        onChange={(e) => setMapStyle(e.target.value)}
        aria-label="Basemap style"
      >
        <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
        <option value="mapbox://styles/mapbox/satellite-streets-v12">Satellite streets</option>
        <option value="mapbox://styles/mapbox/satellite-v9">Satellite (pure)</option>
        <option value="mapbox://styles/mapbox/light-v11">Light</option>
        <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
      </select>
    </div>
  );
}
