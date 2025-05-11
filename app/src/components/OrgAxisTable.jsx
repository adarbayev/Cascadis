import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OrgAxisTable.css';

// Stub functions for CSV import/export
export function exportOrgAxisToCSV() {/* TODO */}
export async function importOrgAxisFromCSV(file) {/* TODO */}

const OrgAxisTable = () => {
  const [orgData, setOrgData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('At least one');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch org data
  const fetchOrgData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/org');
      setOrgData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch organization data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  // Toggle expand/collapse
  const toggleExpand = (id) => {
    setOrgData(prev => {
      const updateNode = (nodes) => {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      };
      return updateNode(prev);
    });
  };

  // Add a new child node
  const addChildNode = async (parentId, nodeType) => {
    try {
      const newNode = {
        code: '',
        name: 'New ' + nodeType,
        type: nodeType,
        parent: parentId
      };
      await axios.post('/org', newNode);
      fetchOrgData(); // Refresh data after adding
    } catch (err) {
      setError('Failed to add new node');
      console.error(err);
    }
  };

  // Update a node
  const updateNode = async (node) => {
    try {
      await axios.patch(`/org/${node.id}`, node);
      fetchOrgData(); // Refresh data after update
    } catch (err) {
      setError('Failed to update node');
      console.error(err);
    }
  };

  // Delete a node
  const deleteNode = async (id) => {
    try {
      await axios.delete(`/org/${id}`);
      fetchOrgData(); // Refresh data after deletion
    } catch (err) {
      setError('Failed to delete node');
      console.error(err);
    }
  };

  // Get color based on node type
  const getNodeColor = (type) => {
    switch (type) {
      case 'Group':
        return '#0066CC'; // Blue
      case 'Legal Entity':
        return '#FFA500'; // Orange
      case 'Warehouse':
      case 'Office':
      case 'Production Site':
        return '#00A651'; // Green
      default:
        return 'black';
    }
  };

  // Get indent level based on node type
  const getIndentLevel = (type) => {
    switch (type) {
      case 'Group':
        return 0;
      case 'Legal Entity':
        return 1;
      case 'Warehouse':
      case 'Office':
      case 'Production Site':
        return 2;
      default:
        return 0;
    }
  };

  // Render a single node row
  const renderNode = (node, depth = 0) => {
    const indentLevel = getIndentLevel(node.type);
    const color = getNodeColor(node.type);
    const fontWeight = node.type === 'Group' ? 'bold' : 'normal';
    return (
      <React.Fragment key={node.id}>
        <tr>
          <td>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {node.children && node.children.length > 0 && (
                <button 
                  className="expand-button"
                  onClick={() => toggleExpand(node.id)}
                >
                  {node.expanded ? '▼' : '►'}
                </button>
              )}
              <span 
                style={{ 
                  marginLeft: `${indentLevel * 20}px`, 
                  color, 
                  fontWeight 
                }}
              >
                {node.type}
              </span>
            </div>
          </td>
          <td>{node.code}</td>
          <td style={{ color }}>{node.name}</td>
          <td>
            <button onClick={() => {}}>Edit</button>
            <button onClick={() => addChildNode(node.id, getNextLevelType(node.type))}>Add</button>
            <button onClick={() => deleteNode(node.id)}>Delete</button>
          </td>
        </tr>
        {node.expanded && node.children && node.children.map(child => renderNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  // Get the next level type based on the current type
  const getNextLevelType = (currentType) => {
    if (currentType === 'Group') return 'Legal Entity';
    return 'Warehouse'; // Default site type, could be made selectable
  };

  // Filter nodes based on search and level filter
  const filterNodes = (nodes) => {
    return nodes.filter(node => {
      const matchesSearch = 
        searchTerm === '' || 
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = 
        levelFilter === 'At least one' || 
        node.type === levelFilter;
      const result = matchesSearch && matchesLevel;
      // If this node doesn't match but might have children that match,
      // we need to check its children recursively
      if (!result && node.children && node.children.length > 0) {
        const filteredChildren = filterNodes(node.children);
        if (filteredChildren.length > 0) {
          node.children = filteredChildren;
          return true;
        }
      }
      return result;
    });
  };

  const filteredData = filterNodes([...orgData]);

  return (
    <div className="org-axis-container">
      {/* Legend */}
      <div className="legend">
        <h3>Legend</h3>
        <div className="legend-items">
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#0066CC' }}></div>
            <span>Group</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#FFA500' }}></div>
            <span>Legal Entity</span>
          </div>
          <div className="legend-item">
            <div className="color-box" style={{ backgroundColor: '#00A651' }}></div>
            <span>Site</span>
          </div>
        </div>
      </div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="filter-section">
          <label>Level: </label>
          <select 
            value={levelFilter} 
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <option value="At least one">At least one</option>
            <option value="Group">Group</option>
            <option value="Legal Entity">Legal Entity</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Office">Office</option>
            <option value="Production Site">Production Site</option>
          </select>
        </div>
        <div className="search-section">
          <label>Name: </label>
          <select>
            <option value="starts-with">Starts with</option>
            <option value="contains">Contains</option>
            <option value="equals">Equals</option>
          </select>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Search by name..."
          />
        </div>
        <button className="refresh-button" onClick={fetchOrgData}>
          Refresh
        </button>
      </div>
      {/* Error message */}
      {error && <div className="error-message">{error}</div>}
      {/* Loading indicator */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <table className="org-table">
          <thead>
            <tr>
              <th>LEVEL</th>
              <th>REFERENCE</th>
              <th>NAME</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map(node => renderNode(node))
            ) : (
              <tr>
                <td colSpan={4}>No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrgAxisTable; 