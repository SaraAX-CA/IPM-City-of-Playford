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

// Helper: colour scales for organised (blue) and casual (orange)
function getColor(value, type) {
    if (type === 'OrganisedDemand_2025') {
        return value > 20 ? '#08519c' :
            value > 15 ? '#3182bd' :
                value > 10 ? '#6baed6' :
                    value > 5 ? '#bdd7e7' : '#eff3ff';
    } else {
        // Casual demand – orange palette
        return value > 20 ? '#a63603' :
            value > 15 ? '#e6550d' :
                value > 10 ? '#fd8d3c' :
                    value > 5 ? '#fdbe85' : '#feedde';
    }
}

function styleFeature(feature) {
    const type = document.querySelector('input[name="demandLayer"]:checked').value;
    const val = feature.properties[type];
    return {
        fillColor: getColor(val, type),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function highlight(e) {
    const layer = e.target;
    layer.setStyle({ weight: 3, color: '#666', dashArray: '', fillOpacity: 0.9 });
    layer.bringToFront();
}

function resetHighlight(e) {
    if (geojsonLayer) geojsonLayer.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({ mouseover: highlight, mouseout: resetHighlight });
    const p = feature.properties;
    const content = `
    <div class="popup-header">SA1: ${p.SA1_CODE21 || p.Level0_Identifier}</div>
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
    const type = document.querySelector('input[name="demandLayer"]:checked').value;
    const legend = document.getElementById('legend');
    const grades = [0, 5, 10, 15, 20];
    let html = '<h4>Legend</h4>';
    for (let i = 0; i < grades.length; i++) {
        html += `<div class="legend-item"><i style="background:${getColor(grades[i] + 1, type)}"></i><span>${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] : '+'}</span></div>`;
    }
    legend.innerHTML = html;
}

function loadSport(sport) {
    if (!sportsData || !sportsData[sport]) {
        console.error('No data for sport', sport);
        return;
    }
    const data = sportsData[sport];
    if (geojsonLayer) map.removeLayer(geojsonLayer);
    geojsonLayer = L.geoJson(data, { style: styleFeature, onEachFeature }).addTo(map);
    map.fitBounds(geojsonLayer.getBounds());
    updateLegend();
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

// Layer toggle listeners
function initLayerToggle() {
    document.querySelectorAll('input[name="demandLayer"]').forEach(r => {
        r.addEventListener('change', () => {
            if (geojsonLayer) geojsonLayer.setStyle(styleFeature);
            updateLegend();
        });
    });
}

// Initialise everything after data script loads
if (typeof sportsData !== 'undefined') {
    initSportSelector();
    initLayerToggle();
} else {
    console.error('sportsData not loaded – ensure sports_data.js is included');
}
