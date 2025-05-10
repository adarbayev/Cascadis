import React, { useState, useMemo, useEffect } from 'react';
import './HomePage.css';
import { INVENTORY_YEARS, ORG_STRUCTURE, NODE_INDICATOR_MAPPING, QUESTIONNAIRE_DATA } from '../demoData'; // Removed INDICATORS, CONVERSION_FACTORS, EMISSION_FACTORS
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import SiteEmissionsMap from '../components/dashboard/SiteEmissionsMap';
import { calcGHG } from '../utils/ghgUtils'; // Added import
import { indicatorById, getConversionFactorById, getEmissionFactorById } from '../utils/dataUtils'; // Added import
import { SCOPE1_NAMES, SCOPE2_NAMES } from '../utils/ghgConstants'; // Assuming this was already refactored

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// --- Helper functions (similar to ScenarioAnalysisPage) ---
// SCOPE1_NAMES and SCOPE2_NAMES moved to ghgConstants.js

const flattenNodes = (nodes, arr = []) => {
  nodes.forEach(node => {
    if (node.type === 'Site') arr.push(node);
    if (node.children) flattenNodes(node.children, arr);
  });
  return arr;
};

// indicatorById, getConversionFactorById, getEmissionFactorById moved to dataUtils.js
// calcGHG moved to ghgUtils.js and will now also need getConversionFactorById, getEmissionFactorById passed to it.

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
      // Pass the getter functions to calcGHG
      const ghg = calcGHG(indicator, valObj.value, valObj.unit, getConversionFactorById, getEmissionFactorById) / 1000; // to tCO2eq
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

// Load organization structure data from localStorage or use default data
const getInitialOrgData = () => {
  const savedData = localStorage.getItem('orgStructureData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved org structure data:', e);
    }
  }
  
  // Default data if nothing in localStorage
  return [
    {
      id: 'g1',
      type: 'Group',
      code: 'NOG001',
      name: 'NAT OIL GROUP',
      children: [
        {
          id: 'le1',
          type: 'Legal Entity',
          code: 'NOW001',
          name: 'NAT OIL WEST',
          children: [
            {
              id: 's1',
              type: 'Site',
              code: 'NOWO001',
              name: 'NAT OIL WEST OFFICE',
              country: 'Romania',
              latitude: 44.4268,
              longitude: 26.1025
            },
            {
              id: 's2',
              type: 'Site',
              code: 'NOWF001',
              name: 'NAT OIL WEST FIELD',
              country: 'Romania',
              latitude: 45.7538,
              longitude: 26.8212
            }
          ]
        },
        {
          id: 'le2',
          type: 'Legal Entity',
          code: 'NOE001',
          name: 'NAT OIL EAST',
          children: [
            {
              id: 's3',
              type: 'Site',
              code: 'NOEO001',
              name: 'NAT OIL EAST OFFICE',
              country: 'Kazakhstan',
              latitude: 43.2551,
              longitude: 76.9126
            },
            {
              id: 's4',
              type: 'Site',
              code: 'NOEF001',
              name: 'NAT OIL EAST FIELD',
              country: 'Kazakhstan',
              latitude: 47.1211,
              longitude: 51.8766
            }
          ]
        }
      ]
    }
  ];
}; 