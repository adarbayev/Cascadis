import React, { useState, useMemo, useEffect, forwardRef } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

// Predefined color palette (based on wedgeColors idea)
const WEDGE_COLORS = [
  'rgba(255, 99, 132, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(255, 206, 86, 0.7)',
  'rgba(75, 192, 192, 0.7)', 'rgba(153, 102, 255, 0.7)', 'rgba(255, 159, 64, 0.7)',
  'rgba(199, 199, 199, 0.7)', 'rgba(83, 102, 255, 0.7)', 'rgba(100, 255, 100, 0.7)',
  'rgba(255, 100, 255, 0.7)'
];

// Function to calculate Net Present Value (NPV)
const calculateNPV = (cashflows, discountRate) => {
  let npv = 0;
  for (let i = 0; i < cashflows.length; i++) {
    npv += cashflows[i] / Math.pow(1 + discountRate, i + 1);
  }
  return npv;
};

export const BubblePayoffChart = forwardRef(({ scenarios, baseline, baseYear }, ref) => {
  const [debugOutput, setDebugOutput] = useState("");

  const chartData = useMemo(() => {
    let allMeasures = [];
    let tempDebug = "Bubble Data Calculation:\n";

    scenarios.forEach((scenario, scenarioIndex) => {
      if (!scenario.measures || scenario.measures.length === 0) {
        tempDebug += `Scenario '${scenario.name}': No measures.\n`;
        return;
      }
      tempDebug += `Scenario '${scenario.name}':\n`;

      scenario.measures.forEach((measure, measureIndex) => {
        const {
          name,
          capex = '0', opex = '0', reduction = '0',
          startYear = baseYear, lifecycle = '1', rampUp = '1'
        } = measure;

        const numCapex = parseFloat(capex) || 0;
        const numOpex = parseFloat(opex) || 0;
        const numReduction = parseFloat(reduction) || 0;
        const numStartYear = parseInt(startYear, 10) || baseYear;
        const numLifecycle = parseInt(lifecycle, 10) || 1;
        const numRampUp = parseInt(rampUp, 10) || 1;

        tempDebug += `  Measure '${name}':\n`;
        tempDebug += `    Capex: ${numCapex}, Opex: ${numOpex}, Reduction: ${numReduction}%\n`;
        tempDebug += `    StartYear: ${numStartYear}, Lifecycle: ${numLifecycle}, RampUp: ${numRampUp}\n`;

        let cumAbatement = 0;
        let annualAbatementValuesInBuild = [];

        for (let year = numStartYear; year <= 2050; year++) {
          if (year >= numStartYear && year < numStartYear + numLifecycle) {
            const yearsIntoRampUp = year - numStartYear + 1;
            const rampUpFactor = numRampUp > 0 ? Math.min(1, yearsIntoRampUp / numRampUp) : 1;
            const baselineForYear = baseline.values[baseline.years.indexOf(year)] || 0;
            const annualAbatementForYear = baselineForYear * (numReduction / 100) * rampUpFactor;
            cumAbatement += annualAbatementForYear;
            if (yearsIntoRampUp <= numRampUp) {
              annualAbatementValuesInBuild.push(annualAbatementForYear);
            }
          }
        }
        tempDebug += `    Cumulative Abatement (to 2050): ${cumAbatement.toFixed(2)} tCO2e\n`;

        let cashflows = [-numCapex];
        for (let i = 0; i < numLifecycle; i++) {
          cashflows.push(-numOpex);
        }
        const npvCost = calculateNPV(cashflows, 0.07);
        tempDebug += `    NPV Cost: ${npvCost.toFixed(2)}\n`;

        let annualAbateBuild = 0;
        if (annualAbatementValuesInBuild.length > 0) {
          annualAbateBuild = annualAbatementValuesInBuild.reduce((sum, val) => sum + val, 0) / annualAbatementValuesInBuild.length;
        } else if (numReduction > 0) {
            const baselineAtStart = baseline.values[baseline.years.indexOf(numStartYear)] || 0;
            annualAbateBuild = baselineAtStart * (numReduction / 100);
        }
        tempDebug += `    Raw Avg Annual Abatement (Build): ${annualAbateBuild.toFixed(2)} tCO2e\n`;

        let radiusValue = Math.sqrt(Math.max(0, annualAbateBuild)) / 1.5;
        const finalRadius = Math.max(7, Math.min(radiusValue, 50));
        tempDebug += `    Calculated Radius Value (before clamp): ${radiusValue.toFixed(2)}, Final Radius: ${finalRadius.toFixed(2)}\n`;

        if (!isNaN(cumAbatement) && !isNaN(npvCost) && !isNaN(finalRadius) && isFinite(cumAbatement) && isFinite(npvCost) && isFinite(finalRadius)) {
            allMeasures.push({
              label: `${scenario.name} - ${name}`,
              data: [{
                x: parseFloat((cumAbatement / 1000).toFixed(2)),
                y: parseFloat((npvCost / 1000000).toFixed(2)),
                r: finalRadius,
              }],
              backgroundColor: WEDGE_COLORS[(scenarioIndex * scenario.measures.length + measureIndex) % WEDGE_COLORS.length],
              measureDetails: measure
            });
        } else {
            tempDebug += `    SKIPPING measure '${name}' due to NaN/Infinity values (CumAb: ${cumAbatement}, NPV: ${npvCost}, RadiusVal: ${radiusValue} FinalRadius: ${finalRadius})\n`;
        }
      });
    });
    // Only set debug output if it has changed to avoid infinite loops with useEffect
    setDebugOutput(prev => prev === tempDebug ? prev : tempDebug);

    return { datasets: allMeasures };
  }, [scenarios, baseline, baseYear]);

  useEffect(() => {
    if(debugOutput) {
      // This is primarily for developer use in the browser console.
      // To show it in Gemini's output, we'd need to explicitly print `debugOutput` state after a render.
      console.log("BubblePayoffChart debug info:", debugOutput);
    }
  }, [debugOutput]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: { display: true, text: 'Net Present Cost (Million $)' },
        ticks: {
          callback: function(value) {
            return '$' + value + 'M';
          }
        }
      },
      x: {
        title: { display: true, text: 'Cumulative Abatement by 2050 (ktCO₂e)' },
        ticks: {
          callback: function(value) {
            return value + ' kt';
          }
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const datasetLabel = context.dataset.label || 'Measure';
            const data = context.dataset.data[context.dataIndex];
            let label = datasetLabel + ': ';
            if (data) {
              label += `(Abatement: ${data.x} ktCO₂e, Cost: $${data.y}M, Radius Base Value: ${data.r.toFixed(1)})`;
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <>
      {/* <textarea value={debugOutput} readOnly style={{width: "100%", height: "100px", fontSize: "10px"}} /> */}
      <Bubble ref={ref} options={options} data={chartData} style={{ minHeight: '450px' }}/>
    </>
  );
}); 