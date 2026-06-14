# Map engine migration notes

## Context

The first interactive map implementation used Leaflet 1.9 with OpenStreetMap raster tiles and road segments rendered as polylines. This was enough for the initial catalog UI, but macOS trackpad pinch zoom repeatedly felt wrong in real use.

## Leaflet issues we hit

- Leaflet normalizes macOS wheel deltas aggressively, so trackpad pinch gestures produced very small zoom changes unless `wheelPxPerZoomLevel` was tuned to unusually low values.
- A custom `ctrlKey` wheel handler made synthetic tests pass, but it fought Leaflet's own scroll-wheel handler and ongoing `fitBounds` / `flyToBounds` animations.
- Adding WebKit `gesturestart` / `gesturechange` handling made the component more complex without proving reliable in Chrome/Canary on macOS.
- The app is a full-screen map, not a long article with an embedded map, so plugins like `leaflet-gesture-handling` solve a different problem: preventing scroll trapping and asking for Ctrl/Cmd gestures.

## Decision

Move the map component to MapLibre GL JS and keep the road data model unchanged. MapLibre has a dedicated `ScrollZoomHandler` with separate tuning for trackpad zoom (`setZoomRate`) and mouse wheel zoom (`setWheelZoomRate`), plus first-class GeoJSON line layers for road segments.

## Migration shape

- Keep `src/data/roads.json` and `src/data/road-geometries.json` as the source of truth.
- Convert roads to a GeoJSON `FeatureCollection` inside `RoadMap.tsx`.
- Render two line layers for actual OSM-matched segments and estimated fallback segments.
- Keep selection controlled by React state, but update the MapLibre GeoJSON source when selection changes.
- Use MapLibre `fitBounds` for all roads and selected-road focus.
