import React, { useState, useMemo } from 'react';

// Helper to get color based on risk level (customize as needed)
const getRiskLevelClass = (probIndex, impIndex) => {
  // const score = (probIndex + 1) * (impIndex + 1); // Simple score, can be more nuanced // Unused variable
  if (impIndex >= 3 && probIndex >=3) return { text: 'Very High', bg: 'bg-red-600', textIntensity: 'text-white'}; // Dark red for very high
  if (impIndex >=2 && probIndex >=2) return { text: 'High', bg: 'bg-red-500', textIntensity: 'text-white' }; // Red
  if ((impIndex >=2 && probIndex >=1) || (impIndex >=1 && probIndex >=2)) return { text: 'Medium-High', bg: 'bg-orange-500', textIntensity: 'text-white' }; // Orange
  if ((impIndex >=2 && probIndex >=0) || (impIndex >=0 && probIndex >=2) || (impIndex === 1 && probIndex ===1)) return { text: 'Medium', bg: 'bg-yellow-400', textIntensity: 'text-gray-800' }; // Yellow
  if ((impIndex >=1 && probIndex >=0) || (impIndex >=0 && probIndex >=1)) return { text: 'Med-Low', bg: 'bg-green-400', textIntensity: 'text-gray-800' }; // Light Green
  return { text: 'Low', bg: 'bg-green-500', textIntensity: 'text-white' }; // Green
};

const quadrantLabels = {
  impact: ['Very Low', 'Low', 'Medium', 'High', 'Very High'], // y-axis (0 to 4)
  probability: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] // x-axis (0 to 4)
};

const RiskQuadrant = ({ analysisData, sites: allSites }) => {
  const [selectedScope, setSelectedScope] = useState('company-wide');

  const siteOptions = useMemo(() => {
    if (!allSites || !analysisData || !analysisData.sites) return [];
    return allSites
      .filter(site => analysisData.sites.hasOwnProperty(site.id)) // Only sites present in analysis
      .map(site => ({ value: site.id, label: site.name }));
  }, [allSites, analysisData]);

  const bubbles = useMemo(() => {
    if (!analysisData || !analysisData.selectedRisks || !analysisData.sites) return [];
    const { selectedRisks, sites: analysisSitesData } = analysisData;

    let processedRisks = [];

    if (selectedScope === 'company-wide') {
      processedRisks = selectedRisks.map(risk => {
        let totalProbIndex = 0;
        let totalImpIndex = 0;
        let count = 0;
        Object.values(analysisSitesData).forEach(siteData => {
          if (siteData[risk.value]) {
            totalProbIndex += siteData[risk.value].probIndex;
            totalImpIndex += siteData[risk.value].impIndex;
            count++;
          }
        });
        if (count === 0) return null;
        const avgProbIndex = Math.round(totalProbIndex / count);
        const avgImpIndex = Math.round(totalImpIndex / count);
        return {
          id: risk.value + '-avg',
          shortLabel: risk.shortLabel,
          probIndex: avgProbIndex,
          impIndex: avgImpIndex,
        };
      }).filter(b => b !== null);
    } else {
      const siteData = analysisSitesData[selectedScope];
      if (!siteData) return [];
      processedRisks = selectedRisks.map(risk => {
        if (!siteData[risk.value]) return null;
        const { probIndex, impIndex } = siteData[risk.value];
        return {
          id: risk.value + '-' + selectedScope,
          shortLabel: risk.shortLabel,
          probIndex,
          impIndex,
        };
      }).filter(b => b !== null);
    }

    const groupedByCell = processedRisks.reduce((acc, risk) => {
      const key = `${risk.probIndex}-${risk.impIndex}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(risk);
      return acc;
    }, {});

    const finalBubbles = Object.values(groupedByCell).flatMap(groupOfRisksInCell =>
      groupOfRisksInCell.map((risk, indexInGroup) => {
        const offset = indexInGroup * 4; // 4px offset for each bubble in the stack
        return {
          ...risk,
          id: `${risk.id}-stack-${indexInGroup}`, // Ensure unique ID for React key
          style: {
            left: `${(risk.probIndex / 5) * 100 + 10}%`,
            bottom: `${(risk.impIndex / 5) * 100 + 10}%`,
            transform: `translate(calc(-50% + ${offset}px), calc(50% - ${offset}px))`,
            zIndex: 10 + indexInGroup, // Higher indexInGroup means more offset and higher zIndex
          }
        };
      })
    );
    return finalBubbles;

  }, [analysisData, selectedScope]);

  if (!analysisData) {
    return <p className="text-gray-600 p-4">No analysis data available. Please run an analysis first.</p>;
  }

  return (
    <div className="risk-quadrant-view p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Risk Quadrant</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="quadrantScope" className="text-sm font-medium text-gray-600">View quadrant for:</label>
          <select 
            id="quadrantScope"
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="form-select block w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value="company-wide">Company-Wide (Average)</option>
            {siteOptions.map(site => (
              <option key={site.value} value={site.value}>{site.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main flex container for quadrant and legend */}
      <div className="flex flex-row space-x-6"> 
        {/* Quadrant and its axes group */}
        <div className="flex">
          {/* Y-axis labels (Impact/Severity) */}
          <div className="flex flex-col justify-center items-center pr-2" style={{ height: '400px' }}> 
            <span 
              className="transform -rotate-90 whitespace-nowrap text-sm font-medium text-gray-500"
              style={{ transformOrigin: 'center' }} 
            >
              Impact / Severity
            </span>
          </div>

          {/* Quadrant grid and X-axis labels group */}
          <div className="flex flex-col items-center"> 
            <div className="grid grid-cols-5 grid-rows-5 border border-gray-300 relative" style={{ width: '400px', height: '400px' }}>
              {/* Quadrant Cells & Bubbles */}
              {quadrantLabels.impact.slice().reverse().map((impLabel, impIdx) => (
                quadrantLabels.probability.map((probLabel, probIdx) => (
                  <div 
                    key={`${impIdx}-${probIdx}`}
                    className={`border border-gray-200 flex items-center justify-center ${getRiskLevelClass(probIdx, 4 - impIdx).bg}`}
                    title={`${quadrantLabels.impact[4-impIdx]} Impact, ${quadrantLabels.probability[probIdx]} Probability`}
                  >
                    {/* Cell content can be empty, or show small score if needed */}
                  </div>
                ))
              ))}
              {/* Bubbles */}
              {bubbles.map(bubble => (
                <div 
                  key={bubble.id}
                  className="absolute w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white quadrant-bubble"
                  style={bubble.style}
                  title={`Risk: ${bubble.shortLabel} (P:${bubble.probIndex}, I:${bubble.impIndex})`}
                >
                  {bubble.shortLabel}
                </div>
              ))}
            </div>
            {/* X-axis labels (Probability/Likelihood) */}
            <div className="grid grid-cols-5 mt-1" style={{ width: '400px' }}>
              {quadrantLabels.probability.map(label => (
                <div key={label} className="text-center text-xs text-gray-500">{label}</div>
              ))}
            </div>
            <div className="text-center text-sm font-medium text-gray-500 mt-2" style={{ width: '400px' }}>
                Probability / Likelihood
            </div>
          </div>
        </div>

        {/* Risk Initials Legend (Moved to the right) */}
        <div className="flex-shrink-0 pl-6 pt-8" style={{ minWidth: '200px' }}> {/* Added pt-8 for vertical alignment with quadrant title */}
          <h4 className="text-md font-semibold text-gray-700 mb-2">Risk Initials Legend:</h4>
          <div className="flex flex-col space-y-1 text-sm text-gray-600">
            {analysisData.selectedRisks.map(risk => (
              <span key={risk.value}><strong>{risk.shortLabel}:</strong> {risk.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskQuadrant; 