import React, { useState, useEffect, useMemo } from 'react';
import PhysicalRiskDefinitionPanel from '../components/climate/PhysicalRiskDefinitionPanel';
import SiteMap from '../components/climate/SiteMap';
import RiskAnalysisTabs from '../components/climate/RiskAnalysisTabs';
import { ORG_STRUCTURE } from '../demoData'; 
import { flattenNodesSite } from '../utils/arrayUtils'; 
import '../components/climate/ClimateRiskPage.css'; // Adjusted CSS import path

// This list is used to map selected risk *values* back to their full objects for the analysis data.
const FULL_PHYSICAL_RISKS_LIST = [
  { value: "Wildfire", label: "Wildfire", shortLabel: "WF" },
  { value: "CoastalFlood", label: "Coastal Flood", shortLabel: "CF" },
  { value: "FluvialFlood", label: "Fluvial Flood", shortLabel: "FF" },
  { value: "PluvialFlood", label: "Pluvial Flood", shortLabel: "PF" },
  { value: "TropicalCyclone", label: "Tropical Cyclone", shortLabel: "TC" },
  { value: "Drought", label: "Drought", shortLabel: "DR" },
  { value: "Heatwave", label: "Heatwave", shortLabel: "HW" },
  { value: "ExtremeCold", label: "Extreme Cold", shortLabel: "EC" },
  { value: "Landslide", label: "Landslide", shortLabel: "LS" },
  { value: "Hailstorm", label: "Hailstorm", shortLabel: "HS" },
  { value: "SeaLevelRise", label: "Sea Level Rise", shortLabel: "SLR" },
  { value: "WaterStress", label: "Water Stress", shortLabel: "WS" },
  { value: "PrecipitationChanges", label: "Precipitation Changes", shortLabel: "PC" },
  { value: "RisingTemperatures", label: "Rising Temperatures", shortLabel: "RT" },
];

const ClimateRisksPage = () => {
  const [sites, setSites] = useState([]);
  const [timeHorizon, setTimeHorizon] = useState("2040");
  const [scenario, setScenario] = useState("RCP4.5");
  const [selectedRisks, setSelectedRisks] = useState([]); // Stores array of risk *values*, e.g., ["Wildfire", "Flood"]
  const [currentAnalysisData, setCurrentAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('physical');

  useEffect(() => {
    const processedSites = flattenNodesSite(ORG_STRUCTURE);
    setSites(processedSites);
  }, []);

  const sitesForMap = useMemo(() => {
    return sites.filter(site => site.latitude && site.longitude);
  }, [sites]);

  const handleTimeHorizonChange = (event) => {
    setTimeHorizon(event.target.value);
    setCurrentAnalysisData(null); 
  };

  const handleScenarioChange = (event) => {
    setScenario(event.target.value);
    setCurrentAnalysisData(null); 
  };

  const handleRiskSelectionChange = (riskValue) => {
    setSelectedRisks(prev => {
      const isSelected = prev.includes(riskValue);
      const newSelection = isSelected 
        ? prev.filter(risk => risk !== riskValue) 
        : [...prev, riskValue];
      return newSelection;
    });
    setCurrentAnalysisData(null); 
  };
  
  const runMockAnalysis = () => {
    if (selectedRisks.length === 0) return;
    setIsLoading(true);
    setCurrentAnalysisData(null);

    setTimeout(() => {
      const analysisSitesData = {};
      sites.forEach(site => {
        analysisSitesData[site.id] = {};
        selectedRisks.forEach(riskValue => {
          const probIndex = Math.floor(Math.random() * 5);
          const impIndex = Math.floor(Math.random() * 5);
          analysisSitesData[site.id][riskValue] = {
            probability: (probIndex + 1) * 20,
            impact: (impIndex + 1) * 20,
            probIndex,
            impIndex,
          };
        });
      });

      // Map selected risk values to their full objects for storing in analysisData
      const fullSelectedRiskObjects = selectedRisks.map(riskValue => 
        FULL_PHYSICAL_RISKS_LIST.find(r => r.value === riskValue)
      ).filter(Boolean); // Filter out any undefined if a value somehow doesn't match

      setCurrentAnalysisData({
        selectedRisks: fullSelectedRiskObjects, // Now stores the array of risk objects
        timeHorizon,
        scenario,
        sites: analysisSitesData,
      });
      setIsLoading(false);
      setActiveMainTab('analysis'); // Switch to Risk Analysis tab
    }, 1000);
  };

  const renderPhysicalRisksContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <PhysicalRiskDefinitionPanel
          timeHorizon={timeHorizon}
          scenario={scenario}
          selectedRisks={selectedRisks} // Pass the array of selected risk values
          onTimeHorizonChange={handleTimeHorizonChange}
          onScenarioChange={handleScenarioChange}
          onRiskSelectionChange={handleRiskSelectionChange}
          onRunAnalysis={runMockAnalysis}
          disabled={isLoading}
        />
      </div>
      <div className="md:col-span-2 space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Site Locations</h2>
          {sitesForMap.length > 0 ? <SiteMap sites={sitesForMap} /> : <p>Loading site map or no sites with coordinates.</p>}
          {/* TODO: Add map legend here based on site types or risk levels */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Climate Risks Management</h1>

      <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'physical', label: 'Physical Risks' },
            { key: 'transition', label: 'Transition Risks' },
            { key: 'analysis', label: 'Risk Analysis' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeMainTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeMainTab === 'physical' && renderPhysicalRisksContent()}
      
      {activeMainTab === 'transition' && (
        <div className="card"><p className="text-gray-600">Transition Risks content will be developed here.</p></div>
      )}
      
      {activeMainTab === 'analysis' && (
        currentAnalysisData && !isLoading ? (
          <RiskAnalysisTabs analysisData={currentAnalysisData} sites={sites} />
        ) : isLoading && selectedRisks.length > 0 ? (
          <div className="card flex flex-col justify-center items-center p-10">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">Running Analysis...</p>
          </div>
        ) : selectedRisks.length === 0 && currentAnalysisData === null ? (
          <div className="card text-center p-10">
            <p className="text-gray-600">Please select risks and parameters in the 'Physical Risks' tab first, then click "Run Analysis".</p>
          </div>
        ) : (
          <div className="card text-center p-10">
            <p className="text-gray-600">Analysis results will be displayed here once generated from the 'Physical Risks' tab.</p>
          </div>
        )
      )}
    </div>
  );
};

export default ClimateRisksPage; 