import React from 'react';
import './IndicatorTable.css';
import { INDICATORS, CONVERSION_FACTORS } from '../demoData';

// const unitOptions = ['kWh', 'MWh', 'GJ', 'L', 'm³', 'kg', 't', 'm²', 'USD']; // Unused
// const scopeTags = ['general', 'scope1', 'scope2']; // Unused

const getConversionFactorById = (id) => {
  if (!id) return null;
  return CONVERSION_FACTORS.find(cf => cf.id === id);
};

function IndicatorTable() {
  // Group indicators by scope_tag
  const groupedIndicators = {
    general: INDICATORS.filter(ind => ind.scope_tag === 'general'),
    scope1: INDICATORS.filter(ind => ind.scope_tag === 'scope1'),
    scope2: INDICATORS.filter(ind => ind.scope_tag === 'scope2')
  };

  return (
    <div className="indicator-table-container">
      <div className="table-header">
        <h2>Indicators</h2>
      </div>
      {/* General Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">General Info</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.general.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Scope 1 Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">Scope 1</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.scope1.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Scope 2 Indicators */}
      <div className="indicator-section">
        <h3 className="section-header">Scope 2</h3>
        <table className="indicator-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {groupedIndicators.scope2.map(indicator => (
              <tr key={indicator.id}>
                <td>{indicator.id}</td>
                <td>{indicator.name}</td>
                <td>{indicator.default_unit}</td>
                <td>
                  {indicator.conversion_factor_id ? 
                    `${getConversionFactorById(indicator.conversion_factor_id)?.conversion_factor || '-'} kWh` : 
                    '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IndicatorTable; 