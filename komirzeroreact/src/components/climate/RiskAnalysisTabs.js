import React, { useState } from 'react';
import RiskQuadrant from './RiskQuadrant';
import RiskMatrixTable from './RiskMatrixTable';

// Define keys for tabs for clarity
const QUADRANT_VIEW = 'quadrant';
const MATRIX_VIEW = 'matrix';

// Simple Download Icon SVG
const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const RiskAnalysisTabs = ({ analysisData, sites }) => {
  const [activeSubTab, setActiveSubTab] = useState(QUADRANT_VIEW);
  const [showRiskAnalysisExport, setShowRiskAnalysisExport] = useState(false);

  if (!analysisData) {
    // This case is handled by ClimateRisksPage before rendering these tabs,
    // but as a safeguard or if used elsewhere:
    return (
      <div className="card text-center p-10">
        <p className="text-gray-600">No analysis data available. Please run an analysis first from the 'Physical Risks' tab.</p>
      </div>
    );
  }

  const { timeHorizon, scenario, selectedRisks, sites: analysisSitesData } = analysisData;
  const analyzedSitesCount = analysisSitesData ? Object.keys(analysisSitesData).length : 0;

  const tableCellLegendItems = [
    { label: 'Low', color: 'bg-green-500' },
    { label: 'Med-Low', color: 'bg-green-400' },
    { label: 'Medium', color: 'bg-yellow-400' },
    { label: 'Med-High', color: 'bg-orange-500' },
    { label: 'High', color: 'bg-red-500' },
  ];

  return (
    <div className="physical-risk-analysis-output space-y-6">
      {/* Analysis Summary Bar */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        Analysis for: <strong>Time Horizon:</strong> {timeHorizon}, <strong>Scenario:</strong> {scenario}, Assessing <strong>{selectedRisks.length} risk(s)</strong> across <strong>{analyzedSitesCount} locations</strong>.
      </div>

      {/* Sub-navigation for tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Risk Analysis Tabs">
          <button
            onClick={() => setActiveSubTab(QUADRANT_VIEW)}
            className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === QUADRANT_VIEW
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Risk Quadrant View
          </button>
          <button
            onClick={() => setActiveSubTab(MATRIX_VIEW)}
            className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeSubTab === MATRIX_VIEW
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed Risk Matrix
          </button>
        </nav>
      </div>

      {/* Table/Cell Legend (Common for both views or shown contextually) */}
      {activeSubTab === MATRIX_VIEW && (
          <div className="my-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Table/Cell Legend:</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {tableCellLegendItems.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className={`w-4 h-4 rounded-sm mr-1.5 ${item.color}`}></span>
                        <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-4">
        {activeSubTab === QUADRANT_VIEW && <RiskQuadrant analysisData={analysisData} sites={sites} />}
        {activeSubTab === MATRIX_VIEW && <RiskMatrixTable analysisData={analysisData} sites={sites} />}
      </div>

      {/* Disclaimer & Export Button Area */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500 mb-4">Disclaimer: This is a mock analysis for demonstration purposes.</p>
        <div className="relative inline-block text-left">
          <button 
            type="button"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
            onClick={() => setShowRiskAnalysisExport(!showRiskAnalysisExport)}
          >
            <DownloadIcon />
            Export Analysis
          </button>
          {showRiskAnalysisExport && (
            <div 
              className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
            >
              <div className="py-1" role="none">
                <button
                  onClick={() => {
                    console.log('Placeholder: Export Risk Quadrant/Matrix as JPEG');
                    alert('Placeholder: Export Risk Quadrant/Matrix as JPEG functionality to be implemented.');
                    setShowRiskAnalysisExport(false);
                  }}
                  className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as JPEG (Placeholder)
                </button>
                <button
                  onClick={() => {
                    console.log('Placeholder: Export Risk Quadrant/Matrix as SVG');
                    alert('Placeholder: Export Risk Quadrant/Matrix as SVG functionality to be implemented.');
                    setShowRiskAnalysisExport(false);
                  }}
                  className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  role="menuitem"
                >
                  Export as SVG (Placeholder)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisTabs; 