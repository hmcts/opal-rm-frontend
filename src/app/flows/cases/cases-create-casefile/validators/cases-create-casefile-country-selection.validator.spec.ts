import { FormControl } from '@angular/forms';
import { createCasesCreateCasefileCountrySelectionValidator } from './cases-create-casefile-country-selection.validator';

describe('createCasesCreateCasefileCountrySelectionValidator', () => {
  const autocompleteOptions = [
    { name: 'England', value: 1 },
    { name: 'Scotland', value: 2 },
  ] as const;
  const selectOptions = [
    { name: 'Wales', value: '3' },
    { name: 'Northern Ireland', value: '4' },
  ] as const;

  it.each([
    ['a matching numeric value', autocompleteOptions, 1],
    ['a matching string value', selectOptions, '3'],
    ['a numeric value matching a string option', selectOptions, 3],
    ['a string value matching a numeric option', autocompleteOptions, '1'],
  ])('returns null for %s', (_description, options, value) => {
    const validator = createCasesCreateCasefileCountrySelectionValidator(options);

    expect(validator(new FormControl(value))).toBeNull();
  });

  it.each([
    ['null', null],
    ['an empty string', ''],
    ['an unknown country value', 'unknown'],
    ['a number absent from the options', 999],
  ])('returns required for %s', (_description, value) => {
    const validator = createCasesCreateCasefileCountrySelectionValidator(autocompleteOptions);

    expect(validator(new FormControl(value))).toEqual({ required: true });
  });
});
