import React from 'react';

/**
 * Component for managing app initialization and reset
 * This is used for debugging and managing the initial state of the app
 */
const InitManager = () => {
  // Trigger reinitialization
  const handleReinitialize = () => {
    // Clear init flag in sessionStorage
    sessionStorage.removeItem('initComplete');
    
    // Also trigger reinitialization across tabs
    localStorage.setItem('clearInit', 'true');
    
    // Run initialization function if available
    if (window.setupDefaultMapping) {
      window.setupDefaultMapping();
    }
    
    // Inform user
    alert('App initialization complete! The app is now fully set up with proper mappings and default data.');
  };

  return (
    <div className="init-manager" style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      zIndex: 9999
    }}>
      <button 
        onClick={handleReinitialize}
        style={{
          padding: '8px 12px',
          backgroundColor: '#4a5568',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        Reset & Initialize App
      </button>
    </div>
  );
};

export default InitManager; 