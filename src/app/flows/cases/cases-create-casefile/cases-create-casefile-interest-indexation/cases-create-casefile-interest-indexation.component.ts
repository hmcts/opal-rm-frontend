import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileInterestIndexationFormComponent } from './cases-create-casefile-interest-indexation-form/cases-create-casefile-interest-indexation-form.component';
import type { ICasesCreateCasefileInterestIndexationFormData } from './interfaces/cases-create-casefile-interest-indexation-form-data.interface';
import type { ICasesCreateCasefileInterestIndexationForm } from './interfaces/cases-create-casefile-interest-indexation-form.interface';

@Component({
  selector: 'app-cases-create-casefile-interest-indexation',
  imports: [CasesCreateCasefileInterestIndexationFormComponent],
  templateUrl: './cases-create-casefile-interest-indexation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileInterestIndexationComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

  public readonly initialFormData: ICasesCreateCasefileInterestIndexationFormData =
    this.store.interestAndIndexation() ?? { interestApplies: null, indexationType: null };

  public handleFormSubmit(form: ICasesCreateCasefileInterestIndexationForm): void {
    this.store.setInterestAndIndexation(form.formData);
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
