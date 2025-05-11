import React from 'react';

// Match this with the one in RiskQuadrant or make it a shared util
const getRiskLevelDisplay = (probIndex, impIndex) => {
  // Simplified mapping for text and color - align with quadrant's visual style
  // const score = (probIndex + 1) * (impIndex + 1); // Example score, can be different // Unused variable
  // Colors are Tailwind CSS background classes
  if (impIndex >= 3 && probIndex >=3) return { text: 'Very High', color: 'bg-red-600 text-white', textColor: 'text-white'};
  if (impIndex >=2 && probIndex >=2) return { text: 'High', color: 'bg-red-500 text-white', textColor: 'text-white' };
  if ((impIndex >=2 && probIndex >=1) || (impIndex >=1 && probIndex >=2)) return { text: 'Medium-High', color: 'bg-orange-500 text-white', textColor: 'text-white' };
  if ((impIndex >=2 && probIndex >=0) || (impIndex >=0 && probIndex >=2) || (impIndex === 1 && probIndex ===1)) return { text: 'Medium', color: 'bg-yellow-400 text-gray-800', textColor: 'text-gray-800' };
  if ((impIndex >=1 && probIndex >=0) || (impIndex >=0 && probIndex >=1)) return { text: 'Med-Low', color: 'bg-green-400 text-gray-800', textColor: 'text-gray-800' };
  return { text: 'Low', color: 'bg-green-500 text-white', textColor: 'text-white' }; 
};

const RiskMatrixTable = ({ analysisData, sites: allSites }) => {
  if (!analysisData || !analysisData.selectedRisks || !analysisData.sites) {
    return <p className="text-gray-600 p-4">No analysis data available or data is malformed.</p>;
  }

  const { selectedRisks, sites: analysisSitesData } = analysisData;

  // Filter sites to only those that are part of the current analysis
  const sitesInAnalysis = allSites.filter(site => analysisSitesData.hasOwnProperty(site.id));

  if (sitesInAnalysis.length === 0) {
    return <p className="text-gray-600 p-4">No sites were included in this analysis run.</p>;
  }
  if (selectedRisks.length === 0) {
    return <p className="text-gray-600 p-4">No risks were selected for this analysis.</p>;
  }

  return (
    <div className="risk-matrix-table-view p-4 bg-white rounded-lg shadow overflow-x-auto">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Detailed Risk Matrix (Site vs. Risk)</h3>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-300 risk-matrix-table">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            {selectedRisks.map(risk => (
              <th key={risk.value} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {risk.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sitesInAnalysis.map(site => (
            <tr key={site.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.name}</td>
              {selectedRisks.map(risk => {
                const siteRiskData = analysisSitesData[site.id]?.[risk.value];
                if (siteRiskData) {
                  const level = getRiskLevelDisplay(siteRiskData.probIndex, siteRiskData.impIndex);
                  return (
                    <td key={risk.value} className={`px-6 py-4 whitespace-nowrap text-sm ${level.color}`}>
                      {level.text}
                    </td>
                  );
                } else {
                  return <td key={risk.value} className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">N/A</td>;
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RiskMatrixTable; 