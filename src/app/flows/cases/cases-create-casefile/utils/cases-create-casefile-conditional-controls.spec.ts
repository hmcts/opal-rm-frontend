import { FormControl, Validators } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { updateCasesCreateCasefileConditionalControls } from './cases-create-casefile-conditional-controls';

describe('updateCasesCreateCasefileConditionalControls', () => {
  const requiredTextValidator = Validators.required;

  it('enables selected controls and adds only their required validators without emitting control changes', () => {
    const optionalTextValidator = Validators.maxLength(10);
    const text = new FormControl({ value: null, disabled: true }, optionalTextValidator);
    const country = new FormControl({ value: null, disabled: true });
    const optional = new FormControl({ value: null, disabled: true }, optionalTextValidator);
    const textChanges = vi.fn();
    const countryChanges = vi.fn();
    const optionalChanges = vi.fn();
    text.valueChanges.subscribe(textChanges);
    country.valueChanges.subscribe(countryChanges);
    optional.valueChanges.subscribe(optionalChanges);

    updateCasesCreateCasefileConditionalControls(
      {
        controls: [text, country, optional],
        requiredTextControls: new Set([text]),
        requiredCountryControls: new Set([country]),
        requiredTextValidator,
      },
      true,
    );

    expect(text.enabled).toBe(true);
    expect(text.hasValidator(requiredTextValidator)).toBe(true);
    expect(text.hasValidator(optionalTextValidator)).toBe(true);
    expect(text.hasError('required')).toBe(true);
    expect(country.enabled).toBe(true);
    expect(country.hasValidator(Validators.required)).toBe(true);
    expect(country.hasError('required')).toBe(true);
    expect(optional.enabled).toBe(true);
    expect(optional.validator).not.toBeNull();
    expect(textChanges).not.toHaveBeenCalled();
    expect(countryChanges).not.toHaveBeenCalled();
    expect(optionalChanges).not.toHaveBeenCalled();
  });

  it('resets, clears errors, removes conditional validators and disables deselected controls without emitting control changes', () => {
    const optionalTextValidator = Validators.maxLength(10);
    const text = new FormControl('Content', [requiredTextValidator, optionalTextValidator]);
    const country = new FormControl(826, Validators.required);
    const optional = new FormControl('Optional', optionalTextValidator);
    const textChanges = vi.fn();
    const countryChanges = vi.fn();
    const optionalChanges = vi.fn();
    text.valueChanges.subscribe(textChanges);
    country.valueChanges.subscribe(countryChanges);
    optional.valueChanges.subscribe(optionalChanges);
    text.setErrors({ custom: true }, { emitEvent: false });
    country.setErrors({ custom: true }, { emitEvent: false });
    optional.setErrors({ custom: true }, { emitEvent: false });

    updateCasesCreateCasefileConditionalControls(
      {
        controls: [text, country, optional],
        requiredTextControls: new Set([text]),
        requiredCountryControls: new Set([country]),
        requiredTextValidator,
      },
      false,
    );

    expect(text.disabled).toBe(true);
    expect(text.value).toBeNull();
    expect(text.hasValidator(requiredTextValidator)).toBe(false);
    expect(text.hasValidator(optionalTextValidator)).toBe(true);
    expect(text.errors).toBeNull();
    expect(country.disabled).toBe(true);
    expect(country.value).toBeNull();
    expect(country.hasValidator(Validators.required)).toBe(false);
    expect(country.errors).toBeNull();
    expect(optional.disabled).toBe(true);
    expect(optional.value).toBeNull();
    expect(optional.hasValidator(optionalTextValidator)).toBe(true);
    expect(optional.errors).toBeNull();
    expect(textChanges).not.toHaveBeenCalled();
    expect(countryChanges).not.toHaveBeenCalled();
    expect(optionalChanges).not.toHaveBeenCalled();
  });
});
