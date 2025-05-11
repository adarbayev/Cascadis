import React, { useState } from 'react';
import './PageStyles.css';
import IndicatorTable from '../components/IndicatorTable';
import EmissionFactorTable from '../components/EmissionFactorTable';
import ConversionFactorTable from '../components/ConversionFactorTable';

const GHGFrameworkPage = () => {
  const [activeTab, setActiveTab] = useState('indicators');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'indicators':
        return <IndicatorTable />;
      case 'conversionFactors':
        return <ConversionFactorTable />;
      case 'emissionFactors':
        return <EmissionFactorTable />;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">GHG Framework</h1>
      
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'indicators' ? 'active' : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          Indicators
        </button>
        <button 
          className={`tab-button ${activeTab === 'conversionFactors' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversionFactors')}
        >
          Conversion Factors
        </button>
        <button 
          className={`tab-button ${activeTab === 'emissionFactors' ? 'active' : ''}`}
          onClick={() => setActiveTab('emissionFactors')}
        >
          Emission Factors
        </button>
      </div>
      
      <div className="page-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default GHGFrameworkPage; 