# Switching from Mapbox Standard Satellite to Standard Style

To switch your map from `mapbox://styles/mapbox/standard-satellite` to `mapbox://styles/mapbox/standard`, you'll use the **`setStyle()`** method. Here's how to implement this change:[1][2]

## Basic Style Switch Code

```javascript
// Switch from standard-satellite to standard
map.setStyle('mapbox://styles/mapbox/standard');
```

## Complete Implementation Example

Here's a complete working example that demonstrates how to switch between styles:[1]

```javascript
// Initialize your map (assuming it starts with standard-satellite)
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard-satellite', // starting style
    center: [-2.81361, 36.77271], // your coordinates
    zoom: 13
});

// Function to switch to standard style
function switchToStandard() {
    map.setStyle('mapbox://styles/mapbox/standard');
}

// You can call this function when needed, for example:
// - On a button click
// - Based on user interaction
// - Programmatically based on conditions
```

## Interactive Style Switcher

If you want to create an interactive interface for users to switch between styles:[1]

```html
<div id="menu">
    <input id="standard-satellite" type="radio" name="style-toggle" value="standard-satellite" checked>
    <label for="standard-satellite">Satellite</label>
    
    <input id="standard" type="radio" name="style-toggle" value="standard">
    <label for="standard">Standard</label>
</div>

<script>
const layerList = document.getElementById('menu');
const inputs = layerList.getElementsByTagName('input');

for (const input of inputs) {
    input.onclick = (layer) => {
        const styleId = layer.target.value;
        map.setStyle('mapbox://styles/mapbox/' + styleId);
    };
}
</script>
```

## Important Considerations

**Layer Preservation**: When using `setStyle()`, any custom layers you've added after map initialization will be removed. If you have custom layers, you'll need to re-add them after the style change:[3][2]

```javascript
// Store your custom layers
const customLayers = [/* your layer configurations */];

// Switch style and re-add layers
map.setStyle('mapbox://styles/mapbox/standard');

// Re-add custom layers after style loads
map.on('styledata', () => {
    // Add your custom layers back here
    customLayers.forEach(layer => {
        map.addLayer(layer);
    });
});
```

**Alternative Approach for Layer Persistence**: If you need to maintain custom layers when switching styles, consider using the `styledata` event:[4]

```javascript
function switchStyleWithLayers() {
    // This will be called once after the new style loads
    map.once('styledata', () => {
        // Re-add your custom layers here
        addCustomLayers();
    });
    
    // Switch the style
    map.setStyle('mapbox://styles/mapbox/standard');
}
```

The `setStyle()` method is the standard and recommended approach for changing map styles in Mapbox GL JS. Simply call `map.setStyle('mapbox://styles/mapbox/standard')` to switch from satellite to standard view.[2]

[1](https://docs.mapbox.com/mapbox-gl-js/example/setstyle/)
[2](https://docs.mapbox.com/mapbox-gl-js/guides/styles/set-a-style/)
[3](https://github.com/mapbox/mapbox-gl-js/issues/8660)
[4](https://dev.to/dqunbp/effectively-switching-mapbox-gl-styles-1a3i)
[5](https://docs.mapbox.com/android/maps/api/11.8.0/mapbox-maps-android/com.mapbox.maps.extension.compose.style.standard/-mapbox-standard-satellite-style.html)
[6](https://docs.mapbox.com/android/maps/examples/android-view/change-the-maps-style/)
[7](https://stackoverflow.com/questions/29028287/in-mapbox-js-how-to-switch-between-different-map-style)
[8](https://docs.mapbox.com/mapbox-gl-js/example/set-config-property/)
[9](https://docs.maptiler.com/sdk-js/examples/switch-from-mapbox/)
[10](https://docs.mapbox.com/ios/maps/guides/styles/set-a-style/)
[11](https://stackoverflow.com/questions/36168658/mapbox-gl-setstyle-removes-layers)
[12](https://docs.mapbox.com/mapbox-gl-js/example/)
[13](https://docs.mapbox.com/android/maps/guides/styles/set-a-style/)
[14](https://github.com/mapbox/mapbox-gl-js/issues/9600)
[15](https://github.com/mapbox/mapbox-gl-language)
[16](https://docs.mapbox.com/mapbox-gl-js/example/style-switch/)
[17](https://docs.mapbox.com/style-spec/guides/)
[18](https://docs.mapbox.com/map-styles/standard/guides/)
[19](https://docs.mapbox.com/flutter/maps/guides/styles/set-a-style/)
[20](https://docs.mapbox.com/mapbox-gl-js/guides/styles/)