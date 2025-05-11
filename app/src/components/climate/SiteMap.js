import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ClimateRiskPage.css'; // For .map-container styles

// Default Leaflet icon fix (still useful for react-leaflet if not using custom icons consistently)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to automatically adjust map bounds to fit markers
const FitBounds = ({ sites }) => {
  const map = useMap();
  useEffect(() => {
    if (sites && sites.length > 0) {
      const validSites = sites.filter(site => 
        typeof site.latitude === 'number' && typeof site.longitude === 'number'
      );
      if (validSites.length > 0) {
        const bounds = L.latLngBounds(validSites.map(site => [site.latitude, site.longitude]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        map.setView([20,0], 2); // Default view if no valid sites
      }
    } else if (sites && sites.length === 0) {
      map.setView([20,0], 2); // Default view if sites array is empty
    }
  }, [sites, map]);
  return null;
};

const SiteMap = ({ sites }) => {
  if (!sites) { // Basic guard against sites being undefined initially
    return <div className="map-container"><p>Loading map data...</p></div>;
  }

  const validSites = sites.filter(site => 
    typeof site.latitude === 'number' && typeof site.longitude === 'number'
  );

  return (
    <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="map-container">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validSites.map(site => (
        <Marker key={site.id} position={[site.latitude, site.longitude]}>
          <Popup>
            {site.name}<br />
            {site.code}
          </Popup>
        </Marker>
      ))}
      <FitBounds sites={validSites} />
    </MapContainer>
  );
};

export default SiteMap; 