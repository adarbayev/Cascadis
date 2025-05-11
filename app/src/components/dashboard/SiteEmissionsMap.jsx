import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ClimateRisksMap.css'; // Can reuse or create new CSS for this map if needed

// Fix for default Leaflet icon path issues (might not be strictly needed for CircleMarker, but good to have if other markers are ever mixed)
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
// });

const extractSitesWithCoords = (data) => {
  const sites = [];
  const traverseNodes = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'Site' && typeof node.latitude === 'number' && typeof node.longitude === 'number') {
        sites.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverseNodes(node.children);
      }
    });
  };
  if (Array.isArray(data)) {
    traverseNodes(data);
  }
  return sites;
};

const FitBoundsToSites = ({ sites }) => {
  const map = useMap();
  useEffect(() => {
    if (sites && sites.length > 0) {
      const validSites = sites.filter(site => typeof site.latitude === 'number' && typeof site.longitude === 'number');
      if (validSites.length > 0) {
        const bounds = L.latLngBounds(validSites.map(site => [site.latitude, site.longitude]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    } else if (sites && sites.length === 0) {
      // Optional: Default view if no sites
      map.setView([20, 0], 2);
    }
  }, [sites, map]);
  return null;
};

// Calculate radius - simple log scale for now, adjust as needed
// Max/min radius can also be tuned
const calculateRadius = (emissions) => {
  if (emissions <= 0) return 5; // Min radius for sites with no/zero emissions
  // Example scaling: logarithmic to handle wide range, plus a base size.
  // Adjust scaleFactor and baseSize based on typical emission values and desired visual impact.
  const scaleFactor = 3;
  const baseSize = 5;
  let radius = baseSize + Math.log1p(emissions) * scaleFactor; // log1p = log(1+p) to handle 0 emissions gracefully if not caught by above
  return Math.min(Math.max(radius, 5), 30); // Clamp radius between 5px and 30px
};

const SiteEmissionsMap = ({ orgStructureData = [], emissionsBySite = {} }) => {
  const [sitesToDisplay, setSitesToDisplay] = useState([]);

  useEffect(() => {
    const extracted = extractSitesWithCoords(orgStructureData);
    setSitesToDisplay(extracted);
  }, [orgStructureData]);

  return (
    <div className="site-emissions-map-container" style={{ height: '300px', width: '100%', marginBottom: '20px' }}>
      <MapContainer 
        center={[20, 0]} // Default center
        zoom={2}         // Default zoom
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {sitesToDisplay.map(site => {
          const siteEmissions = emissionsBySite[site.id] || 0;
          const radius = calculateRadius(siteEmissions);
          return (
            <CircleMarker
              key={site.id}
              center={[site.latitude, site.longitude]}
              radius={radius}
              pathOptions={{
                color: '#065f46', // Emerald-800 for border
                fillColor: '#34d399', // Emerald-400 for fill
                fillOpacity: 0.7,
                weight: 1
              }}
            >
              <Popup>
                <div className="site-popup">
                  <h3>{site.name}</h3>
                  <p><strong>Type:</strong> {site.type}</p>
                  <p><strong>Emissions:</strong> {siteEmissions.toFixed(2)} tCO₂e</p>
                  <p><strong>Coords:</strong> {site.latitude}, {site.longitude}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        <FitBoundsToSites sites={sitesToDisplay} />
      </MapContainer>
      {/* Optional: Add a legend for circle sizes if needed */}
      {/* <div className="map-legend">
        <h4>Emissions Magnitude (tCO₂e)</h4>
        <div><span style={{height: calculateRadius(10), width: calculateRadius(10)*2, backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block'}}></span> Small (~10)</div>
        <div><span style={{height: calculateRadius(1000), width: calculateRadius(1000)*2, backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block'}}></span> Medium (~1000)</div>
        <div><span style={{height: calculateRadius(100000), width: calculateRadius(100000)*2, backgroundColor: '#34d399', borderRadius: '50%', display: 'inline-block'}}></span> Large (~100k)</div>
      </div> */}
    </div>
  );
};

export default SiteEmissionsMap; 