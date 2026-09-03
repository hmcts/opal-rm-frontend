import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileManagingPaymentsFormComponent } from './cases-create-casefile-managing-payments-form/cases-create-casefile-managing-payments-form.component';
import { CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES } from './constants/cases-create-casefile-managing-payments-field-names.constant';
import type { ICasesCreateCasefileManagingPaymentsFormData } from './interfaces/cases-create-casefile-managing-payments-form-data.interface';
import type { ICasesCreateCasefileManagingPaymentsForm } from './interfaces/cases-create-casefile-managing-payments-form.interface';

@Component({
  selector: 'app-cases-create-casefile-managing-payments',
  imports: [CasesCreateCasefileManagingPaymentsFormComponent],
  templateUrl: './cases-create-casefile-managing-payments.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileManagingPaymentsComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

  public readonly initialFormData: ICasesCreateCasefileManagingPaymentsFormData = {
    [CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]: this.store.paymentArrangement(),
  };

  public handleFormSubmit(form: ICasesCreateCasefileManagingPaymentsForm): void {
    this.store.setPaymentArrangement(
      form.formData[CASES_CREATE_CASEFILE_MANAGING_PAYMENTS_FIELD_NAMES.paymentArrangement]!,
    );
    this.stateUnsavedChanges = false;
    this.routerNavigate(this.taskListPath, true);
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleCancel(): void {
    this.routerNavigate(this.taskListPath, true);
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
