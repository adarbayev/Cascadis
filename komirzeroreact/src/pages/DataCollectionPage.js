import React, { useState, useEffect } from 'react';
import './PageStyles.css';

// Helpers for localStorage
const getInventoryYears = () => {
  const saved = localStorage.getItem('inventoryYears');
  if (saved) try { return JSON.parse(saved); } catch { return []; }
  return [];
};
const saveInventoryYears = (years) => {
  localStorage.setItem('inventoryYears', JSON.stringify(years));
};
const getQuestionnaireMappings = () => {
  const saved = localStorage.getItem('questionnaireMappings');
  if (saved) try { return JSON.parse(saved); } catch { return {}; }
  return {};
};
const saveQuestionnaireMappings = (mappings) => {
  localStorage.setItem('questionnaireMappings', JSON.stringify(mappings));
};
const getNodeIndicatorMapping = () => {
  const saved = localStorage.getItem('nodeIndicatorMapping');
  if (saved) try { return JSON.parse(saved); } catch { return {}; }
  return {};
};
const getOrgStructure = () => {
  const saved = localStorage.getItem('orgStructureData');
  if (saved) try { return JSON.parse(saved); } catch { return []; }
  return [];
};
const getIndicators = () => {
  const saved = localStorage.getItem('indicatorData');
  if (saved) try { return JSON.parse(saved); } catch { return []; }
  return [];
};
const getQuestionnaireData = () => {
  const saved = localStorage.getItem('questionnaireData');
  if (saved) try { return JSON.parse(saved); } catch { return {}; }
  return {};
};
const saveQuestionnaireData = (data) => {
  localStorage.setItem('questionnaireData', JSON.stringify(data));
};
const getConversionFactors = () => {
  const saved = localStorage.getItem('conversionFactorData');
  if (saved) try { return JSON.parse(saved); } catch { return []; }
  return [];
};
const getEmissionFactors = () => {
  const saved = localStorage.getItem('emissionFactorData');
  if (saved) try { return JSON.parse(saved); } catch { return []; }
  return [];
};

const DataCollectionPage = () => {
  const [tab, setTab] = useState('inventory');
  const [inventoryYears, setInventoryYears] = useState(getInventoryYears());
  const [selectedYearId, setSelectedYearId] = useState(inventoryYears[0]?.id || null);
  const [showModal, setShowModal] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalYear, setModalYear] = useState('');
  const [yearError, setYearError] = useState('');
  const [editNodeId, setEditNodeId] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    setInventoryYears(getInventoryYears());
  }, [showModal]);

  // Pre-create Inventory 2024 if not present
  useEffect(() => {
    let years = getInventoryYears();
    if (years.length === 0) {
      const newYear = { id: 1, name: 'Inventory 2024', year: 2024 };
      years = [newYear];
      saveInventoryYears(years);
      // Snapshot nodeIndicatorMapping
      const mappings = getQuestionnaireMappings();
      mappings[1] = JSON.parse(JSON.stringify(getNodeIndicatorMapping()));
      saveQuestionnaireMappings(mappings);
    }
    setInventoryYears(years);
    if (!selectedYearId) setSelectedYearId(years[0].id);
  }, []);

  // Modal save handler
  const handleSaveNewYear = () => {
    const yearInt = parseInt(modalYear, 10);
    if (!modalName.trim() || !yearInt) return;
    if (inventoryYears.some(y => y.year === yearInt)) {
      setYearError('Year must be unique');
      return;
    }
    setYearError('');
    // Generate next id
    const nextId = inventoryYears.length > 0 ? Math.max(...inventoryYears.map(y => y.id)) + 1 : 1;
    const newYear = { id: nextId, name: modalName.trim(), year: yearInt };
    const newYears = [...inventoryYears, newYear];
    saveInventoryYears(newYears);
    setInventoryYears(newYears);
    setSelectedYearId(nextId);
    // Snapshot nodeIndicatorMapping
    const mappings = getQuestionnaireMappings();
    mappings[nextId] = JSON.parse(JSON.stringify(getNodeIndicatorMapping()));
    saveQuestionnaireMappings(mappings);
    setShowModal(false);
    setModalName('');
    setModalYear('');
  };

  // Helper: flatten org structure to get all nodes by id
  const flattenNodes = (nodes, arr = []) => {
    nodes.forEach(node => {
      arr.push(node);
      if (node.children) flattenNodes(node.children, arr);
    });
    return arr;
  };

  // Helper: get indicator by id
  const indicatorById = (id, indicators) => indicators.find(i => i.id === id);

  // Helper: get conversion factor for indicator
  const getConversion = (indicator, conversionFactors) => {
    if (!indicator.conversion_factor_id) return 1;
    const cf = conversionFactors.find(cf => cf.id === indicator.conversion_factor_id);
    return cf ? cf.conversion_factor : 1;
  };
  // Helper: get emission factor for indicator
  const getEmission = (indicator, emissionFactors) => {
    if (!indicator.emission_factor_id) return 0;
    const ef = emissionFactors.find(ef => ef.id === indicator.emission_factor_id);
    return ef ? ef.value : 0;
  };

  // Modal for editing node data
  const renderEditModal = (node, indicatorIds, indicators, conversionFactors, emissionFactors, questionnaireData, selectedYearId) => {
    if (!node) return null;
    const qKey = `${selectedYearId}_${node.id}`;
    const qData = questionnaireData[qKey] || {};
    // Split indicators by scope
    const generalIndicators = indicatorIds.map(id => indicators.find(i => i.id === id)).filter(ind => ind && ind.scope_tag === 'general');
    const scope1Indicators = indicatorIds.map(id => indicators.find(i => i.id === id)).filter(ind => ind && ind.scope_tag === 'scope1');
    const scope2Indicators = indicatorIds.map(id => indicators.find(i => i.id === id)).filter(ind => ind && ind.scope_tag === 'scope2');
    // Helper for GHG calculation
    const calcGHG = (indicator, value, unit) => {
      let conv = 1;
      if (indicator.conversion_factor_id) {
        const cf = conversionFactors.find(cf => cf.id === indicator.conversion_factor_id);
        if (cf && cf.source_unit === unit) conv = cf.conversion_factor;
        // If the selected unit does not match, try to find a conversion factor for the selected unit
        else if (cf && cf.source_unit !== unit) {
          const altCf = conversionFactors.find(cf2 => cf2.name.toLowerCase().includes(indicator.name.toLowerCase()) && cf2.source_unit === unit);
          if (altCf) conv = altCf.conversion_factor;
        }
      }
      let ef = 0;
      if (indicator.emission_factor_id) {
        const efObj = emissionFactors.find(efac => efac.id === indicator.emission_factor_id);
        if (efObj) ef = efObj.value;
      }
      return value && !isNaN(value) ? (parseFloat(value) * conv * ef).toFixed(2) : '0.00';
    };
    return (
      <div className="form-overlay">
        <div className="form-container" style={{ maxWidth: 700, minWidth: 400, width: '95%' }}>
          <h2>Edit Data for {node.name} <span style={{ color: '#888', fontWeight: 400 }}>({node.code})</span></h2>
          {/* General Info */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, marginTop: 8 }}>General Info</div>
            <div style={{ borderBottom: '1px solid #eee', marginBottom: 8 }} />
            {generalIndicators.map(indicator => {
              const value = editValues[indicator.id]?.value ?? (qData[indicator.id]?.value || '');
              const unit = editValues[indicator.id]?.unit ?? (qData[indicator.id]?.unit || indicator.default_unit);
              return (
                <div key={indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <span style={{ minWidth: 70, fontFamily: 'monospace' }}>{indicator.id}</span>
                  <span style={{ flex: 1 }}>{indicator.name}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => {
                      const v = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value: v, unit } }));
                    }}
                    className="form-control"
                    style={{ width: 100 }}
                    placeholder="Value"
                  />
                  <select
                    value={unit}
                    onChange={e => {
                      const u = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value, unit: u } }));
                    }}
                    className="form-control"
                    style={{ width: 80 }}
                  >
                    <option value={indicator.default_unit}>{indicator.default_unit}</option>
                  </select>
                </div>
              );
            })}
          </div>
          {/* Scope 1 Indicators */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, marginTop: 8 }}>Scope 1 Indicators</div>
            <div style={{ borderBottom: '1px solid #eee', marginBottom: 8 }} />
            {scope1Indicators.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No indicators</div>}
            {scope1Indicators.map(indicator => {
              const value = editValues[indicator.id]?.value ?? (qData[indicator.id]?.value || '');
              const unit = editValues[indicator.id]?.unit ?? (qData[indicator.id]?.unit || indicator.default_unit);
              const ghg = calcGHG(indicator, value, unit);
              return (
                <div key={indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <span style={{ minWidth: 70, fontFamily: 'monospace' }}>{indicator.id}</span>
                  <span style={{ flex: 1 }}>{indicator.name}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => {
                      const v = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value: v, unit } }));
                    }}
                    className="form-control"
                    style={{ width: 100 }}
                    placeholder="Value"
                  />
                  <select
                    value={unit}
                    onChange={e => {
                      const u = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value, unit: u } }));
                    }}
                    className="form-control"
                    style={{ width: 80 }}
                  >
                    <option value={indicator.default_unit}>{indicator.default_unit}</option>
                  </select>
                  <input
                    type="text"
                    value={`${ghg} kg GHG`}
                    readOnly
                    className="form-control"
                    style={{ width: 140, textAlign: 'right', color: '#1F7A1F', fontWeight: 600, background: '#f9fff9', border: '1px solid #b6eab6', fontSize: 15 }}
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>
          {/* Scope 2 Indicators */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 500, marginBottom: 4, marginTop: 8 }}>Scope 2 Indicators</div>
            <div style={{ borderBottom: '1px solid #eee', marginBottom: 8 }} />
            {scope2Indicators.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No indicators</div>}
            {scope2Indicators.map(indicator => {
              const value = editValues[indicator.id]?.value ?? (qData[indicator.id]?.value || '');
              const unit = editValues[indicator.id]?.unit ?? (qData[indicator.id]?.unit || indicator.default_unit);
              const ghg = calcGHG(indicator, value, unit);
              return (
                <div key={indicator.id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                  <span style={{ minWidth: 70, fontFamily: 'monospace' }}>{indicator.id}</span>
                  <span style={{ flex: 1 }}>{indicator.name}</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => {
                      const v = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value: v, unit } }));
                    }}
                    className="form-control"
                    style={{ width: 100 }}
                    placeholder="Value"
                  />
                  <select
                    value={unit}
                    onChange={e => {
                      const u = e.target.value;
                      setEditValues(prev => ({ ...prev, [indicator.id]: { value, unit: u } }));
                    }}
                    className="form-control"
                    style={{ width: 80 }}
                  >
                    <option value={indicator.default_unit}>{indicator.default_unit}</option>
                  </select>
                  <input
                    type="text"
                    value={`${ghg} kg GHG`}
                    readOnly
                    className="form-control"
                    style={{ width: 140, textAlign: 'right', color: '#1F7A1F', fontWeight: 600, background: '#f9fff9', border: '1px solid #b6eab6', fontSize: 15 }}
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>
          <div className="form-actions">
            <button
              className="save-button"
              onClick={() => {
                // Save all values to questionnaireData
                const qKey = `${selectedYearId}_${node.id}`;
                const newData = { ...questionnaireData };
                newData[qKey] = { ...newData[qKey], ...editValues };
                saveQuestionnaireData(newData);
                setEditNodeId(null);
                setEditValues({});
              }}
            >
              Save
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setEditNodeId(null);
                setEditValues({});
              }}
            >
              Cancel
            </button>
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
          <select
            value={selectedYearId || ''}
            onChange={e => setSelectedYearId(Number(e.target.value))}
            style={{ minWidth: 180, height: 36, borderRadius: 4, border: '1px solid #ccc', padding: '0 12px' }}
          >
            {inventoryYears.map(y => (
              <option key={y.id} value={y.id}>{y.name} ({y.year})</option>
            ))}
          </select>
          <button
            style={{ height: 36, width: 36, borderRadius: 4, border: '1px solid #4CAF50', color: '#4CAF50', background: 'white', fontSize: 22, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
            title="New Inventory Year"
          >
            +
          </button>
        </div>
        {/* Modal for new inventory year */}
        {showModal && (
          <div className="form-overlay">
            <div className="form-container" style={{ maxWidth: 340 }}>
              <h2>New Inventory Year</h2>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={modalName}
                  onChange={e => setModalName(e.target.value)}
                  className="form-control"
                  placeholder="e.g. 2024 Baseline"
                />
              </div>
              <div className="form-group">
                <label>Year:</label>
                <input
                  type="number"
                  value={modalYear}
                  onChange={e => setModalYear(e.target.value)}
                  className="form-control"
                  placeholder="e.g. 2024"
                  min="2000"
                  max="2100"
                />
                {yearError && <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{yearError}</div>}
              </div>
              <div className="form-actions">
                <button className="save-button" onClick={handleSaveNewYear}>Save</button>
                <button className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* Inventory node records list */}
        {selectedYearId && (() => {
          const mappings = getQuestionnaireMappings();
          const yearMapping = mappings[selectedYearId] || {};
          const orgNodes = flattenNodes(getOrgStructure());
          const indicators = getIndicators();
          const conversionFactors = getConversionFactors();
          const emissionFactors = getEmissionFactors();
          const questionnaireData = getQuestionnaireData();
          return (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Inventory {inventoryYears.find(y => y.id === selectedYearId)?.year}</h2>
              {Object.keys(yearMapping).map(nodeId => {
                const node = orgNodes.find(n => n.id === nodeId);
                if (!node) return null;
                const indicatorIds = yearMapping[nodeId];
                return (
                  <div key={nodeId} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 24, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>{node.name} <span style={{ color: '#888', fontWeight: 400 }}>({node.code})</span></div>
                      <div style={{ color: '#888', fontSize: 13 }}>{node.type}</div>
                    </div>
                    <button className="edit-button" onClick={() => {
                      setEditNodeId(nodeId);
                      setEditValues({});
                    }}>Edit</button>
                    {editNodeId === nodeId && renderEditModal(node, indicatorIds, indicators, conversionFactors, emissionFactors, questionnaireData, selectedYearId)}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DataCollectionPage; 