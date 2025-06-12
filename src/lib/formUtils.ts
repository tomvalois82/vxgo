
export const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/\D/g, '');
  const number = Number(numericValue) / 100;
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatMileage = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
};

export const extractNumericValue = (formattedPrice: string | number): number => {
  if (formattedPrice === null || formattedPrice === undefined) return 0;
  if (typeof formattedPrice === 'number') return formattedPrice;
  return parseFloat(formattedPrice.replace(/\D/g, '')) / 100;
};

// Export the conversion functions
export { convertToWords, convertFromWords } from './numberToWords';
