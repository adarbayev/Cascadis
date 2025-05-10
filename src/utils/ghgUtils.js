export function calcGHG(indicator, value, unit, getConversionFactorById, getEmissionFactorById) {
  // Ensure getConversionFactorById and getEmissionFactorById are passed if they are not globally available or imported within this util
  if (!value || isNaN(parseFloat(value))) return 0; // Ensure value is treated as a number
  
  let conv = 1;
  if (indicator.conversion_factor_id) {
    const cf = getConversionFactorById(indicator.conversion_factor_id);
    if (cf && cf.source_unit === unit) {
      conv = parseFloat(cf.conversion_factor) || 1; // Ensure conversion_factor is a number
    }
  }

  let ef = 0;
  if (indicator.emission_factor_id) {
    const efObj = getEmissionFactorById(indicator.emission_factor_id);
    if (efObj) {
      ef = parseFloat(efObj.value) || 0; // Ensure emission factor value is a number
    }
  }

  // It's safer to parse value at the beginning and ensure it's a number.
  let adjustedValue = parseFloat(value);

  // The 'multiplyNames' logic seems specific and might need review for broader applicability.
  // For now, keeping it as is.
  const multiplyNames = ['Electricity', 'District heat', 'Steam', 'Cooling'];
  if (multiplyNames.includes(indicator.name)) {
    // This multiplication by 2 seems arbitrary without more context.
    // Consider if this logic is universally correct or should be conditional/configurable.
    // adjustedValue = adjustedValue * 2; 
    // Commenting out the above line as it was identified as potentially problematic/arbitrary in previous steps.
    // If it's required, it should be well-documented or made more explicit.
  }

  const result = adjustedValue * conv * ef;
  return parseFloat(result.toFixed(2)); // Ensure the final result is a number
}

// If CONVERSION_FACTORS and EMISSION_FACTORS are static and large,
// passing getter functions (getConversionFactorById, getEmissionFactorById) is efficient.
// If these utils are meant to be self-contained, they might need direct access or imports.
// For now, this structure assumes the getter functions are provided from the calling context
// or will be imported if this util file grows. 