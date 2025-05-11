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

// Function to get the org structure from localStorage
function getOrgStructure() {
  const saved = localStorage.getItem('orgStructureData');
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

// Helper: flatten org structure to get all nodes
function flattenNodes(nodes, arr = []) {
  if (!nodes || !Array.isArray(nodes)) return arr;
  
  nodes.forEach(node => {
    arr.push(node);
    if (node.children) flattenNodes(node.children, arr);
  });
  return arr;
}

// Function to set up node-indicator mappings with proper node type handling
function setupNodeIndicatorMapping() {
  const indicators = getIndicators();
  const currentMapping = getNodeIndicatorMapping();
  
  // Get all nodes from org structure
  const orgStructure = getOrgStructure();
  const allNodes = flattenNodes(orgStructure);
  
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
  
  // Create mappings for all nodes in the structure by node type
  const nodeIndicatorMapping = { ...currentMapping };
  
  allNodes.forEach(node => {
    if (node.type === 'Legal Entity') {
      // Legal entities get only revenue indicator
      nodeIndicatorMapping[node.id] = revenueIndicator;
    } else if (node.type === 'Site') {
      // Sites get scope1, scope2, and general indicators
      nodeIndicatorMapping[node.id] = [...scope1Indicators, ...scope2Indicators, ...generalIndicators];
    }
    // Group nodes don't need indicators
  });
  
  // Save to localStorage
  saveNodeIndicatorMapping(nodeIndicatorMapping);
  console.log('Default node-indicator mappings have been set up for all nodes.');
  
  return nodeIndicatorMapping;
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

// Function to save inventory years to localStorage
function saveInventoryYears(years) {
  localStorage.setItem('inventoryYears', JSON.stringify(years));
  console.log('Inventory years have been saved.');
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

// Pre-populate sample data for each indicator
function populateSampleData() {
  const years = getInventoryYears();
  const indicators = getIndicators();
  const orgNodes = flattenNodes(getOrgStructure());
  const mappings = getQuestionnaireMappings();
  const questionnaireData = {};
  
  // Only do this if no data exists yet
  const existingData = localStorage.getItem('questionnaireData');
  if (existingData && Object.keys(JSON.parse(existingData)).length > 0) {
    console.log('Questionnaire data already exists, skipping sample data generation');
    return;
  }
  
  // For each year and each node
  years.forEach(year => {
    const yearMapping = mappings[year.id] || {};
    
    orgNodes.forEach(node => {
      const indicatorIds = yearMapping[node.id] || [];
      const qKey = `${year.id}_${node.id}`;
      
      // Generate realistic sample data
      indicatorIds.forEach(indId => {
        const indicator = indicators.find(i => i.id === indId);
        if (!indicator) return;
        
        let value = 0;
        
        // Generate realistic values based on indicator type
        if (indicator.name === 'Revenue') {
          // Revenues in millions
          value = Math.floor(Math.random() * 100) + 20;
        } else if (indicator.name === 'Electricity') {
          // Electricity usage in kWh
          value = Math.floor(Math.random() * 50000) + 10000;
        } else if (indicator.name === 'Natural gas') {
          // Natural gas in m³
          value = Math.floor(Math.random() * 10000) + 1000;
        } else if (indicator.name === 'Diesel' || indicator.name === 'Petrol') {
          // Fuel in liters
          value = Math.floor(Math.random() * 5000) + 500;
        } else {
          // Other indicators
          value = Math.floor(Math.random() * 1000) + 100;
        }
        
        // Add to questionnaire data
        if (!questionnaireData[qKey]) {
          questionnaireData[qKey] = {};
        }
        
        questionnaireData[qKey][indId] = {
          value: value.toString(),
          unit: indicator.default_unit
        };
      });
    });
  });
  
  // Save to localStorage
  localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
  console.log('Sample data has been populated for all indicators');
}

// Reset and initialize all GHG framework data
function resetGHGFrameworkData() {
  // First, ensure the session flag is clear
  sessionStorage.removeItem('ghgFrameworkReset');
  
  // Clear all GHG framework data to force regeneration
  localStorage.removeItem('indicatorData');
  localStorage.removeItem('emissionFactorData');
  localStorage.removeItem('conversionFactorData');
  localStorage.removeItem('nodeIndicatorMapping');
  
  // Explicitly trigger table resets by setting special keys
  localStorage.setItem('resetIndicators', 'true');
  localStorage.setItem('resetEmissionFactors', 'true');
  localStorage.setItem('resetConversionFactors', 'true');
  
  console.log('GHG Framework data has been reset and will be regenerated');
  
  // Dispatch storage event to notify components
  window.dispatchEvent(new Event('storage'));
}

// Check if emission factors are mapped to indicators
function checkIndicatorMappings() {
  const indicators = getIndicators();
  const emissionFactors = JSON.parse(localStorage.getItem('emissionFactorData') || '[]');
  
  // Check if any indicators need mapping updates
  let needsUpdate = false;
  indicators.forEach(indicator => {
    // Skip indicators that don't need emission factors (like Revenue)
    if (indicator.name === 'Revenue') return;
    
    if (!indicator.emission_factor_id && emissionFactors.length > 0) {
      needsUpdate = true;
    }
  });
  
  if (needsUpdate) {
    console.log('Some indicators need emission factor mapping updates');
    // We could add logic here to remap indicators to emission factors
    // For now, we'll rely on IndicatorTable.js's existing functions
  }
}

// Function to set up questionnaire mappings for all inventory years
function setupQuestionnaireMappings() {
  const inventoryYears = getInventoryYears();
  const mappings = getQuestionnaireMappings();
  
  // Get the latest node-indicator mappings
  const nodeIndicatorMapping = setupNodeIndicatorMapping();
  
  // Create a default inventory year if none exists
  if (inventoryYears.length === 0) {
    const newYear = { id: 1, name: 'Inventory 2024', year: 2024 };
    const updatedYears = [newYear];
    saveInventoryYears(updatedYears);
    mappings[1] = JSON.parse(JSON.stringify(nodeIndicatorMapping));
  } else {
    // Update mappings for each inventory year
    inventoryYears.forEach(year => {
      if (!mappings[year.id]) {
        mappings[year.id] = JSON.parse(JSON.stringify(nodeIndicatorMapping));
      }
    });
  }
  
  // Save questionnaire mappings
  saveQuestionnaireMappings(mappings);
  console.log('Questionnaire mappings have been set up for all inventory years');
  
  // Initialize empty questionnaire data if not present
  const questionnaireData = JSON.parse(localStorage.getItem('questionnaireData') || '{}');
  localStorage.setItem('questionnaireData', JSON.stringify(questionnaireData));
}

// Check if we need to run initialization (for first time or after changes)
function shouldRunInitialization() {
  const initFlag = sessionStorage.getItem('initComplete');
  if (initFlag === 'true') {
    return false;
  }
  
  // We should also check if any critical data is missing
  const hasOrgData = localStorage.getItem('orgStructureData');
  const hasIndicators = localStorage.getItem('indicatorData');
  const hasNodeMappings = localStorage.getItem('nodeIndicatorMapping');
  const hasInventoryYears = localStorage.getItem('inventoryYears');
  const hasEmissionFactors = localStorage.getItem('emissionFactorData');
  const hasConversionFactors = localStorage.getItem('conversionFactorData');
  
  return !hasOrgData || !hasIndicators || !hasNodeMappings || !hasInventoryYears || 
         !hasEmissionFactors || !hasConversionFactors || 
         Object.keys(getQuestionnaireMappings()).length === 0;
}

// Function to initialize all mappings
function initializeAllMappings() {
  console.log('Initializing all mappings...');
  
  // Use a persistent flag to prevent infinite reloads
  const firstTimeSetupComplete = localStorage.getItem('firstTimeSetupComplete');
  const isFirstTimeUser = !localStorage.getItem('orgStructureData') && !firstTimeSetupComplete;
  
  if (isFirstTimeUser) {
    console.log('First-time user detected. Performing complete setup...');
    // Reset all data tables to ensure default data
    resetGHGFrameworkData();
    
    // We need to wait a bit for the tables to reset and initialize
    setTimeout(() => {
      // Now setup the node indicator mappings with the fresh data
      setupNodeIndicatorMapping();
      
      // Setup questionnaire mappings
      setupQuestionnaireMappings();
      
      // Generate sample data
      populateSampleData();
      
      // Mark initialization as complete (persistent flag)
      localStorage.setItem('firstTimeSetupComplete', 'true');
      sessionStorage.setItem('initComplete', 'true');
      
      console.log('First-time setup completed successfully!');
      
      // Force a page reload to ensure everything is loaded properly
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1000); // 1 second delay to allow table resets to complete
    
    return; // Exit early
  }
  
  // For returning users with missing data
  if (shouldRunInitialization()) {
    console.log('Incomplete data detected. Performing necessary setup...');
    
    // Check if GHG framework data is missing
    const hasEmissionFactors = localStorage.getItem('emissionFactorData');
    const hasConversionFactors = localStorage.getItem('conversionFactorData');
    const hasIndicators = localStorage.getItem('indicatorData');
    
    if (!hasEmissionFactors || !hasConversionFactors || !hasIndicators) {
      resetGHGFrameworkData();
    }
    
    // Setup node-indicator mapping
  setupNodeIndicatorMapping();
    
    // Setup questionnaire mappings
  setupQuestionnaireMappings();
    
    // Check indicator mappings
    checkIndicatorMappings();
    
    // Mark initialization as complete for this session
    sessionStorage.setItem('initComplete', 'true');
  } else {
    console.log('Initialization already complete, skipping');
  }
  
  console.log('All mappings initialized successfully!');
}

// Execute setup
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.setupDefaultMapping = initializeAllMappings;
  
  // Auto-run on script load
  initializeAllMappings();
  
  // Also add a listener to localStorage changes that might require re-initialization
  window.addEventListener('storage', function(e) {
    if (e.key === 'clearInit' && e.newValue === 'true') {
      sessionStorage.removeItem('initComplete');
      initializeAllMappings();
      localStorage.removeItem('clearInit');
    }
  });
}

export { initializeAllMappings, setupNodeIndicatorMapping, setupQuestionnaireMappings }; 