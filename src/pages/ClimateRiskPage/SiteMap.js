import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../ClimateRiskPage.css'; // For .map-container styles

// Default Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const SiteMap = ({ sites }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null); // To store the map instance

  useEffect(() => {
    if (leafletMap.current === null && mapRef.current) {
      // Initialize map
      leafletMap.current = L.map(mapRef.current).setView([20, 0], 2); // Default view

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(leafletMap.current);
    }

    // Add/update markers when sites change
    if (leafletMap.current && sites) {
      // Clear existing markers first (simple way)
      leafletMap.current.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          leafletMap.current.removeLayer(layer);
        }
      });

      if (sites.length > 0) {
        const markers = sites.map(site => {
          if (site.latitude && site.longitude) {
            return L.marker([site.latitude, site.longitude]).bindPopup(site.name);
          }
          return null;
        }).filter(marker => marker !== null);

        if (markers.length > 0) {
          const group = L.featureGroup(markers).addTo(leafletMap.current);
          // Optional: Fit map to bounds of markers
           if (group.getBounds().isValid()) {
            leafletMap.current.fitBounds(group.getBounds().pad(0.1));
          }
        }
      } else if (leafletMap.current.getZoom() > 2) { // if no sites, reset to default view if zoomed in
        leafletMap.current.setView([20, 0], 2);
      }
    }

    // Cleanup function to destroy map instance when component unmounts
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [sites]); // Rerun effect if sites array changes

  return <div ref={mapRef} className="map-container" style={{ height: '500px' }} />;
};

export default SiteMap; 