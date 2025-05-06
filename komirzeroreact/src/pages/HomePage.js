import React, { useState, useEffect } from 'react';
import './HomePage.css';
import TrajectoryDashboard from '../components/dashboard/TrajectoryDashboard';
import ClimateRisksMap from '../components/dashboard/ClimateRisksMap';

// Placeholder components for other tabs - will implement these later
const MACCAnalysis = () => <div className="placeholder-content">MACC Analysis Content</div>;
const AbatementWedges = () => <div className="placeholder-content">Abatement Wedges Content</div>;

// Load organization structure data from localStorage or use default data
const getInitialOrgData = () => {
  const savedData = localStorage.getItem('orgStructureData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved org structure data:', e);
    }
  }
  
  // Default data if nothing in localStorage
  return [
    {
      id: 'g1',
      type: 'Group',
      code: 'NOG001',
      name: 'NAT OIL GROUP',
      children: [
        {
          id: 'le1',
          type: 'Legal Entity',
          code: 'NOW001',
          name: 'NAT OIL WEST',
          children: [
            {
              id: 's1',
              type: 'Site',
              code: 'NOWO001',
              name: 'NAT OIL WEST OFFICE',
              country: 'Romania',
              latitude: 44.4268,
              longitude: 26.1025
            },
            {
              id: 's2',
              type: 'Site',
              code: 'NOWF001',
              name: 'NAT OIL WEST FIELD',
              country: 'Romania',
              latitude: 45.7538,
              longitude: 26.8212
            }
          ]
        },
        {
          id: 'le2',
          type: 'Legal Entity',
          code: 'NOE001',
          name: 'NAT OIL EAST',
          children: [
            {
              id: 's3',
              type: 'Site',
              code: 'NOEO001',
              name: 'NAT OIL EAST OFFICE',
              country: 'Kazakhstan',
              latitude: 43.2551,
              longitude: 76.9126
            },
            {
              id: 's4',
              type: 'Site',
              code: 'NOEF001',
              name: 'NAT OIL EAST FIELD',
              country: 'Kazakhstan',
              latitude: 47.1211,
              longitude: 51.8766
            }
          ]
        }
      ]
    }
  ];
};

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('trajectory');
  const [orgStructureData, setOrgStructureData] = useState(getInitialOrgData);
  
  // Listen for changes to orgStructureData in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedData = localStorage.getItem('orgStructureData');
      if (savedData) {
        try {
          setOrgStructureData(JSON.parse(savedData));
        } catch (e) {
          console.error('Error parsing saved org structure data:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const tabs = [
    { id: 'trajectory', label: 'Trajectory Dashboard', component: TrajectoryDashboard },
    { id: 'macc', label: 'MACC Analysis', component: MACCAnalysis },
    { id: 'wedges', label: 'Abatement Wedges', component: AbatementWedges },
    { id: 'risks', label: 'Physical Climate Risks', component: () => <ClimateRisksMap orgStructureData={orgStructureData} /> }
  ];

  const renderTabContent = () => {
    const tab = tabs.find(tab => tab.id === activeTab);
    if (tab) {
      const TabComponent = tab.component;
      return <TabComponent />;
    }
    return null;
  };

  return (
    <div className="home-page">
      <h1 className="page-title">Main Dashboard</h1>
      
      <div className="tab-container">
        <div className="tabs-header">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default HomePage; 