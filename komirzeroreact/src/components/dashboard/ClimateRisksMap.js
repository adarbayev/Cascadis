import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './ClimateRisksMap.css';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

// Create custom icons for different site types
const siteIcons = {
  'Office': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'Warehouse': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }),
  'Production Site': new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
};

// Helper function to extract all site nodes from the org structure data
const extractSites = (data) => {
  const sites = [];
  
  const traverseNodes = (nodes) => {
    nodes.forEach(node => {
      if (node.type === 'Site' && node.latitude && node.longitude) {
        sites.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverseNodes(node.children);
      }
    });
  };
  
  traverseNodes(data);
  return sites;
};

const ClimateRisksMap = ({ orgStructureData = [] }) => {
  const [sites, setSites] = useState([]);
  
  useEffect(() => {
    // Extract sites whenever the org structure data changes
    setSites(extractSites(orgStructureData));
  }, [orgStructureData]);
  
  return (
    <div className="climate-risks-map-container">
      <h2 className="section-header">Physical Climate Risks Map</h2>
      <p className="map-description">
        This map shows the locations of all sites in your organization, color-coded by site type.
        When a site is added or edited in the organizational structure, it will automatically 
        appear on this map.
      </p>
      <div className="map-wrapper">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '500px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {sites.map(site => (
            <Marker 
              key={site.id}
              position={[site.latitude, site.longitude]}
              icon={siteIcons[site.type] || siteIcons['Office']}
            >
              <Popup>
                <div className="site-popup">
                  <h3>{site.name}</h3>
                  <p><strong>Code:</strong> {site.code}</p>
                  <p><strong>Type:</strong> {site.type}</p>
                  <p><strong>Country:</strong> {site.country}</p>
                  <p><strong>Coordinates:</strong> {site.latitude}, {site.longitude}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      <div className="map-legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <div className="legend-icon office"></div>
          <span>Office</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon warehouse"></div>
          <span>Warehouse</span>
        </div>
        <div className="legend-item">
          <div className="legend-icon production"></div>
          <span>Production Site</span>
        </div>
      </div>
    </div>
  );
};

export default ClimateRisksMap; 