import type { IOpalMaintenanceResultDetail } from '../interfaces/opal-maintenance-result-detail.interface';

const common = [
  { name: 'amount', prompt: 'Amount', type: 'money', mandatory: true, language_dependent: false, min: 0, precision: 2 },
  {
    name: 'frequency',
    prompt: 'Payment frequency',
    type: 'menu',
    mandatory: true,
    language_dependent: false,
    readonly: true,
  },
  {
    name: 'expiry_date',
    prompt: 'Expiry date',
    type: 'date',
    mandatory: false,
    language_dependent: false,
    min: 0,
    max: 'No Limit',
    hint: 'For example, 31/03/2027',
  },
  {
    name: 'arrears',
    prompt: 'Arrears',
    type: 'money',
    mandatory: false,
    language_dependent: false,
    min: 0,
    precision: 2,
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
      { name: 'child_name', prompt: 'Child’s name', type: 'text', mandatory: true, language_dependent: false },
      {
        name: 'child_date_of_birth',
        prompt: 'Child’s date of birth',
        type: 'date',
        mandatory: true,
        language_dependent: false,
        date_rule: 'past',
        hint: 'For example, 31/03/2020',
      },
      ...common,
    ]),
  },
};
