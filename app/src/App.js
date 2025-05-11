import React, { useState } from 'react';
import './App.css';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import OrganisationPage from './pages/OrganisationPage';
import GHGFrameworkPage from './pages/GHGFrameworkPage';
import DataCollectionPage from './pages/DataCollectionPage';
import ReportingPage from './pages/ReportingPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ScenarioAnalysisPage from './pages/ScenarioAnalysisPage';
import ClimateRisksPage from './pages/ClimateRisksPage';

function App() {
  const [activeSection, setActiveSection] = useState('home');
  // Shared emissions data state: { [yearId_nodeId]: { ...indicatorValues } }
  const [sessionEmissions, setSessionEmissions] = useState({});

  // Function to update emissions for a node/year
  const updateSessionEmissions = (yearId, nodeId, values) => {
    setSessionEmissions(prev => ({
      ...prev,
      [`${yearId}_${nodeId}`]: values
    }));
  };

  // Function to render the active content based on the selected section
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HomePage />;
      case 'organisation':
        return <OrganisationPage />;
      case 'ghg-framework':
        return <GHGFrameworkPage />;
      case 'data-collection':
        return <DataCollectionPage
          sessionEmissions={sessionEmissions}
          updateSessionEmissions={updateSessionEmissions}
        />;
      case 'analysis':
        return <ScenarioAnalysisPage
          sessionEmissions={sessionEmissions}
        />;
      case 'climate-risks':
        return <ClimateRisksPage />;
      case 'reporting':
        return <ReportingPage />;
      case 'settings':
        return <SettingsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="app-container">
      <Navigation activeSection={activeSection} setActiveSection={setActiveSection} />
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App; 