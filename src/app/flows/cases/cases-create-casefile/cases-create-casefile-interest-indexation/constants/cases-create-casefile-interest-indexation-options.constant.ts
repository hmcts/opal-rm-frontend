import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from '../../constants/cases-create-casefile-indexation-types.constant';

export const CASES_CREATE_CASEFILE_INTEREST_INDEXATION_OPTIONS = {
  interest: [
    { key: 'yes', label: 'Yes', value: true },
    { key: 'no', label: 'No', value: false },
  ],
  indexation: [
    { key: 'rpi', label: 'Retail Price Index (RPI)', value: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI },
    { key: 'cpi', label: 'Consumer Price Index (CPI)', value: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI },
    { key: 'other', label: 'Other indexation', value: CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER },
    { key: 'none', label: 'No indexation', value: CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE },
  ],
} as const;
