// Unified Sport Demand Map – Leaflet implementation
// Assumes a global variable `sportsData` defined in sports_data.js

// Initialize map centered on Playford
const map = L.map('map').setView([-34.7, 138.7], 11);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let geojsonLayer = null;
let currentSport = null;
let currentDemandType = 'OrganisedDemand_2025'; // Track current demand type for consistent styling

// Helper: colour scales for organised (blue) and casual (orange)
function getColor(value, type) {
    // Organised (2025) uses a finer low-range scale
    if (type === 'OrganisedDemand_2025') {
        return value > 15 ? '#08306b' :
            value > 12 ? '#08519c' :
                value > 9 ? '#3182bd' :
                    value > 6 ? '#6baed6' :
                        value > 3 ? '#bdd7e7' : '#eff3ff';
    }

    // Organised (2046) – extended to 25
    if (type === 'OrganisedDemand_2046') {
        return value > 25 ? '#08306b' :
            value > 20 ? '#08519c' :
                value > 15 ? '#3182bd' :
                    value > 10 ? '#6baed6' :
                        value > 5 ? '#bdd7e7' : '#eff3ff';
    }

    // Casual (2025) – existing orange palette
    if (type === 'CasualDemand_2025') {
        return value > 50 ? '#7f2704' :
            value > 40 ? '#a63603' :
                value > 30 ? '#e6550d' :
                    value > 20 ? '#fd8d3c' :
                        value > 10 ? '#fdbe85' : '#feedde';
    }

    // Casual (2046) – extended to 75
    if (type === 'CasualDemand_2046') {
        return value > 75 ? '#7f2704' :
            value > 60 ? '#a63603' :
                value > 45 ? '#e6550d' :
                    value > 30 ? '#fd8d3c' :
                        value > 15 ? '#fdbe85' : '#feedde';
    }

    // Default fallback (treat as casual)
    return value > 50 ? '#7f2704' :
        value > 40 ? '#a63603' :
            value > 30 ? '#e6550d' :
                value > 20 ? '#fd8d3c' :
                    value > 10 ? '#fdbe85' : '#feedde';
}

// Create a style function for a specific demand property
function styleFor(type) {
    return function(feature) {
        const val = feature.properties[type];
        return {
            fillColor: getColor(val, type),
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    };
}

function highlight(e) {
    const layer = e.target;
    layer.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.9 });
    layer.bringToFront();
}

function resetHighlight(e) {
    if (geojsonLayer) {
        // Apply the current demand type style to reset properly
        e.target.setStyle(styleFor(currentDemandType)(e.target.feature));
    }
}

function onEachFeature(feature, layer) {
    layer.on({ mouseover: highlight, mouseout: resetHighlight });
    const p = feature.properties;
    const content = `
    <div class="popup-header">SA1: ${p.SA1_CODE21 || p.Level0_Identifier}</div>
    <div class="popup-header">SA2: ${p.SA2_NAME21 || 'N/A'}</div>
    <div class="popup-body">
      <div class="popup-stat"><span class="popup-label">Organised Demand (2025)</span><span class="popup-value">${p.OrganisedDemand_2025 || 0}</span></div>
      <div class="popup-stat"><span class="popup-label">Casual Demand (2025)</span><span class="popup-value">${p.CasualDemand_2025 || 0}</span></div>
      <div class="popup-stat"><span class="popup-label">Total Population (2025)</span><span class="popup-value">${p.TotalPopulation_2025 || 0}</span></div>
      <hr style="margin:8px 0;border:0;border-top:1px solid #eee;"/>
      <div class="popup-stat"><span class="popup-label">Organised Demand (2046)</span><span class="popup-value">${p.OrganisedDemand_2046 || 0}</span></div>
      <div class="popup-stat"><span class="popup-label">Casual Demand (2046)</span><span class="popup-value">${p.CasualDemand_2046 || 0}</span></div>
      <div class="popup-stat"><span class="popup-label">Total Population (2046)</span><span class="popup-value">${p.TotalPopulation_2046 || 0}</span></div>
    </div>`;
    layer.bindPopup(content);
}

function updateLegend() {
    // Accept an optional type argument so callers (overlay events) can force which legend to show
    const legend = document.getElementById('legend');
    const type = (typeof arguments[0] === 'string' && arguments[0]) ? arguments[0] : (document.querySelector('input[name="demandLayer"]:checked') ? document.querySelector('input[name="demandLayer"]:checked').value : 'OrganisedDemand_2025');
    const grades =
        type === 'OrganisedDemand_2025' ? [0, 3, 6, 9, 12, 15] :
        type === 'OrganisedDemand_2046' ? [0, 5, 10, 15, 20, 25] :
        type === 'CasualDemand_2025' ? [0, 10, 20, 30, 40, 50] :
        /* CasualDemand_2046 */ [0, 15, 30, 45, 60, 75];
    let html = '<h4>Legend</h4>';
    for (let i = 0; i < grades.length; i++) {
        html += `<div class="legend-item"><i style="background:${getColor(grades[i] + 1, type)}"></i><span>${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'}</span></div>`;
    }
    legend.innerHTML = html;
}

// Return the currently visible demand property layer, using a sensible priority
// helper to read the selected demand radio value
function getSelectedDemandType() {
    const radio = document.querySelector('input[name="demandLayer"]:checked');
    return radio ? radio.value : 'OrganisedDemand_2025';
}

function loadSport(sport) {
    if (!sportsData || !sportsData[sport]) {
        console.error('No data for sport', sport);
        return;
    }
    const data = sportsData[sport];

    // Remove previous geojson layer
    if (geojsonLayer) {
        try { map.removeLayer(geojsonLayer); } catch (e) {}
        geojsonLayer = null;
    }

    // Create single geojson layer styled by the selected demand type
    const selectedType = getSelectedDemandType();
    currentDemandType = selectedType; // Track current type for hover reset
    geojsonLayer = L.geoJson(data, { style: styleFor(selectedType), onEachFeature }).addTo(map);

    // Fit bounds to the data
    try {
        map.fitBounds(geojsonLayer.getBounds());
    } catch (e) {
        // ignore if getBounds fails
    }

    // Update legend for current selection
    updateLegend(selectedType);
    loadCompetitorSites(sport);
}

// Populate sport dropdown
function initSportSelector() {
    const select = document.getElementById('sportSelect');
    Object.keys(sportsData).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s.charAt(0).toUpperCase() + s.slice(1);
        select.appendChild(opt);
    });
    // Load first sport by default
    currentSport = select.value;
    loadSport(currentSport);
    select.addEventListener('change', e => {
        currentSport = e.target.value;
        loadSport(currentSport);
    });
}

// Sport Colors for Competitor Sites
const sportColors = {
    'Athletics': '#e41a1c',
    'Australian Football': '#ff7f00',
    'Basketball': '#984ea3',
    'Bowls': '#4daf4a',
    'Cricket': '#377eb8',
    'Soccer': '#ffff33',
    'Netball': '#f781bf',
    'Tennis': '#a65628',
    'Volleyball': '#999999'
};

// Competitor Sites Layer
const sitesLayer = L.layerGroup();
let allSiteMarkers = [];

// Map sport names from CSV format to competitor data format
function mapSportName(sportFromCSV) {
    const sportMapping = {
        'AustralianFootball': 'Australian Football',
        'Athletics': 'Athletics',
        'Basketball': 'Basketball',
        'Bowls': 'Bowls',
        'Cricket': 'Cricket',
        'Hockey': 'Hockey',
        'Netball': 'Netball',
        'Soccer': 'Soccer',
        'Tennis': 'Tennis',
        'Volleyball': 'Volleyball'
    };
    return sportMapping[sportFromCSV] || sportFromCSV;
}

// Create Custom Icon Function
function createSiteIcon(color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}

// Load Competitor Sites (only for current sport)
function loadCompetitorSites(sport) {
    sitesLayer.clearLayers();
    allSiteMarkers = [];

    const mappedSport = mapSportName(sport);

    if (typeof competitorSites !== 'undefined') {
        competitorSites.forEach(site => {
            if (site.lat && site.long && site.sport === mappedSport) {
                const color = sportColors[site.sport] || '#000000';
                const marker = L.marker([site.lat, site.long], {
                    icon: createSiteIcon(color)
                });

                marker.bindPopup(`
                    <strong>${site.sitename || 'Unknown Site'}</strong><br>
                    Sport: ${site.sport}
                `);

                allSiteMarkers.push(marker);
                marker.addTo(sitesLayer);
            }
        });

        // Check if checkbox is checked
        const showSitesCheckbox = document.getElementById('showSites');
        if (showSitesCheckbox && showSitesCheckbox.checked) {
            sitesLayer.addTo(map);
        }
    }
}

// Layer toggle listeners
function initLayerToggle() {
    document.querySelectorAll('input[name="demandLayer"]').forEach(r => {
        r.addEventListener('change', () => {
            const type = getSelectedDemandType();
            currentDemandType = type; // Track the new demand type
            // Update the style of the single geojson layer and legend
            if (geojsonLayer && typeof geojsonLayer.setStyle === 'function') {
                geojsonLayer.setStyle(styleFor(type));
            }
            updateLegend(type);
        });
    });

    // Sites toggle listener
    const showSitesCheckbox = document.getElementById('showSites');
    if (showSitesCheckbox) {
        showSitesCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                sitesLayer.addTo(map);
            } else {
                map.removeLayer(sitesLayer);
            }
        });
    }
}

// Initialise everything after data script loads
if (typeof sportsData !== 'undefined') {
    initSportSelector();
    initLayerToggle();
} else {
    console.error('sportsData not loaded – ensure sports_data.js is included');
}
