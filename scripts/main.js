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
            'visual': {
                center: [-71.5375, -16.4090],
                zoom: 10,
                pitch: 70,
                bearing: -45,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'data': {
                center: [-71.5375, -16.4090],
                zoom: 11,
                pitch: 80,
                bearing: -60,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
            },
            'conclusion': {
                center: [-71.5375, -16.4090],
                zoom: 12,
                pitch: 85,
                bearing: -75,
                style: 'mapbox://styles/mapbox/satellite-streets-v12'
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

        // Use easeTo for smooth 3D transitions
        this.map.easeTo({
            center: mapState.center,
            zoom: mapState.zoom,
            pitch: mapState.pitch,
            bearing: mapState.bearing,
            duration: this.reducedMotion ? 0 : 2000
        });

        // Add atmospheric effects and turquoise glow
        this.addAtmosphericEffects(mapState);
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
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
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
     * Setup map controls
     */
    setupMapControls() {
        // Create zoom controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'map-controls';
        controlsContainer.innerHTML = `
            <button class="map-control-btn zoom-in" aria-label="Zoom in">
                <span aria-hidden="true">+</span>
            </button>
            <button class="map-control-btn zoom-out" aria-label="Zoom out">
                <span aria-hidden="true">−</span>
            </button>
        `;

        this.mapContainer.appendChild(controlsContainer);

        // Add event listeners for controls
        const zoomInBtn = controlsContainer.querySelector('.zoom-in');
        const zoomOutBtn = controlsContainer.querySelector('.zoom-out');

        zoomInBtn.addEventListener('click', () => {
            this.map.zoomIn({ duration: 300 });
            this.announceToScreenReader('Zoomed in');
        });

        zoomOutBtn.addEventListener('click', () => {
            this.map.zoomOut({ duration: 300 });
            this.announceToScreenReader('Zoomed out');
        });

        // Keyboard support for controls
        zoomInBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.map.zoomIn({ duration: 300 });
            }
        });

        zoomOutBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.map.zoomOut({ duration: 300 });
            }
        });
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

        // Add fog effect for depth
        this.map.setFog({
            color: 'rgb(186, 210, 235)',
            'high-color': 'rgb(36, 92, 223)',
            'horizon-blend': 0.02,
            'space-color': 'rgb(11, 11, 25)',
            'star-intensity': 0.6,
            range: [0, 4],
            'space-opacity': 0.3
        });

        // Add sky layer for atmospheric effects
        this.map.setSky({
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15,
            'sky-atmosphere-color': 'rgb(220, 159, 159)',
            'sky-atmosphere-halo-color': 'rgb(255, 255, 255)',
            'sky-atmosphere-space-color': 'rgb(0, 0, 0)',
            'sky-atmosphere-stars-intensity': 0.5,
            'sky-atmosphere-opacity': 0.2
        });

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
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    new ArequipaScrollMap();
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
