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
        <button className="reporting-big-btn cdp" onClick={() => handleReportButtonClick('CDP')}>
          <span className="reporting-btn-icon">CDP</span>
          <span className="reporting-btn-label">CDP Report</span>
        </button>
        <button className="reporting-big-btn gri" onClick={() => handleReportButtonClick('GRI')}>
          <span className="reporting-btn-icon">GRI</span>
          <span className="reporting-btn-label">GRI Report</span>
        </button>
        <button className="reporting-big-btn csrd" onClick={() => handleReportButtonClick('CSRD')}>
          <span className="reporting-btn-icon">CSRD</span>
          <span className="reporting-btn-label">CSRD/ESRS Report</span>
        </button>
      </div>
      <p className="reporting-disclaimer">
        Note: Full report generation with AI is a future capability. These buttons are currently placeholders.
      </p>
    </div>
  );
};

export default ReportingPage; 