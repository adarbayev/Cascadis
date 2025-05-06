import React, { useState, useEffect } from 'react';
import './IndicatorTable.css';

// Default units for the dropdown
const unitOptions = ['kWh', 'MWh', 'GJ', 'L', 'm³', 'kg', 't', 'm²', 'USD'];

// Default scope tags for grouping
const scopeTags = ['general', 'scope1', 'scope2'];

// Load emission factors from localStorage
const getEmissionFactors = () => {
  const savedData = localStorage.getItem('emissionFactorData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved emission factor data:', e);
      return [];
    }
  }
  return [];
};

// Load conversion factors from localStorage
const getConversionFactors = () => {
  const savedData = localStorage.getItem('conversionFactorData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved conversion factor data:', e);
      return [];
    }
  }
  return [];
};

// Check if data needs to be migrated from UUID to sequential IDs
const needsMigration = () => {
  const savedData = localStorage.getItem('indicatorData');
  if (!savedData) return false;
  
  try {
    const data = JSON.parse(savedData);
    // Check if any ID doesn't match our ind.XXX pattern
    return data.some(ind => !ind.id.match(/^ind\.\d{3}$/));
  } catch (e) {
    return false;
  }
};

// Reset localStorage data to force regeneration with sequential IDs
if (needsMigration()) {
  console.log('Migrating indicator data from UUIDs to sequential IDs');
  localStorage.removeItem('indicatorData');
}

// Load data from localStorage or use default seed data
const getInitialData = () => {
  const savedData = localStorage.getItem('indicatorData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved indicator data:', e);
    }
  }
  
  // Get emission factors for default mappings
  const emissionFactors = getEmissionFactors();
  
  // Helper function to find matching emission factor
  const findMatchingFactorId = (indicatorName) => {
    const normalizedName = indicatorName.toLowerCase();
    
    // Look for emission factors with similar names
    const matchingFactor = emissionFactors.find(ef => {
      const efName = ef.name.toLowerCase();
      return (
        (normalizedName.includes('diesel') && efName.includes('diesel')) ||
        (normalizedName.includes('petrol') && efName.includes('petrol')) ||
        (normalizedName.includes('coal') && efName.includes('coal')) ||
        (normalizedName.includes('natural gas') && efName.includes('natural gas')) ||
        (normalizedName === 'electricity' && efName.includes('electricity')) ||
        (normalizedName.includes('district heat') && efName.includes('heat')) ||
        (normalizedName === 'steam' && efName.includes('steam')) ||
        (normalizedName === 'cooling' && efName.includes('cooling'))
      );
    });
    
    return matchingFactor ? matchingFactor.id : null;
  };

  // Helper function to find matching conversion factor
  const findMatchingConversionId = (indicatorName, defaultUnit) => {
    const normalizedName = indicatorName.toLowerCase();
    const conversionFactors = getConversionFactors();
    
    // Look for conversion factors with similar names and matching units
    const matchingFactor = conversionFactors.find(cf => {
      const cfName = cf.name.toLowerCase();
      return (
        ((normalizedName.includes('diesel') && cfName.includes('diesel')) ||
        (normalizedName.includes('petrol') && cfName.includes('petrol')) ||
        (normalizedName.includes('coal') && cfName.includes('coal')) ||
        (normalizedName.includes('natural gas') && cfName.includes('natural gas')) ||
        (normalizedName.includes('lpg') && cfName.includes('lpg'))) &&
        cf.source_unit === defaultUnit
      );
    });
    
    // For unit conversions
    if (!matchingFactor && defaultUnit !== 'kWh') {
      const unitConversion = conversionFactors.find(cf => 
        cf.name.toLowerCase().includes(defaultUnit.toLowerCase()) && 
        cf.source_unit === defaultUnit
      );
      
      if (unitConversion) {
        return unitConversion.id;
      }
    }
    
    return matchingFactor ? matchingFactor.id : null;
  };
  
  // Default seed data if nothing in localStorage
  return [
    // Scope 1 indicators
    {
      id: 'ind.001',
      name: 'Diesel',
      scope_tag: 'scope1',
      default_unit: 'L',
      conversion_factor_id: findMatchingConversionId('Diesel', 'L'),
      emission_factor_id: findMatchingFactorId('Diesel'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.002',
      name: 'Petrol',
      scope_tag: 'scope1',
      default_unit: 'L',
      conversion_factor_id: findMatchingConversionId('Petrol', 'L'),
      emission_factor_id: findMatchingFactorId('Petrol'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.003',
      name: 'Coal',
      scope_tag: 'scope1',
      default_unit: 't',
      conversion_factor_id: findMatchingConversionId('Coal', 't'),
      emission_factor_id: findMatchingFactorId('Coal'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.004',
      name: 'Natural gas',
      scope_tag: 'scope1',
      default_unit: 'm³',
      conversion_factor_id: findMatchingConversionId('Natural gas', 'm³'),
      emission_factor_id: findMatchingFactorId('Natural gas'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Scope 2 indicators
    {
      id: 'ind.005',
      name: 'Electricity',
      scope_tag: 'scope2',
      default_unit: 'kWh',
      conversion_factor_id: null, // Already in kWh
      emission_factor_id: findMatchingFactorId('Electricity'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.006',
      name: 'District heat',
      scope_tag: 'scope2',
      default_unit: 'kWh',
      conversion_factor_id: null, // Already in kWh
      emission_factor_id: findMatchingFactorId('District heat'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.007',
      name: 'Steam',
      scope_tag: 'scope2',
      default_unit: 'kWh',
      conversion_factor_id: null, // Already in kWh
      emission_factor_id: findMatchingFactorId('Steam'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.008',
      name: 'Cooling',
      scope_tag: 'scope2',
      default_unit: 'kWh',
      conversion_factor_id: null, // Already in kWh
      emission_factor_id: findMatchingFactorId('Cooling'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // General indicators
    {
      id: 'ind.009',
      name: 'Production output',
      scope_tag: 'general',
      default_unit: 't',
      conversion_factor_id: null, // No conversion needed
      emission_factor_id: null, // No emission factor for this
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.010',
      name: 'Revenue',
      scope_tag: 'general',
      default_unit: 'USD',
      conversion_factor_id: null, // No conversion needed
      emission_factor_id: null, // No emission factor for this
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ind.011',
      name: 'Floor area',
      scope_tag: 'general',
      default_unit: 'm²',
      conversion_factor_id: null, // No conversion needed
      emission_factor_id: null, // No emission factor for this
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

// Helper function to remap all indicators to emission factors
const remapIndicatorsToEmissionFactors = (indicators, emissionFactors) => {
  // Helper function to find matching emission factor
  const findMatchingFactorId = (indicatorName) => {
    const normalizedName = indicatorName.toLowerCase();
    const matchingFactor = emissionFactors.find(ef => {
      const efName = ef.name.toLowerCase();
      return (
        (normalizedName.includes('diesel') && efName.includes('diesel')) ||
        (normalizedName.includes('petrol') && efName.includes('petrol')) ||
        (normalizedName.includes('coal') && efName.includes('coal')) ||
        (normalizedName.includes('natural gas') && efName.includes('natural gas')) ||
        (normalizedName === 'electricity' && efName.includes('electricity')) ||
        (normalizedName.includes('district heat') && efName.includes('heat')) ||
        (normalizedName === 'steam' && efName.includes('steam')) ||
        (normalizedName === 'cooling' && efName.includes('cooling'))
      );
    });
    return matchingFactor ? matchingFactor.id : null;
  };
  return indicators.map(ind => {
    // Only remap if scope1 or scope2
    if (ind.scope_tag === 'scope1' || ind.scope_tag === 'scope2') {
      const newEfId = findMatchingFactorId(ind.name);
      return { ...ind, emission_factor_id: newEfId };
    }
    return ind;
  });
};

function IndicatorTable() {
  const [indicators, setIndicators] = useState(getInitialData);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [newIndicatorForm, setNewIndicatorForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    scope_tag: 'general',
    default_unit: 'kWh',
    conversion_factor_id: null,
    emission_factor_id: null
  });
  const [emissionFactors, setEmissionFactors] = useState(getEmissionFactors());
  const [conversionFactors, setConversionFactors] = useState(getConversionFactors());

  // Remap indicators to emission factors on mount or when emission factors change
  useEffect(() => {
    const remapped = remapIndicatorsToEmissionFactors(indicators, emissionFactors);
    setIndicators(remapped);
    localStorage.setItem('indicatorData', JSON.stringify(remapped));
  }, [emissionFactors]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('indicatorData', JSON.stringify(indicators));
    // Dispatch a storage event so other components can react to the change
    window.dispatchEvent(new Event('storage'));
  }, [indicators]);

  // Load emission factors and conversion factors whenever localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setEmissionFactors(getEmissionFactors());
      setConversionFactors(getConversionFactors());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reset data to seed values
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all indicators to default values? This cannot be undone.')) {
      localStorage.removeItem('indicatorData');
      setIndicators(getInitialData());
      setEditingIndicator(null);
      setNewIndicatorForm(false);
    }
  };

  // Handle opening the edit form for an indicator
  const handleEditClick = (indicator) => {
    setEditingIndicator(indicator);
    setFormData({
      name: indicator.name,
      scope_tag: indicator.scope_tag,
      default_unit: indicator.default_unit,
      conversion_factor_id: indicator.conversion_factor_id || null,
      emission_factor_id: indicator.emission_factor_id || null
    });
    setNewIndicatorForm(false);
  };

  // Handle dropdown click to open it
  const handleDropdownClick = (e) => {
    const select = e.target;
    select.size = 6; // Show 6 options when clicking
    
    // Add event to close when focus is lost
    const handleBlur = () => {
      select.size = 1;
      select.removeEventListener('blur', handleBlur);
    };
    
    select.addEventListener('blur', handleBlur);
  };

  // Handle opening the "add new" form
  const handleAddClick = () => {
    setNewIndicatorForm(true);
    setFormData({
      name: '',
      scope_tag: 'general',
      default_unit: 'kWh',
      conversion_factor_id: null,
      emission_factor_id: null
    });
    setEditingIndicator(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // If unit changes, try to find matching conversion factor
    if (name === 'default_unit') {
      const matchingConversionFactor = conversionFactors.find(cf => 
        cf.source_unit === value && 
        cf.name.toLowerCase().includes(value.toLowerCase())
      );
      
      if (matchingConversionFactor) {
        setFormData(prev => ({
          ...prev,
          conversion_factor_id: matchingConversionFactor.id
        }));
      } else if (value === 'kWh') {
        // No conversion needed for kWh
        setFormData(prev => ({
          ...prev,
          conversion_factor_id: null
        }));
      }
    }
  };

  // Find conversion factor by ID
  const getConversionFactorById = (id) => {
    if (!id) return null;
    return conversionFactors.find(cf => cf.id === id);
  };

  // Handle save for edited indicator
  const handleSaveEdit = () => {
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    if (editingIndicator) {
      const updatedIndicators = indicators.map(ind => {
        if (ind.id === editingIndicator.id) {
          return {
            ...ind,
            name: formData.name,
            scope_tag: formData.scope_tag,
            default_unit: formData.default_unit,
            conversion_factor_id: formData.conversion_factor_id,
            emission_factor_id: formData.emission_factor_id,
            updated_at: new Date().toISOString()
          };
        }
        return ind;
      });
      
      setIndicators(updatedIndicators);
      setEditingIndicator(null);
    }
  };

  // Generate a new sequential ID in the format "ind.XXX"
  const generateNewId = () => {
    // Find the highest existing ID number
    const idNumbers = indicators.map(ind => {
      const match = ind.id.match(/ind\.(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxId = Math.max(...idNumbers, 0);
    const newIdNumber = maxId + 1;
    
    // Format with leading zeros (e.g., ind.001, ind.012, ind.123)
    return `ind.${newIdNumber.toString().padStart(3, '0')}`;
  };

  // Handle save for new indicator
  const handleSaveNew = () => {
    if (!formData.name) {
      alert('Name is required');
      return;
    }

    const newIndicator = {
      id: generateNewId(),
      name: formData.name,
      scope_tag: formData.scope_tag,
      default_unit: formData.default_unit,
      conversion_factor_id: formData.conversion_factor_id,
      emission_factor_id: formData.emission_factor_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setIndicators([...indicators, newIndicator]);
    setNewIndicatorForm(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditingIndicator(null);
    setNewIndicatorForm(false);
  };

  // Handle delete indicator
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this indicator?')) {
      setIndicators(indicators.filter(ind => ind.id !== id));
    }
  };

  // Render the indicator edit/add form
  const renderForm = () => {
    if (!editingIndicator && !newIndicatorForm) return null;
    
    // Filter conversion factors based on selected unit
    const relevantConversionFactors = conversionFactors.filter(cf => 
      cf.source_unit === formData.default_unit
    );

    return (
      <div className="form-overlay">
        <div className="form-container">
          <h3>{editingIndicator ? 'Edit Indicator' : 'Add New Indicator'}</h3>
          
          <div className="form-group">
            <label>ID:</label>
            <input
              type="text"
              value={editingIndicator?.id || 'Auto-generated'}
              disabled
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Scope Tag:</label>
            <select
              name="scope_tag"
              value={formData.scope_tag}
              onChange={handleInputChange}
              className="form-control"
            >
              {scopeTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Default Unit:</label>
            <select
              name="default_unit"
              value={formData.default_unit}
              onChange={handleInputChange}
              className="form-control"
            >
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Conversion Factor:</label>
            <select
              name="conversion_factor_id"
              value={formData.conversion_factor_id || ''}
              onChange={handleInputChange}
              onClick={handleDropdownClick}
              className="form-control conversion-factor-select"
              size="1"
            >
              <option value="">None (No conversion to kWh needed)</option>
              {relevantConversionFactors.map(factor => {
                const conversionText = `1 ${factor.source_unit} = ${factor.conversion_factor} kWh`;
                return (
                  <option key={factor.id} value={factor.id}>
                    {factor.name} ({conversionText})
                  </option>
                );
              })}
            </select>
            {formData.default_unit !== 'kWh' && !formData.conversion_factor_id && (
              <div className="warning-text">
                Warning: No conversion to kWh selected. This may cause calculation issues.
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label>Emission Factor Mapping:</label>
            <select
              name="emission_factor_id"
              value={formData.emission_factor_id || ''}
              onChange={handleInputChange}
              onClick={handleDropdownClick}
              className="form-control emission-factor-select"
              size="1"
            >
              <option value="">None</option>
              {emissionFactors.map(factor => (
                <option key={factor.id} value={factor.id}>
                  {factor.name} ({factor.value.toFixed(2)} kg CO₂e/kWh)
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-actions">
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
            <button 
              onClick={editingIndicator ? handleSaveEdit : handleSaveNew}
              className="save-button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group indicators by scope_tag
  const groupedIndicators = {
    general: indicators.filter(ind => ind.scope_tag === 'general'),
    scope1: indicators.filter(ind => ind.scope_tag === 'scope1'),
    scope2: indicators.filter(ind => ind.scope_tag === 'scope2')
  };

  return (
    <div className="indicator-table-container">
      <div className="table-header">
        <h2>Indicators</h2>
        <div>
          <button className="reset-button" onClick={handleResetData} title="Reset to default indicators">
            Reset Data
          </button>
          <button className="add-button" onClick={handleAddClick}>
            New
          </button>
        </div>
      </div>
      
      {/* General Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">General Info</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.general.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
                <td className="actions">
                  <button onClick={() => handleEditClick(indicator)}>✎</button>
                  <button onClick={() => handleDelete(indicator.id)} className="delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Scope 1 Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">Scope 1</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.scope1.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
                <td className="actions">
                  <button onClick={() => handleEditClick(indicator)}>✎</button>
                  <button onClick={() => handleDelete(indicator.id)} className="delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Scope 2 Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">Scope 2</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.scope2.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
                <td className="actions">
                  <button onClick={() => handleEditClick(indicator)}>✎</button>
                  <button onClick={() => handleDelete(indicator.id)} className="delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Render the form as a modal popup */}
      {renderForm()}
    </div>
  );
}

export default IndicatorTable; 