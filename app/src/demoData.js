// Demo data for hardcoded MVP (no localStorage, no persistence)

export const ORG_STRUCTURE = [
  {
    id: 'g1',
    type: 'Group',
    code: 'NOG001',
    name: 'NAT OIL GROUP',
    children: [
      {
        id: 'le1',
        type: 'Legal Entity',
        code: 'NOW001',
        name: 'NAT OIL WEST',
        children: [
          {
            id: 's1',
            type: 'Site',
            code: 'NOWO001',
            name: 'NAT OIL WEST OFFICE',
            country: 'Romania',
            latitude: 44.4268,
            longitude: 26.1025
          },
          {
            id: 's2',
            type: 'Site',
            code: 'NOWF001',
            name: 'NAT OIL WEST FIELD',
            country: 'Romania',
            latitude: 45.7538,
            longitude: 26.8212
          }
        ]
      },
      {
        id: 'le2',
        type: 'Legal Entity',
        code: 'NOE001',
        name: 'NAT OIL EAST',
        children: [
          {
            id: 's3',
            type: 'Site',
            code: 'NOEO001',
            name: 'NAT OIL EAST OFFICE',
            country: 'Kazakhstan',
            latitude: 43.2551,
            longitude: 76.9126
          },
          {
            id: 's4',
            type: 'Site',
            code: 'NOEF001',
            name: 'NAT OIL EAST FIELD',
            country: 'Kazakhstan',
            latitude: 47.1211,
            longitude: 51.8766
          }
        ]
      }
    ]
  }
];

export const INDICATORS = [
  // Scope 1
  { id: 'ind.001', name: 'Diesel', scope_tag: 'scope1', default_unit: 'L', conversion_factor_id: 'conv.001', emission_factor_id: 'ef.001' },
  { id: 'ind.002', name: 'Petrol', scope_tag: 'scope1', default_unit: 'L', conversion_factor_id: 'conv.002', emission_factor_id: 'ef.002' },
  { id: 'ind.003', name: 'Coal', scope_tag: 'scope1', default_unit: 't', conversion_factor_id: 'conv.003', emission_factor_id: 'ef.003' },
  { id: 'ind.004', name: 'Natural gas', scope_tag: 'scope1', default_unit: 'm³', conversion_factor_id: 'conv.004', emission_factor_id: 'ef.004' },
  // Scope 2
  { id: 'ind.005', name: 'Electricity', scope_tag: 'scope2', default_unit: 'kWh', conversion_factor_id: null, emission_factor_id: 'ef.006' },
  { id: 'ind.006', name: 'District heat', scope_tag: 'scope2', default_unit: 'kWh', conversion_factor_id: null, emission_factor_id: 'ef.007' },
  { id: 'ind.007', name: 'Steam', scope_tag: 'scope2', default_unit: 'kWh', conversion_factor_id: null, emission_factor_id: 'ef.008' },
  { id: 'ind.008', name: 'Cooling', scope_tag: 'scope2', default_unit: 'kWh', conversion_factor_id: null, emission_factor_id: 'ef.009' },
  // General
  { id: 'ind.009', name: 'Production output', scope_tag: 'general', default_unit: 't', conversion_factor_id: null, emission_factor_id: null },
  { id: 'ind.010', name: 'Revenue', scope_tag: 'general', default_unit: 'USD', conversion_factor_id: null, emission_factor_id: null },
  { id: 'ind.011', name: 'Floor area', scope_tag: 'general', default_unit: 'm²', conversion_factor_id: null, emission_factor_id: null }
];

export const EMISSION_FACTORS = [
  { id: 'ef.001', name: 'Diesel (1L)', value: 0.26808, scope_tag: 'scope1', source_comment: 'DEFRA 2024' },
  { id: 'ef.002', name: 'Petrol (1L)', value: 0.28523, scope_tag: 'scope1', source_comment: 'DEFRA 2024' },
  { id: 'ef.003', name: 'Coal (1t)', value: 0.333, scope_tag: 'scope1', source_comment: 'DEFRA 2024' },
  { id: 'ef.004', name: 'Natural gas (1m³)', value: 0.202, scope_tag: 'scope1', source_comment: 'DEFRA 2024' },
  { id: 'ef.006', name: 'IEA Electricity', value: 0.511, scope_tag: 'scope2', source_comment: 'IEA 2024' },
  { id: 'ef.007', name: 'IEA District heat', value: 0.250, scope_tag: 'scope2', source_comment: 'IEA 2024' },
  { id: 'ef.008', name: 'IEA Steam', value: 0.270, scope_tag: 'scope2', source_comment: 'IEA 2024' },
  { id: 'ef.009', name: 'IEA Cooling', value: 0.185, scope_tag: 'scope2', source_comment: 'IEA 2024' }
];

export const CONVERSION_FACTORS = [
  { id: 'conv.001', name: 'Diesel', source_unit: 'L', target_unit: 'kWh', conversion_factor: 10.7, source_comment: 'DEFRA 2024' },
  { id: 'conv.002', name: 'Petrol', source_unit: 'L', target_unit: 'kWh', conversion_factor: 9.5, source_comment: 'DEFRA 2024' },
  { id: 'conv.003', name: 'Coal', source_unit: 't', target_unit: 'kWh', conversion_factor: 6800, source_comment: 'DEFRA 2024' },
  { id: 'conv.004', name: 'Natural gas', source_unit: 'm³', target_unit: 'kWh', conversion_factor: 10.3, source_comment: 'DEFRA 2024' }
];

export const NODE_INDICATOR_MAPPING = {
  // Sites: scope 1, scope 2, and area
  s1: ['ind.001', 'ind.002', 'ind.003', 'ind.004', 'ind.005', 'ind.006', 'ind.007', 'ind.008', 'ind.011'],
  s2: ['ind.001', 'ind.002', 'ind.003', 'ind.004', 'ind.005', 'ind.006', 'ind.007', 'ind.008', 'ind.011'],
  s3: ['ind.001', 'ind.002', 'ind.003', 'ind.004', 'ind.005', 'ind.006', 'ind.007', 'ind.008', 'ind.011'],
  s4: ['ind.001', 'ind.002', 'ind.003', 'ind.004', 'ind.005', 'ind.006', 'ind.007', 'ind.008', 'ind.011'],
  // Legal entities: revenue and production output
  le1: ['ind.009', 'ind.010'],
  le2: ['ind.009', 'ind.010']
};

export const INVENTORY_YEARS = [
  { id: 1, name: 'Inventory 2024', year: 2024 }
];

export const QUESTIONNAIRE_DATA = {
  // Sites (dummy values for oil/gas)
  '1_s1': {
    'ind.001': { value: '12000', unit: 'L' }, // Diesel
    'ind.002': { value: '8000', unit: 'L' }, // Petrol
    'ind.003': { value: '100', unit: 't' }, // Coal
    'ind.004': { value: '50000', unit: 'm³' }, // Natural gas
    'ind.005': { value: '200000', unit: 'kWh' }, // Electricity
    'ind.006': { value: '10000', unit: 'kWh' }, // District heat
    'ind.007': { value: '5000', unit: 'kWh' }, // Steam
    'ind.008': { value: '3000', unit: 'kWh' }, // Cooling
    'ind.011': { value: '1200', unit: 'm²' } // Area
  },
  '1_s2': {
    'ind.001': { value: '25000', unit: 'L' },
    'ind.002': { value: '15000', unit: 'L' },
    'ind.003': { value: '300', unit: 't' },
    'ind.004': { value: '120000', unit: 'm³' },
    'ind.005': { value: '400000', unit: 'kWh' },
    'ind.006': { value: '20000', unit: 'kWh' },
    'ind.007': { value: '10000', unit: 'kWh' },
    'ind.008': { value: '6000', unit: 'kWh' },
    'ind.011': { value: '2500', unit: 'm²' }
  },
  '1_s3': {
    'ind.001': { value: '10000', unit: 'L' },
    'ind.002': { value: '7000', unit: 'L' },
    'ind.003': { value: '80', unit: 't' },
    'ind.004': { value: '40000', unit: 'm³' },
    'ind.005': { value: '180000', unit: 'kWh' },
    'ind.006': { value: '9000', unit: 'kWh' },
    'ind.007': { value: '4000', unit: 'kWh' },
    'ind.008': { value: '2500', unit: 'kWh' },
    'ind.011': { value: '1100', unit: 'm²' }
  },
  '1_s4': {
    'ind.001': { value: '22000', unit: 'L' },
    'ind.002': { value: '12000', unit: 'L' },
    'ind.003': { value: '250', unit: 't' },
    'ind.004': { value: '100000', unit: 'm³' },
    'ind.005': { value: '350000', unit: 'kWh' },
    'ind.006': { value: '18000', unit: 'kWh' },
    'ind.007': { value: '9000', unit: 'kWh' },
    'ind.008': { value: '5000', unit: 'kWh' },
    'ind.011': { value: '2200', unit: 'm²' }
  },
  // Legal entities (dummy values)
  '1_le1': {
    'ind.009': { value: '500000', unit: 't' }, // Production output
    'ind.010': { value: '120000000', unit: 'USD' } // Revenue
  },
  '1_le2': {
    'ind.009': { value: '400000', unit: 't' },
    'ind.010': { value: '95000000', unit: 'USD' }
  }
}; 