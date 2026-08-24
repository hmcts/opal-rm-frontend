import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../../constants/cases-create-casefile-case-types.constant';

export const CASES_CREATE_CASEFILE_CASE_TYPE_OPTIONS = [
  { key: 'remo-in', value: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN },
  { key: 'remo-out', value: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT },
  { key: 'remo-out-cms', value: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS },
] as const;
