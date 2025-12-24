import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const TYPE_ICONS = [
  'airbase',
  'naval_base',
  'garrison',
  'missile_base',
  'radar_air_defense',
  'logistics_ammo',
  'hq_command',
  'industrial_defense',
  'training',
  'unknown',
];
const ICON_SIZE = 2.0;

async function loadSvgIcon(map, name, url) {
  if (map.hasImage(name)) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Icon not found');
    const blob = await res.blob();
    try {
      const imageBitmap = await createImageBitmap(blob);
      map.addImage(name, imageBitmap, { pixelRatio: 2 });
      return;
    } catch {
      // Fallback: use HTMLImageElement if ImageBitmap fails for SVG
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
        // defer add until load
        const check = () => {
          if (!map.hasImage(name) && img.naturalWidth > 0) {
            map.addImage(name, img, { pixelRatio: 2 });
          }
        };
        img.addEventListener('load', check);
      });
      return;
    }
  } catch (e) {
    // Fallback to unknown icon but register it under the requested name
    try {
      const res2 = await fetch('/svg/unknown.svg');
      if (!res2.ok) return;
      const blob2 = await res2.blob();
      try {
        const imageBitmap2 = await createImageBitmap(blob2);
        if (!map.hasImage('unknown')) map.addImage('unknown', imageBitmap2, { pixelRatio: 2 });
        if (!map.hasImage(name)) map.addImage(name, imageBitmap2, { pixelRatio: 2 });
      } catch {
        await new Promise((resolve, reject) => {
          const img2 = new Image();
          img2.crossOrigin = 'anonymous';
          img2.onload = () => resolve();
          img2.onerror = (e) => reject(e);
          img2.src = '/svg/unknown.svg';
          const check2 = () => {
            if (!map.hasImage('unknown')) map.addImage('unknown', img2, { pixelRatio: 2 });
            if (!map.hasImage(name)) map.addImage(name, img2, { pixelRatio: 2 });
          };
          img2.addEventListener('load', check2);
        });
      }
    } catch {
      // ignore
    }
  }
}

async function ensureIconsForTypes(map, typeNames) {
  const tasks = [];
  for (const name of typeNames) {
    if (!name) continue;
    if (map.hasImage(name)) continue;
    tasks.push(loadSvgIcon(map, name, `/svg/${name}.svg`));
  }
  await Promise.all(tasks);
}

function toFeatureCollection(features) {
  return {
    type: 'FeatureCollection',
    features: features || [],
  };
}

export default function MapView({ features, fullCount, typeLabels = {}, typeCounts = {}, onSelectFeature, mapStyle = 'mapbox://styles/mapbox/streets-v12', onMapReady }) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const sourceId = 'bases';
  const unclusteredLayerId = 'unclustered-point';
  const latestFeaturesRef = useRef(features);
  const mapLoadedRef = useRef(false);
  const eventsAttachedRef = useRef(false);
  const navControlRef = useRef(null);
  const scaleControlRef = useRef(null);

  function attachEvents(map) {
    if (eventsAttachedRef.current) return;
    map.on('click', 'clusters', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = feats[0].properties.cluster_id;
      const source = map.getSource(sourceId);
      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({ center: feats[0].geometry.coordinates, zoom });
      });
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

    map.on('click', unclusteredLayerId, (e) => {
      const f = e.features?.[0];
      if (!f) return;
      onSelectFeature(f);
    });

    map.on('mouseenter', unclusteredLayerId, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', unclusteredLayerId, () => { map.getCanvas().style.cursor = ''; });

    eventsAttachedRef.current = true;
  }

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [37.618423, 55.751244],
      zoom: 4,
    });

    mapRef.current = map;
    if (onMapReady) onMapReady(map);

    map.on('load', async () => {
      mapLoadedRef.current = true;
      if (!navControlRef.current) {
        navControlRef.current = new mapboxgl.NavigationControl({ showCompass: false });
        map.addControl(navControlRef.current, 'bottom-right');
      }
      if (!scaleControlRef.current) {
        scaleControlRef.current = new mapboxgl.ScaleControl({ unit: 'metric' });
        map.addControl(scaleControlRef.current, 'bottom-left');
      }

      // Load icons lazily for known types
      await Promise.all(
        TYPE_ICONS.map((name) => loadSvgIcon(map, name, `/svg/${name}.svg`))
      );

      // Add source with clustering
      map.addSource(sourceId, {
        type: 'geojson',
        data: toFeatureCollection(latestFeaturesRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#71c7ec',
            20, '#1c9cea',
            50, '#136fce',
            100, '#0b4fa1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            20, 20,
            50, 25,
            100, 30
          ]
        }
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Unclustered points with per-type icons
      map.addLayer({
        id: unclusteredLayerId,
        type: 'symbol',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['coalesce', ['get', 'type_norm'], 'unknown'],
          'icon-size': ICON_SIZE,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
          'icon-offset': [0, -4],
        }
      });

      // ensure initial data after load
      const src = map.getSource(sourceId);
      if (src) {
        src.setData(toFeatureCollection(latestFeaturesRef.current));
      }

      attachEvents(map);
    });

    return () => {
      map.remove();
      mapLoadedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update source data when filters/search change, and ensure icons exist for current types
  useEffect(() => {
    latestFeaturesRef.current = features;
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const src = map.getSource(sourceId);
    // ensure icons for present type_norm values
    const typeNames = new Set();
    for (const f of features || []) {
      const tn = f?.properties?.type_norm;
      if (tn) typeNames.add(tn);
    }
    ensureIconsForTypes(map, Array.from(typeNames)).finally(() => {
      const existing = map.getSource(sourceId);
      if (existing) {
        existing.setData(toFeatureCollection(features));
      } else {
        // Re-add source and layers if missing (e.g., after style change)
        map.addSource(sourceId, {
          type: 'geojson',
          data: toFeatureCollection(features),
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50,
        });
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: sourceId,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#71c7ec',
              20, '#1c9cea',
              50, '#136fce',
              100, '#0b4fa1'
            ],
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,
              20, 20,
              50, 25,
              100, 30
            ]
          }
        });
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: sourceId,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12
          },
          paint: { 'text-color': '#ffffff' }
        });
          map.addLayer({
            id: unclusteredLayerId,
            type: 'symbol',
            source: sourceId,
            filter: ['!', ['has', 'point_count']],
            layout: {
              'icon-image': ['coalesce', ['get', 'type_norm'], 'unknown'],
              'icon-size': ICON_SIZE,
              'icon-allow-overlap': true,
              'icon-anchor': 'bottom',
              'icon-offset': [0, -4],
            }
          });
      }
    });
  }, [features]);

  // Switch style when mapStyle changes and re-add source/layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      eventsAttachedRef.current = false;
      mapLoadedRef.current = false;
      map.setStyle(mapStyle);
      map.once('style.load', async () => {
        mapLoadedRef.current = true;
        // reload icons and source/layers for the new style
        await Promise.all(TYPE_ICONS.map((name) => loadSvgIcon(map, name, `/svg/${name}.svg`)));
        const currentFeatures = latestFeaturesRef.current || [];
        const typeNames = new Set();
        for (const f of currentFeatures) {
          const tn = f?.properties?.type_norm;
          if (tn) typeNames.add(tn);
        }
        await ensureIconsForTypes(map, Array.from(typeNames));
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: toFeatureCollection(currentFeatures),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });
        }
        if (!map.getLayer('clusters')) {
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: sourceId,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#71c7ec',
                20, '#1c9cea',
                50, '#136fce',
                100, '#0b4fa1'
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                20, 20,
                50, 25,
                100, 30
              ]
            }
          });
        }
        if (!map.getLayer('cluster-count')) {
          map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': 12
            },
            paint: { 'text-color': '#ffffff' }
          });
        }
        if (!map.getLayer(unclusteredLayerId)) {
          map.addLayer({
            id: unclusteredLayerId,
            type: 'symbol',
            source: sourceId,
            filter: ['!', ['has', 'point_count']],
            layout: {
              'icon-image': ['coalesce', ['get', 'type_norm'], 'unknown'],
              'icon-size': ICON_SIZE,
              'icon-allow-overlap': true,
              'icon-anchor': 'bottom',
              'icon-offset': [0, -4],
            }
          });
        }
        const src = map.getSource(sourceId);
        if (src) {
          src.setData(toFeatureCollection(currentFeatures));
        }
        attachEvents(map);
      });
    } catch {
      // ignore style change errors
    }
  }, [mapStyle]);

  // removed icon-size dynamic changes

  const legendKeys = Array.from(new Set([...TYPE_ICONS, ...Object.keys(typeLabels || {})]));
  const legendItems = legendKeys.map((name) => ({
    key: name,
    label: typeLabels[name] || name.replace(/_/g, ' '),
    count: typeCounts?.[name] ?? 0,
  })).filter((item) => item.label);

  return (
    <div className="map-container" ref={containerRef}>
      <div className="absolute bottom-6 left-6 legend w-60">
        <div className="text-xs uppercase tracking-wide text-slate-500">Legend</div>
        <div className="grid grid-cols-1 gap-2 mt-1">
          {legendItems.map((item) => (
            <div key={item.key} className="legend-row">
              <img src={`/svg/${item.key}.svg`} alt={item.label} className="w-5 h-5" />
              <span className="flex-1 text-sm text-slate-800 truncate">{item.label}</span>
              <span className="text-xs text-slate-500">{item.count}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 mt-2">Total bases: {fullCount}</div>
      </div>
    </div>
  );
}
