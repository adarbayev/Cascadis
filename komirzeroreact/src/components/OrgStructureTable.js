import React, { useState, useEffect } from 'react';
import './OrgStructureTable.css';

// Load data from localStorage or use default data
const getInitialData = () => {
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

const siteTypes = ['Office', 'Warehouse', 'Production Site'];

// Helper to get all indicators from localStorage
const getAllIndicators = () => {
  const saved = localStorage.getItem('indicatorData');
  if (saved) {
    try { return JSON.parse(saved); } catch { return []; }
  }
  return [];
};

// Helper to get node-indicator mapping from localStorage
const getNodeIndicatorMapping = () => {
  const saved = localStorage.getItem('nodeIndicatorMapping');
  if (saved) {
    try { return JSON.parse(saved); } catch { return {}; }
  }
  return {};
};

// Helper to save node-indicator mapping to localStorage
const saveNodeIndicatorMapping = (mapping) => {
  localStorage.setItem('nodeIndicatorMapping', JSON.stringify(mapping));
  window.dispatchEvent(new Event('storage'));
};

function OrgStructureTable() {
  const [data, setData] = useState(getInitialData);
  const [expanded, setExpanded] = useState({ g1: true, le1: true, le2: true });
  const [editingNode, setEditingNode] = useState(null);
  const [newNodeForm, setNewNodeForm] = useState({ open: false, parentId: null, level: null });
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '',
    country: '',
    latitude: '',
    longitude: ''
  });
  const [tab, setTab] = useState('general');
  const [indicatorList, setIndicatorList] = useState([]);
  const [nodeIndicatorMapping, setNodeIndicatorMapping] = useState(getNodeIndicatorMapping());
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('orgStructureData', JSON.stringify(data));
    // Dispatch a storage event so other components can react to the change
    window.dispatchEvent(new Event('storage'));
  }, [data]);

  // Load indicators when modal opens
  useEffect(() => {
    if (editingNode) {
      setIndicatorList(getAllIndicators());
      setNodeIndicatorMapping(getNodeIndicatorMapping());
      // Set default checked indicators
      let checked = nodeIndicatorMapping[editingNode.id] || [];
      if (checked.length === 0) {
        if (editingNode.type === 'Legal Entity') {
          checked = indicatorList.filter(i => i.name === 'Revenue').map(i => i.id);
        } else if (editingNode.type === 'Site') {
          checked = indicatorList.filter(i => i.scope_tag === 'scope1' || i.scope_tag === 'scope2').map(i => i.id);
        }
      }
      setSelectedIndicators(checked);
    }
  }, [editingNode]);

  // Toggle expand/collapse for a node
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle opening the edit form for a node
  const handleEditClick = (node) => {
    setEditingNode(node);
    setFormData({
      name: node.name,
      code: node.code,
      type: node.type,
      country: node.country || '',
      latitude: node.latitude || '',
      longitude: node.longitude || ''
    });
    // Close any open "add new" form
    setNewNodeForm({ open: false, parentId: null, level: null });
  };

  // Handle opening the "add new" form
  const handleAddClick = (parentId, level) => {
    setNewNodeForm({ open: true, parentId, level });
    // Clear form data
    setFormData({
      name: '',
      code: '',
      type: level === 'Site' ? siteTypes[0] : level,
      country: '',
      latitude: '',
      longitude: ''
    });
    // Close any open edit form
    setEditingNode(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle save for edited node
  const handleSaveEdit = () => {
    if (!formData.name || !formData.code) {
      alert('Name and Code are required fields');
      return;
    }

    if (editingNode) {
      // Deep clone the data to avoid direct state mutation
      const newData = JSON.parse(JSON.stringify(data));
      
      const updateNode = (nodes) => {
        return nodes.map(node => {
          if (node.id === editingNode.id) {
            return {
              ...node,
              name: formData.name,
              code: formData.code,
              type: formData.type,
              country: formData.country,
              latitude: formData.latitude ? parseFloat(formData.latitude) : null,
              longitude: formData.longitude ? parseFloat(formData.longitude) : null
            };
          }
          if (node.children) {
            return {
              ...node,
              children: updateNode(node.children)
            };
          }
          return node;
        });
      };
      
      setData(updateNode(newData));
      setEditingNode(null);
    }
  };

  // Handle save for new node
  const handleSaveNew = () => {
    if (!formData.name || !formData.code) {
      alert('Name and Code are required fields');
      return;
    }

    if (newNodeForm.open) {
      // Generate a simple unique ID (in a real app, you'd use a proper ID generator)
      const newId = `id${Date.now()}`;
      
      // Create the new node
      const newNode = {
        id: newId,
        name: formData.name,
        code: formData.code,
        type: formData.type
      };
      
      // Add location fields for Site level
      if (newNodeForm.level === 'Site') {
        newNode.country = formData.country;
        newNode.latitude = formData.latitude ? parseFloat(formData.latitude) : null;
        newNode.longitude = formData.longitude ? parseFloat(formData.longitude) : null;
      } else {
        newNode.children = [];
      }
      
      // Deep clone the data to avoid direct state mutation
      const newData = JSON.parse(JSON.stringify(data));
      
      // Helper function to find and update the parent node
      const addNodeToParent = (nodes, parentId) => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: addNodeToParent(node.children, parentId)
            };
          }
          return node;
        });
      };
      
      // If parent is null, add to the root level
      if (!newNodeForm.parentId) {
        setData([...newData, newNode]);
      } else {
        setData(addNodeToParent(newData, newNodeForm.parentId));
      }
      
      // Set the new node as expanded if it's a group or legal entity
      if (newNodeForm.level !== 'Site') {
        setExpanded((prev) => ({ ...prev, [newId]: true }));
      }
      
      setNewNodeForm({ open: false, parentId: null, level: null });
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    setEditingNode(null);
    setNewNodeForm({ open: false, parentId: null, level: null });
  };

  // Handle node deletion
  const handleDelete = (nodeId, nodeType) => {
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete this ${nodeType}? This action cannot be undone.`)) {
      return;
    }
    
    // Deep clone the data to avoid direct state mutation
    const newData = JSON.parse(JSON.stringify(data));
    
    // If it's a root node, filter it out
    if (newData.some(node => node.id === nodeId)) {
      setData(newData.filter(node => node.id !== nodeId));
      return;
    }
    
    // Otherwise, recursively search and remove the node
    const removeNode = (nodes) => {
      return nodes.map(node => {
        // If this node has children, check if any child needs to be removed
        if (node.children) {
          // If the child is found directly, filter it out
          if (node.children.some(child => child.id === nodeId)) {
            return {
              ...node,
              children: node.children.filter(child => child.id !== nodeId)
            };
          }
          // Otherwise, search deeper in the tree
          return {
            ...node,
            children: removeNode(node.children)
          };
        }
        return node;
      });
    };
    
    setData(removeNode(newData));
  };

  // Render a single node in the tree
  const renderNode = (node, level = 0) => {
    const isGroup = node.type === 'Group';
    const isLegalEntity = node.type === 'Legal Entity';
    const isSite = !isGroup && !isLegalEntity;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.id} className="org-node-container">
        <div 
          className={`org-node level-${level}`}
          style={{ paddingLeft: `${level * 24}px` }}
        >
          <div className="org-node-header">
            {hasChildren && (
              <button className="expand-button" onClick={() => toggleExpand(node.id)}>
                {expanded[node.id] ? '▼' : '►'}
              </button>
            )}
            <span className={`node-type type-${node.type.toLowerCase().replace(/\s+/g, '-')}`}>
              {node.type}
            </span>
            <span className="node-code">{node.code}</span>
            <span className="node-name">{node.name}</span>
            
            <div className="node-actions">
              {!isSite && (
                <button 
                  className="add-group-button"
                  onClick={() => handleAddClick(
                    node.id, 
                    isGroup ? 'Legal Entity' : 'Site'
                  )}
                  title={`Add ${isGroup ? 'Legal Entity' : 'Site'}`}
                >
                  +
                </button>
              )}
              
              <button 
                className="edit-button"
                onClick={() => handleEditClick(node)}
                title="Edit"
              >
                <span className="icon edit-icon">✎</span>
              </button>
              
              <button 
                className="delete-button"
                onClick={() => handleDelete(node.id, node.type)}
                title="Delete"
              >
                <span className="icon delete-icon">×</span>
              </button>
            </div>
          </div>
        </div>
        
        {hasChildren && expanded[node.id] && (
          <div className="org-node-children">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render the "Add Group" button at the top level
  const renderAddGroupButton = () => (
    <button 
      className="add-group-button"
      onClick={() => handleAddClick(null, 'Group')}
      title="Add Group"
    >
      +
    </button>
  );

  // Render the edit form
  const renderForm = () => {
    const isEditing = !!editingNode;
    const isAddingGroup = newNodeForm.open && newNodeForm.level === 'Group';
    const isAddingLegalEntity = newNodeForm.open && newNodeForm.level === 'Legal Entity';
    const isAddingSite = newNodeForm.open && newNodeForm.level === 'Site';
    
    if (!isEditing && !newNodeForm.open) return null;
    
    const formTitle = isEditing 
      ? `Edit ${editingNode.type} Details` 
      : `Add ${newNodeForm.level}`;
    
    const isSiteForm = (isEditing && editingNode.type === 'Site') || isAddingSite;
    
    return (
      <div className="form-overlay">
        <div className="form-container">
          <h2>{formTitle}</h2>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <button onClick={() => setTab('general')} aria-selected={tab==='general'} className={tab==='general' ? 'active-tab' : ''}>General Info</button>
            {isEditing && (
              <button onClick={() => setTab('indicators')} aria-selected={tab==='indicators'} className={tab==='indicators' ? 'active-tab' : ''}>Indicators</button>
            )}
          </div>
          {tab === 'general' && (
            <>
          <div className="form-group">
            <label>{isEditing ? `${editingNode.type} Name:` : 'Name:'}</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={`e.g., London Office`}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>{isEditing ? `${editingNode.type} Code:` : 'Code:'}</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              placeholder={`e.g., LON-01`}
              className="form-control"
            />
          </div>
          
          {isSiteForm && (
            <>
              <div className="form-group">
                <label>Site Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  {siteTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Country:</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g., GB"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Latitude:</label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 51.5074"
                  className="form-control"
                />
              </div>
              
              <div className="form-group">
                <label>Longitude:</label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., -0.1278"
                  className="form-control"
                />
              </div>
            </>
          )}
            </>
          )}
          {tab === 'indicators' && isEditing && (
            <div>
              {/* Indicator blocks */}
              {['general', 'scope1', 'scope2'].map(scope => (
                <div key={scope} style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, marginTop: 12 }}>{scope === 'general' ? 'General Info' : scope === 'scope1' ? 'Scope 1 Indicators' : 'Scope 2 Indicators'}</div>
                  <div style={{ borderBottom: '1px solid #eee', marginBottom: 8 }} />
                  {indicatorList.filter(i => i.scope_tag === scope).map(ind => (
                    <label key={ind.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        checked={selectedIndicators.includes(ind.id)}
                        onChange={e => {
                          setSelectedIndicators(sel => e.target.checked ? [...sel, ind.id] : sel.filter(id => id !== ind.id));
                        }}
                        aria-label={`Include ${ind.name} (${ind.id})`}
                        tabIndex={0}
                      />
                      <span style={{ minWidth: 70, fontFamily: 'monospace' }}>{ind.id}</span>
                      <span>{ind.name}</span>
                    </label>
                  ))}
                  {indicatorList.filter(i => i.scope_tag === scope).length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No indicators</div>}
                </div>
              ))}
            </div>
          )}
          <div className="form-actions">
            <button 
              className="save-button"
              onClick={() => {
                if (tab === 'indicators' && isEditing) {
                  // Save indicator mapping
                  const mapping = { ...getNodeIndicatorMapping(), [editingNode.id]: selectedIndicators };
                  saveNodeIndicatorMapping(mapping);
                  setNodeIndicatorMapping(mapping);
                }
                (isEditing ? handleSaveEdit : handleSaveNew)();
              }}
            >
              Save
            </button>
            <button 
              className="cancel-button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="org-structure-container">
      {renderAddGroupButton()}
      
      <div className="org-tree">
        {data.map(node => renderNode(node))}
      </div>
      
      {renderForm()}
    </div>
  );
}

export default OrgStructureTable; 