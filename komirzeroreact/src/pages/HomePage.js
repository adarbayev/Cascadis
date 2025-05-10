import React, { useState, useMemo, useEffect } from 'react';
import './HomePage.css';
import { INVENTORY_YEARS, ORG_STRUCTURE, NODE_INDICATOR_MAPPING, QUESTIONNAIRE_DATA, INDICATORS, CONVERSION_FACTORS, EMISSION_FACTORS } from '../demoData';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import SiteEmissionsMap from '../components/dashboard/SiteEmissionsMap';
import ESGNewsPanel from '../components/dashboard/ESGNewsPanel';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- Helper functions (similar to ScenarioAnalysisPage) ---
const SCOPE1_NAMES = ['Diesel', 'Petrol', 'Coal', 'Natural gas'];
const SCOPE2_NAMES = ['Electricity', 'District heat', 'Steam', 'Cooling'];

const flattenNodes = (nodes, arr = []) => {
  nodes.forEach(node => {
    if (node.type === 'Site') arr.push(node);
    if (node.children) flattenNodes(node.children, arr);
  });
  return arr;
};

const indicatorById = (id) => INDICATORS.find(i => i.id === id);
const getConversionFactorById = (id) => CONVERSION_FACTORS.find(cf => cf.id === id);
const getEmissionFactorById = (id) => EMISSION_FACTORS.find(ef => ef.id === id);

function calcGHG(indicator, value, unit) {
  if (!value || isNaN(value)) return 0;
  let conv = 1;
  if (indicator.conversion_factor_id) {
    const cf = getConversionFactorById(indicator.conversion_factor_id);
    if (cf && cf.source_unit === unit) conv = cf.conversion_factor;
  }
  let ef = 0;
  if (indicator.emission_factor_id) {
    const efObj = getEmissionFactorById(indicator.emission_factor_id);
    if (efObj) ef = efObj.value;
  }
  const multiplyNames = ['Electricity', 'District heat', 'Steam', 'Cooling'];
  let adjustedValue = parseFloat(value);
  if (multiplyNames.includes(indicator.name)) {
    adjustedValue = adjustedValue * 2;
  }
  return parseFloat((adjustedValue * conv * ef).toFixed(2));
}

// Simplified sumEmissions for the dashboard - assumes sessionEmissions is not used here directly
// Or, if HomePage needs to reflect live changes from DataCollection, sessionEmissions would need to be passed from App.js
function sumEmissionsForBaseline(yearId, currentQuestionnaireData = QUESTIONNAIRE_DATA) {
  const sites = flattenNodes(ORG_STRUCTURE);
  let scope1Total = 0, scope2Total = 0;
  let scope1Breakdown = {};
  let scope2Breakdown = {};
  let emissionsBySite = {};

  for (const site of sites) {
    const key = `${yearId}_${site.id}`;
    const data = currentQuestionnaireData[key] || {};
    let siteTotalGHG = 0;

    for (const indId of NODE_INDICATOR_MAPPING[site.id] || []) {
      const indicator = indicatorById(indId);
      if (!indicator) continue;
      const valObj = data[indId];
      if (!valObj) continue;
      const ghg = calcGHG(indicator, valObj.value, valObj.unit) / 1000; // to tCO2eq
      siteTotalGHG += ghg;

      if (SCOPE1_NAMES.includes(indicator.name)) {
        scope1Total += ghg;
        scope1Breakdown[indicator.name] = (scope1Breakdown[indicator.name] || 0) + ghg;
      }
      if (SCOPE2_NAMES.includes(indicator.name)) {
        scope2Total += ghg;
        scope2Breakdown[indicator.name] = (scope2Breakdown[indicator.name] || 0) + ghg;
      }
    }
    emissionsBySite[site.id] = siteTotalGHG;
  }
  return { 
    scope1Total, 
    scope2Total, 
    totalEmissions: scope1Total + scope2Total,
    scope1Breakdown, 
    scope2Breakdown,
    emissionsBySite
  };
}

const KeyMetricCard = ({ title, value, unit, className = '' }) => (
  <div className={`p-4 rounded-lg shadow-md text-white ${className} h-full flex flex-col justify-center items-center`}>
    <h3 className="text-sm font-semibold text-gray-200 mb-1 text-center">{title}</h3>
    <p className="text-2xl sm:text-3xl font-bold text-center">{value} <span className="text-base sm:text-lg">{unit}</span></p>
  </div>
);

const EmissionsPieChart = ({ scope1, scope2 }) => {
  const data = { 
    labels: ['Scope 1', 'Scope 2'], 
    datasets: [{ 
      label: 'Emissions (tCO2eq)', 
      data: [scope1.toFixed(2), scope2.toFixed(2)], 
      backgroundColor: ['#f97316', '#0ea5e9'], // Orange for Scope 1, Sky Blue for Scope 2
      borderColor: ['#f97316', '#0ea5e9'], 
      borderWidth: 1 
    }] 
  };
  const options = { 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { position: 'bottom', labels: { color: '#4A5568', boxWidth: 15, padding: 10, font: {size: 10} } }, 
      title: { display: true, text: 'Emissions by Scope', color: '#2D3748', font: { size: 14 } }
    }
  };
  return <div className="bg-white p-3 rounded-lg shadow-lg h-full w-full flex flex-col"><div className="flex-grow relative"><Pie data={data} options={options} /></div></div>;
};

const EmissionsBarChart = ({ title, breakdownData, color }) => {
  const labels = Object.keys(breakdownData);
  const values = Object.values(breakdownData).map(v => v.toFixed(2));
  // Determine color based on title, fallback to props or default
  let chartColor = color;
  if (title === 'Scope 1 Breakdown') {
    chartColor = '#f97316'; // Orange
  } else if (title === 'Scope 2 Breakdown') {
    chartColor = '#0ea5e9'; // Sky Blue
  }

  const data = { 
    labels: labels, 
    datasets: [{ 
      label: 'Emissions (tCO2eq)', 
      data: values, 
      backgroundColor: chartColor || 'rgba(75, 192, 192, 0.8)', 
      borderColor: chartColor ? chartColor.replace('0.8', '1') : 'rgba(75, 192, 192, 1)', 
      borderWidth: 1 
    }] 
  };
  const options = { 
    indexAxis: 'y', 
    responsive: true, 
    maintainAspectRatio: false, 
    plugins: { 
      legend: { display: false }, 
      title: { display: true, text: title, color: '#2D3748', font: {size: 16} } 
    }, 
    scales: { 
      x: { beginAtZero: true, title: { display: true, text: 'tCO2eq', color: '#4A5568' }, ticks: { color: '#4A5568', font: {size: 10} }, grid: { color: '#E2E8F0' } }, 
      y: { ticks: { autoSkip: false, color: '#4A5568', font: {size: 10} }, grid: { display: false } } 
    } 
  };
  return <div className="bg-white p-3 rounded-lg shadow-lg h-full w-full flex flex-col"><div className="flex-grow relative"><Bar data={data} options={options} /></div></div>;
};


const HomePage = () => {
  // For now, let's assume baseline year is the first in INVENTORY_YEARS
  // This could be made selectable later if needed
  const [selectedBaselineYearId, setSelectedBaselineYearId] = useState(INVENTORY_YEARS[0].id);

  // Potentially load QUESTIONNAIRE_DATA from localStorage if it can be modified elsewhere
  // For simplicity, using directly imported for now.
  const [questionnaireData, setQuestionnaireData] = useState(QUESTIONNAIRE_DATA);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Re-calculate if year or data changes
  const emissionsData = useMemo(() => {
    return sumEmissionsForBaseline(selectedBaselineYearId, questionnaireData);
  }, [selectedBaselineYearId, questionnaireData]);

  const handleSaveLayout = () => {
    console.log("Save Layout button clicked - Placeholder action. Actual saving requires a backend and layout persistence logic.");
    setIsEditMode(false);
    alert("Layout saving is a placeholder. Actual functionality requires a library like React Grid Layout.");
  };

  const handleCancelEditing = () => {
    console.log("Cancel Editing button clicked - Placeholder action. No changes were actually made.");
    setIsEditMode(false);
  };

  // EditableTile now just adds edit mode border and icons, layout classes are applied directly to it from parent.
  const EditableTile = ({ children, className = '' }) => (
    <div className={`relative h-full ${className} ${isEditMode ? 'dashboard-item-editable' : ''}`}>
      {children}
      {isEditMode && <div className="edit-overlay-icons"></div>}
    </div>
  );

  // Power BI style layout
  return (
    <div className="home-page-modern p-5 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Main Emissions Dashboard
        </h1>
      </div>

      {/* Two-column layout: left = dashboard, right = ESG news */}
      <div className="dashboard-main-row flex flex-row gap-8 items-start">
        {/* Left: Dashboard tiles */}
        <div className="dashboard-left-col flex flex-col gap-4 flex-1 min-w-0">
          {/* KPIs grouped */}
          <div className="flex flex-row gap-4 ml-2">
            <div className="kpi-card-modern">
              <KeyMetricCard title="Total Scope 1" value={emissionsData.scope1Total.toFixed(0)} unit="tCO2eq" className="bg-orange-500 hover:bg-orange-600" />
            </div>
            <div className="kpi-card-modern">
              <KeyMetricCard title="Total Scope 2" value={emissionsData.scope2Total.toFixed(0)} unit="tCO2eq" className="bg-sky-500 hover:bg-sky-600" />
            </div>
            <div className="kpi-card-modern">
              <KeyMetricCard title="Total Baseline" value={emissionsData.totalEmissions.toFixed(0)} unit="tCO2eq" className="bg-blue-600 hover:bg-blue-700"/>
            </div>
          </div>

          {/* Pie chart and Map in the same row, pie chart is a square and fills row height */}
          <div className="pie-map-row mb-4">
            <div className="piechart-square-container">
              <EmissionsPieChart scope1={emissionsData.scope1Total} scope2={emissionsData.scope2Total} />
            </div>
            <div className="site-emissions-map-modern flex-1 flex justify-center">
              <div className="map-modern-container">
                {ORG_STRUCTURE && emissionsData.emissionsBySite && (
                  <SiteEmissionsMap 
                    orgStructureData={ORG_STRUCTURE} 
                    emissionsBySite={emissionsData.emissionsBySite} 
                  />
                )}
              </div>
            </div>
          </div>

          {/* Scope 1 and Scope 2 breakdowns side by side */}
          <div className="flex flex-row gap-6 justify-center breakdowns-row-modern">
            <div className="breakdown-modern">
              {Object.keys(emissionsData.scope1Breakdown).length > 0 ? (
                <EmissionsBarChart title="Scope 1 Breakdown" breakdownData={emissionsData.scope1Breakdown} color="rgba(255, 99, 132, 0.8)" />
              ) : (
                <div className="p-4 bg-white rounded-lg shadow-lg text-gray-500 text-center h-full flex items-center justify-center">No Scope 1 data.</div>
              )}
            </div>
            <div className="breakdown-modern">
              {Object.keys(emissionsData.scope2Breakdown).length > 0 ? (
                <EmissionsBarChart title="Scope 2 Breakdown" breakdownData={emissionsData.scope2Breakdown} color="rgba(54, 162, 235, 0.8)" />
              ) : (
                <div className="p-4 bg-white rounded-lg shadow-lg text-gray-500 text-center h-full flex items-center justify-center">No Scope 2 data.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 