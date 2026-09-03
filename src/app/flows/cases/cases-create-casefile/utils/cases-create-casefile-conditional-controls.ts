import { AbstractControl, type ValidatorFn, Validators } from '@angular/forms';

export interface ICasesCreateCasefileConditionalControlsConfig {
  controls: readonly AbstractControl[];
  requiredTextControls: ReadonlySet<AbstractControl>;
  requiredCountryControls: ReadonlySet<AbstractControl>;
  requiredTextValidator: ValidatorFn;
}

const updateConditionalValidators = (
  config: ICasesCreateCasefileConditionalControlsConfig,
  control: AbstractControl,
  operation: 'add' | 'remove',
): void => {
  if (config.requiredTextControls.has(control)) {
    control[operation === 'add' ? 'addValidators' : 'removeValidators'](config.requiredTextValidator);
  }
  if (config.requiredCountryControls.has(control)) {
    control[operation === 'add' ? 'addValidators' : 'removeValidators'](Validators.required);
  }
};

const activateConditionalControl = (
  config: ICasesCreateCasefileConditionalControlsConfig,
  control: AbstractControl,
): void => {
  control.enable({ emitEvent: false });
  updateConditionalValidators(config, control, 'add');
  control.updateValueAndValidity({ emitEvent: false });
};

const deactivateConditionalControl = (
  config: ICasesCreateCasefileConditionalControlsConfig,
  control: AbstractControl,
): void => {
  control.reset(null, { emitEvent: false });
  updateConditionalValidators(config, control, 'remove');
  control.setErrors(null, { emitEvent: false });
  control.disable({ emitEvent: false });
  control.updateValueAndValidity({ emitEvent: false });
};

export const updateCasesCreateCasefileConditionalControls = (
  config: ICasesCreateCasefileConditionalControlsConfig,
  selected: boolean,
): void => {
  for (const control of config.controls) {
    if (selected) {
      activateConditionalControl(config, control);
    } else {
      deactivateConditionalControl(config, control);
    }
  }
};
