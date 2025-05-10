import React, { useState, useEffect, useMemo } from 'react';
import PhysicalRiskDefinitionPanel from './PhysicalRiskDefinitionPanel';
import SiteMap from './SiteMap'; // Uncommented and to be used
// import RiskAnalysisTabs from './RiskAnalysisTabs'; // To be created
import { ORG_STRUCTURE } from '../../demoData'; // Assuming this is the correct path
import { flattenNodesSite } from '../../utils/arrayUtils'; // Assuming this is the correct path
import './ClimateRiskPage.css';

// Placeholder for physical risk options if not imported from panel or a constants file
const PHYSICAL_RISKS_OPTIONS = [
  { value: "Wildfire", label: "Wildfire", shortLabel: "WF" },
  { value: "Flood", label: "Coastal/Riverine Flood", shortLabel: "FL" },
  { value: "Hurricane", label: "Hurricane/Typhoon", shortLabel: "HU" },
  { value: "Heatwave", label: "Extreme Heat", shortLabel: "EH" },
  { value: "WaterScarcity", label: "Water Scarcity", shortLabel: "WS" },
  { value: "SeaLevelRise", label: "Sea Level Rise", shortLabel: "SLR" },
  { value: "Landslide", label: "Landslide", shortLabel: "LS" },
  { value: "Subsidence", label: "Subsidence", shortLabel: "SUB" },
  { value: "OtherClimate", label: "Other Chronic Climate", shortLabel: "OCC" },
  { value: "Earthquake", label: "Earthquake", shortLabel: "EQ" },
  { value: "Tsunami", label: "Tsunami", shortLabel: "TSU" },
  { value: "Volcano", label: "Volcano", shortLabel: "VOL" }
];


const ClimateRiskPage = () => {
  const [sites, setSites] = useState([]);
  const [timeHorizon, setTimeHorizon] = useState("2040");
  const [scenario, setScenario] = useState("RCP4.5");
  const [selectedRisks, setSelectedRisks] = useState([]);
  const [currentAnalysisData, setCurrentAnalysisData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('physical'); // For main page tabs later

  useEffect(() => {
    const processedSites = flattenNodesSite(ORG_STRUCTURE);
    // For the map, ensure sites have latitude and longitude.
    // The panel itself doesn't need to filter, but SiteMap component will handle sites without lat/lon.
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

  const handleRiskSelectionChange = (event) => {
    const { value, checked } = event.target;
    setSelectedRisks(prev => {
      const newSelection = checked ? [...prev, value] : prev.filter(risk => risk !== value);
      if (newSelection.length > 6 && checked) { // Only prevent adding more than 6
        // Optionally, provide user feedback here (e.g., a toast notification)
        return prev;
      }
      return newSelection;
    });
    setCurrentAnalysisData(null); 
  };
  
  const runMockAnalysis = () => {
    setIsLoading(true);
    setCurrentAnalysisData(null);

    setTimeout(() => {
      const analysisSitesData = {};
      // Use all sites for analysis, not just those on map
      sites.forEach(site => {
        analysisSitesData[site.id] = {};
        selectedRisks.forEach(riskValue => {
          const probIndex = Math.floor(Math.random() * 5); 
          const impIndex = Math.floor(Math.random() * 5);  
          const probability = (probIndex + 1) * 20; 
          const impact = (impIndex + 1) * 20;       
          analysisSitesData[site.id][riskValue] = {
            probability,
            impact,
            probIndex,
            impIndex,
          };
        });
      });

      const riskLabels = selectedRisks.map(sr => PHYSICAL_RISKS_OPTIONS.find(r => r.value === sr)).filter(Boolean);

      setCurrentAnalysisData({
        selectedRisks: riskLabels,
        timeHorizon,
        scenario,
        sites: analysisSitesData,
      });
      setIsLoading(false);
    }, 1000); 
  };

  // TODO: Define content for other main tabs: Transition Risks, Risk Analysis
  const renderContent = () => {
    // This structure assumes ClimateRiskPage is for the "Physical Risks" tab content from the screenshot
    // If ClimateRiskPage IS the "Climate Risks Management" page, this needs adjustment for main tabs
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Definition Panel */}
        <div className="md:col-span-1 space-y-6">
          <PhysicalRiskDefinitionPanel
            timeHorizon={timeHorizon}
            scenario={scenario}
            selectedRisks={selectedRisks}
            onTimeHorizonChange={handleTimeHorizonChange}
            onScenarioChange={handleScenarioChange}
            onRiskSelectionChange={handleRiskSelectionChange}
            onRunAnalysis={runMockAnalysis}
            disabled={isLoading}
          />
        </div>

        {/* Right Column: Map and Legend (Legend to be added) */}
        <div className="md:col-span-2 space-y-6">
          <div className="card"> {/* Card for the map */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Site Locations</h2>
            {sitesForMap.length > 0 ? <SiteMap sites={sitesForMap} /> : <p>No sites with coordinates to display on map.</p>}
            {/* TODO: Add map legend here */}
          </div>
        </div>
      </div>
    );
  };

  return (
    // Assuming this component itself is the "Climate Risks Management" page content
    // and the tabs are internal to it, or it's one of the main tabs.
    // For now, focusing on the "Physical Risks" content as per screenshot.
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Title - This might be managed by a higher-level layout component in your app */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Climate Risks Management</h1>

      {/* Tabs for "Physical Risks", "Transition Risks", "Risk Analysis" - Basic structure */}
      <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('physical')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'physical'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Physical Risks
          </button>
          <button
            onClick={() => setActiveTab('transition')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transition'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transition Risks
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Analysis
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'physical' && renderContent()}
      {activeTab === 'transition' && <div className="card"><p>Transition Risks content will go here.</p></div>}
      {activeTab === 'analysis' && (
        currentAnalysisData && !isLoading ? (
          <div className="card">
             {/* <RiskAnalysisTabs analysisData={currentAnalysisData} sites={sites} /> */}
             <h2 className="text-xl font-semibold mb-4">Analysis Results (Raw Data)</h2>
             <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
               {JSON.stringify(currentAnalysisData, null, 2)}
             </pre>
          </div>
        ) : isLoading && selectedRisks.length > 0 ? (
          <div className="flex justify-center items-center p-4 card">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
            <p className="text-lg font-semibold">Running Analysis...</p>
          </div>
        ) : selectedRisks.length > 0 && !isLoading ? (
           <div className="card text-center p-6">
              <p className="text-gray-600">Press "Run Analysis" in the 'Physical Risks' tab to view detailed analysis here.</p>
           </div>
        ) : (
          <div className="card text-center p-6">
            <p className="text-gray-600">Select parameters and run analysis in the 'Physical Risks' tab to see results.</p>
          </div>
        )
      )}
      
      {/* This is the old results display, now integrated into 'analysis' tab or handled by RiskAnalysisTabs later */}
      {/* {isLoading && activeTab !== 'analysis' && ( ... )} */}
      {/* {!currentAnalysisData && !isLoading && selectedRisks.length > 0 && activeTab === 'physical' && ( ... )} */}
    </div>
  );
};

export default ClimateRiskPage; 