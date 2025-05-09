import React, { useState, useEffect } from 'react';
import './ConversionFactorTable.css';

// Default units for conversion factors
const unitOptions = ['L', 'MWh', 'GJ', 't', 'm³', 'kg'];

// Load conversion factors from localStorage
const getInitialData = () => {
  const savedData = localStorage.getItem('conversionFactorData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved conversion factor data:', e);
      return [];
    }
  }
  
  // Default seed data if nothing in localStorage - DEFRA values
  return [
    {
      id: 'conv.001',
      name: 'Diesel',
      source_unit: 'L',
      target_unit: 'kWh',
      conversion_factor: 10.7,
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.002',
      name: 'Petrol',
      source_unit: 'L',
      target_unit: 'kWh',
      conversion_factor: 9.5,
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.003',
      name: 'Coal',
      source_unit: 't',
      target_unit: 'kWh',
      conversion_factor: 6800,
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.004',
      name: 'Natural gas',
      source_unit: 'm³',
      target_unit: 'kWh',
      conversion_factor: 10.3,
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.005',
      name: 'LPG',
      source_unit: 'L',
      target_unit: 'kWh',
      conversion_factor: 7.1,
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.006',
      name: 'MWh to kWh',
      source_unit: 'MWh',
      target_unit: 'kWh',
      conversion_factor: 1000,
      source_comment: 'Standard conversion',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'conv.007',
      name: 'GJ to kWh',
      source_unit: 'GJ',
      target_unit: 'kWh',
      conversion_factor: 277.778,
      source_comment: 'Standard conversion',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

function ConversionFactorTable() {
  const [conversionFactors, setConversionFactors] = useState(getInitialData);
  const [editingFactor, setEditingFactor] = useState(null);
  const [newFactorForm, setNewFactorForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    source_unit: 'L',
    target_unit: 'kWh', // Always kWh as target
    conversion_factor: '',
    source_comment: ''
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('conversionFactorData', JSON.stringify(conversionFactors));
    // Dispatch a storage event so other components can react to the change
    window.dispatchEvent(new Event('storage'));
  }, [conversionFactors]);

  // Check for reset flag on mount and storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Check for reset flag
      if (localStorage.getItem('resetConversionFactors') === 'true') {
        console.log('Reset conversion factors flag detected, resetting data...');
        localStorage.removeItem('conversionFactorData');
        setConversionFactors(getInitialData());
        localStorage.removeItem('resetConversionFactors');
      }
    };

    // Initial check for reset flag on mount
    if (localStorage.getItem('resetConversionFactors') === 'true') {
      console.log('Reset conversion factors flag detected on mount, resetting data...');
      localStorage.removeItem('conversionFactorData');
      setConversionFactors(getInitialData());
      localStorage.removeItem('resetConversionFactors');
    }

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Reset data to seed values
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all conversion factors to default values? This cannot be undone.')) {
      localStorage.removeItem('conversionFactorData');
      setConversionFactors(getInitialData());
      setEditingFactor(null);
      setNewFactorForm(false);
    }
  };

  // Handle opening the edit form for a conversion factor
  const handleEditClick = (factor) => {
    setEditingFactor(factor);
    setFormData({
      name: factor.name,
      source_unit: factor.source_unit,
      target_unit: 'kWh', // Always kWh
      conversion_factor: factor.conversion_factor,
      source_comment: factor.source_comment || ''
    });
    setNewFactorForm(false);
  };

  // Handle opening the "add new" form
  const handleAddClick = () => {
    setNewFactorForm(true);
    setFormData({
      name: '',
      source_unit: 'L',
      target_unit: 'kWh',
      conversion_factor: '',
      source_comment: ''
    });
    setEditingFactor(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'conversion_factor') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle save for edited conversion factor
  const handleSaveEdit = () => {
    if (!formData.name || formData.conversion_factor === '') {
      alert('Name and Conversion Factor are required');
      return;
    }

    if (editingFactor) {
      const updatedFactors = conversionFactors.map(cf => {
        if (cf.id === editingFactor.id) {
          return {
            ...cf,
            name: formData.name,
            source_unit: formData.source_unit,
            target_unit: 'kWh',
            conversion_factor: parseFloat(formData.conversion_factor),
            source_comment: formData.source_comment,
            updated_at: new Date().toISOString()
          };
        }
        return cf;
      });
      
      setConversionFactors(updatedFactors);
      setEditingFactor(null);
    }
  };

  // Generate a new sequential ID in the format "conv.XXX"
  const generateNewId = () => {
    // Find the highest existing ID number
    const idNumbers = conversionFactors.map(cf => {
      const match = cf.id.match(/conv\.(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxId = Math.max(...idNumbers, 0);
    const newIdNumber = maxId + 1;
    
    // Format with leading zeros (e.g., conv.001, conv.012, conv.123)
    return `conv.${newIdNumber.toString().padStart(3, '0')}`;
  };

  // Handle save for new conversion factor
  const handleSaveNew = () => {
    if (!formData.name || formData.conversion_factor === '') {
      alert('Name and Conversion Factor are required');
      return;
    }

    const newFactor = {
      id: generateNewId(),
      name: formData.name,
      source_unit: formData.source_unit,
      target_unit: 'kWh',
      conversion_factor: parseFloat(formData.conversion_factor),
      source_comment: formData.source_comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setConversionFactors([...conversionFactors, newFactor]);
    setNewFactorForm(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditingFactor(null);
    setNewFactorForm(false);
  };

  // Handle delete conversion factor
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this conversion factor?')) {
      setConversionFactors(conversionFactors.filter(cf => cf.id !== id));
    }
  };

  // Render the conversion factor edit/add form
  const renderForm = () => {
    if (!editingFactor && !newFactorForm) return null;
    
    return (
      <div className="form-overlay">
        <div className="form-container">
          <h3>{editingFactor ? 'Edit Conversion Factor' : 'Add New Conversion Factor'}</h3>
          
          <div className="form-group">
            <label>ID:</label>
            <input
              type="text"
              value={editingFactor?.id || 'Auto-generated'}
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
              placeholder="e.g., Diesel, Natural gas, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Source Unit:</label>
            <select
              name="source_unit"
              value={formData.source_unit}
              onChange={handleInputChange}
              className="form-control"
            >
              {unitOptions.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Target Unit:</label>
            <input
              type="text"
              value="kWh"
              disabled
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Conversion Factor ({formData.source_unit} to kWh):</label>
            <input
              type="number"
              name="conversion_factor"
              value={formData.conversion_factor}
              onChange={handleInputChange}
              required
              step="0.001"
              className="form-control"
              placeholder="e.g., 10.7"
            />
          </div>
          
          <div className="form-group">
            <label>Source Comment:</label>
            <input
              type="text"
              name="source_comment"
              value={formData.source_comment}
              onChange={handleInputChange}
              className="form-control"
              placeholder="e.g., DEFRA 2024, IPCC 2021, etc."
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleCancel} className="cancel-button">Cancel</button>
            <button 
              onClick={editingFactor ? handleSaveEdit : handleSaveNew}
              className="save-button"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="conversion-factor-table-container">
      <div className="table-header">
        <h2>Conversion Factors</h2>
        <div>
          <button className="reset-button" onClick={handleResetData} title="Reset to default conversion factors">
            Reset Data
          </button>
          <button className="add-button" onClick={handleAddClick}>
            New
          </button>
        </div>
      </div>
      
      <table className="conversion-factor-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Conversion</th>
            <th>Source</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {conversionFactors.map(factor => (
            <tr key={factor.id}>
              <td>{factor.id}</td>
              <td>{factor.name}</td>
              <td>1 {factor.source_unit} = {factor.conversion_factor} kWh</td>
              <td>{factor.source_comment || '-'}</td>
              <td className="actions">
                <button onClick={() => handleEditClick(factor)}>✎</button>
                <button onClick={() => handleDelete(factor.id)} className="delete">×</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Render the form as a modal popup */}
      {renderForm()}
    </div>
  );
}

export default ConversionFactorTable; 