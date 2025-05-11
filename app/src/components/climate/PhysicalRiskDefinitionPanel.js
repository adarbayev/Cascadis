import React from 'react';

// Moved from ClimateRiskPage.js for better modularity
const PHYSICAL_RISKS_OPTIONS = [
  { value: "Wildfire", label: "Wildfire", shortLabel: "WF" },
  { value: "CoastalFlood", label: "Coastal Flood", shortLabel: "CF" },
  { value: "FluvialFlood", label: "Fluvial Flood", shortLabel: "FF" }, // River flooding
  { value: "PluvialFlood", label: "Pluvial Flood", shortLabel: "PF" }, // Surface water flooding
  { value: "TropicalCyclone", label: "Tropical Cyclone", shortLabel: "TC" }, // Hurricanes, Typhoons
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

// No longer filtering, use all options
// const CLIMATE_SPECIFIC_RISKS = PHYSICAL_RISKS_OPTIONS.filter(risk => 
//     !["Earthquake", "Tsunami", "Volcano", "Landslide", "Subsidence"].includes(risk.value)
// );

const PhysicalRiskDefinitionPanel = ({
  timeHorizon,
  scenario,
  selectedRisks,
  onTimeHorizonChange,
  onScenarioChange,
  onRiskSelectionChange,
  onRunAnalysis,
  disabled // This prop is primarily for isLoading state from parent
}) => {
  const timeHorizons = [
    { value: "2040", label: "2040 - Near-term" },
    { value: "2060", label: "2060 - Mid-term" },
    { value: "2100", label: "2100 - Long-term" },
  ];

  const scenarios = [
    { value: "RCP4.5", label: "RCP 4.5 (Moderate Emissions)" },
    { value: "RCP8.5", label: "RCP 8.5 (High Emissions)" },
    // { value: "SSP1-2.6", label: "SSP1-2.6 (Low Emissions)" }, 
    // { value: "SSP5-8.5", label: "SSP5-8.5 (Very High Emissions)" },
  ];

  return (
    <div className="card p-6 bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Define Physical Risks</h2>

      {/* Time Horizon Selection - Dropdown */}
      <div className="space-y-2">
        <label htmlFor="timeHorizonSelect" className="text-md font-medium text-gray-600">1. Select Time Horizon:</label>
        <select
          id="timeHorizonSelect"
          name="timeHorizon"
          value={timeHorizon}
          onChange={onTimeHorizonChange}
          disabled={disabled}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
        >
          {timeHorizons.map(th => (
            <option key={th.value} value={th.value}>{th.label}</option>
          ))}
        </select>
      </div>

      {/* Scenario Selection - Dropdown */}
      <div className="space-y-2">
        <label htmlFor="scenarioSelect" className="text-md font-medium text-gray-600">2. Select Climate Scenario:</label>
        <select
          id="scenarioSelect"
          name="scenario"
          value={scenario}
          onChange={onScenarioChange}
          disabled={disabled}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
        >
          {scenarios.map(sc => (
            <option key={sc.value} value={sc.value}>{sc.label}</option>
          ))}
        </select>
      </div>

      {/* Risk Type Selection - Checkboxes */}
      <fieldset className="space-y-2">
        <legend className="text-md font-medium text-gray-600">3. Select Physical Risks:</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"> {/* Adjusted grid for better checkbox layout */}
          {PHYSICAL_RISKS_OPTIONS.map(risk => (
            <label key={risk.value} className="checkbox-label flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-md cursor-pointer"> {/* Added flex and spacing for better alignment */}
              <input
                type="checkbox"
                value={risk.value}
                checked={selectedRisks.includes(risk.value)}
                onChange={() => onRiskSelectionChange(risk.value)}
                className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" // Standard Tailwind classes
                disabled={disabled}
              />
              <span className="text-sm text-gray-700">{risk.label}</span> {/* Wrapped label text in a span for better control if needed */}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onRunAnalysis}
          className="run-analysis-button"
          disabled={disabled || selectedRisks.length === 0}
        >
          {disabled && selectedRisks.length > 0 ? 'Running...' : 'Run Analysis'}
        </button>
      </div>
    </div>
  );
};

export default PhysicalRiskDefinitionPanel; 