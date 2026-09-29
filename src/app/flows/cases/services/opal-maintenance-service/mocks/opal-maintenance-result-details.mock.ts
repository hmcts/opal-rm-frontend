import type { IOpalMaintenanceResultDetail } from '../interfaces/opal-maintenance-result-detail.interface';

const common = [
  {
    name: 'amount',
    prompt: 'Amount',
    type: 'decimal-2dp',
    mandatory: true,
    language_dependent: false,
    min: 0,
    max: 9999999999.99,
  },
  {
    name: 'frequency',
    prompt: 'Payment frequency',
    type: 'menu-radio',
    mandatory: true,
    language_dependent: false,
    min: 1,
    max: 1,
    options: ['Weekly', 'Fortnightly', 'Monthly', 'Quarterly', 'Yearly'],
  },
  {
    name: 'expiry_date',
    prompt: 'Expiry date',
    type: 'date',
    mandatory: false,
    language_dependent: false,
    min: '1900-01-01',
    max: '2100-12-31',
    hint: 'For example, 31/03/2027',
  },
  {
    name: 'arrears',
    prompt: 'Arrears',
    type: 'decimal-2dp',
    mandatory: false,
    language_dependent: false,
    min: 0,
    max: 9999999999.99,
  },
];

export const OPAL_MAINTENANCE_RESULT_DETAILS_MOCK: Readonly<Record<string, IOpalMaintenanceResultDetail>> = {
  MAT: {
    result_id: 'MAT',
    result_title: 'Maintenance',
    result_parameters: JSON.stringify(common),
  },
  MCHILD: {
    result_id: 'MCHILD',
    result_title: 'Child maintenance',
    result_parameters: JSON.stringify([
      {
        name: 'child_name',
        prompt: 'Child’s name',
        type: 'text-60',
        mandatory: true,
        min: 1,
        max: 60,
        language_dependent: false,
      },
      {
        name: 'child_date_of_birth',
        prompt: 'Child’s date of birth',
        type: 'date',
        mandatory: true,
        language_dependent: false,
        min: '1900-01-01',
        max: '2100-12-31',
        date_rule: 'past',
        hint: 'For example, 31/03/2020',
      },
      ...common,
    ]),
  },
};
