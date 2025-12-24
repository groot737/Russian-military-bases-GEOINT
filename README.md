# Geoint Bases Map (React + Mapbox)

A React app that displays Russian bases from a local CSV with Mapbox GL, supports clustering and filtering by type and search.

## Folder Structure

- `public/data/RusBases.csv` - your CSV data
- `public/svg/` - SVG icons named exactly:
  - `airbase.svg`, `naval_base.svg`, `garrison.svg`, `missile_base.svg`, `radar_air_defense.svg`, `logistics_ammo.svg`, `hq_command.svg`, `industrial_defense.svg`, `training.svg`, `unknown.svg`
- `src/` - React source code

If your workspace currently has `svgs/` at the root, move those files into `public/svg/` to match the app's icon loader.

## CSV Columns

The app safely handles either `lat,lng` or `latitude,longitude` (case-insensitive). Required fields:
- `name`
- `type_norm` (categorical key)
- `type` (human-readable label)
- `tags` (JSON string array)

## Install

```bash
npm install
```

## Env

Create a `.env` file at the project root:

```
VITE_MAPBOX_TOKEN=YOUR_MAPBOX_ACCESS_TOKEN
```

## Run

```bash
npm run dev
```

The CSV is fetched from [Kaggle](https://www.kaggle.com/datasets/astrohl/russian-belarussian-military-bases-dataset) and parsed with PapaParse. Features are clustered and displayed with per-type SVG icons loaded into Mapbox.

## Filtering

- Multi-select checkboxes for `type_norm` (labels from `type`)
- Search input in top bar for `name`
- Reset button
- Shows `Showing X / Y`

Filtering updates the GeoJSON source via `setData` so clusters reflect the filtered subset.
