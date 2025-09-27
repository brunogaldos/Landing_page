# Switching Mapbox’s Light Style from Day to Night in JavaScript

To implement a **day ↔ night toggle** for Mapbox’s light preset in your web application, follow these steps. You’ll load Mapbox GL JS, initialize the map, and then switch the style layers’ light properties dynamically.

***

## 1. Prerequisites

- Mapbox account with a valid **access token.**
- Mapbox GL JS library included in your HTML.
- A basic HTML container for your map (e.g., a `<div id="map">`).

***

## 2. Include Mapbox GL JS

Insert these in your HTML’s `<head>`:

```html
<link
  href="https://api.mapbox.com/mapbox-gl-js/v2.18.0/mapbox-gl.css"
  rel="stylesheet"
/>
<script src="https://api.mapbox.com/mapbox-gl-js/v2.18.0/mapbox-gl.js"></script>
<style>
  #map { position:absolute; top:0; bottom:0; width:100%; }
  .map-toggle { position:absolute; top:10px; right:10px; z-index:1; }
</style>
```

***

## 3. HTML Boilerplate

In your `<body>`:

```html
<div id="map"></div>
<button id="toggleBtn" class="map-toggle">Switch to Night</button>
```

***

## 4. Initialize the Map

In a JavaScript file or `<script>` tag:

```javascript
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11', // Start with Day style
  center: [0, 0],      // [longitude, latitude]
  zoom: 2
});
```

***

## 5. Define Day and Night Light Settings

Mapbox styles support a `light` property you can mutate. Here’s a pair of configurations:

```javascript
const dayLight = {
  anchor: 'viewport',
  color: '#ffffff',
  intensity: 0.3,
  position: [1.15, 210, 30]
};

const nightLight = {
  anchor: 'viewport',
  color: '#222244',
  intensity: 0.6,
  position: [1.15, 20, 40]
};
```

- **color**: hue of global illumination.
- **intensity**: brightness level (0 to 1.5).
- **position**: [radialCoordinate, polarAngle, polarElevation].

***

## 6. Toggle Function

Add a function to switch between presets:

```javascript
let isNight = false;

document.getElementById('toggleBtn').addEventListener('click', () => {
  if (!isNight) {
    map.setLight(nightLight);
    document.getElementById('toggleBtn').textContent = 'Switch to Day';
  } else {
    map.setLight(dayLight);
    document.getElementById('toggleBtn').textContent = 'Switch to Night';
  }
  isNight = !isNight;
});
```

- `map.setLight()` updates the global light in real time.
- Button text updates for user feedback.

***

## 7. Putting It All Together

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Day/Night Light Toggle</title>
  <link
    href="https://api.mapbox.com/mapbox-gl-js/v2.18.0/mapbox-gl.css"
    rel="stylesheet"
  />
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.18.0/mapbox-gl.js"></script>
  <style>
    body, html { margin:0; padding:0; height:100%; }
    #map { position:absolute; top:0; bottom:0; width:100%; }
    .map-toggle { position:absolute; top:10px; right:10px; z-index:1; padding:8px 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <button id="toggleBtn" class="map-toggle">Switch to Night</button>

  <script>
    mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 0],
      zoom: 2
    });

    const dayLight = {
      anchor: 'viewport',
      color: '#ffffff',
      intensity: 0.3,
      position: [1.15, 210, 30]
    };

    const nightLight = {
      anchor: 'viewport',
      color: '#222244',
      intensity: 0.6,
      position: [1.15, 20, 40]
    };

    let isNight = false;
    document.getElementById('toggleBtn').addEventListener('click', () => {
      if (!isNight) {
        map.setLight(nightLight);
        toggleBtn.textContent = 'Switch to Day';
      } else {
        map.setLight(dayLight);
        toggleBtn.textContent = 'Switch to Night';
      }
      isNight = !isNight;
    });
  </script>
</body>
</html>
```

***

## 8. Next Steps

- **Customize colors & angles** to match your branding or target ambiance.
- **Persist user choice** in local storage or backend for consistent experience.
- **Animate transitions** using `map.easeTo({ duration: 2000 })` before calling `setLight` for smooth fades.

With these instructions, you can seamlessly switch between **day** and **night** lighting in your Mapbox application.