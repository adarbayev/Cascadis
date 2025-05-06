import React from 'react';
import './PageStyles.css';
import OrgStructureTable from '../components/OrgStructureTable';

const OrganisationPage = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Organisation Structure</h1>
      <div className="page-content">
        <OrgStructureTable />
      </div>
    </div>
  );
};

export default OrganisationPage; 