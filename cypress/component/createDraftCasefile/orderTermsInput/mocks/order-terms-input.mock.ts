import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';

const autocompleteLabels = ['synthetic A & B', "synthetic O'Brien"];

export const ORDER_TERMS_INPUT_MOCK = {
  autocompleteLabels,
  controlErrors: ['Enter short text', 'Enter count', 'Select choice', 'Select menu', 'Select lookup', 'Select confirm'],
  problem: {
    status: 503,
    title: '<strong>Synthetic title</strong>',
    detail: '<img src=x onerror="alert(1)">Synthetic detail',
    operation_id: 'synthetic-reference',
  },
  literal: {
    result_id: 'MAT',
    result_title: '<strong>synthetic</strong>',
    active: true,
    order_term: true,
    result_parameters: JSON.stringify([
      {
        name: 'short_text',
        prompt: '<strong>synthetic</strong>',
        hint: '<strong>synthetic</strong>',
        type: 'text',
        mandatory: false,
        language_dependent: false,
      },
      {
        name: 'lookup',
        prompt: 'Lookup',
        type: 'autocomplete',
        mandatory: true,
        language_dependent: false,
        options: [
          { value: 'literal', label: autocompleteLabels[0] },
          { value: 'event', label: autocompleteLabels[1] },
        ],
      },
    ]),
  },
  mat: OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'],
  child: OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MCHILD'],
  valid: { amount: '12.30', expiry_date: '', arrears: '' },
  invalid: { amount: 'abc', expiry_date: '31/02/2026', arrears: '12.30' },
  childValid: { child_name: 'Synthetic child', child_date_of_birth: '01/01/2000', amount: '20', arrears: '0' },
  expected: { resultId: 'MAT', parameters: { amount: '12.30' } },
  allControls: {
    result_id: 'MAT',
    result_title: 'Synthetic controls',
    active: true,
    order_term: true,
    result_parameters: JSON.stringify([
      {
        name: 'short_text',
        prompt: 'Short text',
        type: 'text',
        mandatory: true,
        language_dependent: false,
        min: 2,
        max: 5,
      },
      {
        name: 'long_text',
        prompt: 'Long text',
        type: 'long_text',
        mandatory: false,
        language_dependent: false,
        max: 100,
      },
      { name: 'count', prompt: 'Count', type: 'integer', mandatory: true, language_dependent: false, min: 1, max: 5 },
      {
        name: 'choice',
        prompt: 'Choice',
        type: 'radio',
        mandatory: true,
        language_dependent: false,
        options: [
          { value: 'a', label: 'Option A' },
          { value: 'b', label: 'Option B' },
        ],
      },
      {
        name: 'menu',
        prompt: 'Menu',
        type: 'select',
        mandatory: true,
        language_dependent: false,
        options: [{ value: 'x', label: 'Option X' }],
      },
      {
        name: 'lookup',
        prompt: 'Lookup',
        type: 'autocomplete',
        mandatory: true,
        language_dependent: false,
        apidata: 'mock:order-term-options',
        hint: 'Choose a synthetic option',
      },
      { name: 'confirm', prompt: 'Confirm', type: 'checkbox', mandatory: true, language_dependent: false },
    ]),
  },
};
