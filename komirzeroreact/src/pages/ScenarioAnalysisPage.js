import React, { useState, useMemo } from 'react';
import './PageStyles.css';
import '../components/dashboard/TrajectoryDashboard.css';
import { ORG_STRUCTURE, INDICATORS, NODE_INDICATOR_MAPPING, INVENTORY_YEARS, QUESTIONNAIRE_DATA, CONVERSION_FACTORS, EMISSION_FACTORS } from '../demoData';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend
);

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

// Match DataCollectionPage logic exactly
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
  // Multiply by 2 for electricity, heat, steam, cooling
  const multiplyNames = ['Electricity', 'District heat', 'Steam', 'Cooling'];
  let adjustedValue = parseFloat(value);
  if (multiplyNames.includes(indicator.name)) {
    adjustedValue = adjustedValue * 2;
  }
  // Use parseFloat and .toFixed(2) as in DataCollectionPage
  return parseFloat((adjustedValue * conv * ef).toFixed(2));
}

function sumEmissionsByScope(yearId, sessionEmissions) {
  const sites = flattenNodes(ORG_STRUCTURE);
  let scope1 = 0, scope2 = 0;
  let split = { scope1: {}, scope2: {} };
  for (const site of sites) {
    const key = `${yearId}_${site.id}`;
    const data = (sessionEmissions && sessionEmissions[key]) ? sessionEmissions[key] : (QUESTIONNAIRE_DATA[key] || {});
    for (const indId of NODE_INDICATOR_MAPPING[site.id] || []) {
      const indicator = indicatorById(indId);
      if (!indicator) continue;
      const valObj = data[indId];
      if (!valObj) continue;
      const ghg = calcGHG(indicator, valObj.value, valObj.unit) / 1000; // to tCO2eq
      if (SCOPE1_NAMES.includes(indicator.name)) {
        scope1 += ghg;
        split.scope1[indicator.name] = (split.scope1[indicator.name] || 0) + ghg;
      }
      if (SCOPE2_NAMES.includes(indicator.name)) {
        scope2 += ghg;
        split.scope2[indicator.name] = (split.scope2[indicator.name] || 0) + ghg;
      }
    }
  }
  return { scope1, scope2, split };
}

function getBAUTrajectory(baseline, growth1, growth2, growth3, baseYear = 2024) {
  const years = [];
  const values = [];
  let value = baseline;
  for (let y = baseYear; y <= 2030; ++y) {
    years.push(y);
    values.push(value);
    value *= 1 + growth1 / 100;
  }
  for (let y = 2031; y <= 2040; ++y) {
    years.push(y);
    values.push(value);
    value *= 1 + growth2 / 100;
  }
  for (let y = 2041; y <= 2050; ++y) {
    years.push(y);
    values.push(value);
    value *= 1 + growth3 / 100;
  }
  return { years, values };
}

function getTargetPath(baseline, baseYear = 2024, reduction = 50, sbti = false) {
  // SBTi: -42% by baseYear+10, -90% by 2050; else linear to reduction% by 2050
  const years = [];
  const values = [];
  if (sbti) {
    for (let y = baseYear; y <= 2050; ++y) {
      years.push(y);
      if (y <= baseYear + 10) {
        // Linear to -42%
        const v = baseline * (1 - 0.42 * (y - baseYear) / 10);
        values.push(v);
      } else {
        // Linear to -90% by 2050
        const v = baseline * (0.58 - 0.48 * (y - (baseYear + 10)) / (2050 - (baseYear + 10)));
        values.push(v);
      }
    }
  } else {
    for (let y = baseYear; y <= 2050; ++y) {
      years.push(y);
      const v = baseline * (1 - reduction / 100 * (y - baseYear) / (2050 - baseYear));
      values.push(v);
    }
  }
  return { years, values };
}

// Minimalist Pencil Icon (reuse from DataCollectionPage)
const PencilIcon = () => (
  <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3-3.3.71.71-3.3 9.3-9.3zM3 17h14v2H3v-2z" fill="#6B7280"/>
  </svg>
);

// Helper to get baseline emissions by scope and by site
function getBaselineByScopeAndSite(yearId, sessionEmissions) {
  const sites = flattenNodes(ORG_STRUCTURE);
  let scope1 = 0, scope2 = 0;
  let bySite = {};
  for (const site of sites) {
    const key = `${yearId}_${site.id}`;
    const data = (sessionEmissions && sessionEmissions[key]) ? sessionEmissions[key] : (QUESTIONNAIRE_DATA[key] || {});
    let siteScope1 = 0, siteScope2 = 0;
    for (const indId of NODE_INDICATOR_MAPPING[site.id] || []) {
      const indicator = indicatorById(indId);
      if (!indicator) continue;
      const valObj = data[indId];
      if (!valObj) continue;
      const ghg = calcGHG(indicator, valObj.value, valObj.unit) / 1000; // to tCO2eq
      if (SCOPE1_NAMES.includes(indicator.name)) siteScope1 += ghg;
      if (SCOPE2_NAMES.includes(indicator.name)) siteScope2 += ghg;
    }
    bySite[site.id] = { scope1: siteScope1, scope2: siteScope2 };
    scope1 += siteScope1;
    scope2 += siteScope2;
  }
  return { scope1, scope2, bySite };
}

// Refactored scenario trajectory logic
function getScenarioTrajectory({ baseline, growth, baseYear, measures, sessionEmissions, yearId }) {
  // Get baseline by scope and by site
  const { scope1, scope2, bySite } = getBaselineByScopeAndSite(yearId, sessionEmissions);
  const totalBaseline = scope1 + scope2;
  // Precompute BAU values for all years
  const bau = getBAUTrajectory(baseline, growth.p1, growth.p2, growth.p3, baseYear);
  const years = [...bau.years];
  // For each year, calculate emissions by scope
  let values = [];
  for (let i = 0; i < years.length; ++i) {
    let year = years[i];
    // Start with BAU for each scope
    let valScope1 = getBAUTrajectory(scope1, growth.p1, growth.p2, growth.p3, baseYear).values[i];
    let valScope2 = getBAUTrajectory(scope2, growth.p1, growth.p2, growth.p3, baseYear).values[i];
    // Apply all measures
    let reductionScope1 = 0, reductionScope2 = 0;
    (measures || []).forEach(measure => {
      const start = parseInt(measure.startYear) || baseYear;
      const isPermanent = measure.permanent === 'Yes' || measure.isPermanent === true;
      const lifecycle = isPermanent ? 99 : Math.max(1, parseInt(measure.lifecycle) || 1);
      const isInstant = measure.instant === 'Yes' || measure.isInstant === true;
      const rampYears = isInstant ? 1 : Math.max(1, parseInt(measure.rampYears) || 1);
      if (year >= start && year < start + lifecycle) {
        let eff = parseFloat(measure.reduction) || 0;
        // Ramp up if not instant
        if (!isInstant && year < start + rampYears) {
          eff *= (year - start + 1) / rampYears;
        }
        // Scale for site-specific
        let scale = 1;
        if (!measure.groupLevel && measure.node && bySite[measure.node]) {
          const siteBaseline = (measure.scope === 'Scope 1' ? bySite[measure.node].scope1 : bySite[measure.node].scope2);
          const totalScope = measure.scope === 'Scope 1' ? scope1 : scope2;
          scale = totalScope > 0 ? siteBaseline / totalScope : 0;
        }
        eff = eff * scale;
        // Apply to relevant scope
        if (measure.scope === 'Scope 1') reductionScope1 += eff;
        if (measure.scope === 'Scope 2') reductionScope2 += eff;
      }
    });
    // Cap reductions at 100%
    reductionScope1 = Math.min(reductionScope1, 100);
    reductionScope2 = Math.min(reductionScope2, 100);
    valScope1 = valScope1 * (1 - reductionScope1 / 100);
    valScope2 = valScope2 * (1 - reductionScope2 / 100);
    values.push(valScope1 + valScope2);
  }
  return { years, values };
}

const ScenarioAnalysisPage = ({ sessionEmissions }) => {
  const [activeTab, setActiveTab] = useState('baseline');
  const [selectedYear, setSelectedYear] = useState(INVENTORY_YEARS[0].id);
  const [showSplit, setShowSplit] = useState(false);
  const [growthRateP1, setGrowthRateP1] = useState(2.0);
  const [growthRateP2, setGrowthRateP2] = useState(1.5);
  const [growthRateP3, setGrowthRateP3] = useState(1.0);
  const [isSBTiAligned, setIsSBTiAligned] = useState(false);
  const [targetReduction, setTargetReduction] = useState(50);
  const [scenarios, setScenarios] = useState([
    { id: 1, name: 'Scenario 1', measures: [], useBAUGrowth: true, growth: { p1: 2.0, p2: 1.5, p3: 1.0 } }
  ]);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [editGrowth, setEditGrowth] = useState({ p1: growthRateP1, p2: growthRateP2, p3: growthRateP3 });
  // Scenario modals
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioToEdit, setScenarioToEdit] = useState(null);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioUseBAU, setScenarioUseBAU] = useState(true);
  const [scenarioGrowth, setScenarioGrowth] = useState({ p1: 2.0, p2: 1.5, p3: 1.0 });
  // Measures modal
  const [showMeasuresModal, setShowMeasuresModal] = useState(false);
  const [measuresScenario, setMeasuresScenario] = useState(null);
  const [measures, setMeasures] = useState([]);
  const [editMeasureIdx, setEditMeasureIdx] = useState(null);
  const [measureForm, setMeasureForm] = useState({
    name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: ''
  });

  // Add state for new tabs
  const [chartTab, setChartTab] = useState('trajectory');
  
  // Create realistic mock values for new measures
  const getDefaultMeasureValues = () => ({
    name: 'New Energy Efficiency Measure', 
    reduction: '5', 
    scope: 'Scope 1', 
    startYear: baseYear + 1, 
    permanent: 'No', 
    lifecycle: 10, 
    instant: 'Yes', 
    rampYears: 2,
    capex: '100000', 
    opex: '5000', 
    groupLevel: true, 
    node: ''
  });

  const { scope1, scope2, split } = sumEmissionsByScope(selectedYear, sessionEmissions);
  const baselineEmissions = useMemo(() => Number(scope1 + scope2), [scope1, scope2]);
  const baseYear = INVENTORY_YEARS.find(y => y.id === selectedYear)?.year || 2024;

  // BAU Trajectory
  const bau = useMemo(() => getBAUTrajectory(
    baselineEmissions,
    growthRateP1,
    growthRateP2,
    growthRateP3,
    baseYear
  ), [baselineEmissions, growthRateP1, growthRateP2, growthRateP3, baseYear]);

  // Target Path
  const target = useMemo(() => getTargetPath(
    baselineEmissions,
    baseYear,
    targetReduction,
    isSBTiAligned
  ), [baselineEmissions, baseYear, targetReduction, isSBTiAligned]);

  // 2. In the component, compute scenario lines
  const scenarioLines = useMemo(() => {
    return scenarios.map(scenario => {
      const growth = scenario.useBAUGrowth ? { p1: growthRateP1, p2: growthRateP2, p3: growthRateP3 } : scenario.growth;
      return {
        id: scenario.id,
        name: scenario.name,
        data: getScenarioTrajectory({
          baseline: baselineEmissions,
          growth,
          baseYear,
          measures: scenario.measures,
          sessionEmissions,
          yearId: selectedYear
        })
      };
    });
  }, [scenarios, baselineEmissions, growthRateP1, growthRateP2, growthRateP3, baseYear, sessionEmissions, selectedYear]);

  // 3. Update chartData to include scenario lines
  const chartData = {
    labels: bau.years,
    datasets: [
      {
        label: 'Business As Usual (BAU)',
        data: bau.values.map(v => v.toFixed(2)),
        fill: false,
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0,
        pointRadius: 2.5,
        borderWidth: 2,
      },
      {
        label: 'Target Path',
        data: target.values.map(v => v.toFixed(2)),
        fill: false,
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        borderDash: [6, 6],
        tension: 0,
        pointRadius: 2.5,
        borderWidth: 2,
      },
      ...scenarioLines.map((line, idx) => ({
        label: line.name,
        data: line.data.values.map(v => v.toFixed(2)),
        fill: false,
        borderColor: `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)`,
        backgroundColor: `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)`,
        borderWidth: 2,
        tension: 0,
        pointRadius: 2.5,
      }))
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'Emissions (tCO2eq)' },
        grid: { color: '#e5e7eb' },
      },
      x: {
        title: { display: true, text: 'Year' },
        grid: { color: '#e5e7eb' },
      }
    }
  };

  // Edit Growth Modal logic
  const openGrowthModal = () => {
    setEditGrowth({ p1: growthRateP1, p2: growthRateP2, p3: growthRateP3 });
    setShowGrowthModal(true);
  };
  const saveGrowthRates = () => {
    setGrowthRateP1(Number(editGrowth.p1));
    setGrowthRateP2(Number(editGrowth.p2));
    setGrowthRateP3(Number(editGrowth.p3));
    setShowGrowthModal(false);
  };

  // Add Scenario
  const handleAddScenario = () => {
    const nextNum = scenarios.length + 1;
    setScenarios([...scenarios, {
      id: Date.now(),
      name: `Scenario ${nextNum}`,
      measures: [],
      useBAUGrowth: true,
      growth: { p1: growthRateP1, p2: growthRateP2, p3: growthRateP3 }
    }]);
  };

  // Edit Scenario
  const openEditScenario = (scenario) => {
    setScenarioToEdit(scenario.id);
    setScenarioName(scenario.name);
    setScenarioUseBAU(scenario.useBAUGrowth);
    setScenarioGrowth({ ...scenario.growth });
    setShowScenarioModal(true);
  };
  const saveScenarioEdit = () => {
    setScenarios(scenarios.map(s =>
      s.id === scenarioToEdit
        ? { ...s, name: scenarioName, useBAUGrowth: scenarioUseBAU, growth: { ...scenarioGrowth } }
        : s
    ));
    setShowScenarioModal(false);
    setScenarioToEdit(null);
  };

  // Edit Measures
  const openEditMeasures = (scenario) => {
    if (!scenario.measures || scenario.measures.length === 0) {
      setMeasures([{ name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: '' }]);
      setEditMeasureIdx(0);
      setMeasureForm({ name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: '' });
    } else {
      setMeasures([...scenario.measures]);
      setEditMeasureIdx(null);
      setMeasureForm({ name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: '' });
    }
    setMeasuresScenario(scenario.id);
    setShowMeasuresModal(true);
  };
  const saveMeasures = () => {
    setScenarios(scenarios.map(s =>
      s.id === measuresScenario
        ? { ...s, measures: [...measures] }
        : s
    ));
    setShowMeasuresModal(false);
    setMeasuresScenario(null);
  };
  const handleEditMeasure = (idx) => {
    setEditMeasureIdx(idx);
    setMeasureForm({ ...measures[idx] });
  };
  const handleSaveMeasure = () => {
    const updated = [...measures];
    if (editMeasureIdx !== null) {
      updated[editMeasureIdx] = { ...measureForm };
    } else {
      updated.push({ ...measureForm });
    }
    setMeasures(updated);
    setEditMeasureIdx(null);
    setMeasureForm({
      name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: ''
    });
  };
  const handleRemoveMeasure = (idx) => {
    setMeasures(measures.filter((_, i) => i !== idx));
    setEditMeasureIdx(null);
  };

  // Org structure nodes for targeting
  const allNodes = useMemo(() => {
    const arr = [];
    const walk = (nodes) => nodes.forEach(n => {
      arr.push(n);
      if (n.children) walk(n.children);
    });
    walk(ORG_STRUCTURE);
    return arr.filter(n => n.type === 'Site' || n.type === 'Legal Entity');
  }, []);

  // Update the 'Add New Measure' button to use realistic mock values
  const handleAddNewMeasure = () => {
    setMeasures([...measures, getDefaultMeasureValues()]);
    setEditMeasureIdx(measures.length);
    setMeasureForm(getDefaultMeasureValues());
  };

  // Add state for selected scenario for MACC chart
  const [selectedMACCScenario, setSelectedMACCScenario] = useState(null);
  
  // Add state for selected year for MACC chart
  const [selectedMACCYear, setSelectedMACCYear] = useState(2030);
  
  // Add state for selected scenario for Wedges chart
  const [selectedWedgesScenario, setSelectedWedgesScenario] = useState(null);

  // Create MACC chart data (legacy stepped line style)
  const maccChartData = useMemo(() => {
    const scenarioId = selectedMACCScenario || (scenarios.length > 0 ? scenarios[0].id : null);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario || !scenario.measures || scenario.measures.length === 0) {
      return { labels: [0], datasets: [] };
    }
    // Sort by MAC (cost per tCO2e)
    const measures = [...scenario.measures]
      .filter(m => parseFloat(m.reduction) > 0)
      .map((m, idx) => {
        const capex = parseFloat(m.capex) || 0;
        const opex = parseFloat(m.opex) || 0;
        const reduction = parseFloat(m.reduction) || 0;
        const lifecycle = m.permanent === 'Yes' ? 20 : parseInt(m.lifecycle) || 1;
        const annualizedCost = capex / lifecycle + opex;
        // Ramp-up logic
        const startYear = parseInt(m.startYear) || baseYear;
        const yearsSinceStart = selectedMACCYear - startYear;
        const isInstant = m.instant === 'Yes';
        const rampYears = isInstant ? 1 : Math.max(1, parseInt(m.rampYears) || 1);
        let effectiveness = reduction;
        if (!isInstant && yearsSinceStart < rampYears) {
          effectiveness *= (yearsSinceStart + 1) / rampYears;
        }
        // BAU growth factor for selected year
        const yearIndex = selectedMACCYear - baseYear;
        const bauGrowthFactor = yearIndex >= 0 && yearIndex < bau.values.length ? bau.values[yearIndex] / bau.values[0] : 1;
        const annualAbatementForSelectedYear = baselineEmissions * (effectiveness / 100) * bauGrowthFactor;
        const mac = annualAbatementForSelectedYear > 0 ? annualizedCost / annualAbatementForSelectedYear : 0;
        return {
          ...m,
          annualizedCost,
          annualAbatementForSelectedYear,
          mac,
          color: `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)`
        };
      })
      .filter(m => m.annualAbatementForSelectedYear > 0)
      .sort((a, b) => a.mac - b.mac);
    // Build stepped datasets
    let cumulative = 0;
    const datasets = measures.map((m, idx) => {
      const x0 = cumulative;
      const x1 = cumulative + m.annualAbatementForSelectedYear;
      cumulative = x1;
      return {
        label: m.name,
        data: [
          { x: x0, y: m.mac },
          { x: x1, y: m.mac }
        ],
        borderColor: m.color,
        backgroundColor: m.color,
        borderWidth: 3,
        stepped: true,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 6,
        measureData: m // for tooltip
      };
    });
    return {
      datasets
    };
  }, [selectedMACCScenario, selectedMACCYear, scenarios, baselineEmissions, baseYear, bau.values]);

  // MACC chart options (legacy style)
  const maccChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Cumulative Annual Abatement (tCO2eq/yr)', font: { size: 14, weight: '500' }, color: '#4b5563' },
        beginAtZero: true,
        grid: { display: false }
      },
      y: {
        type: 'linear',
        title: { display: true, text: 'Marginal Abatement Cost ($/tCO2eq)', font: { size: 14, weight: '500' }, color: '#4b5563' },
        grid: { color: '#e5e7eb' }
      }
    },
    plugins: {
      tooltip: {
        mode: 'dataset',
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0]?.dataset.label || '';
          },
          label: function() { return ''; },
          footer: function(tooltipItems) {
            const m = tooltipItems[0]?.dataset.measureData;
            if (!m) return '';
            return [
              `MAC: $${m.mac.toFixed(2)} / tCO2eq`,
              `Abatement: ${m.annualAbatementForSelectedYear.toFixed(0)} tCO2eq/yr`,
              `Annualized Cost: $${m.annualizedCost.toFixed(0)} /yr`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        footerFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
        boxPadding: 5
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
          boxWidth: 15
        }
      }
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  // Create wedge chart data for abatement wedges
  const wedgeChartData = useMemo(() => {
    // If no scenarios, return empty data
    if (scenarios.length === 0) {
      return {
        labels: bau.years,
        datasets: []
      };
    }
    
    // Use the selected scenario, or the first scenario if none selected
    const scenarioId = selectedWedgesScenario || (scenarios.length > 0 ? scenarios[0].id : null);
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (!scenario || !scenario.measures || scenario.measures.length === 0) {
      return {
        labels: bau.years,
        datasets: [{
          label: 'BAU',
          data: bau.values.map(v => v.toFixed(2)),
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          fill: false,
          tension: 0,
          pointRadius: 2,
          borderWidth: 2
        }]
      };
    }
    
    // Start with BAU trajectory as the top line
    const datasets = [{
      label: 'BAU',
      data: bau.values.map(v => v.toFixed(2)),
      borderColor: '#ef4444',
      backgroundColor: '#ef4444',
      fill: false,
      tension: 0,
      pointRadius: 2,
      borderWidth: 2
    }];
    
    // For each measure, calculate its contribution over time
    let cumulativeValues = [...bau.values];
    
    scenario.measures.forEach((measure, idx) => {
      const start = parseInt(measure.startYear) || baseYear;
      const startIndex = bau.years.indexOf(start);
      if (startIndex === -1) return;
      
      const reduction = parseFloat(measure.reduction) || 0;
      const isPermanent = measure.permanent === 'Yes';
      const lifecycle = isPermanent ? 99 : Math.max(1, parseInt(measure.lifecycle) || 1);
      const isInstant = measure.instant === 'Yes';
      const rampYears = isInstant ? 1 : Math.max(1, parseInt(measure.rampYears) || 1);
      
      const measureValues = [];
      const measureContribution = [];
      
      for (let i = 0; i < bau.years.length; i++) {
        const year = bau.years[i];
        
        if (i < startIndex || i >= startIndex + lifecycle) {
          // Measure not active yet or expired
          measureContribution.push(0);
        } else {
          // Measure is active
          let eff = reduction;
          
          // Apply ramp-up if not instant
          if (!isInstant && i < startIndex + rampYears) {
            eff *= (i - startIndex + 1) / rampYears;
          }
          
          const yearlyReduction = (baselineEmissions * (eff / 100)) * (bau.values[i] / bau.values[0]);
          measureContribution.push(yearlyReduction);
        }
        
        // Calculate new total after this measure
        const previousValue = i > 0 ? cumulativeValues[i-1] : baselineEmissions;
        const newValue = cumulativeValues[i] - measureContribution[i];
        measureValues.push(newValue);
      }
      
      // Update cumulative values for next measure
      cumulativeValues = [...measureValues];
      
      // Add this measure's contribution as a dataset
      datasets.push({
        label: measure.name,
        data: measureValues.map(v => v.toFixed(2)),
        borderColor: `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)`,
        backgroundColor: `hsla(${(idx * 60 + 120) % 360}, 70%, 40%, 0.7)`,
        fill: '+1',
        tension: 0,
        pointRadius: 1,
        borderWidth: 1
      });
    });
    
    return {
      labels: bau.years,
      datasets: datasets.reverse() // Reverse to make stacking work correctly
    };
  }, [selectedWedgesScenario, scenarios, bau, baselineEmissions, baseYear]);

  const wedgeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Emissions (tCO2eq)'
        },
        grid: {
          color: '#e5e7eb'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Year'
        },
        grid: {
          color: '#e5e7eb'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };

  return (
    <div className="trajectory-dashboard">
      <div className="dashboard-grid" style={{ alignItems: 'stretch', minHeight: '80vh', gap: '24px', display: 'flex' }}>
        <div className="inputs-panel" style={{ minHeight: '100%', width: '300px', maxWidth: '300px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button
              className={`tab-button${activeTab === 'baseline' ? ' active' : ''}`}
              onClick={() => setActiveTab('baseline')}
              style={{ flex: 1 }}
            >
              Baselining
            </button>
            <button
              className={`tab-button${activeTab === 'scenarios' ? ' active' : ''}`}
              onClick={() => setActiveTab('scenarios')}
              style={{ flex: 1 }}
            >
              Scenario Definition
            </button>
          </div>
          {activeTab === 'baseline' && (
            <>
              <h2 className="section-header">Baselining</h2>
              {/* Baseline Section */}
              <div className="input-section">
                <h3 className="subsection-header">
                  <span>Baseline</span>
                </h3>
                <div className="input-grid" style={{ alignItems: 'end' }}>
                  <div>
                    <label htmlFor="total-co2eq">Total CO2eq</label>
                    <input
                      id="total-co2eq"
                      className="form-input"
                      style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, minWidth: 0, width: '100%', height: 36, borderRadius: 4, border: '1px solid #ccc', padding: '0 12px', background: '#f9fafb' }}
                      value={baselineEmissions.toFixed(2)}
                      readOnly
                      onClick={() => setShowSplit(true)}
                      title="View split by scope"
                    />
                  </div>
                  <div>
                    <label htmlFor="baseline-year">Baseline Year</label>
                    <select
                      id="baseline-year"
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      className="form-input"
                      style={{ minWidth: 0, width: '100%' }}
                    >
                      {INVENTORY_YEARS.map(y => (
                        <option key={y.id} value={y.id}>{y.year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* Split Modal */}
              {showSplit && (
                <div className="form-overlay">
                  <div className="form-container" style={{ maxWidth: 400, minWidth: 300, width: '95%' }}>
                    <h2>Baseline Emissions Split</h2>
                    <div style={{ margin: '18px 0' }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>Scope 1</div>
                      {Object.entries(split.scope1).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{k}</span>
                          <span>{v.toFixed(2)} tCO2eq</span>
                        </div>
                      ))}
                      <div style={{ fontWeight: 600, margin: '12px 0 8px' }}>Scope 2</div>
                      {Object.entries(split.scope2).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span>{k}</span>
                          <span>{v.toFixed(2)} tCO2eq</span>
                        </div>
                      ))}
                    </div>
                    <div className="form-actions" style={{ marginTop: 18 }}>
                      <button className="cancel-button" onClick={() => setShowSplit(false)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Projections Section */}
              <div className="input-section">
                <h3 className="subsection-header">
                  <span>BAU Projections</span>
                  <button type="button" className="edit-btn" onClick={openGrowthModal}>Edit Growth Rates</button>
                </h3>
                <p className="input-description">Linear growth rates (% of baseline) applied per period.</p>
                <div className="rates-display">
                  <span>P1 (baseline–2030): {growthRateP1}%</span>
                  <span>P2 (2031–2040): {growthRateP2}%</span>
                  <span>P3 (2041–2050): {growthRateP3}%</span>
                </div>
              </div>
              {/* Edit Growth Modal */}
              {showGrowthModal && (
                <div className="form-overlay">
                  <div className="form-container" style={{ maxWidth: 420, minWidth: 320, width: '95%' }}>
                    <h2>Edit Growth Rates (% of Baseline / Year)</h2>
                    <div className="form-group">
                      <label>Period 1 (2024 - 2030)</label>
                      <input type="number" className="form-input" value={editGrowth.p1} onChange={e => setEditGrowth(g => ({ ...g, p1: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Period 2 (2031 - 2040)</label>
                      <input type="number" className="form-input" value={editGrowth.p2} onChange={e => setEditGrowth(g => ({ ...g, p2: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label>Period 3 (2041 - 2050)</label>
                      <input type="number" className="form-input" value={editGrowth.p3} onChange={e => setEditGrowth(g => ({ ...g, p3: e.target.value }))} />
                    </div>
                    <div className="form-actions" style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="cancel-button" onClick={() => setShowGrowthModal(false)}>Cancel</button>
                      <button className="save-button" onClick={saveGrowthRates}>Save Rates</button>
                    </div>
                  </div>
                </div>
              )}
              {/* Target Section */}
              <div className="input-section">
                <h3 className="subsection-header">Target</h3>
                <div className="checkbox-row">
                  <input
                    id="sbti-checkbox"
                    type="checkbox"
                    checked={isSBTiAligned}
                    onChange={() => setIsSBTiAligned(!isSBTiAligned)}
                    className="form-checkbox"
                  />
                  <label htmlFor="sbti-checkbox">Align target with SBTi (1.5°C Pathway)?</label>
                </div>
                {isSBTiAligned && (
                  <p className="input-note">Applies -42% by near-term target year (baseline+10yrs) and -90% by 2050 vs baseline year emissions.</p>
                )}
                <div className="input-row">
                  <label htmlFor="target-reduction">Manual 2050 Target Reduction (%)</label>
                  <input
                    type="number"
                    id="target-reduction"
                    value={targetReduction}
                    onChange={e => setTargetReduction(parseInt(e.target.value))}
                    min="0"
                    max="100"
                    disabled={isSBTiAligned}
                    className="form-input"
                  />
                </div>
              </div>
            </>
          )}
          {activeTab === 'scenarios' && (
            <>
              <h2 className="section-header">Scenario Definition</h2>
              <div className="input-section">
                <div className="section-header-with-button">
                  <h2 className="section-header">Scenarios</h2>
                  <button className="add-btn" onClick={handleAddScenario}>Add Scenario</button>
                </div>
                <div className="scenarios-list">
                  {scenarios.map((scenario, idx) => (
                    <div key={scenario.id} className="scenario-block" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, background: '#fff' }}>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{scenario.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <button className="action-btn" style={{ height: 28, minWidth: 0, fontSize: 13, padding: '0 12px' }} onClick={() => openEditMeasures(scenario)}>Edit Measures</button>
                        <button className="edit-button" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => openEditScenario(scenario)} title="Edit Scenario">
                        ✎
                        </button>
                        <button className="action-btn delete" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ef4444', borderRadius: 4, background: 'white', color: '#ef4444', fontWeight: 700, fontSize: 18, cursor: 'pointer' }} onClick={() => setScenarios(scenarios.filter(s => s.id !== scenario.id))} title="Delete Scenario">
                          ×
                        </button>
                      </div>
                      <div className="measures-count">{scenario.measures.length} measure(s)</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <div className="chart-panel" style={{ 
          height: 'calc(100vh - 100px)', 
          minHeight: 500, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'flex-start',
          width: 'calc(100% - 300px)',
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* Add chart tabs */}
          <div className="chart-tabs" style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
            <button 
              className={`chart-tab ${chartTab === 'trajectory' ? 'active' : ''}`} 
              onClick={() => setChartTab('trajectory')}
              style={{ 
                padding: '8px 16px', 
                fontWeight: chartTab === 'trajectory' ? '600' : '400',
                borderBottom: chartTab === 'trajectory' ? '2px solid #3b82f6' : 'none',
                marginRight: '16px'
              }}
            >
              Emissions Trajectory
            </button>
            <button 
              className={`chart-tab ${chartTab === 'macc' ? 'active' : ''}`} 
              onClick={() => setChartTab('macc')}
              style={{ 
                padding: '8px 16px', 
                fontWeight: chartTab === 'macc' ? '600' : '400',
                borderBottom: chartTab === 'macc' ? '2px solid #3b82f6' : 'none',
                marginRight: '16px'
              }}
            >
              MACC Analysis
            </button>
            <button 
              className={`chart-tab ${chartTab === 'wedges' ? 'active' : ''}`} 
              onClick={() => setChartTab('wedges')}
              style={{ 
                padding: '8px 16px', 
                fontWeight: chartTab === 'wedges' ? '600' : '400',
                borderBottom: chartTab === 'wedges' ? '2px solid #3b82f6' : 'none'
              }}
            >
              Abatement Wedges
            </button>
          </div>
          
          {chartTab === 'trajectory' && (
            <>
              <h2 className="section-header">Emissions Trajectory (tCO2eq)</h2>
              <div className="chart-container" style={{ height: '100%', minHeight: 400, flex: 1 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
              <p className="chart-note">*CAPEX and OPEX values are recorded but do not currently affect the emissions trajectory graph.</p>
            </>
          )}
          
          {chartTab === 'macc' && (
            <>
              <h2 className="section-header">Marginal Abatement Cost Curve</h2>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <label style={{ marginRight: '8px', fontWeight: '500' }}>Select Scenario:</label>
                  <select 
                    value={selectedMACCScenario || (scenarios.length > 0 ? scenarios[0].id : '')} 
                    onChange={e => setSelectedMACCScenario(Number(e.target.value))}
                    className="form-control" 
                    style={{ display: 'inline-block', width: 'auto', minWidth: '200px' }}
                  >
                    {scenarios.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ marginRight: '8px', fontWeight: '500' }}>Analysis Year:</label>
                  <select 
                    value={selectedMACCYear} 
                    onChange={e => setSelectedMACCYear(Number(e.target.value))}
                    className="form-control" 
                    style={{ display: 'inline-block', width: 'auto', minWidth: '100px' }}
                  >
                    {bau.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="chart-container" style={{ height: '100%', minHeight: 400, flex: 1 }}>
                {scenarios.length > 0 && scenarios[0].measures && scenarios[0].measures.length > 0 ? (
                  <Bar data={maccChartData} options={maccChartOptions} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p>Add measures to your scenarios to view MACC Analysis</p>
                    <button 
                      className="add-btn"
                      style={{ marginTop: '16px' }}
                      onClick={() => {
                        if (scenarios.length > 0) {
                          openEditMeasures(scenarios[0].id);
                        } else {
                          handleAddScenario();
                        }
                      }}
                    >
                      {scenarios.length > 0 ? 'Add Measures' : 'Add Scenario'}
                    </button>
                  </div>
                )}
              </div>
              <p className="chart-note">*The MACC shows the cost-effectiveness of each measure ($/tCO2e) and cumulative emissions reduction for year {selectedMACCYear}.</p>
            </>
          )}
          
          {chartTab === 'wedges' && (
            <>
              <h2 className="section-header">Abatement Wedges</h2>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <label style={{ marginRight: '8px', fontWeight: '500' }}>Select Scenario:</label>
                <select 
                  value={selectedWedgesScenario || (scenarios.length > 0 ? scenarios[0].id : '')} 
                  onChange={e => setSelectedWedgesScenario(Number(e.target.value))}
                  className="form-control" 
                  style={{ display: 'inline-block', width: 'auto', minWidth: '200px' }}
                >
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="chart-container" style={{ height: '100%', minHeight: 400, flex: 1 }}>
                {scenarios.length > 0 && scenarios[0].measures && scenarios[0].measures.length > 0 ? (
                  <Line data={wedgeChartData} options={wedgeChartOptions} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <p>Add measures to your scenarios to view Abatement Wedges</p>
                    <button 
                      className="add-btn"
                      style={{ marginTop: '16px' }}
                      onClick={() => {
                        if (scenarios.length > 0) {
                          openEditMeasures(scenarios[0].id);
                        } else {
                          handleAddScenario();
                        }
                      }}
                    >
                      {scenarios.length > 0 ? 'Add Measures' : 'Add Scenario'}
                    </button>
                  </div>
                )}
              </div>
              <p className="chart-note">*Each colored area represents the annual abatement (tCO2eq/yr) contributed by a specific measure.</p>
            </>
          )}
        </div>
      </div>
      {/* Scenario Edit Modal */}
      {showScenarioModal && (
        <div className="form-overlay">
          <div className="form-container" style={{ maxWidth: 400, minWidth: 300, width: '95%' }}>
            <h2>Edit Scenario</h2>
            <div className="form-group">
              <label>Scenario Name</label>
              <input className="form-control" value={scenarioName} onChange={e => setScenarioName(e.target.value)} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
              <input 
                type="checkbox" 
                id="useBAUGrowth" 
                checked={scenarioUseBAU} 
                onChange={e => setScenarioUseBAU(e.target.checked)} 
                style={{ 
                  marginRight: 8, 
                  width: 18, 
                  height: 18,
                  cursor: 'pointer'
                }} 
              />
              <label 
                htmlFor="useBAUGrowth" 
                style={{ 
                  marginBottom: 0, 
                  fontWeight: 500, 
                  cursor: 'pointer' 
                }}
              >
                Use BAU Growth Rates
              </label>
            </div>
            {!scenarioUseBAU && (
              <>
                <div className="form-group">
                  <label>Period 1 (2024 - 2030)</label>
                  <input type="number" className="form-control" value={scenarioGrowth.p1} onChange={e => setScenarioGrowth(g => ({ ...g, p1: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Period 2 (2031 - 2040)</label>
                  <input type="number" className="form-control" value={scenarioGrowth.p2} onChange={e => setScenarioGrowth(g => ({ ...g, p2: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Period 3 (2041 - 2050)</label>
                  <input type="number" className="form-control" value={scenarioGrowth.p3} onChange={e => setScenarioGrowth(g => ({ ...g, p3: e.target.value }))} />
                </div>
              </>
            )}
            <div className="form-actions" style={{ marginTop: 18 }}>
              <button className="save-button" onClick={saveScenarioEdit} style={{ marginRight: 8 }}>Save</button>
              <button className="cancel-button" onClick={() => setShowScenarioModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Measures Modal */}
      {showMeasuresModal && (
        <div className="form-overlay">
          <div className="form-container" style={{ maxWidth: 600, minWidth: 350, width: '95%' }}>
            <h2>Edit Measures for {scenarios.find(s => s.id === measuresScenario)?.name}</h2>
            {measures.map((m, idx) => (
              editMeasureIdx === idx ? (
                <div key={idx} style={{ background: '#e0f2fe', borderRadius: 8, padding: 12, marginBottom: 10 }}>
                  <div className="form-group">
                    <label>Measure Name (Required)</label>
                    <input className="form-control" value={measureForm.name} onChange={e => setMeasureForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Reduction (%)</label>
                      <input className="form-control" value={measureForm.reduction} onChange={e => setMeasureForm(f => ({ ...f, reduction: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Scope</label>
                      <select className="form-control" value={measureForm.scope} onChange={e => setMeasureForm(f => ({ ...f, scope: e.target.value }))}>
                        <option>Scope 1</option>
                        <option>Scope 2</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Start Year</label>
                      <input className="form-control" value={measureForm.startYear} onChange={e => setMeasureForm(f => ({ ...f, startYear: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Permanent?</label>
                      <select className="form-control" value={measureForm.permanent} onChange={e => {
                        const val = e.target.value;
                        setMeasureForm(f => ({ ...f, permanent: val, lifecycle: val === 'Yes' ? 99 : (f.lifecycle === 99 ? 10 : f.lifecycle) }));
                      }}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                    {measureForm.permanent === 'No' && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Lifecycle (yrs)</label>
                        <input className="form-control" value={measureForm.lifecycle} onChange={e => setMeasureForm(f => ({ ...f, lifecycle: e.target.value }))} />
                      </div>
                    )}
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Instant Effect?</label>
                      <select className="form-control" value={measureForm.instant} onChange={e => {
                        const val = e.target.value;
                        setMeasureForm(f => ({ ...f, instant: val, rampYears: val === 'Yes' ? 1 : (f.rampYears <= 1 ? 2 : f.rampYears) }));
                      }}>
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </div>
                    {measureForm.instant === 'No' && (
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Ramp Years</label>
                        <input className="form-control" value={measureForm.rampYears || ''} onChange={e => setMeasureForm(f => ({ ...f, rampYears: e.target.value }))} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>CAPEX ($)</label>
                      <input className="form-control" value={measureForm.capex} onChange={e => setMeasureForm(f => ({ ...f, capex: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>OPEX ($/yr)</label>
                      <input className="form-control" value={measureForm.opex} onChange={e => setMeasureForm(f => ({ ...f, opex: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: 16 }}>
                    <input 
                      type="checkbox" 
                      id="groupLevel" 
                      checked={measureForm.groupLevel} 
                      onChange={e => setMeasureForm(f => ({ ...f, groupLevel: e.target.checked, node: '' }))} 
                      style={{ 
                        marginRight: 8, 
                        width: 18, 
                        height: 18,
                        cursor: 'pointer'
                      }} 
                    />
                    <label 
                      htmlFor="groupLevel" 
                      style={{ 
                        marginBottom: 0, 
                        fontWeight: 500, 
                        cursor: 'pointer' 
                      }}
                    >
                      Group level?
                    </label>
                  </div>
                  {!measureForm.groupLevel && (
                    <div className="form-group">
                      <label>Target Node</label>
                      <select className="form-control" value={measureForm.node} onChange={e => setMeasureForm(f => ({ ...f, node: e.target.value }))}>
                        <option value="">Select node...</option>
                        {allNodes.map(n => (
                          <option key={n.id} value={n.id}>{n.name} ({n.code})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-actions" style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button className="save-button" onClick={() => {
                      const updated = [...measures];
                      updated[idx] = { ...measureForm };
                      setMeasures(updated);
                      setEditMeasureIdx(null);
                      setMeasureForm({
                        name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: ''
                      });
                    }} style={{ marginRight: 8 }}>Save</button>
                    <button className="cancel-button" onClick={() => {
                      if (!measures[idx].name && !measures[idx].reduction) {
                        setMeasures(measures.filter((_, i) => i !== idx));
                      }
                      setEditMeasureIdx(null);
                      setMeasureForm(getDefaultMeasureValues());
                    }}>Cancel</button>
                    <button className="action-btn delete" onClick={() => {
                      setMeasures(measures.filter((_, i) => i !== idx));
                      setEditMeasureIdx(null);
                      setMeasureForm(getDefaultMeasureValues());
                    }}>Remove</button>
                  </div>
                </div>
              ) : (
                <div key={idx} style={{ background: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input className="form-control" style={{ flex: 2 }} value={m.name} readOnly />
                  <button className="action-btn" onClick={() => {
                    setEditMeasureIdx(idx);
                    setMeasureForm({ ...measures[idx] });
                  }}>Edit</button>
                  <button className="action-btn delete" onClick={() => {
                    setMeasures(measures.filter((_, i) => i !== idx));
                    setEditMeasureIdx(null);
                    setMeasureForm(getDefaultMeasureValues());
                  }}>Remove</button>
                </div>
              )
            ))}
            <button className="add-btn" style={{ width: '100%', margin: '12px 0', fontWeight: 600, fontSize: 18 }} onClick={handleAddNewMeasure}>+ Add New Measure</button>
            <div className="form-actions" style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="save-button" onClick={saveMeasures} style={{ marginRight: 8 }}>Save and Close</button>
              <button className="cancel-button" onClick={() => setShowMeasuresModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioAnalysisPage; 