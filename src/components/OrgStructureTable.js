import React, { useState, useEffect } from 'react';
import './OrgStructureTable.css';

// Load data from localStorage or use default data
const getInitialData = () => {
  const savedData = localStorage.getItem('orgStructureData');
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved org structure data:', e);
    }
  }
  
  // Default data if nothing in localStorage
  return [
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
};

// ... rest of the file remains the same 