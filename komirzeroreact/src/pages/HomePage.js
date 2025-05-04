import React, { useState } from 'react';
import './HomePage.css';
import TrajectoryDashboard from '../components/dashboard/TrajectoryDashboard';

// Placeholder components for other tabs - will implement these later
const MACCAnalysis = () => <div className="placeholder-content">MACC Analysis Content</div>;
const AbatementWedges = () => <div className="placeholder-content">Abatement Wedges Content</div>;
const ClimateRisks = () => <div className="placeholder-content">Physical Climate Risks Content</div>;

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('trajectory');

  const tabs = [
    { id: 'trajectory', label: 'Trajectory Dashboard', component: TrajectoryDashboard },
    { id: 'macc', label: 'MACC Analysis', component: MACCAnalysis },
    { id: 'wedges', label: 'Abatement Wedges', component: AbatementWedges },
    { id: 'risks', label: 'Physical Climate Risks', component: ClimateRisks }
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
      <h1 className="page-title">Dashboard</h1>
      
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