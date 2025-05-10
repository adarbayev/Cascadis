import React from 'react';

// Moved from ClimateRiskPage.js for better modularity
const PHYSICAL_RISKS_OPTIONS = [
  { value: "Wildfire", label: "Wildfire", shortLabel: "WF" },
  { value: "Flood", label: "Coastal/Riverine Flood", shortLabel: "FL" },
  { value: "Hurricane", label: "Hurricane/Typhoon", shortLabel: "HU" },
  { value: "Heatwave", label: "Extreme Heat", shortLabel: "EH" },
  { value: "WaterScarcity", label: "Water Scarcity", shortLabel: "WS" },
  { value: "SeaLevelRise", label: "Sea Level Rise", shortLabel: "SLR" },
  // { value: "Landslide", label: "Landslide", shortLabel: "LS" }, // Example: Keep if non-climate physical risks are separate
  // { value: "Subsidence", label: "Subsidence", shortLabel: "SUB" },
  // { value: "OtherClimate", label: "Other Chronic Climate", shortLabel: "OCC" }, // For general climate
  // { value: "Earthquake", label: "Earthquake", shortLabel: "EQ" }, // Non-climate specific
  // { value: "Tsunami", label: "Tsunami", shortLabel: "TSU" }, // Non-climate specific
  // { value: "Volcano", label: "Volcano", shortLabel: "VOL" } // Non-climate specific
];

// Filtered to only include primary climate-related physical risks for this panel
const CLIMATE_SPECIFIC_RISKS = PHYSICAL_RISKS_OPTIONS.filter(risk => 
    !["Earthquake", "Tsunami", "Volcano", "Landslide", "Subsidence"].includes(risk.value)
);

const PhysicalRiskDefinitionPanel = ({
  timeHorizon,
  scenario,
  selectedRisks,
  onTimeHorizonChange,
  onScenarioChange,
  onRiskSelectionChange,
  onRunAnalysis,
  disabled
}) => {
  const timeHorizons = [
    { value: "2040", label: "2040 (Mid-Century)" },
    { value: "2060", label: "2060 (Late-Century)" },
    { value: "2100", label: "2100 (End-Century)" },
  ];

  const scenarios = [
    { value: "RCP4.5", label: "RCP 4.5 (Moderate Emissions)" },
    { value: "RCP8.5", label: "RCP 8.5 (High Emissions)" },
    // { value: "SSP1-2.6", label: "SSP1-2.6 (Low Emissions)" }, // Could add more later
    // { value: "SSP5-8.5", label: "SSP5-8.5 (Very High Emissions)" },
  ];

  return (
    <div className="card p-6 bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Define Physical Risk Analysis Parameters</h2>

      {/* Time Horizon Selection */}
      <fieldset className="space-y-2">
        <legend className="text-md font-medium text-gray-600">1. Select Time Horizon:</legend>
        <div className="flex flex-wrap gap-4">
          {timeHorizons.map(th => (
            <label key={th.value} className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="timeHorizon"
                value={th.value}
                checked={timeHorizon === th.value}
                onChange={onTimeHorizonChange}
                className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">{th.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Scenario Selection */}
      <fieldset className="space-y-2">
        <legend className="text-md font-medium text-gray-600">2. Select Climate Scenario:</legend>
        <div className="flex flex-wrap gap-4">
          {scenarios.map(sc => (
            <label key={sc.value} className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name="scenario"
                value={sc.value}
                checked={scenario === sc.value}
                onChange={onScenarioChange}
                className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">{sc.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Risk Type Selection */}
      <fieldset className="space-y-2">
        <legend className="text-md font-medium text-gray-600">3. Select Physical Risks (Max 6):</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CLIMATE_SPECIFIC_RISKS.map(risk => (
            <label key={risk.value} className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                value={risk.value}
                checked={selectedRisks.includes(risk.value)}
                onChange={onRiskSelectionChange}
                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={disabled || (selectedRisks.length >= 6 && !selectedRisks.includes(risk.value))}
              />
              <span className="text-sm text-gray-700">{risk.label}</span>
            </label>
          ))}
        </div>
        {selectedRisks.length >= 6 && <p className="text-xs text-red-500 mt-1">Maximum of 6 risks selected.</p>}
      </fieldset>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onRunAnalysis}
          disabled={disabled || selectedRisks.length === 0}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          {disabled && selectedRisks.length > 0 ? 'Running...' : 'Run Analysis'}
        </button>
      </div>
    </div>
  );
};

export default PhysicalRiskDefinitionPanel; 