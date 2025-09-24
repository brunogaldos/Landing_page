# Arequipa Scrollytelling Map

A responsive, accessible, and production-ready frontend page featuring a pinned Mapbox map background with scrolling content panels that trigger smooth map animations, similar to the South Sudan Crisis Group website.

## Features

- **Pinned Map Background**: Mapbox map stays fixed in viewport while content scrolls over it
- **Scrollytelling Effect**: Content panels scroll upward triggering map state changes
- **Smooth Map Animations**: Pan, zoom, pitch, and bearing transitions for each panel
- **Responsive Design**: Mobile-first approach with breakpoints for all device sizes
- **Interactive Maps**: Mapbox GL JS integration with lazy loading and performance optimization
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels, keyboard navigation, and reduced motion support
- **Performance Optimized**: Lazy loading, throttled scroll events, and efficient rendering
- **Modern CSS**: CSS Grid, Flexbox, and responsive typography
- **Graceful Fallbacks**: Static image fallback when JavaScript is disabled or Mapbox fails

## Map Configuration

### Coordinates & Defaults
- **Arequipa coordinates**: `lng: -71.5375, lat: -16.4090`
- **Initial view**: World view (`center: [0, 0], zoom: 3`)
- **Final view**: Arequipa close-up (`center: [-71.5375, -16.4090], zoom: 9`)
- **Scroll behavior**: Map animates only when section is in view, holds final view when scrolled past

### Token Configuration
The map uses a flexible token system:

1. **Environment Variable** (for build systems):
   ```bash
   export MAPBOX_TOKEN="your-token-here"
   ```

2. **Data Attribute** (in HTML):
   ```html
   <div id="map" data-mapbox-token="your-token-here"></div>
   ```

3. **Development Fallback**: Uses the existing token for local development

**Important**: Replace `MAPBOX_TOKEN_HERE` in the HTML with your actual Mapbox token before deployment.

## Project Structure

```
landing_page/
├── index.html              # Main HTML file with Arequipa content
├── styles/
│   └── main.css            # Consolidated CSS with map controls
├── scripts/
│   └── main.js             # Scroll-driven map functionality
├── assets/
│   ├── logo.svg            # Crisis Group logo
│   └── texturebg.svg      # Background texture
├── README.md               # This file
├── package.json            # Project configuration
└── server.py               # Development server
```

## Setup Instructions

1. **Set Mapbox Token**:
   - Replace `MAPBOX_TOKEN_HERE` in `index.html` with your Mapbox token
   - Or set `MAPBOX_TOKEN` environment variable

2. **Local Development**: 
   ```bash
   python3 server.py
   # Opens http://localhost:8000
   ```

3. **Production Deployment**:
   - Minify CSS and JavaScript
   - Optimize images
   - Enable gzip compression
   - Set up HTTPS

## Technical Implementation

### Scroll-Driven Animation
- **Progress Calculation**: Maps scroll position to animation progress (0-1)
- **Smooth Interpolation**: Uses `easeInOutCubic` easing function
- **Performance**: Throttled with `requestAnimationFrame`
- **Hardware Acceleration**: Uses `map.easeTo()` for smooth transitions

### Scrollytelling Implementation
- **Pinned Map**: Fixed position map background using `position: fixed`
- **Content Panels**: Scrolling content with `min-height: 100vh` for full viewport coverage
- **Intersection Observer**: Efficiently detects when panels enter viewport
- **Map State Transitions**: Each panel triggers specific map animations (zoom, pan, pitch, bearing)
- **Smooth Animations**: 1.5-second transitions with easing for natural movement
- **Visual Effects**: Glassmorphism panels with backdrop blur and subtle shadows

### Accessibility Features
- Semantic HTML5 structure with proper ARIA labels
- Keyboard navigation support for map controls
- Screen reader announcements for zoom actions
- Reduced motion preference support
- Focus management to prevent keyboard traps

### Performance Optimizations
- Lazy loading of Mapbox GL JS (only when map section is visible)
- Intersection Observer for efficient scroll detection
- Debounced resize events
- Graceful fallback for failed map loads

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Mobile Considerations

- Touch-friendly map controls
- Responsive design adapts to all screen sizes
- Performance optimized for mobile devices
- Fallback static image for low-bandwidth scenarios

## Customization

### Map Behavior
Modify these values in `scripts/main.js`:
```javascript
this.targetCenter = [-71.5375, -16.4090];  // Arequipa coordinates
this.initialZoom = 3;                       // Starting zoom level
this.targetZoom = 9;                        // Final zoom level
this.targetPitch = 0;                       // No pitch animation
this.targetBearing = 0;                     // No bearing animation
```

### Visual Styling
Update CSS custom properties in `styles/main.css`:
- Primary: `#E87722` (orange)
- Secondary: `#FFB81C` (yellow)
- Background: `#000` (black)
- Text: `#e4e4e4` (light gray)

## Development Notes

- The original South Sudan content has been adapted for Arequipa, Peru
- All scroll-driven map functionality is implemented from scratch
- Code follows modern ES6+ standards and web development best practices
- Includes comprehensive error handling and fallback mechanisms

## License

This project is created for educational and demonstration purposes. Please ensure you have proper rights to any content used.
