import { AbstractControl, type ValidatorFn, Validators } from '@angular/forms';

export interface ICasesCreateCasefileConditionalControlsConfig {
  controls: readonly AbstractControl[];
  requiredTextControls: ReadonlySet<AbstractControl>;
  requiredCountryControls: ReadonlySet<AbstractControl>;
  requiredTextValidator: ValidatorFn;
}

export const updateCasesCreateCasefileConditionalControls = (
  config: ICasesCreateCasefileConditionalControlsConfig,
  selected: boolean,
): void => {
  for (const control of config.controls) {
    if (selected) {
      control.enable({ emitEvent: false });
      if (config.requiredTextControls.has(control)) {
        control.addValidators(config.requiredTextValidator);
      }
      if (config.requiredCountryControls.has(control)) {
        control.addValidators(Validators.required);
      }
    } else {
      control.reset(null, { emitEvent: false });
      if (config.requiredTextControls.has(control)) {
        control.removeValidators(config.requiredTextValidator);
      }
      if (config.requiredCountryControls.has(control)) {
        control.removeValidators(Validators.required);
      }
      control.setErrors(null, { emitEvent: false });
      control.disable({ emitEvent: false });
    }
    control.updateValueAndValidity({ emitEvent: false });
  }
};
