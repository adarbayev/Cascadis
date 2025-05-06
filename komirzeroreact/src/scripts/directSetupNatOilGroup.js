// Direct setup script for NAT OIL GROUP
// This script can be copied directly into browser console to execute

function directSetupNatOilGroup() {
  console.log('Starting NAT OIL GROUP setup...');
  
  // Create the organization structure
  const orgStructure = [
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
              latitude: 44.4268,  // Bucharest, Romania
              longitude: 26.1025
            },
            {
              id: 's2',
              type: 'Site',
              code: 'NOWF001',
              name: 'NAT OIL WEST FIELD',
              country: 'Romania',
              latitude: 45.7538,  // Ploiesti, Romania (oil field region)
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
              latitude: 43.2551,  // Almaty, Kazakhstan
              longitude: 76.9126
            },
            {
              id: 's4',
              type: 'Site',
              code: 'NOEF001',
              name: 'NAT OIL EAST FIELD',
              country: 'Kazakhstan',
              latitude: 47.1211,  // Atyrau region, Kazakhstan (oil field region)
              longitude: 51.8766
            }
          ]
        }
      ]
    }
  ];

  // Save to localStorage
  localStorage.setItem('orgStructureData', JSON.stringify(orgStructure));
  console.log('NAT OIL GROUP organization structure has been set up successfully!');
  
  // Set up node-indicator mappings
  setupNodeIndicatorMapping();
  
  // Set up questionnaire mappings for all inventory years
  setupQuestionnaireMappings();
  
  console.log('Setup complete. Please refresh the page to see the changes.');
  
  return 'Setup successful';
}

// Function to get all indicators from localStorage
function getIndicators() {
  const saved = localStorage.getItem('indicatorData');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (e) { return []; }
  }
  return [];
}

// Function to get inventory years from localStorage
function getInventoryYears() {
  const saved = localStorage.getItem('inventoryYears');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (e) { return []; }
  }
  return [];
}

// Function to get questionnaire mappings from localStorage
function getQuestionnaireMappings() {
  const saved = localStorage.getItem('questionnaireMappings');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (e) { return {}; }
  }
  return {};
}

// Function to save questionnaire mappings to localStorage
function saveQuestionnaireMappings(mappings) {
  localStorage.setItem('questionnaireMappings', JSON.stringify(mappings));
}

// Function to set up node-indicator mappings
function setupNodeIndicatorMapping() {
  const indicators = getIndicators();
  
  // Get indicator IDs by scope
  const scope1Indicators = indicators
    .filter(i => i.scope_tag === 'scope1')
    .map(i => i.id);
  
  const scope2Indicators = indicators
    .filter(i => i.scope_tag === 'scope2')
    .map(i => i.id);
  
  const generalIndicators = indicators
    .filter(i => i.scope_tag === 'general')
    .map(i => i.id);
  
  // Revenue indicator (for legal entities)
  const revenueIndicator = indicators
    .filter(i => i.name === 'Revenue')
    .map(i => i.id);
  
  // Create mappings
  const nodeIndicatorMapping = {
    // Legal entities - assign revenue indicator
    'le1': revenueIndicator,
    'le2': revenueIndicator,
    
    // Sites - assign scope1 and scope2 indicators
    's1': [...scope1Indicators, ...scope2Indicators, ...generalIndicators],
    's2': [...scope1Indicators, ...scope2Indicators, ...generalIndicators],
    's3': [...scope1Indicators, ...scope2Indicators, ...generalIndicators],
    's4': [...scope1Indicators, ...scope2Indicators, ...generalIndicators]
  };
  
  // Save to localStorage
  localStorage.setItem('nodeIndicatorMapping', JSON.stringify(nodeIndicatorMapping));
  console.log('Node-indicator mappings have been set up successfully!');
}

// Function to set up questionnaire mappings for all inventory years
function setupQuestionnaireMappings() {
  const inventoryYears = getInventoryYears();
  const mappings = getQuestionnaireMappings();
  const nodeIndicatorMapping = JSON.parse(localStorage.getItem('nodeIndicatorMapping') || '{}');
  
  // Update mappings for each inventory year
  inventoryYears.forEach(year => {
    mappings[year.id] = nodeIndicatorMapping;
  });
  
  // If no inventory years exist, create a default one for 2024
  if (inventoryYears.length === 0) {
    const newYear = { id: 1, name: 'Inventory 2024', year: 2024 };
    localStorage.setItem('inventoryYears', JSON.stringify([newYear]));
    mappings[1] = nodeIndicatorMapping;
  }
  
  // Save questionnaire mappings
  saveQuestionnaireMappings(mappings);
  console.log('Questionnaire mappings have been set up successfully!');
}

// To use this script, copy it and paste it into your browser's developer console
// Then call directSetupNatOilGroup() to run it 