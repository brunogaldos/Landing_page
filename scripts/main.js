/**
 * Arequipa Scroll-Driven Map - Main JavaScript
 * Production-ready, accessible, and responsive functionality with scroll-driven map behavior
 */

class ArequipaScrollMap {
    constructor() {
        this.map = null;
        this.mapContainer = null;
        this.isLoaded = false;
        this.isInitialized = false;
        this.currentState = null;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.contentPanels = [];
        this.currentPanelIndex = 0;
        
        // Arequipa coordinates
        this.targetCenter = [-71.5375, -16.4090];
        this.initialCenter = [0, 0]; // World view
        this.initialZoom = 3;
        this.targetZoom = 9;
        
        // Map states for each panel with proper 3D views
        this.mapStates = {
            'intro': {
                center: [0, 0],
                zoom: 3,
                pitch: 0,
                bearing: 0,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'historical': {
                center: [-71.5375, -16.4090],
                zoom: 6,
                pitch: 0,
                bearing: 0,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'architectural': {
                center: [-71.5375, -16.4090],
                zoom: 8,
                pitch: 15,
                bearing: 10,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'cultural': {
                center: [-71.5375, -16.4090],
                zoom: 9,
                pitch: 60,
                bearing: -30,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'data': {
                center: [-71.537, -16.399],  // Arequipa coordinates as requested
                zoom: 18,  // Closer zoom to see buildings in more detail
                pitch: 60,  // Good angle to see building sides
                bearing: 0,  // Straight view for better visibility
                style: 'mapbox://styles/mapbox/standard'  // Standard style with built-in 3D buildings
            },
            'conclusion': {
                center: [-71.537, -16.399],  // Same as data panel - maintain view
                zoom: 17,  // Same as data panel - maintain view
                pitch: 60,  // Same as data panel - maintain view
                bearing: 0,  // Same as data panel - maintain view
                style: 'mapbox://styles/mapbox/standard'  // Same as data panel - maintain view
            }
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.setupLazyLoading();
            this.setupScrollytelling();
            this.setupEventListeners();
            this.hideLoader();
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to load the interactive map. Please refresh the page.');
        }
    }

    /**
     * Setup lazy loading for the map
     */
    setupLazyLoading() {
        this.mapContainer = document.getElementById('map');
        if (!this.mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Create intersection observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isInitialized) {
                    this.loadMapboxAndInitialize();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        observer.observe(this.mapContainer);
    }

    /**
     * Setup scrollytelling functionality
     */
    setupScrollytelling() {
        // Get all content panels
        this.contentPanels = Array.from(document.querySelectorAll('.content-panel'));
        
        if (this.contentPanels.length === 0) {
            console.warn('No content panels found');
            return;
        }

        // Create intersection observer for panel transitions
        const panelObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActivePanel(entry.target);
                }
            });
        }, {
            threshold: 0.6, // Trigger when panel is 60% visible
            rootMargin: '-10% 0px -10% 0px'
        });

        // Observe all content panels
        this.contentPanels.forEach(panel => {
            panelObserver.observe(panel);
        });

        // Set initial map state
        this.updateMapState('intro');
        
        // Setup scrollytelling section observer to unpin map
        this.setupScrollytellingObserver();
    }

    /**
     * Setup observer to unpin map after scrollytelling section
     */
    setupScrollytellingObserver() {
        const scrollytellingSection = document.querySelector('.scrollytelling-section');
        if (!scrollytellingSection) return;

        const unpinObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    // Scrollytelling section is out of view, unpin the map
                    this.unpinMap();
                } else {
                    // Scrollytelling section is in view, pin the map
                    this.pinMap();
                }
            });
        }, {
            threshold: 0,
            rootMargin: '0px'
        });

        unpinObserver.observe(scrollytellingSection);
    }

    /**
     * Pin the map for scrollytelling
     */
    pinMap() {
        if (this.mapContainer) {
            this.mapContainer.classList.add('pinned-map');
            this.mapContainer.style.position = 'fixed';
            this.mapContainer.style.top = '0';
            this.mapContainer.style.left = '0';
            this.mapContainer.style.width = '100vw';
            this.mapContainer.style.height = '100vh';
            this.mapContainer.style.zIndex = '1';
        }
    }

    /**
     * Unpin the map after scrollytelling
     */
    unpinMap() {
        if (this.mapContainer) {
            this.mapContainer.classList.remove('pinned-map');
            this.mapContainer.style.position = 'relative';
            this.mapContainer.style.top = 'auto';
            this.mapContainer.style.left = 'auto';
            this.mapContainer.style.width = '100%';
            this.mapContainer.style.height = '400px';
            this.mapContainer.style.zIndex = 'auto';
        }
    }

    /**
     * Update active panel for scrollytelling
     */
    updateActivePanel(activePanel) {
        const panelIndex = this.contentPanels.indexOf(activePanel);
        
        if (panelIndex !== -1 && panelIndex !== this.currentPanelIndex) {
            // Update current panel index
            this.currentPanelIndex = panelIndex;
            
            // Get map state from panel data attribute
            const mapState = activePanel.dataset.mapState;
            console.log('Active panel changed to:', mapState, 'Panel index:', panelIndex);
            
            if (mapState) {
                this.updateMapState(mapState);
            }
            
            // Update progress bar
            this.updateProgressBar();
        }
    }

    /**
     * Update map state based on panel
     */
    updateMapState(stateKey) {
        if (!this.map || !this.isLoaded) return;

        const mapState = this.mapStates[stateKey];
        if (!mapState) {
            console.warn(`Map state not found for: ${stateKey}`);
            return;
        }

        // Change map style if different from current
        if (this.map.getStyle().name !== mapState.style) {
            this.map.setStyle(mapState.style);
        }

        // Skip animation if transitioning from 'data' to 'conclusion' (maintain same view)
        if (this.currentState === 'data' && stateKey === 'conclusion') {
            console.log('Maintaining same view from data to conclusion - no animation');
            // Don't animate, just maintain the current view
        } else {
            // Use easeTo for smooth 3D transitions
            this.map.easeTo({
                center: mapState.center,
                zoom: mapState.zoom,
                pitch: mapState.pitch,
                bearing: mapState.bearing,
                duration: this.reducedMotion ? 0 : 2000
            });
        }
        
        // Update current state
        this.currentState = stateKey;

        // Skip atmospheric effects and turquoise glow (disabled per user request)
        // this.addAtmosphericEffects(mapState);

        // Apply lighting after map transition (with delay to ensure it's visible)
        setTimeout(() => {
            this.applyLightingForState(stateKey);
        }, 100);

        // Configure 3D buildings for data and conclusion panels using Standard style
        if (stateKey === 'data' || stateKey === 'conclusion') {
            this.configure3DBuildingsForStandardStyle();
        }
    }

    /**
     * Configure 3D buildings using Mapbox Standard Style
     */
    configure3DBuildingsForStandardStyle() {
        console.log('🏗️ Configuring 3D buildings with Standard style...');
        
        // Wait for the map transition and style change to complete
        setTimeout(() => {
            this.waitForMapReady().then(() => {
                try {
                    // Enable 3D buildings and trees with natural colors using Standard style configuration
                    this.map.setConfigProperty('basemap', 'show3dObjects', true);
                    
                    // Set dusk lighting preset for atmospheric appearance
                    this.map.setConfigProperty('basemap', 'lightPreset', 'dusk');
                    
                    console.log('✅ Standard style 3D buildings and trees configured with dusk lighting');
                    
                } catch (error) {
                    console.error('❌ Failed to configure Standard style 3D buildings:', error);
                    console.log('🔄 Falling back to custom 3D buildings...');
                    
                    // Fallback to the original custom 3D buildings method
                    this.addCustom3DBuildings();
                }
            });
        }, 2000); // Reduced wait time since Standard style loads faster
    }

    /**
     * Fallback method for custom 3D buildings (if Standard style fails)
     */
    addCustom3DBuildings() {
        try {
            // Remove existing custom layers if they exist
            if (this.map.getLayer('3d-buildings-custom')) {
                this.map.removeLayer('3d-buildings-custom');
            }

            // Add custom 3D buildings with natural colors
            this.map.addLayer({
                'id': '3d-buildings-custom',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 10,
                'paint': {
                    // More natural building colors
                    'fill-extrusion-color': [
                        'case',
                        ['>', ['get', 'height'], 50], '#8B4513', // Taller buildings: brown
                        ['>', ['get', 'height'], 20], '#D2B48C', // Medium buildings: tan
                        '#F5F5DC' // Short buildings: beige
                    ],
                    'fill-extrusion-height': [
                        'case',
                        ['has', 'height'],
                        ['get', 'height'],
                        ['*', ['get', 'levels'], 3]
                    ],
                    'fill-extrusion-base': [
                        'case',
                        ['has', 'min_height'],
                        ['get', 'min_height'],
                        0
                    ],
                    'fill-extrusion-opacity': 0.8
                }
            });

            console.log('✅ Custom 3D buildings added as fallback');
            
        } catch (error) {
            console.error('❌ Failed to add custom 3D buildings fallback:', error);
        }
    }

    /**
     * Wait for map to be ready
     */
    waitForMapReady() {
        return new Promise((resolve) => {
            const checkReady = () => {
                if (this.map && this.map.loaded() && this.map.isStyleLoaded()) {
                    console.log('✅ Map ready for building addition');
                    resolve();
                } else {
                    console.log('⏳ Waiting for map to be ready...');
                    setTimeout(checkReady, 200);
                }
            };
            checkReady();
        });
    }

    /**
     * Update progress bar based on current panel
     */
    updateProgressBar() {
        const progressBar = document.getElementById('progressBar');
        if (progressBar && this.contentPanels.length > 0) {
            const progress = (this.currentPanelIndex / (this.contentPanels.length - 1)) * 100;
            progressBar.style.width = progress + '%';
        }
    }

    /**
     * Load Mapbox GL JS and initialize the map
     */
    async loadMapboxAndInitialize() {
        try {
            // Load Mapbox CSS if not already loaded
            if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
                document.head.appendChild(link);
            }

            // Load Mapbox JS if not already loaded
            if (typeof mapboxgl === 'undefined') {
                await this.loadScript('https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js');
            }

            await this.initializeMap();
            this.setupMapControls();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to load Mapbox:', error);
            this.showFallbackImage();
        }
    }

    /**
     * Load external script
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Initialize the Mapbox map
     */
    async initializeMap() {
        // Get token from environment or data attribute
        const token = this.getMapboxToken();
        if (!token) {
            throw new Error('Mapbox token not found');
        }

        mapboxgl.accessToken = token;

        // Create map with initial world view
        this.map = new mapboxgl.Map({
            container: 'map',
            style: this.mapStates.intro.style,
            center: this.mapStates.intro.center,
            zoom: this.mapStates.intro.zoom,
            pitch: this.mapStates.intro.pitch,
            bearing: this.mapStates.intro.bearing,
            interactive: false, // Disable interaction initially
            attributionControl: true
        });

        // Wait for map to load
        await new Promise((resolve) => {
            this.map.on('load', resolve);
        });

        console.log('✅ Map initialization complete - buildings will be added when data panel is active');

        this.isLoaded = true;
        this.mapContainer.setAttribute('aria-label', 'Interactive map showing Arequipa, Peru');
        this.mapContainer.setAttribute('role', 'region');
        this.mapContainer.setAttribute('tabindex', '0');
    }

    /**
     * Get Mapbox token from environment or data attribute
     */
    getMapboxToken() {
        // Check for environment variable (for build systems)
        if (typeof process !== 'undefined' && process.env && process.env.MAPBOX_TOKEN) {
            return process.env.MAPBOX_TOKEN;
        }

        // Check for data attribute on map container
        const token = this.mapContainer?.dataset.mapboxToken;
        if (token && token !== 'MAPBOX_TOKEN_HERE') {
            return token;
        }

        // Fallback to the existing token (for development)
        return 'pk.eyJ1IjoibWF0dGVhOTkiLCJhIjoiY2xkY2V0eHF2MDhhYjNub2Jya2h0dHh5diJ9.fXChvC5vSrDhDaNNLLbb0w';
    }

    /**
     * Setup map controls (disabled - no custom controls)
     */
    setupMapControls() {
        // Custom zoom controls disabled per user request
        console.log('Custom map controls disabled');
    }

    /**
     * Show fallback image when Mapbox fails
     */
    showFallbackImage() {
        this.mapContainer.innerHTML = `
            <div class="map-fallback">
                <img src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop" 
                     alt="Arequipa, Peru - City view" 
                     class="fallback-image">
                <div class="fallback-content">
                    <h3>Arequipa, Peru</h3>
                    <p>The White City nestled in the Andes Mountains</p>
                    <a href="https://www.google.com/maps/place/Arequipa,+Peru/@-16.4090,-71.5375,13z" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       class="fallback-link">
                        View on Google Maps
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', this.debounce(() => {
            if (this.map) {
                this.map.resize();
            }
        }, 250));

        // Handle keyboard navigation
        this.mapContainer?.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                // Allow normal tab navigation
                return;
            }
            
            // Prevent map from trapping focus
            if (e.key === 'Escape') {
                this.mapContainer.blur();
            }
        });
    }

    /**
     * Hide loading screen
     */
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => {
                loader.style.display = 'none';
            }, 1000);
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #b65d61;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: inherit;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }

    /**
     * Linear interpolation utility
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Easing function for smooth animation
     */
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }


    /**
     * Add atmospheric effects and turquoise glow
     */
    addAtmosphericEffects(mapState) {
        if (!this.map) return;

        // Skip fog and sky effects for compatibility
        console.log('⚠ Skipping fog/sky effects for version compatibility');

        // Add turquoise glow effect around Arequipa
        this.addTurquoiseGlow();
    }

    /**
     * Add turquoise glow effect around Arequipa
     */
    addTurquoiseGlow() {
        if (!this.map) return;

        // Remove existing glow layer if it exists
        if (this.map.getLayer('turquoise-glow')) {
            this.map.removeLayer('turquoise-glow');
        }
        if (this.map.getSource('turquoise-glow')) {
            this.map.removeSource('turquoise-glow');
        }

        // Add turquoise glow source
        this.map.addSource('turquoise-glow', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: [-71.5375, -16.4090]
                    }
                }]
            }
        });

        // Add turquoise glow layer
        this.map.addLayer({
            id: 'turquoise-glow',
            type: 'circle',
            source: 'turquoise-glow',
            paint: {
                'circle-radius': {
                    stops: [
                        [6, 20],
                        [12, 100]
                    ]
                },
                'circle-color': '#4effd0',
                'circle-opacity': 0.3,
                'circle-blur': 1
            }
        });

        // Add pulsing animation
        this.animateTurquoiseGlow();
    }

    /**
     * Animate turquoise glow effect
     */
    animateTurquoiseGlow() {
        if (!this.map || this.reducedMotion) return;

        let opacity = 0.3;
        let increasing = true;

        const animate = () => {
            if (increasing) {
                opacity += 0.01;
                if (opacity >= 0.6) increasing = false;
            } else {
                opacity -= 0.01;
                if (opacity <= 0.2) increasing = true;
            }

            if (this.map.getLayer('turquoise-glow')) {
                this.map.setPaintProperty('turquoise-glow', 'circle-opacity', opacity);
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Apply lighting based on state
     */
    applyLightingForState(stateKey) {
        console.log('Applying lighting for state:', stateKey);
        
        // Test lighting support first
        this.testLightingSupport();
        
        // Apply day lighting for all states (night lighting removed per user request)
        this.applyDayLighting();
    }

    /**
     * Test if lighting is supported and working
     */
    testLightingSupport() {
        if (!this.map) {
            console.log('❌ Map not initialized');
            return false;
        }

        console.log('🔍 Testing Mapbox lighting support...');
        
        // Check if methods exist
        console.log('✓ setLight method exists:', typeof this.map.setLight === 'function');
        console.log('✓ getLight method exists:', typeof this.map.getLight === 'function');
        
        // Check map state
        console.log('✓ Map loaded:', this.map.loaded());
        console.log('✓ Style loaded:', this.map.isStyleLoaded());
        console.log('✓ Mapbox GL version:', mapboxgl.version);
        
        // Check current style
        try {
            const style = this.map.getStyle();
            console.log('✓ Current style:', style.name || 'Unknown');
            console.log('✓ Style source:', style.sources ? Object.keys(style.sources).length + ' sources' : 'No sources');
        } catch (e) {
            console.log('❌ Could not get style info:', e.message);
        }

        // Test current light
        try {
            const currentLight = this.map.getLight();
            console.log('✓ Current light:', currentLight || 'Default/None');
        } catch (e) {
            console.log('❌ Could not get current light:', e.message);
        }

        // Test setting a simple light
        try {
            const testLight = {
                anchor: 'viewport',
                color: '#ffffff',
                intensity: 0.5,
                position: [1.15, 180, 30]
            };
            
            this.map.setLight(testLight);
            console.log('✅ Test light applied successfully');
            
            // Verify it was set
            setTimeout(() => {
                try {
                    const verifyLight = this.map.getLight();
                    console.log('✅ Verified light:', verifyLight);
                } catch (e) {
                    console.log('❌ Could not verify light:', e.message);
                }
            }, 100);
            
            return true;
        } catch (e) {
            console.log('❌ Test light failed:', e.message);
            console.log('❌ Error stack:', e.stack);
            return false;
        }
    }

    /**
     * Apply night lighting effect for Visual Journey panel
     */
    applyNightLighting() {
        if (!this.map) return;

        console.log('Applying night lighting...');
        
        try {
            // Try to apply lighting - some styles don't support it
            const nightLight = {
                anchor: 'viewport',
                color: '#000033',  // Very dark blue for dramatic contrast
                intensity: 2.0,    // Much higher intensity for visibility
                position: [1.15, 5, 10]  // Very low angle for dramatic shadows
            };

            this.map.setLight(nightLight);
            console.log('Night lighting applied:', nightLight);
        } catch (error) {
            console.log('Lighting not supported by current style, using alternative approach');
            // Fallback: apply dark overlay effect
            this.applyDarkOverlay();
        }
        
        // Skip fog and sky effects - not supported in this version
        console.log('✓ Night lighting applied (fog/sky skipped for compatibility)');
    }

    /**
     * Apply dark overlay as fallback when lighting is not supported
     */
    applyDarkOverlay() {
        if (!this.map) return;

        // Remove existing overlay if it exists
        if (this.map.getLayer('night-overlay')) {
            this.map.removeLayer('night-overlay');
        }
        if (this.map.getSource('night-overlay')) {
            this.map.removeSource('night-overlay');
        }

        // Add dark overlay source
        this.map.addSource('night-overlay', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [-180, -90],
                            [180, -90],
                            [180, 90],
                            [-180, 90],
                            [-180, -90]
                        ]]
                    }
                }]
            }
        });

        // Add dark overlay layer
        this.map.addLayer({
            id: 'night-overlay',
            type: 'fill',
            source: 'night-overlay',
            paint: {
                'fill-color': '#0a0a1a',
                'fill-opacity': 0.4
            }
        });

        console.log('Dark overlay applied as fallback');
    }

    /**
     * Apply day lighting effect for other panels
     */
    applyDayLighting() {
        if (!this.map) return;

        console.log('Applying day lighting...');
        
        try {
            const dayLight = {
                anchor: 'viewport',
                color: '#ffffff',
                intensity: 1.0,  // Higher intensity for more visible effect
                position: [1.15, 210, 30]
            };

            this.map.setLight(dayLight);
            console.log('Day lighting applied:', dayLight);
        } catch (error) {
            console.log('Lighting not supported, removing overlay');
            // Remove dark overlay if it exists
            this.removeDarkOverlay();
        }
        
        // Skip fog and sky effects - not supported in this version
        console.log('✓ Day lighting applied (fog/sky skipped for compatibility)');
    }

    /**
     * Remove dark overlay
     */
    removeDarkOverlay() {
        if (!this.map) return;

        if (this.map.getLayer('night-overlay')) {
            this.map.removeLayer('night-overlay');
        }
        if (this.map.getSource('night-overlay')) {
            this.map.removeSource('night-overlay');
        }

        console.log('Dark overlay removed');
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

/**
 * Demo Form Modal Handler
 */
class DemoFormHandler {
    constructor() {
        this.modal = document.getElementById('demoModal');
        this.openBtn = document.getElementById('bookDemoBtn');
        this.closeBtn = document.getElementById('demoModalClose');
        this.overlay = document.getElementById('demoModalOverlay');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.form = document.getElementById('demoForm');
        
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // Event listeners
        this.openBtn?.addEventListener('click', () => this.openModal());
        this.closeBtn?.addEventListener('click', () => this.closeModal());
        this.overlay?.addEventListener('click', () => this.closeModal());
        this.cancelBtn?.addEventListener('click', () => this.closeModal());
        this.form?.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }
    
    openModal() {
        this.modal.classList.add('show');
        this.modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = this.modal.querySelector('input[type="email"]');
        setTimeout(() => firstInput?.focus(), 100);
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        this.modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Reset form
        this.form?.reset();
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const email = formData.get('email');
        const message = formData.get('message');
        const captcha = formData.get('captcha');
        
        // Validate required fields
        if (!email || !captcha) {
            this.showMessage('Please fill in all required fields.', 'error');
            return;
        }
        
        // Simulate form submission
        this.showMessage('Thank you! We\'ll be in touch soon to schedule your demo.', 'success');
        
        // Close modal after success
        setTimeout(() => {
            this.closeModal();
        }, 2000);
    }
    
    showMessage(text, type) {
        // Create temporary message element
        const message = document.createElement('div');
        message.className = `form-message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            ${type === 'success' ? 'background: #4effd0; color: #000;' : 'background: #b65d61;'}
        `;
        
        document.body.appendChild(message);
        
        // Remove after 3 seconds
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    new ArequipaScrollMap();
    
    // Initialize demo form handler
    new DemoFormHandler();
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any animations when page is hidden
        const videos = document.querySelectorAll('video');
        videos.forEach(video => video.pause());
    } else {
        // Resume when page becomes visible
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video.hasAttribute('autoplay')) {
                video.play().catch(e => console.log('Video autoplay prevented:', e));
            }
        });
    }
});

/**
 * Handle online/offline status
 */
window.addEventListener('online', () => {
    console.log('Connection restored');
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});
