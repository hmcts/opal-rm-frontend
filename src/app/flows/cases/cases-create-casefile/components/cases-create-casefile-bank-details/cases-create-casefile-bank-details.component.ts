import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AbstractNestedFormBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-nested-form-base';
import type { IAbstractFormControlErrorMessage } from '@hmcts/opal-frontend-common/components/abstract/interfaces';
import { GovukTextInputComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-text-input';
import type { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { CasesCreateCasefileApplicantBankType } from '../../types/cases-create-casefile-applicant-bank-type.type';
import type { ICasesCreateCasefileBankDetailsFieldNames } from './interfaces/cases-create-casefile-bank-details-field-names.interface';

type CasesCreateCasefileNonUkBankFieldName = keyof Pick<
  ICasesCreateCasefileBankDetailsFieldNames,
  | 'nonUkNameOnAccount'
  | 'nonUkAccountNumber'
  | 'nonUkPaymentReference'
  | 'nonUkBicSwiftCode'
  | 'nonUkIban'
  | 'nonUkBankName'
  | 'nonUkBranchSortCode'
>;

type CasesCreateCasefileNonUkBankFieldOrder = readonly [
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
  CasesCreateCasefileNonUkBankFieldName,
];

interface ICasesCreateCasefileBankDetailsLayout {
  headingMode: 'heading' | 'fieldset';
  nonUkFieldOrder: CasesCreateCasefileNonUkBankFieldOrder;
}

@Component({
  selector: 'app-cases-create-casefile-bank-details',
  imports: [NgTemplateOutlet, ReactiveFormsModule, GovukTextInputComponent],
  templateUrl: './cases-create-casefile-bank-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileBankDetailsComponent extends AbstractNestedFormBaseComponent {
  @Input({ required: true }) public override form!: FormGroup;
  @Input({ required: true }) public override formControlErrorMessages!: IAbstractFormControlErrorMessage;
  @Input({ required: true }) public fieldNames!: ICasesCreateCasefileBankDetailsFieldNames;
  @Input({ required: true }) public bankOptions!: ReadonlyArray<{
    readonly key: string;
    readonly value: CasesCreateCasefileApplicantBankType;
  }>;
  @Input({ required: true }) public bankTypes!: typeof CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES;
  @Input({ required: true }) public ukBankConditionalId!: string;
  @Input({ required: true }) public nonUkBankConditionalId!: string;
  @Input({ required: true }) public layout!: ICasesCreateCasefileBankDetailsLayout;

  public get bankTypeControl(): FormControl<CasesCreateCasefileApplicantBankType | null> {
    return this.form.controls[this.fieldNames.bankType] as FormControl<CasesCreateCasefileApplicantBankType | null>;
  }
}
