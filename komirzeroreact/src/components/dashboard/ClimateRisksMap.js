import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

// Define site types with their display names, icon URLs, and legend colors
// Ensure these keys (e.g., 'Office', 'Production Site') EXACTLY match site.type from ORG_STRUCTURE
const siteTypeDetails = {
  'Office': { // Case-sensitive match
    name: 'Office',
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    color: '#2A81CB' // Blue
  },
  'Warehouse': {
    name: 'Warehouse',
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    color: '#FFA500' // Orange
  },
  'Production Site': { // Case-sensitive match
    name: 'Production Site',
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    color: '#2AAA8A' // Green
  },
  'Retail Outlet': {
    name: 'Retail Outlet',
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    color: '#D43939' // Red
  },
  'Default': { // Fallback
    name: 'Other Site Type',
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    color: '#A9A9A9' // Grey
  }
};

// Create custom Leaflet icons dynamically based on siteTypeDetails
const getSiteIcon = (siteType) => {
  const details = siteTypeDetails[siteType] || siteTypeDetails['Default'];
  return new L.Icon({
    iconUrl: details.iconUrl,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
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

// Component to adjust map bounds
const FitBounds = ({ sites }) => {
  const map = useMap();
  useEffect(() => {
    if (sites && sites.length > 0) {
      const bounds = L.latLngBounds(sites.map(site => [site.latitude, site.longitude]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [sites, map]);
  return null;
};

const ClimateRisksMap = ({ orgStructureData = [] }) => {
  const [sites, setSites] = useState([]);
  const [uniqueSiteTypes, setUniqueSiteTypes] = useState([]);

  useEffect(() => {
    const extracted = extractSites(orgStructureData);
    setSites(extracted);
    
    const typesInData = extracted.map(site => site.type);
    // console.log('[ClimateRisksMap] Site types found in data:', [...new Set(typesInData)]); // For debugging legend
    const typesForLegend = [...new Set(typesInData)].filter(type => siteTypeDetails[type]); // Only include types defined in details
    
    // If after filtering, no specific types are matched, but there are sites, show 'Default' legend if necessary
    if (typesForLegend.length === 0 && extracted.length > 0) {
      setUniqueSiteTypes(['Default']); 
    } else {
      setUniqueSiteTypes(typesForLegend.sort());
    }

  }, [orgStructureData]);

  return (
    <div className="climate-risks-map-container">
      {/* Map title and description can be moved to parent page if this is just the map component */}
      {/* <h2 className="section-header">Physical Climate Risks Map</h2> */}
      {/* <p className="map-description">...
      </p> */}
      <div className="map-wrapper" style={{ height: 'calc(100% - 60px)', minHeight: '450px' }}> {/* Adjusted height */}
        <MapContainer 
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }} // Removed minHeight from here, parent controls it
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
              icon={getSiteIcon(site.type)}
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
          <FitBounds sites={sites} />
        </MapContainer>
      </div>
      
      {uniqueSiteTypes.length > 0 && (
        <div className="map-legend">
          <h3>Legend</h3>
          {uniqueSiteTypes.map(type => {
            // Ensure we use the exact key that exists in siteTypeDetails, or fall back to Default
            const details = siteTypeDetails[type] || siteTypeDetails['Default'];
            return (
              <div key={type} className="legend-item">
                <div 
                  className="legend-icon" 
                  style={{ backgroundColor: details.color, width: '16px', height: '16px', borderRadius: '50%', marginRight: '8px' }}
                ></div>
                <span>{details.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClimateRisksMap; 