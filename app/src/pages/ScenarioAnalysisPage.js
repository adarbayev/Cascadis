import React, { useState, useMemo, useRef } from 'react';
import './PageStyles.css';
import '../components/dashboard/TrajectoryDashboard.css';
import { ORG_STRUCTURE, INDICATORS, NODE_INDICATOR_MAPPING, INVENTORY_YEARS, QUESTIONNAIRE_DATA, CONVERSION_FACTORS, EMISSION_FACTORS } from '../demoData';
import { Line /*, Bar*/ } from 'react-chartjs-2'; // Bar is unused
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { BubblePayoffChart } from '../components/charts/BubblePayoffChart';
import { SCOPE1_NAMES, SCOPE2_NAMES } from '../utils/ghgConstants';
import { flattenNodesSite } from '../utils/arrayUtils';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

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

function sumEmissionsByScope(yearId, sessionEmissions) {
  const sites = flattenNodesSite(ORG_STRUCTURE);
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
// const PencilIcon = () => ( // Unused
//   <svg width="28" height="28" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
//     <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3-3.3.71.71-3.3 9.3-9.3zM3 17h14v2H3v-2z" fill="#6B7280"/>
//   </svg>
// );

function getBaselineByScopeAndSite(yearId, sessionEmissions) {
  const sites = flattenNodesSite(ORG_STRUCTURE);
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

function getScenarioTrajectory({ baseline, growth, baseYear, measures, sessionEmissions, yearId }) {
  // Get initial baseline by scope and by site (remains similar)
  // Note: 'baseline' passed to this function is totalBaselineEmissions. We need initialScope1Baseline and initialScope2Baseline.
  const { scope1: initialScope1Baseline, scope2: initialScope2Baseline, bySite } = getBaselineByScopeAndSite(yearId, sessionEmissions);

  // Precompute BAU values for all years for each scope (remains similar)
  const bauScope1Trajectory = getBAUTrajectory(initialScope1Baseline, growth.p1, growth.p2, growth.p3, baseYear);
  const bauScope2Trajectory = getBAUTrajectory(initialScope2Baseline, growth.p1, growth.p2, growth.p3, baseYear);
  
  const years = [...bauScope1Trajectory.years]; // Assuming bauScope1Trajectory.years is comprehensive
  let scenarioValues = [];

  for (let i = 0; i < years.length; ++i) {
    let currentYear = years[i];
    
    // Start with this year's BAU emissions for each scope
    let currentYearScope1Emissions = bauScope1Trajectory.values[i] !== undefined ? bauScope1Trajectory.values[i] : 0;
    let currentYearScope2Emissions = bauScope2Trajectory.values[i] !== undefined ? bauScope2Trajectory.values[i] : 0;
    
    let appliedMeasureIdsThisYear = new Set(); // Track IDs of measures already applied in this year's sequence

    const effectiveMeasures = measures || []; // Use the order as is in the scenario.measures array

    for (const measure of effectiveMeasures) {
      // For this logic to work, each 'measure' object MUST have a unique 'id' property.
      // And an optional 'exclusiveWith' array of other measure IDs.
      // Example: measure = { id: 'm1', ..., exclusiveWith: ['m2'] }

      const start = parseInt(measure.startYear) || baseYear;
      const isPermanent = measure.permanent === 'Yes' || measure.isPermanent === true; // Ensure boolean check for older data
      const measureLifecycle = isPermanent ? (2051 - start) : Math.max(1, parseInt(measure.lifecycle) || 1); // Permanent lasts till 2050

      // Is measure active this year?
      if (currentYear >= start && currentYear < start + measureLifecycle) {
        let isExcluded = false;
        if (measure.id && measure.exclusiveWith && Array.isArray(measure.exclusiveWith)) {
          for (const excludedById of measure.exclusiveWith) {
            if (appliedMeasureIdsThisYear.has(excludedById)) {
              isExcluded = true;
              break;
            }
          }
        }

        if (isExcluded) {
          // If measure is excluded but active, add its ID so it can exclude others if it's in *their* exclusiveWith list
          if (measure.id) appliedMeasureIdsThisYear.add(measure.id);
          continue; 
        }

        let percentageEffectiveness = parseFloat(measure.reduction) || 0;
        if (isNaN(percentageEffectiveness)) percentageEffectiveness = 0;

        const isInstant = measure.instant === 'Yes' || measure.isInstant === true; // Ensure boolean check
        const rampYears = isInstant ? 1 : Math.max(1, parseInt(measure.rampYears) || 1);

        // Ramp up if not instant
        if (!isInstant && currentYear < start + rampYears) {
          percentageEffectiveness *= (currentYear - start + 1) / rampYears;
        }

        // Site-specific scaling:
        // This is complex with sequential application. The original scaling was against initial baseline portions.
        // For sequential, it should ideally be against the site's portion of the *current live residual emissions*.
        // This requires knowing each site's live residual emissions, which adds significant complexity.
        // For now, let's simplify: if a measure is site-specific, its % reduction applies to that site's
        // share of the *initial* scope baseline, and this % is then converted to an absolute value
        // against the *current total live residual* for that scope. This is an approximation.
        // A more accurate model would track residual emissions per site per scope.
        let siteSpecificScaleFactor = 1; // Assume group level by default
        if (measure.groupLevel === false && measure.node && bySite[measure.node]) { // Check for groupLevel === false
            const siteInitialBaselineForScope = measure.scope === 'Scope 1' ? (bySite[measure.node].scope1 || 0) : (bySite[measure.node].scope2 || 0);
            const totalInitialBaselineForScope = measure.scope === 'Scope 1' ? initialScope1Baseline : initialScope2Baseline;
            if (totalInitialBaselineForScope > 0) {
                 // What portion of the total scope baseline did this site represent?
                const siteShareOfInitialBaseline = siteInitialBaselineForScope / totalInitialBaselineForScope;
                // The measure's % reduction is applied to this conceptual share.
                // So, if measure reduces by 10%, and site is 50% of baseline, it's like a 5% reduction on total.
                // This percentage is then applied to the live residual.
                percentageEffectiveness = percentageEffectiveness * siteShareOfInitialBaseline;
            } else {
                percentageEffectiveness = 0; // No baseline to apply to for this site's scope
            }
        }
        
        percentageEffectiveness = Math.max(0, Math.min(percentageEffectiveness, 100));

        let absoluteReductionOnScope = 0;
        if (measure.scope === 'Scope 1' && currentYearScope1Emissions > 0) {
          absoluteReductionOnScope = currentYearScope1Emissions * (percentageEffectiveness / 100);
          currentYearScope1Emissions -= absoluteReductionOnScope;
          currentYearScope1Emissions = Math.max(0, currentYearScope1Emissions);
        } else if (measure.scope === 'Scope 2' && currentYearScope2Emissions > 0) {
          absoluteReductionOnScope = currentYearScope2Emissions * (percentageEffectiveness / 100);
          currentYearScope2Emissions -= absoluteReductionOnScope;
          currentYearScope2Emissions = Math.max(0, currentYearScope2Emissions);
        }
        
        // Add to applied set if it was active (even if 0% reduction, or excluded but still could exclude others)
        // and had an ID.
        if (measure.id) {
            appliedMeasureIdsThisYear.add(measure.id);
        }
      }
    }
    scenarioValues.push(currentYearScope1Emissions + currentYearScope2Emissions);
  }
  return { years, values: scenarioValues };
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
  
  // Refs for charts to enable export
  const trajectoryChartRef = useRef(null);
  const maccChartRef = useRef(null);
  const payoffChartRef = useRef(null); // Added for potential export
  
  // State for export dropdown visibility
  const [showTrajectoryExport, setShowTrajectoryExport] = useState(false);
  const [showMaccExport, setShowMaccExport] = useState(false);
  const [showPayoffExport, setShowPayoffExport] = useState(false); // Added for potential export

  const { scope1, scope2, split } = useMemo(() => sumEmissionsByScope(selectedYear, sessionEmissions), [selectedYear, sessionEmissions]); // Ensure sumEmissionsByScope is memoized if sessionEmissions can change frequently
  const baselineEmissionsTotal = useMemo(() => Number(scope1 + scope2), [scope1, scope2]);
  // Pass a baseline object with scope1 and scope2 breakdown to charts needing it
  const baselineBreakdown = useMemo(() => ({ scope1, scope2 }), [scope1, scope2]);

  const baseYear = useMemo(() => INVENTORY_YEARS.find(y => y.id === selectedYear)?.year || 2024, [selectedYear]); // Memoized baseYear

  // Create realistic mock values for new measures
  const getDefaultMeasureValues = () => ({
    name: 'New Energy Efficiency Measure', 
    reduction: '5', // Default reduction percentage
    scope: 'Scope 1', 
    startYear: baseYear + 1, 
    permanent: 'No', 
    lifecycle: 10, 
    instant: 'Yes', // Default to instant
    rampYears: 1,   // If instant, rampYears is effectively 1
    capex: '100000', 
    opex: '5000', 
    groupLevel: true, 
    node: ''
  });

  // BAU Trajectory
  const bau = useMemo(() => getBAUTrajectory(
    baselineEmissionsTotal,
    growthRateP1,
    growthRateP2,
    growthRateP3,
    baseYear
  ), [baselineEmissionsTotal, growthRateP1, growthRateP2, growthRateP3, baseYear]);

  // Target Path
  const target = useMemo(() => getTargetPath(
    baselineEmissionsTotal,
    baseYear,
    targetReduction,
    isSBTiAligned
  ), [baselineEmissionsTotal, baseYear, targetReduction, isSBTiAligned]);

  // 2. In the component, compute scenario lines
  const scenarioLines = useMemo(() => {
    return scenarios.map(scenario => {
      const growth = scenario.useBAUGrowth ? { p1: growthRateP1, p2: growthRateP2, p3: growthRateP3 } : scenario.growth;
      return {
        id: scenario.id,
        name: scenario.name,
        data: getScenarioTrajectory({
          baseline: baselineEmissionsTotal,
          growth,
          baseYear,
          measures: scenario.measures,
          sessionEmissions,
          yearId: selectedYear
        })
      };
    });
  }, [scenarios, baselineEmissionsTotal, growthRateP1, growthRateP2, growthRateP3, baseYear, sessionEmissions, selectedYear]);

  // 3. Update chartData to include scenario lines
  const chartData = useMemo(() => {
    const datasets = [
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
    ];

    if (isSBTiAligned) {
      const nearTermTargetYear = baseYear + 10;
      const nearTermTargetValue = baselineEmissionsTotal * (1 - 0.42);
      const longTermTargetValue = baselineEmissionsTotal * (1 - 0.90);

      // const nearTermData = bau.years.map(year => { // Unused variable
      //   if (year <= nearTermTargetYear) return nearTermTargetValue;
      //   // Optional: could make it go towards longTermTargetValue after nearTermTargetYear
      //   // For now, just hold the near-term target level if we want to visualize it flatly
      //   // Or, more accurately, the SBTi path would continue to decrease.
      //   // The original getTargetPath already calculates a decreasing SBTi path, so this is for visualization of the levels.
      //   return null; // Or make it part of a stepped line to 2050
      // });
       // For simplicity, these lines will be flat. The main 'Target Path' shows the trajectory.
      datasets.push({
        label: 'SBTi Near-Term Target Level (-42% by ' + nearTermTargetYear + ')',
        data: bau.years.map(year => year <= nearTermTargetYear ? nearTermTargetValue : null), // Shows flat line up to target year
        borderColor: 'rgba(234, 179, 8, 0.6)', // Yellowish
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0,
        hidden: false, // Make sure it's visible
        order: -1 // Draw behind BAU/Target Path if needed, or adjust order of others
      });
      datasets.push({
        label: 'SBTi Long-Term Target Level (-90% by 2050)',
        data: bau.years.map(_year => longTermTargetValue), // Flat line across all years
        borderColor: 'rgba(220, 38, 38, 0.6)', // Reddish
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        tension: 0,
        hidden: false, // Make sure it's visible
        order: -2 
      });
    }

    return {
      labels: bau.years,
      datasets
    };
  }, [bau, target, scenarioLines, isSBTiAligned, baseYear, baselineEmissionsTotal]);

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
      const defaultValues = getDefaultMeasureValues(); // Use the existing helper
      setMeasures([defaultValues]);
      setEditMeasureIdx(0);
      setMeasureForm({ ...defaultValues });
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
  // const handleEditMeasure = (idx) => { // Unused function
  //   setEditMeasureIdx(idx);
  //   setMeasureForm({ ...measures[idx] });
  // };
  // const handleSaveMeasure = () => { // Unused function
  //   const updated = [...measures];
  //   if (editMeasureIdx !== null) {
  //     updated[editMeasureIdx] = { ...measureForm };
  //   } else {
  //     updated.push({ ...measureForm });
  //   }
  //   setMeasures(updated);
  //   setEditMeasureIdx(null);
  //   setMeasureForm({
  //     name: '', reduction: '', scope: 'Scope 1', startYear: 2025, permanent: 'No', lifecycle: 10, instant: 'Yes', capex: '', opex: '', groupLevel: true, node: ''
  //   });
  // };
  // const handleRemoveMeasure = (idx) => { // Unused function
  //   setMeasures(measures.filter((_, i) => i !== idx));
  //   setEditMeasureIdx(null);
  // };

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
  const [selectedMACCYear, setSelectedMACCYear] = useState(2030); // Default to 2030

  // Create MACC chart data (updated style)
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
        const measureLifecycle = m.permanent === 'Yes' ? 99 : Math.max(1, parseInt(m.lifecycle) || 1);
        const annualizedCost = capex / measureLifecycle + opex;

        const startYear = parseInt(m.startYear) || baseYear;
        const isInstant = m.instant === 'Yes';
        const rampYears = isInstant ? 1 : Math.max(1, parseInt(m.rampYears) || 1);
        
        let effectiveness = 0; // Default to 0

        // Check if the measure is active in the selectedMACCYear
        if (selectedMACCYear >= startYear && selectedMACCYear < startYear + measureLifecycle) {
          effectiveness = reduction; // Base effectiveness for the active period
          
          const yearsIntoMeasure = selectedMACCYear - startYear; // Years since the measure started

          // Apply ramp-up if not instant and within ramp-up period
          if (!isInstant && yearsIntoMeasure < rampYears) {
            effectiveness *= (yearsIntoMeasure + 1) / rampYears;
          }
        }
        
        const yearIndex = selectedMACCYear - baseYear;
        const bauGrowthFactor = (yearIndex >= 0 && yearIndex < bau.values.length && bau.values[0] > 0) ? bau.values[yearIndex] / bau.values[0] : (bau.values[0] === 0 ? 0 : 1) ;
        const annualAbatementForSelectedYear = baselineEmissionsTotal * (effectiveness / 100) * bauGrowthFactor;
        const mac = annualAbatementForSelectedYear > 0 ? annualizedCost / annualAbatementForSelectedYear : 0;
        return {
          ...m,
          annualizedCost,
          annualAbatementForSelectedYear,
          mac,
          color: `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)` // Keep HSL for distinct colors
        };
      })
      .filter(m => m.annualAbatementForSelectedYear > 0)
      .sort((a, b) => a.mac - b.mac);
    // Build datasets with 3 points for stepped block fill
    let cumulative = 0;
    const datasets = measures.map((m, idx) => {
      const x0 = cumulative;
      const x1 = cumulative + m.annualAbatementForSelectedYear;
      cumulative = x1;

      // Generate consistent colours for each measure
      const borderColor = `hsl(${(idx * 60 + 120) % 360}, 70%, 40%)`;
      const backgroundColor = `hsla(${(idx * 60 + 120) % 360}, 70%, 40%, 0.35)`; // ~35% opacity

      return {
        label: m.name,
        data: [
          { x: x0, y: m.mac },
          { x: x1, y: m.mac },
          { x: x1, y: 0 } // Drop down to the x-axis so the area under is filled
        ],
        borderColor,
        backgroundColor,
        borderWidth: 1,
        stepped: 'before',
        fill: true,
        measureData: m // make the raw measure available in tooltip callbacks
      };
    });
    return {
      // labels: [0], // Keep labels: [0] if Chart.js needs it for initialization with no data
      datasets
    };
  }, [selectedMACCScenario, selectedMACCYear, scenarios, baselineEmissionsTotal, baseYear, bau.values]);

  // MACC chart options (updated style)
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
        mode: 'index', // Changed from 'dataset'
        intersect: false,
        callbacks: {
          title: function(tooltipItems) {
            // In 'index' mode, tooltipItems is an array, use the first item's dataset label
            return tooltipItems[0]?.dataset.label || '';
          },
          label: function() { return ''; }, // Keep label empty as details are in footer
          footer: function(tooltipItems) {
            // In 'index' mode, we might need to find the correct dataset if tooltips from multiple datasets appear
            // However, with stepped lines, 'index' mode should correctly identify the "active" dataset at that x-value
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
          usePointStyle: false, // Changed from true
          padding: 20,
          font: { size: 12 },
          boxWidth: 15
        }
      }
    },
    interaction: { mode: 'x', axis: 'x', intersect: false } // Changed from 'nearest'
  };

  const triggerDownload = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChart = (chartRef, format, chartNamePrefix) => {
    if (chartRef.current) {
      const chartInstance = chartRef.current; // Access the chart instance
      let imageDataUrl;
      const filename = `${chartNamePrefix}_${selectedMACCYear || baseYear}_${new Date().toISOString().slice(0,10)}.${format}`;

      if (format === 'jpeg') {
        const canvas = document.createElement('canvas');
        canvas.width = chartInstance.width;
        canvas.height = chartInstance.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const chartPngUrl = chartInstance.toBase64Image();
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          triggerDownload(imageDataUrl, filename);
        };
        img.src = chartPngUrl;
      } else { // png
        imageDataUrl = chartInstance.toBase64Image();
        triggerDownload(imageDataUrl, filename);
      }
    }
  };

  // SVG Icon for Download
  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
  );

  return (
    <div className="trajectory-dashboard">
      <div className="dashboard-grid" style={{ alignItems: 'stretch', minHeight: '80vh', gap: '24px', display: 'flex' }}>
        <div className="inputs-panel" style={{ minHeight: '100%', width: '400px', maxWidth: '400px', flexShrink: 0 }}>
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
                      style={{ textAlign: 'left', fontWeight: 600, fontSize: 16, minWidth: 0, width: '100%', height: 36, borderRadius: 4, border: '1px solid #ccc', padding: '0 12px', background: '#f9fafb' }}
                      value={baselineEmissionsTotal.toFixed(2)}
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
                    <div key={scenario.id} className="scenario-block" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 12, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div> {/* Left part: Name and count */}
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{scenario.name}</div>
                        <div className="measures-count" style={{ fontSize: '0.9em', color: '#6b7280', marginTop: '2px' }}>{scenario.measures.length} measure(s)</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}> {/* Right part: Button container */}
                        <button className="action-btn" style={{ height: 28, minWidth: 0, fontSize: 13, padding: '0 10px' }} onClick={() => openEditMeasures(scenario)}>Edit Measures</button>
                        <button className="edit-button" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D1D5DB', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => openEditScenario(scenario)} title="Edit Scenario">
                        ✎
                        </button>
                        <button className="action-btn delete" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #EF4444', borderRadius: 4, background: 'white', color: '#EF4444', fontWeight: 600, fontSize: 16, cursor: 'pointer' }} onClick={() => setScenarios(scenarios.filter(s => s.id !== scenario.id))} title="Delete Scenario">
                          ×
                        </button>
                      </div>
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
          width: 'calc(100% - 400px)', // Adjusted from original to ensure it doesn't overflow
          flex: 1 // Added to ensure it takes available space
        }}>
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
              className={`chart-tab ${chartTab === 'payoff' ? 'active' : ''}`} 
              onClick={() => setChartTab('payoff')} // Changed from wedges to payoff
              style={{ 
                padding: '8px 16px', 
                fontWeight: chartTab === 'payoff' ? '600' : '400',
                borderBottom: chartTab === 'payoff' ? '2px solid #3b82f6' : 'none'
              }}
            >
              Pay-off Plot 
            </button>
          </div>
          
          {chartTab === 'trajectory' && (
            <>
              <h2 className="section-header">Emissions Trajectory (tCO2eq)</h2>
              <div className="chart-container" style={{ height: '100%', minHeight: 400, flex: 1 }}>
                <Line ref={trajectoryChartRef} data={chartData} options={chartOptions} />
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right', position: 'relative' }}>
                <button className="action-btn icon-btn" onClick={() => setShowTrajectoryExport(!showTrajectoryExport)} title="Export Chart">
                  <DownloadIcon />
                </button>
                {showTrajectoryExport && (
                  <div className="export-dropdown">
                    <button onClick={() => { exportChart(trajectoryChartRef, 'png', 'TrajectoryChart'); setShowTrajectoryExport(false); }}>Export PNG</button>
                    <button onClick={() => { exportChart(trajectoryChartRef, 'jpeg', 'TrajectoryChart'); setShowTrajectoryExport(false); }}>Export JPEG</button>
                  </div>
                )}
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
                {scenarios.length > 0 && scenarios.find(s => s.id === (selectedMACCScenario || scenarios[0].id))?.measures?.length > 0 ? (
                  <Line ref={maccChartRef} data={maccChartData} options={maccChartOptions} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#6b7280' }}>
                    <p>Add measures to your scenarios to view MACC Analysis.</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right', position: 'relative' }}>
                <button className="action-btn icon-btn" onClick={() => setShowMaccExport(!showMaccExport)} title="Export Chart">
                  <DownloadIcon />
                </button>
                {showMaccExport && (
                  <div className="export-dropdown">
                    <button onClick={() => { exportChart(maccChartRef, 'png', 'MACC'); setShowMaccExport(false); }}>Export PNG</button>
                    <button onClick={() => { exportChart(maccChartRef, 'jpeg', 'MACC'); setShowMaccExport(false); }}>Export JPEG</button>
                  </div>
                )}
              </div>
              <p className="chart-note">*The MACC shows the cost-effectiveness of each measure ($/tCO2e) and cumulative emissions reduction for year {selectedMACCYear}.</p>
            </>
          )}
          
          {chartTab === 'payoff' && (
            <>
              <h2 className="section-header">Abatement Measure Pay-off Analysis</h2>
              <div className="chart-container" style={{ height: '100%', minHeight: 500, flex: 1 }}>
                <BubblePayoffChart
                  scenarios={scenarios}
                  baseline={baselineBreakdown} 
                  baseYear={baseYear}
                  ref={payoffChartRef} // Pass the ref for export
                />
              </div>
              {/* Export button UI for Payoff Chart */}
              <div style={{ marginTop: '10px', textAlign: 'right', position: 'relative' }}>
                <button className="action-btn icon-btn" onClick={() => setShowPayoffExport(!showPayoffExport)} title="Export Chart">
                  <DownloadIcon />
                </button>
                {showPayoffExport && (
                  <div className="export-dropdown" style={{ zIndex: 10 }}> {/* Added zIndex just in case */}
                    <button onClick={() => { exportChart(payoffChartRef, 'png', 'PayoffChart'); setShowPayoffExport(false); }}>Export PNG</button>
                    <button onClick={() => { exportChart(payoffChartRef, 'jpeg', 'PayoffChart'); setShowPayoffExport(false); }}>Export JPEG</button>
                  </div>
                )}
              </div>
              <p className="chart-note">*Bubbles represent individual abatement measures. X-axis: cumulative abatement to 2050. Y-axis: NPV cost. Bubble size: average annual abatement during build years.</p>
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