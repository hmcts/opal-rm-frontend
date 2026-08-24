import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { DASHBOARD_ROUTING_PATHS } from '@app/pages/dashboard/constants/dashboard-routing-paths.constant';
import {
  CASES_CREATE_CASEFILE_APPLICANT_TYPES,
  CasesCreateCasefileApplicantType,
} from '../constants/cases-create-casefile-applicant-types.constant';
import {
  CASES_CREATE_CASEFILE_CASE_TYPES,
  CasesCreateCasefileCaseType,
} from '../constants/cases-create-casefile-case-types.constant';
import { CasesCreateCasefileCaseTypeSelection } from '../interfaces/cases-create-casefile-case-type-selection.type';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCaseTypeFormComponent } from './cases-create-casefile-case-type-form/cases-create-casefile-case-type-form.component';
import { ICasesCreateCasefileCaseTypeFormData } from './interfaces/cases-create-casefile-case-type-form-data.interface';
import { ICasesCreateCasefileCaseTypeForm } from './interfaces/cases-create-casefile-case-type-form.interface';

@Component({
  selector: 'app-cases-create-casefile-case-type',
  imports: [CasesCreateCasefileCaseTypeFormComponent],
  templateUrl: './cases-create-casefile-case-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCaseTypeComponent extends AbstractFormParentBaseComponent {
  private readonly store = inject(CasesCreateCasefileStore);

  private isCaseType(value: unknown): value is CasesCreateCasefileCaseType {
    return Object.values(CASES_CREATE_CASEFILE_CASE_TYPES).includes(value as CasesCreateCasefileCaseType);
  }

  private isApplicantType(value: unknown): value is CasesCreateCasefileApplicantType {
    return Object.values(CASES_CREATE_CASEFILE_APPLICANT_TYPES).includes(value as CasesCreateCasefileApplicantType);
  }

  public get initialFormData(): ICasesCreateCasefileCaseTypeFormData {
    const selection = this.store.caseTypeSelection();

    if (!selection || !this.isCaseType(selection.caseType)) {
      return { caseType: null, applicantType: null };
    }

    if (selection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      if (!('applicantType' in selection) || !this.isApplicantType(selection.applicantType)) {
        return { caseType: null, applicantType: null };
      }

      return { caseType: selection.caseType, applicantType: selection.applicantType };
    }

    if ('applicantType' in selection) {
      return { caseType: null, applicantType: null };
    }

    return { caseType: selection.caseType, applicantType: null };
  }

  public handleFormSubmit(form: ICasesCreateCasefileCaseTypeForm): void {
    const { caseType, applicantType } = form.formData;
    let selection: CasesCreateCasefileCaseTypeSelection | null = null;

    if (!this.isCaseType(caseType)) {
      return;
    }

    if (caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      if (!this.isApplicantType(applicantType)) {
        return;
      }

      selection = { caseType, applicantType };
    } else if (
      caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT ||
      caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS
    ) {
      selection = { caseType };
    }

    if (!selection) {
      return;
    }

    this.store.setCaseTypeSelection(selection);
    this.stateUnsavedChanges = false;
    this.routerNavigate(
      `/${CASES_CREATE_CASEFILE_ROUTING_PATHS.root}/${CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList}`,
      true,
    );
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleCancel(): void {
    this.routerNavigate(`/${DASHBOARD_ROUTING_PATHS.root}/${DASHBOARD_ROUTING_PATHS.children.cases}`, true);
  }
}
