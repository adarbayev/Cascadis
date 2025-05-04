import React, { useState } from 'react';
import './TrajectoryDashboard.css';

const TrajectoryDashboard = () => {
  // State for baseline data
  const [baselineEmissions, setBaselineEmissions] = useState(10000);
  const [baselineYear, setBaselineYear] = useState(2024);
  
  // State for growth rates
  const [growthRateP1, setGrowthRateP1] = useState(2.0);
  const [growthRateP2, setGrowthRateP2] = useState(1.5);
  const [growthRateP3, setGrowthRateP3] = useState(1.0);
  
  // State for target
  const [isSBTiAligned, setIsSBTiAligned] = useState(false);
  const [targetReduction, setTargetReduction] = useState(50);
  
  // State for scenarios (simplified for now)
  const [scenarios, setScenarios] = useState([
    { id: 1, name: 'Scenario 1', measures: [] }
  ]);

  return (
    <div className="trajectory-dashboard">
      <div className="dashboard-grid">
        <div className="inputs-panel">
          <h2 className="section-header">Inputs</h2>
          
          {/* Baseline Section */}
          <div className="input-section">
            <h3 className="subsection-header">
              <span>Baseline</span>
              <button type="button" className="edit-btn">Edit Baseline</button>
            </h3>
            <div className="input-grid">
              <div>
                <label>Total Baseline Emissions</label>
                <div className="input-display">{baselineEmissions} tCO2eq</div>
              </div>
              <div>
                <label htmlFor="baseline-year">Baseline Year</label>
                <input 
                  type="number" 
                  id="baseline-year" 
                  value={baselineYear} 
                  onChange={(e) => setBaselineYear(parseInt(e.target.value))}
                  min="2015" 
                  max="2050" 
                  className="form-input"
                />
              </div>
            </div>
          </div>
          
          {/* Projections Section */}
          <div className="input-section">
            <h3 className="subsection-header">
              <span>Projections</span>
              <button type="button" className="edit-btn">Edit Growth Rates</button>
            </h3>
            <p className="input-description">Linear growth rates (% of baseline) applied per period.</p>
            <div className="rates-display">
              <span>P1 ({baselineYear}-{baselineYear+6}): {growthRateP1}%</span>
              <span>P2 ({baselineYear+7}-{baselineYear+16}): {growthRateP2}%</span>
              <span>P3 ({baselineYear+17}-{baselineYear+26}): {growthRateP3}%</span>
            </div>
          </div>
          
          {/* Target Section */}
          <div className="input-section">
            <h3 className="subsection-header">Target</h3>
            <div className="checkbox-row">
              <input 
                id="sbti-checkbox" 
                type="checkbox" 
                checked={isSBTiAligned}
                onChange={() => setIsSBTiAligned(!isSBTiAligned)}
                className="form-checkbox"
              />
              <label htmlFor="sbti-checkbox">Align target with SBTi (1.5°C Pathway)?</label>
            </div>
            {isSBTiAligned && (
              <p className="input-note">Applies -42% by near-term target year (baseline+10yrs) and -90% by 2050 vs baseline year emissions.</p>
            )}
            <div className="input-row">
              <label htmlFor="target-reduction">Manual 2050 Target Reduction (%)</label>
              <input 
                type="number" 
                id="target-reduction" 
                value={targetReduction}
                onChange={(e) => setTargetReduction(parseInt(e.target.value))}
                min="0" 
                max="100" 
                disabled={isSBTiAligned}
                className="form-input"
              />
            </div>
          </div>
          
          {/* Scenarios Section */}
          <div className="input-section">
            <div className="section-header-with-button">
              <h2 className="section-header">Scenarios</h2>
              <button className="add-btn">Add Scenario</button>
            </div>
            <div className="scenarios-list">
              {scenarios.map(scenario => (
                <div key={scenario.id} className="scenario-block">
                  <div className="scenario-header">
                    <span>{scenario.name}</span>
                    <div className="scenario-actions">
                      <button className="action-btn">Edit Measures</button>
                      <button className="action-btn delete">Delete</button>
                    </div>
                  </div>
                  <div className="measures-count">
                    {scenario.measures.length} measure(s)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="chart-panel">
          <h2 className="section-header">Emissions Trajectory (tCO2eq)</h2>
          <div className="chart-container">
            {/* Chart will be implemented here using react-chartjs-2 */}
            <div className="chart-placeholder">
              Chart will be displayed here
            </div>
          </div>
          <p className="chart-note">*CAPEX and OPEX values are recorded but do not currently affect the emissions trajectory graph.</p>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryDashboard; 