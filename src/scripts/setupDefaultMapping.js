// Script to set up default node-indicator mapping for NAT OIL GROUP
// This script will run on initialization to ensure proper mapping of indicators to nodes

// Function to get all indicators from localStorage
function getIndicators() {
  const saved = localStorage.getItem('indicatorData');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (e) { return []; }
  }
  return [];
}

// Function to get node-indicator mapping from localStorage
function getNodeIndicatorMapping() {
  const saved = localStorage.getItem('nodeIndicatorMapping');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (e) { return {}; }
  }
  return {};
}

// Function to save node-indicator mapping to localStorage
function saveNodeIndicatorMapping(mapping) {
  localStorage.setItem('nodeIndicatorMapping', JSON.stringify(mapping));
  console.log('Node-indicator mappings have been saved.');
  
  // Dispatch a storage event so other components can react to the change
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
  }
}

// Function to set up node-indicator mappings
function setupNodeIndicatorMapping() {
  const indicators = getIndicators();
  const currentMapping = getNodeIndicatorMapping();
  
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
    's4': [...scope1Indicators, ...scope2Indicators, ...generalIndicators],
    
    // Keep any existing mappings
    ...currentMapping
  };
  
  // Save to localStorage
  saveNodeIndicatorMapping(nodeIndicatorMapping);
  console.log('Default node-indicator mappings have been set up.');
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
  console.log('Questionnaire mappings have been saved.');
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

// Function to initialize all mappings
function initializeAllMappings() {
  console.log('Initializing all mappings...');
  setupNodeIndicatorMapping();
  setupQuestionnaireMappings();
  console.log('All mappings initialized successfully!');
}

// Execute setup
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.setupDefaultMapping = initializeAllMappings;
  
  // Auto-run on script load
  initializeAllMappings();
}

export { initializeAllMappings, setupNodeIndicatorMapping, setupQuestionnaireMappings }; 