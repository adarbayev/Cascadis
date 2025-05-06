import React, { useState } from 'react';
import './PageStyles.css';

const OrgSetupPage = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to get inventory years from localStorage
  const getInventoryYears = () => {
    const saved = localStorage.getItem('inventoryYears');
    if (saved) {
      try { return JSON.parse(saved); } 
      catch (e) { return []; }
    }
    return [];
  };

  // Function to get questionnaire mappings from localStorage
  const getQuestionnaireMappings = () => {
    const saved = localStorage.getItem('questionnaireMappings');
    if (saved) {
      try { return JSON.parse(saved); } 
      catch (e) { return {}; }
    }
    return {};
  };

  // Function to save questionnaire mappings to localStorage
  const saveQuestionnaireMappings = (mappings) => {
    localStorage.setItem('questionnaireMappings', JSON.stringify(mappings));
  };

  // Function to set up the NAT OIL GROUP organization structure
  const setupNatOilGroup = () => {
    setLoading(true);
    try {
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
      
      // Set up node-indicator mappings
      setupNodeIndicatorMapping();
      
      // Set up questionnaire mappings for all inventory years
      setupQuestionnaireMappings();
      
      setMessage('NAT OIL GROUP organization structure has been set up successfully!');
    } catch (error) {
      setMessage(`Error setting up organization structure: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to get all indicators from localStorage
  const getIndicators = () => {
    const saved = localStorage.getItem('indicatorData');
    if (saved) {
      try { return JSON.parse(saved); } 
      catch (e) { return []; }
    }
    return [];
  };

  // Function to set up node-indicator mappings
  const setupNodeIndicatorMapping = () => {
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
  };
  
  // Function to set up questionnaire mappings for all inventory years
  const setupQuestionnaireMappings = () => {
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
  };
  
  return (
    <div className="page-container">
      <h1 className="page-title">Organization Setup</h1>
      <div className="page-content">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2>NAT OIL GROUP Setup</h2>
            <p>
              This will create a new organization structure for NAT OIL GROUP with two legal entities 
              (NAT OIL WEST and NAT OIL EAST) and their respective sites located in Romania and Kazakhstan.
            </p>
            <p><strong>Warning:</strong> This will replace any existing organization structure data.</p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <button 
              onClick={setupNatOilGroup}
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#0066CC',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Setting up...' : 'Setup NAT OIL GROUP'}
            </button>
          </div>
          
          {message && (
            <div style={{ 
              padding: '15px', 
              marginTop: '20px',
              borderRadius: '4px',
              backgroundColor: message.includes('Error') ? '#FEE2E2' : '#ECFDF5',
              color: message.includes('Error') ? '#B91C1C' : '#065F46',
              border: `1px solid ${message.includes('Error') ? '#F87171' : '#6EE7B7'}`
            }}>
              {message}
            </div>
          )}
          
          <div style={{ marginTop: '40px' }}>
            <h3>Organization Structure Preview</h3>
            <div style={{ backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '6px' }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {`
NAT OIL GROUP (Group)
├── NAT OIL WEST (Legal Entity)
│   ├── NAT OIL WEST OFFICE (Site) - Romania
│   └── NAT OIL WEST FIELD (Site) - Romania
└── NAT OIL EAST (Legal Entity)
    ├── NAT OIL EAST OFFICE (Site) - Kazakhstan
    └── NAT OIL EAST FIELD (Site) - Kazakhstan
                `}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgSetupPage; 