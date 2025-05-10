import React from 'react';
import './ReportingPage.css';

const ReportingPage = () => {
  const handleReportButtonClick = (reportType) => {
    alert(`Generating ${reportType} report (placeholder - AI generation not yet implemented).`);
    // Future: Trigger AI report generation logic here
  };

  return (
    <div className="reporting-page-container">
      <header className="reporting-header">
        <h1 className="reporting-title">Reporting Workspace</h1>
        <p className="reporting-subtitle">
          Select a framework to generate your sustainability report.
        </p>
      </header>
      <main className="reporting-main-content">
        <div className="report-buttons-grid">
          <button 
            className="report-button cdp-button" 
            onClick={() => handleReportButtonClick('CDP')}
          >
            {/* Placeholder for CDP Icon */}
            <span className="report-button-icon">CDP</span> 
            <span className="report-button-text">CDP Report</span>
          </button>
          <button 
            className="report-button gri-button" 
            onClick={() => handleReportButtonClick('GRI')}
          >
            {/* Placeholder for GRI Icon */}
            <span className="report-button-icon">GRI</span>
            <span className="report-button-text">GRI Report</span>
          </button>
          <button 
            className="report-button csrd-button" 
            onClick={() => handleReportButtonClick('CSRD')}
          >
            {/* Placeholder for CSRD Icon */}
            <span className="report-button-icon">CSRD</span>
            <span className="report-button-text">CSRD/ESRS Report</span>
          </button>
        </div>
        <p className="reporting-disclaimer">
          Note: Full report generation with AI is a future capability. These buttons are currently placeholders.
        </p>
      </main>
    </div>
  );
};

export default ReportingPage; 