import { describe, expect, it } from 'vitest';
import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from '../../../services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import { mapOrderTermParameters } from './cases-create-casefile-order-term-metadata';
import { orderTermErrorMessages } from './cases-create-casefile-order-term-errors';

describe('orderTermErrorMessages', () => {
  const fields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MAT'].result_parameters);
  const childFields = mapOrderTermParameters(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK['MCHILD'].result_parameters);

  it('returns the complete exact error copy for amount', () => {
    const amount = fields.find((field) => field.name === 'amount')!;
    expect(orderTermErrorMessages(amount)).toEqual({
      required: { message: 'Enter an amount', priority: 1 },
      numeric: { message: 'Enter numbers only', priority: 2 },
      integer: { message: 'Enter a whole number within the supported range', priority: 2 },
      precision: { message: 'Enter an amount with no more than 2 decimal places', priority: 3 },
      invalidDate: { message: 'Enter a valid amount', priority: 2 },
      past: { message: 'Amount must be in the past', priority: 3 },
      choice: { message: 'Select a valid amount', priority: 2 },
      minLength: { message: 'Amount must be 0 characters or more', priority: 3 },
      maxLength: { message: 'Amount must be null characters or fewer', priority: 3 },
      min: { message: 'Amount must be 0 or more', priority: 3 },
      max: { message: 'Amount must be null or less', priority: 3 },
    });
  });

  it('returns exact date-specific copy', () => {
    const birthDate = childFields.find((field) => field.name === 'child_date_of_birth')!;
    expect(orderTermErrorMessages(birthDate)).toMatchObject({
      required: { message: 'Enter child’s date of birth', priority: 1 },
      invalidDate: { message: 'Enter a valid child’s date of birth', priority: 2 },
      past: { message: 'Child’s date of birth must be in the past', priority: 3 },
      min: { message: 'Child’s date of birth must be on or after null', priority: 3 },
      max: { message: 'Child’s date of birth must be on or before null', priority: 3 },
    });
  });

  it.each(['constructor', 'toString'])('uses fallback required copy for own-property-unsafe name %s', (name) => {
    const custom: ICasesCreateCasefileOrderTermField = {
      ...fields[2],
      name,
      label: 'Custom value',
      kind: 'text',
    };
    expect(orderTermErrorMessages(custom).required).toEqual({ message: 'Enter custom value', priority: 1 });
  });

  it('uses select wording for a choice field', () => {
    const custom: ICasesCreateCasefileOrderTermField = {
      ...fields[2],
      name: 'category',
      label: 'Category',
      kind: 'autocomplete',
    };
    expect(orderTermErrorMessages(custom).required).toEqual({ message: 'Select category', priority: 1 });
  });
});
