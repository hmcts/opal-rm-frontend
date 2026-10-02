import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';

export function orderTermErrorMessages(field: ICasesCreateCasefileOrderTermField) {
  const required: Record<string, string> = {
    amount: 'Enter an amount',
    arrears: 'Enter arrears',
    expiry_date: 'Enter an expiry date',
    child_name: 'Enter child’s name',
    child_date_of_birth: 'Enter child’s date of birth',
  };
  const choose = ['select', 'radio', 'autocomplete', 'checkbox'].includes(field.kind);
  const action = choose ? 'Select' : 'Enter';
  const requiredMessage = Object.hasOwn(required, field.name)
    ? required[field.name]
    : `${action} ${field.label.toLowerCase()}`;
  const periods = [
    ['past', 'in the past'],
    ['today', 'today'],
    ['future', 'in the future'],
  ] as const;
  const description = periods
    .filter(([period]) => field.datePermissions?.[period])
    .map(([, label]) => label)
    .join(' or ');
  return {
    ...(field.datePermissions ? { datePeriod: { message: `${field.label} must be ${description}`, priority: 3 } } : {}),
    required: { message: requiredMessage, priority: 1 },
    numeric: { message: 'Enter numbers only', priority: 2 },
    integer: { message: 'Enter a whole number within the supported range', priority: 2 },
    precision: { message: 'Enter an amount with no more than 2 decimal places', priority: 3 },
    invalidDate: { message: `Enter a valid ${field.label.toLowerCase()}`, priority: 2 },
    past: {
      message:
        field.name === 'child_date_of_birth'
          ? 'Child’s date of birth must be in the past'
          : `${field.label} must be in the past`,
      priority: 3,
    },
    minSelections: { message: `Select at least ${field.min} options for ${field.label.toLowerCase()}`, priority: 3 },
    maxSelections: {
      message: `Select no more than ${field.max} options for ${field.label.toLowerCase()}`,
      priority: 3,
    },
    choice: { message: `Select a valid ${field.label.toLowerCase()}`, priority: 2 },
    minLength: { message: `${field.label} must be ${field.min} characters or more`, priority: 3 },
    maxLength: { message: `${field.label} must be ${field.max} characters or fewer`, priority: 3 },
    min: {
      message:
        field.kind === 'date'
          ? `${field.label} must be on or after ${field.min}`
          : `${field.label} must be ${field.min ?? 0} or more`,
      priority: 3,
    },
    max: {
      message:
        field.kind === 'date'
          ? `${field.label} must be on or before ${field.max}`
          : `${field.label} must be ${field.max} or less`,
      priority: 3,
    },
  };
}
