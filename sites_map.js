// Initialize map
const map = L.map('map').setView([-34.7, 138.7], 11);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Sport Colors
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

// Add SA1 Boundaries
if (typeof sa1Boundaries !== 'undefined') {
    L.geoJson(sa1Boundaries, {
        style: {
            color: '#3388ff',
            weight: 1,
            opacity: 0.5,
            fillColor: '#3388ff',
            fillOpacity: 0.2
        },
        onEachFeature: function (feature, layer) {
            const id = feature.properties.SA1_CODE21 || feature.properties.Level0_Identifier;
            layer.bindPopup(`SA1: ${id}`);
        }
    }).addTo(map);
} else {
    console.error('SA1 Boundaries not loaded');
}

// Markers Layer Group
const markersLayer = L.layerGroup().addTo(map);
let allMarkers = [];

// Create Custom Icon Function
function createCustomIcon(color) {
    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
}

// Load Markers
if (typeof competitorSites !== 'undefined') {
    competitorSites.forEach(site => {
        if (site.lat && site.long) {
            const color = sportColors[site.sport] || '#000000';
            const marker = L.marker([site.lat, site.long], {
                icon: createCustomIcon(color)
            });

            marker.bindPopup(`
                <strong>${site.sitename || 'Unknown Site'}</strong><br>
                Sport: ${site.sport}
            `);

            marker.sport = site.sport;
            allMarkers.push(marker);
            marker.addTo(markersLayer);
        }
    });
} else {
    console.error('Competitor sites not loaded');
}

// Initialize Filters
const filterContainer = document.getElementById('sportFilters');
const sports = Object.keys(sportColors).sort();

sports.forEach(sport => {
    const div = document.createElement('div');
    div.className = 'filter-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.value = sport;
    checkbox.id = `filter-${sport.replace(/\s+/g, '-')}`;

    const colorDot = document.createElement('span');
    colorDot.className = 'color-dot';
    colorDot.style.backgroundColor = sportColors[sport];

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = sport;

    div.appendChild(checkbox);
    div.appendChild(colorDot);
    div.appendChild(label);
    filterContainer.appendChild(div);

    // Event Listener
    checkbox.addEventListener('change', filterMarkers);
});

function filterMarkers() {
    markersLayer.clearLayers();
    const checkedSports = Array.from(document.querySelectorAll('.filter-item input:checked')).map(cb => cb.value);

    allMarkers.forEach(marker => {
        if (checkedSports.includes(marker.sport)) {
            marker.addTo(markersLayer);
        }
    });
}
