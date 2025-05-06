import React, { useState, useEffect } from 'react';
import './EmissionFactorTable.css';

// Default scope tags for grouping
const scopeTags = ['scope1', 'scope2', 'interdimensional'];

// Check if data needs to be migrated
const needsMigration = () => {
  const savedData = localStorage.getItem('emissionFactorData');
  if (!savedData) return false;
  
  try {
    const data = JSON.parse(savedData);
    // Check if any ID doesn't match our ef.XXX pattern or if any record doesn't have a source_comment
    return data.some(ef => !ef.id.match(/^ef\.\d{3}$/) || ef.source_comment === undefined);
  } catch (e) {
    return false;
  }
};

// Reset localStorage data if needed
if (needsMigration()) {
  console.log('Migrating emission factor data');
  localStorage.removeItem('emissionFactorData');
}

// Load data from localStorage or use default seed data
const getInitialData = () => {
  const savedData = localStorage.getItem('emissionFactorData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved emission factor data:', e);
    }
  }
  
  // Default seed data if nothing in localStorage
  return [
    // Scope 1 emission factors with updated values
    {
      id: 'ef.001',
      name: 'Diesel (1L)',
      value: 2.66, // kg CO2e per kWh
      scope_tag: 'scope1',
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.002',
      name: 'Petrol (1L)',
      value: 2.33, // kg CO2e per kWh
      scope_tag: 'scope1',
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.003',
      name: 'Coal (1t)',
      value: 2399.43, // kg CO2e per kWh
      scope_tag: 'scope1',
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.004',
      name: 'Natural gas (1m³)',
      value: 2.02, // kg CO2e per kWh
      scope_tag: 'scope1',
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.005',
      name: 'LPG',
      value: 1.55537, // kg CO2e per liter
      scope_tag: 'scope1',
      source_comment: 'DEFRA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Scope 2 emission factors with IEA values
    {
      id: 'ef.006',
      name: 'IEA Electricity',
      value: 0.511, // kg CO2e per kWh (IEA as specified)
      scope_tag: 'scope2',
      source_comment: 'IEA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.007',
      name: 'IEA District heat',
      value: 0.250, // kg CO2e per kWh (representative IEA value)
      scope_tag: 'scope2',
      source_comment: 'IEA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.008',
      name: 'IEA Steam',
      value: 0.270, // kg CO2e per kWh (representative IEA value)
      scope_tag: 'scope2',
      source_comment: 'IEA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.009',
      name: 'IEA Cooling',
      value: 0.185, // kg CO2e per kWh (representative IEA value)
      scope_tag: 'scope2',
      source_comment: 'IEA 2024',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Interdimensional emission factors (representative values)
    {
      id: 'ef.010',
      name: 'Biofuel mix factor',
      value: 0.120, // kg CO2e per kWh (representative value)
      scope_tag: 'interdimensional',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'ef.011',
      name: 'Cross-border electricity factor',
      value: 0.322, // kg CO2e per kWh (representative value)
      scope_tag: 'interdimensional',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

function EmissionFactorTable() {
  const [emissionFactors, setEmissionFactors] = useState(getInitialData);
  const [editingFactor, setEditingFactor] = useState(null);
  const [newFactorForm, setNewFactorForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    scope_tag: 'scope1',
    source_comment: ''
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('emissionFactorData', JSON.stringify(emissionFactors));
    // Dispatch a storage event so other components can react to the change
    window.dispatchEvent(new Event('storage'));
  }, [emissionFactors]);

  // Reset data to seed values
  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset all emission factors to default values? This cannot be undone.')) {
      localStorage.removeItem('emissionFactorData');
      setEmissionFactors(getInitialData());
      setEditingFactor(null);
      setNewFactorForm(false);
    }
  };

  // Handle opening the edit form for an emission factor
  const handleEditClick = (factor) => {
    setEditingFactor(factor);
    setFormData({
      name: factor.name,
      value: factor.value,
      scope_tag: factor.scope_tag,
      source_comment: factor.source_comment || ''
    });
    setNewFactorForm(false);
  };

  // Handle opening the "add new" form
  const handleAddClick = () => {
    setNewFactorForm(true);
    setFormData({
      name: '',
      value: '',
      scope_tag: 'scope1',
      source_comment: ''
    });
    setEditingFactor(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'value') {
      setFormData((prev) => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle save for edited emission factor
  const handleSaveEdit = () => {
    if (!formData.name || formData.value === '') {
      alert('Name and Value are required');
      return;
    }

    if (editingFactor) {
      const updatedFactors = emissionFactors.map(ef => {
        if (ef.id === editingFactor.id) {
          return {
            ...ef,
            name: formData.name,
            value: parseFloat(formData.value),
            scope_tag: formData.scope_tag,
            source_comment: formData.source_comment,
            updated_at: new Date().toISOString()
          };
        }
        return ef;
      });
      
      setEmissionFactors(updatedFactors);
      setEditingFactor(null);
    }
  };

  // Generate a new sequential ID in the format "ef.XXX"
  const generateNewId = () => {
    // Find the highest existing ID number
    const idNumbers = emissionFactors.map(ef => {
      const match = ef.id.match(/ef\.(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    const maxId = Math.max(...idNumbers, 0);
    const newIdNumber = maxId + 1;
    
    // Format with leading zeros (e.g., ef.001, ef.012, ef.123)
    return `ef.${newIdNumber.toString().padStart(3, '0')}`;
  };

  // Handle save for new emission factor
  const handleSaveNew = () => {
    if (!formData.name || formData.value === '') {
      alert('Name and Value are required');
      return;
    }

    const newFactor = {
      id: generateNewId(),
      name: formData.name,
      value: parseFloat(formData.value),
      scope_tag: formData.scope_tag,
      source_comment: formData.source_comment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setEmissionFactors([...emissionFactors, newFactor]);
    setNewFactorForm(false);
  };

  // Handle cancel button click
  const handleCancel = () => {
    setEditingFactor(null);
    setNewFactorForm(false);
  };

  // Handle delete emission factor
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this emission factor?')) {
      setEmissionFactors(emissionFactors.filter(ef => ef.id !== id));
    }
  };

  // Render the emission factor edit/add form
  const renderForm = () => {
    if (!editingFactor && !newFactorForm) return null;
    
    return (
      <div className="form-overlay">
        <div className="form-container">
          <h3>{editingFactor ? 'Edit Emission Factor' : 'Add New Emission Factor'}</h3>
          
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
              placeholder="e.g., EU diesel factor 2024"
            />
          </div>
          
          <div className="form-group">
            <label>Value (kg CO₂e per kWh):</label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              required
              step="0.001"
              className="form-control"
              placeholder="e.g., 267.000"
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
            <label>Unit:</label>
            <input
              type="text"
              value="kg CO₂e / kWh"
              disabled
              className="form-control"
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
              placeholder="e.g., DEFRA 2024, IEA 2024, etc."
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

  // Group emission factors by scope_tag
  const groupedFactors = {
    scope1: emissionFactors.filter(ef => ef.scope_tag === 'scope1'),
    scope2: emissionFactors.filter(ef => ef.scope_tag === 'scope2'),
    interdimensional: emissionFactors.filter(ef => ef.scope_tag === 'interdimensional')
  };

  return (
    <div className="emission-factor-table-container">
      <div className="table-header">
        <h2>Emission Factors</h2>
        <div>
          <button className="reset-button" onClick={handleResetData} title="Reset to default emission factors">
            Reset Data
          </button>
          <button className="add-button" onClick={handleAddClick}>
            New
          </button>
        </div>
      </div>
      
      {/* Scope 1 Emission Factors */}
      <div className="emission-factor-section">
        <h3 className="section-header">Scope 1</h3>
        <table className="emission-factor-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedFactors.scope1.map(factor => (
              <tr key={factor.id}>
                <td>{factor.id}</td>
                <td>{factor.name}</td>
                <td>{factor.value.toFixed(3)}</td>
                <td>kg CO₂e / kWh</td>
                <td>{factor.source_comment || '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEditClick(factor)}>✎</button>
                  <button onClick={() => handleDelete(factor.id)} className="delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Scope 2 Emission Factors */}
      <div className="emission-factor-section">
        <h3 className="section-header">Scope 2</h3>
        <table className="emission-factor-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedFactors.scope2.map(factor => (
              <tr key={factor.id}>
                <td>{factor.id}</td>
                <td>{factor.name}</td>
                <td>{factor.value.toFixed(3)}</td>
                <td>kg CO₂e / kWh</td>
                <td>{factor.source_comment || '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEditClick(factor)}>✎</button>
                  <button onClick={() => handleDelete(factor.id)} className="delete">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Interdimensional Emission Factors */}
      <div className="emission-factor-section">
        <h3 className="section-header">Interdimensional</h3>
        <table className="emission-factor-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedFactors.interdimensional.map(factor => (
              <tr key={factor.id}>
                <td>{factor.id}</td>
                <td>{factor.name}</td>
                <td>{factor.value.toFixed(3)}</td>
                <td>kg CO₂e / kWh</td>
                <td>{factor.source_comment || '-'}</td>
                <td className="actions">
                  <button onClick={() => handleEditClick(factor)}>✎</button>
                  <button onClick={() => handleDelete(factor.id)} className="delete">×</button>
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

export default EmissionFactorTable; 