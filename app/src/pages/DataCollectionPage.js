import React, { useState } from 'react';
import './PageStyles.css';
import { ORG_STRUCTURE, INDICATORS, NODE_INDICATOR_MAPPING, INVENTORY_YEARS, QUESTIONNAIRE_DATA, CONVERSION_FACTORS, EMISSION_FACTORS } from '../demoData';

// Helper to format number string with spaces as thousands separator
const formatNumberWithSpaces = (numStr) => {
  let valueAsString = String(numStr).trim();
  if (valueAsString === '') return '';

  // Check if the string, after removing ALL internal spaces, is a valid number
  const cleanedValueForTest = valueAsString.replace(/\s/g, '');
  if (cleanedValueForTest === '' || isNaN(parseFloat(cleanedValueForTest))) {
    return valueAsString; // Not a number or empty after cleaning, return original (trimmed)
  }

  // Proceed with formatting using the cleaned value for splitting, to handle inputs like "123 45.67"
  const [integerPart, decimalPart] = cleanedValueForTest.split('.');
  const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;
};

// Helper to parse a formatted number string (with spaces) back to a plain number string
const parseFormattedNumber = (formattedStr) => {
  if (formattedStr === null || formattedStr === undefined) return '';
  return String(formattedStr).replace(/\s/g, ''); // Remove all spaces
};

const flattenNodes = (nodes, arr = []) => {
  nodes.forEach(node => {
    arr.push(node);
    if (node.children) flattenNodes(node.children, arr);
  });
  return arr;
};

const indicatorById = (id) => INDICATORS.find(i => i.id === id);
const getConversionFactorById = (id) => CONVERSION_FACTORS.find(cf => cf.id === id);
const getEmissionFactorById = (id) => EMISSION_FACTORS.find(ef => ef.id === id);

function calcGHG(indicator, value, unit) {
  if (!value || isNaN(value)) return '0.00';
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
  return (parseFloat(value) * conv * ef).toFixed(2);
}

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7 2.29a1 1 0 0 1 1.42 0l1.59 1.59a1 1 0 0 1 0 1.42l-9.3 9.3-3.3.71.71-3.3 9.3-9.3zM3 17h14v2H3v-2z" fill="#6B7280"/>
  </svg>
);

const DataCollectionPage = ({ sessionEmissions, updateSessionEmissions }) => {
  const [editNodeId, setEditNodeId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [newRecords, setNewRecords] = useState({}); // in-memory only
  const inventoryYear = INVENTORY_YEARS[0];

  // All org nodes
  const orgNodes = flattenNodes(ORG_STRUCTURE);
  const legalEntities = orgNodes.filter(n => n.type === 'Legal Entity');
  const sites = orgNodes.filter(n => n.type === 'Site');

  // Helper: get indicators for a node
  const getIndicatorsForNode = (node) => {
    return (NODE_INDICATOR_MAPPING[node.id] || []).map(indicatorById).filter(Boolean);
  };

  // Helper: get prefilled values for a node
  const getPrefilledValues = (node) => {
    const key = `${inventoryYear.id}_${node.id}`;
    // Prefer sessionEmissions if present
    if (sessionEmissions && sessionEmissions[key]) return sessionEmissions[key];
    return QUESTIONNAIRE_DATA[key] || {};
  };

  // Helper: handle adding a new record (in-memory only)
  const handleAddRecord = (node) => {
    setEditNodeId(node.id);
    setEditValues({});
  };

  // Helper: handle save (in-memory only)
  const handleSave = (node) => {
    setNewRecords(prev => ({
      ...prev,
      [node.id]: editValues
    }));
    // Update sessionEmissions for this node/year
    updateSessionEmissions(inventoryYear.id, node.id, { ...getPrefilledValues(node), ...editValues });
    setEditNodeId(null);
    setEditValues({});
  };

  // Helper: get all records to display (prefilled + new)
  const getAllRecords = (node) => {
    const prefilled = getPrefilledValues(node);
    const added = newRecords[node.id] || {};
    // Merge, new overrides prefilled
    return { ...prefilled, ...added };
  };

  // Modal for editing node data
  const renderEditModal = (node, indicators, allValues) => {
    return (
      <div className="form-overlay">
        <div className="form-container" style={{ maxWidth: 700, minWidth: 400, width: '95%' }}>
          <h2>Edit Data for {node.name} <span style={{ color: '#888', fontWeight: 400 }}>({node.code})</span></h2>
          <div style={{ marginTop: 12 }}>
            {indicators.map(indicator => {
              // Ensure rawValue is consistently a string, defaulting to empty string for formatting purposes.
              let rawValue = editValues[indicator.id]?.value ?? allValues[indicator.id]?.value;
              if (rawValue === null || rawValue === undefined) {
                rawValue = '';
              } else {
                rawValue = String(rawValue); // Ensure it is a string before formatting
              }
              
              const displayValue = formatNumberWithSpaces(rawValue);
              const unit = indicator.default_unit;
              // Use the unformatted rawValue for calculation, ensuring it's a valid number or 0.
              const numericRawValue = parseFloat(parseFormattedNumber(rawValue)) || 0;
              const ghg = calcGHG(indicator, numericRawValue, unit);
              return (
                <div key={indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <span style={{ minWidth: 70, fontFamily: 'monospace' }}>{indicator.id}</span>
                  <span style={{ flex: 1 }}>{indicator.name}</span>
                  <input
                    type="text" // Changed to text to reliably show spaces
                    value={displayValue}
                    onChange={e => {
                      const parsedValue = parseFormattedNumber(e.target.value);
                      // Allow only numbers and a single decimal point for the raw value
                      if (/^\d*\.?\d*$/.test(parsedValue) || parsedValue === '') {
                        setEditValues(prev => ({ ...prev, [indicator.id]: { value: parsedValue, unit } }));
                      }
                    }}
                    className="form-control"
                    style={{ width: 100, textAlign: 'right' }} // Added textAlign: right for number inputs
                    placeholder="Value"
                  />
                  <span style={{ minWidth: 40 }}>{unit}</span>
                  <input
                    type="text"
                    value={`${ghg} kg GHG`}
                    readOnly
                    className="form-control"
                    style={{ width: 120, textAlign: 'right', color: '#1F7A1F', fontWeight: 600, background: '#f9fff9', border: '1px solid #b6eab6', fontSize: 15 }}
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>
          <div className="form-actions" style={{ marginTop: 24 }}>
            <button className="save-button" onClick={() => handleSave(node)} style={{ marginRight: 8 }}>Save</button>
            <button className="cancel-button" onClick={() => setEditNodeId(null)}>Cancel</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Data Collection</h1>
      <div className="page-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <select value={inventoryYear.id} disabled style={{ minWidth: 180, height: 36, borderRadius: 4, border: '1px solid #ccc', padding: '0 12px' }}>
            <option value={inventoryYear.id}>{inventoryYear.name} ({inventoryYear.year})</option>
          </select>
        </div>
        <div style={{ marginTop: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#FFA500', marginBottom: 8, letterSpacing: 1 }}>Legal Entities</div>
          <div style={{ borderLeft: '4px solid #FFA500', marginBottom: 24, paddingLeft: 8 }}>
            {legalEntities.map(node => {
              const indicators = getIndicatorsForNode(node);
              const allValues = getAllRecords(node);
              return (
                <div key={node.id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{node.name} <span style={{ color: '#888', fontWeight: 400 }}>({node.code})</span></div>
                    <div style={{ color: '#888', fontSize: 13 }}>{node.type}</div>
                  </div>
                  <button className="edit-button" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => handleAddRecord(node)} title="Edit">
                    <PencilIcon />
                  </button>
                  {editNodeId === node.id && renderEditModal(node, indicators, allValues)}
                </div>
              );
            })}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#00A651', marginBottom: 8, letterSpacing: 1 }}>Sites</div>
          <div style={{ borderLeft: '4px solid #00A651', marginBottom: 24, paddingLeft: 8 }}>
            {sites.map(node => {
              const indicators = getIndicatorsForNode(node);
              const allValues = getAllRecords(node);
              return (
                <div key={node.id} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{node.name} <span style={{ color: '#888', fontWeight: 400 }}>({node.code})</span></div>
                    <div style={{ color: '#888', fontSize: 13 }}>{node.type}</div>
                  </div>
                  <button className="edit-button" style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB', borderRadius: 4, background: 'white', cursor: 'pointer' }} onClick={() => handleAddRecord(node)} title="Edit">
                    <PencilIcon />
                  </button>
                  {editNodeId === node.id && renderEditModal(node, indicators, allValues)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCollectionPage; 