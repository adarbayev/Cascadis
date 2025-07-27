import React from 'react';
import './PageStyles.css';

const ReportingPage = () => {
  const handleReportButtonClick = (reportType) => {
    alert(`Generating ${reportType} report (placeholder - AI generation not yet implemented).`);
  };

  return (
    <div className="page-container reporting-modern">
      <h1 className="page-title">Reporting Workspace</h1>
      <div className="reporting-buttons-row">
        <button className="reporting-big-btn ebrd" onClick={() => handleReportButtonClick('EBRD')}>
          <span className="reporting-btn-icon">EBRD</span>
          <span className="reporting-btn-label"> Direct Annual E&S Report</span>
        </button>
      </div>
      <p className="reporting-disclaimer">
        Note: Full report generation with AI is a future capability. These buttons are currently placeholders.
      </p>
    </div>
  );
};

export default ReportingPage; 
