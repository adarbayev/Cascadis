import { INDICATORS, CONVERSION_FACTORS, EMISSION_FACTORS } from '../demoData';

export const indicatorById = (id) => INDICATORS.find(i => i.id === id);
export const getConversionFactorById = (id) => CONVERSION_FACTORS.find(cf => cf.id === id);
export const getEmissionFactorById = (id) => EMISSION_FACTORS.find(ef => ef.id === id); 