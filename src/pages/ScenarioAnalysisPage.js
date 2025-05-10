import React, { useState, useMemo, useRef } from 'react';
import './PageStyles.css';
import '../components/dashboard/TrajectoryDashboard.css';
// Removed INDICATORS, CONVERSION_FACTORS, EMISSION_FACTORS from direct import
import { ORG_STRUCTURE, NODE_INDICATOR_MAPPING, INVENTORY_YEARS, QUESTIONNAIRE_DATA } from '../demoData';
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
  Legend,
  Filler
} from 'chart.js';
import { BubblePayoffChart } from '../components/charts/BubblePayoffChart';
import { SCOPE1_NAMES, SCOPE2_NAMES } from '../utils/ghgConstants';
import { flattenNodesSite } from '../utils/arrayUtils';
import { calcGHG } from '../utils/ghgUtils'; // Added import
import { indicatorById, getConversionFactorById, getEmissionFactorById } from '../utils/dataUtils'; // Added import

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

// indicatorById, getConversionFactorById, getEmissionFactorById moved to dataUtils.js
// calcGHG moved to ghgUtils.js, will need getConversionFactorById & getEmissionFactorById passed in

// calcGHG function (original position, now removed and imported)
/*
function calcGHG(indicator, value, unit) {
  if (!value || isNaN(value)) return 0;
  let conv = 1;
  if (indicator.conversion_factor_id) {
    const cf = getConversionFactorById(indicator.conversion_factor_id); // Now uses imported version
    if (cf && cf.source_unit === unit) conv = cf.conversion_factor;
  }
  let ef = 0;
  if (indicator.emission_factor_id) {
    const efObj = getEmissionFactorById(indicator.emission_factor_id); // Now uses imported version
    if (efObj) ef = efObj.value;
  }
  const multiplyNames = ['Electricity', 'District heat', 'Steam', 'Cooling'];
  let adjustedValue = parseFloat(value);
  // The *2 logic was here, it's now commented out in ghgUtils.js
  // if (multiplyNames.includes(indicator.name)) {
  //   adjustedValue = adjustedValue * 2;
  // }
  return parseFloat((adjustedValue * conv * ef).toFixed(2));
}
*/

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
      // Pass the getter functions to calcGHG
      const ghg = calcGHG(indicator, valObj.value, valObj.unit, getConversionFactorById, getEmissionFactorById) / 1000; // to tCO2eq
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

// ... existing code ...
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
      // Pass the getter functions to calcGHG
      const ghg = calcGHG(indicator, valObj.value, valObj.unit, getConversionFactorById, getEmissionFactorById) / 1000; // to tCO2eq
      if (SCOPE1_NAMES.includes(indicator.name)) siteScope1 += ghg;
      if (SCOPE2_NAMES.includes(indicator.name)) siteScope2 += ghg;
    }
    bySite[site.id] = { scope1: siteScope1, scope2: siteScope2 };
    scope1 += siteScope1;
    scope2 += siteScope2;
  }
  return { scope1, scope2, bySite };
}
// ... existing code ... 