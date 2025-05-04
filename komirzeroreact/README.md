# Kömir Zero - React Version

This is a React version of the Kömir Zero application, a carbon emissions management and planning tool.

## Project Structure

- **src/components/** - Reusable UI components
- **src/pages/** - Page-level components
- **src/hooks/** - Custom React hooks
- **src/utils/** - Utility functions
- **src/assets/** - Static assets

## Key Features

- **Dashboard with multiple visualizations:**
  - Emissions Trajectory
  - Marginal Abatement Cost Curve (MACC)
  - Abatement Wedges
  - Physical Climate Risks map

- **Organization Structure Management**
- **GHG Framework and Calculation Logic**
- **Data Collection Forms**
- **Reporting Tools**

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Development Notes

This project is being migrated from a vanilla JavaScript implementation to React, with improvements to the workflow and user interface.

## Next Steps

1. Complete migration of all components from vanilla JS to React
2. Implement proper state management
3. Connect charts using react-chartjs-2
4. Integrate map functionality with react-leaflet
5. Improve user workflow with the new left navigation 