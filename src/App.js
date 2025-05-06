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
import OrgSetupPage from './pages/OrgSetupPage';

function App() {
  const [activeSection, setActiveSection] = useState('home');

  // Function to render the active content based on the selected section
  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return <HomePage />;
      case 'organisation':
        return <OrganisationPage />;
      case 'org-setup':
        return <OrgSetupPage />;
      case 'ghg-framework':
        return <GHGFrameworkPage />;
      case 'data-collection':
        return <DataCollectionPage />;
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