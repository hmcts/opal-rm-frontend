import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { AbstractNestedFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-nested-form-base';
import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import type { ICasesCreateCasefileContactFieldNames } from './interfaces/cases-create-casefile-contact-field-names.interface';

@Component({
  selector: 'app-cases-create-casefile-contact-details',
  imports: [GovukTextInputComponent],
  templateUrl: './cases-create-casefile-contact-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileContactDetailsComponent extends AbstractNestedFormBaseComponent {
  @Input({ required: true }) public override form!: FormGroup;
  @Input({ required: true }) public override formControlErrorMessages!: IAbstractFormControlErrorMessage;
  @Input({ required: true }) public fieldNames!: ICasesCreateCasefileContactFieldNames;
}
