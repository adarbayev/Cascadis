import React, { useState } from 'react';
import './Navigation.css';

const Navigation = ({ activeSection, setActiveSection }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleNavigation = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { 
      id: 'home', 
      label: 'Main Dashboard',
      icon: '📊' // Chart icon
    },
    { 
      id: 'organisation', 
      label: 'Organisation Structure',
      icon: '🏢' // Building icon
    },
    { 
      id: 'org-setup', 
      label: 'Organization Setup',
      icon: '🔧' // Wrench icon
    },
    { 
      id: 'ghg-framework', 
      label: 'GHG Framework',
      icon: '🌱' // Plant icon (representing sustainability)
    },
    { 
      id: 'data-collection', 
      label: 'Data Collection',
      icon: '📝' // Clipboard icon
    },
    { 
      id: 'reporting', 
      label: 'Reporting',
      icon: '📈' // Chart trending up
    },
    { 
      id: 'settings', 
      label: 'Settings',
      icon: '⚙️' // Gear icon
    },
    { 
      id: 'profile', 
      label: 'My Profile',
      icon: '👤' // Person icon
    }
  ];

  return (
    <nav className={`navigation ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="nav-header">
        {!isCollapsed && <h2 className="nav-title">Kömir Zero</h2>}
      </div>
      <ul className="nav-items">
        {navItems.map(item => (
          <li 
            key={item.id} 
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
            title={isCollapsed ? item.label : ''}
          >
            <span className="nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
          </li>
        ))}
      </ul>
      <div className="nav-footer">
        <button 
          className="collapse-button" 
          onClick={toggleNavigation}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>
    </nav>
  );
};

export default Navigation; 