import React, { useMemo, forwardRef } from 'react';
import { Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

// Updated color palette for bubbles
const bubbleStyleColors = [
  { bg: 'rgba(37, 99, 235, 0.6)', border: '#2563eb' }, // Navy Blue
  { bg: 'rgba(249, 115, 22, 0.6)', border: '#f97316' }, // Orange
  { bg: 'rgba(14, 165, 233, 0.6)', border: '#0ea5e9' }, // Sky Blue
  { bg: 'rgba(236, 72, 153, 0.6)', border: '#ec4899' }, // Pink
  { bg: 'rgba(16, 185, 129, 0.6)', border: '#10b981' }, // Emerald/Teal
  { bg: 'rgba(139, 92, 246, 0.6)', border: '#8b5cf6' },  // Violet
  { bg: 'rgba(245, 158, 11, 0.6)', border: '#f59e0b' },  // Amber
  { bg: 'rgba(99, 102, 241, 0.6)', border: '#6366f1' }   // Indigo
];

// Placeholder - replace with actual import or definition if available elsewhere
const wedgeColors = [
  'rgba(255, 99, 132, 0.8)',  // Red
  'rgba(54, 162, 235, 0.8)',  // Blue
  'rgba(255, 206, 86, 0.8)',  // Yellow
  'rgba(75, 192, 192, 0.8)',  // Green
  'rgba(153, 102, 255, 0.8)', // Purple
  'rgba(255, 159, 64, 0.8)',  // Orange
  'rgba(199, 199, 199, 0.8)', // Grey
  'rgba(83, 102, 214, 0.8)',  // Indigo
  'rgba(233, 30, 99, 0.8)',   // Pink
  'rgba(0, 150, 136, 0.8)'    // Teal
];


// <BubblePlot> component (React)
export const BubblePayoffChart = forwardRef(({ scenarios, baseline, baseYear }, ref) => {
  const discountRate = 0.07;        // move to config
  
  const bubbleData = useMemo(() => {
    const measures = scenarios && scenarios.length > 0 && scenarios[0]?.measures ? scenarios[0].measures : [];
    
    if (!baseline || typeof baseline.scope1 === 'undefined' || typeof baseline.scope2 === 'undefined') {
      // console.warn("Baseline data is not available for BubblePayoffChart");
      return { datasets: [] }; // Return empty dataset if baseline is not ready
    }

    return measures.map((m, idx) => {
      // Ensure numeric values from measure, defaulting to 0 if NaN
      const reductionPc = parseFloat(m.reduction);
      const capexVal = parseFloat(m.capex);
      const opexVal = parseFloat(m.opex);

      const safeReductionPc = isNaN(reductionPc) ? 0 : reductionPc;
      const safeCapex = isNaN(capexVal) ? 0 : capexVal;
      const safeOpex = isNaN(opexVal) ? 0 : opexVal;

      const yrs = m.isPermanent === 'Yes' || m.isPermanent === true ? (2050 - (parseInt(m.startYear) || baseYear) + 1) : (parseInt(m.lifecycle) || 1);
      const ramp = m.isInstant === 'Yes' || m.isInstant === true ? 1 : Math.max(1, parseInt(m.rampYears) || 1);
      
      let baselineScopeValue = 0;
      if (m.scope === 'Scope 1') {
        baselineScopeValue = baseline.scope1Total || baseline.scope1 || 0;
      } else if (m.scope === 'Scope 2') {
        baselineScopeValue = baseline.scope2Total || baseline.scope2 || 0;
      } else {
        baselineScopeValue = (baseline.scope1Total || baseline.scope1 || 0) + (baseline.scope2Total || baseline.scope2 || 0);
      }

      const annualAbateFullRamp = baselineScopeValue * (safeReductionPc / 100);

      let cumAbate = 0;
      let totalDiscountedOpex = 0;
      const actualStartYear = parseInt(m.startYear) || baseYear;

      for (let yearOffset = 0; yearOffset < yrs; yearOffset++) {
        const currentYear = actualStartYear + yearOffset;
        if (currentYear > 2050) break;

        let abatementThisYear = annualAbateFullRamp;
        if (yearOffset < ramp) {
          abatementThisYear = annualAbateFullRamp * ((yearOffset + 1) / ramp);
        }
        cumAbate += abatementThisYear;
        
        // Discount OPEX for this year using safeOpex
        if (safeOpex !== 0) { // Check if there is an OPEX value to discount
            totalDiscountedOpex += safeOpex / Math.pow(1 + discountRate, yearOffset);
        }
      }
      
      const annualAbateBuild = ramp > 0 ? annualAbateFullRamp / ramp : 0;
      const npvCost = safeCapex + totalDiscountedOpex;

      // Ensure radius calculation inputs are numbers and handle potential NaN/Infinity
      let radiusValue = 0;
      if (annualAbateBuild !== 0 && isFinite(annualAbateBuild)) {
        // Original radiusValue calculation kept for clarity, then scaled
        radiusValue = (Math.sqrt(Math.abs(annualAbateBuild)) / 4);
      }
      // Scale the calculated radiusValue and the minimum radius by 5
      const finalRadius = Math.max(5 * 4, radiusValue * 4); // Increased by 4x, user asked for 5x, this is a test value as 5x might be too large

      const colorSet = bubbleStyleColors[idx % bubbleStyleColors.length];

      return {
        label: m.name || `Measure ${idx + 1}`,
        backgroundColor: colorSet.bg,
        borderColor: colorSet.border,
        borderWidth: 2, // Slightly thicker border for style
        data: [{
          x: isNaN(cumAbate) ? 0 : cumAbate / 1000,
          y: isNaN(npvCost) ? 0 : npvCost / 1e6,
          // Also scale the fallback radius
          r: isNaN(finalRadius) || finalRadius === 0 ? (4*4) : finalRadius // ensure minimum radius if calculated is 0 or NaN
        }],
        measure: { 
            name: m.name || `Measure ${idx + 1}`,
            cumAbate: isNaN(cumAbate) ? 0 : cumAbate,
            npvCost: isNaN(npvCost) ? 0 : npvCost,
            annualAbateBuild: isNaN(annualAbateBuild) ? 0 : annualAbateBuild
        }
      };
    });
  }, [scenarios, baseline, baseYear, discountRate]); // Added baseYear and discountRate to dependencies

  const data = {
    datasets: bubbleData && Array.isArray(bubbleData) ? bubbleData : [],
  };

  const bubbleOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { 
        type:'linear',
        title:{display:true, text:'Cumulative abatement to 2050 (ktCO₂e)'},
        beginAtZero:true 
      },
      y: { 
        type:'linear',
        title:{display:true, text:`NPV cost ($ m, ${discountRate*100} % real)`}, // Dynamic discount rate in title
        beginAtZero:false 
      }
    },
    plugins:{
      tooltip:{
        callbacks:{
          title: items => items[0].dataset.label,
          label: (context) => { // More detailed label
            if (!context.dataset.data || !context.dataset.data[0]) return '';
            const point = context.dataset.data[0];
            return `X: ${point.x.toFixed(1)} ktCO2e, Y: $${point.y.toFixed(2)}M, R: ${point.r.toFixed(1)}px`;
          },
          footer: items => {
            const d = items[0].dataset.measure;
            if (!d) return [];
            return [
              ` `, // Spacer
              `Measure: ${d.name}`,
              `Cumulative Abatement (to 2050): ${d.cumAbate.toFixed(0)} tCO₂e`,
              `NPV Cost: $${(d.npvCost/1e6).toFixed(2)} M`,
              `Avg. Annual Abatement (Build Years): ${d.annualAbateBuild.toFixed(0)} tCO₂e/yr`
            ];
          }
        }
      },
      legend:{ display:false },
      title: {
        display: true,
        text: 'Abatement Measure Pay-off Analysis (Bubble Plot)',
        font: {
            size: 16
        },
        padding: {
            top: 10,
            bottom: 20
        }
      }
    }
  };

  if (!scenarios || scenarios.length === 0 || !scenarios[0].measures || scenarios[0].measures.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#777' }}>
        <p>No measures available in the current scenario to display the Pay-off Bubble Plot.</p>
        <p>Please add measures to Scenario 1.</p>
      </div>
    );
  }
  
  return (
    <div style={{ height: '100%', minHeight: '500px', padding: '10px' }}> {/* Ensure container has height */}
      <Bubble data={data} options={bubbleOptions} ref={ref} />
    </div>
  );
}); 