export const ORDER_DETAILS_INVALID_DATE_CASES = [
  { name: 'incomplete dates', value: '01/02', message: 'Enter a real date in the format DD/MM/YYYY' },
  { name: 'impossible dates', value: '31/02/2026', message: 'Enter a real date in the format DD/MM/YYYY' },
  { name: 'future dates', value: '01/01/2999', message: 'Date cannot be in the future' },
] as const;
