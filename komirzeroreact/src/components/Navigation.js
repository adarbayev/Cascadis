import React from 'react';
import './Navigation.css';

const Navigation = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { id: 'home', label: 'Home Dashboard' },
    { id: 'organisation', label: 'Organisation Structure' },
    { id: 'ghg-framework', label: 'GHG Framework' },
    { id: 'data-collection', label: 'Data Collection' },
    { id: 'reporting', label: 'Reporting' },
    { id: 'settings', label: 'Settings' },
    { id: 'profile', label: 'My Profile' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2 className="nav-title">Kömir Zero</h2>
      </div>
      <ul className="nav-items">
        {navItems.map(item => (
          <li 
            key={item.id} 
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation; 