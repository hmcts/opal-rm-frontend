import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AbstractNestedFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-nested-form-base';
import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import type { ICasesCreateCasefileAddressTextFieldNames } from './interfaces/cases-create-casefile-address-text-field-names.interface';

@Component({
  selector: 'app-cases-create-casefile-address-text-fields',
  imports: [GovukTextInputComponent],
  templateUrl: './cases-create-casefile-address-text-fields.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileAddressTextFieldsComponent extends AbstractNestedFormBaseComponent {
  @Input({ required: true }) public override form!: FormGroup;
  @Input({ required: true }) public override formControlErrorMessages!: IAbstractFormControlErrorMessage;
  @Input({ required: true }) public fieldNames!: ICasesCreateCasefileAddressTextFieldNames;
}
