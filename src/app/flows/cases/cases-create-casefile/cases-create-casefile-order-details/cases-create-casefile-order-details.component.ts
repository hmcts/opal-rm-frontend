import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { ChangeDetectionStrategy, Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import type { IOpalMaintenanceApplicationReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-application-reference-data-response.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderDetailsFormComponent } from './cases-create-casefile-order-details-form/cases-create-casefile-order-details-form.component';
import type { ICasesCreateCasefileOrderDetailsFormData } from './interfaces/cases-create-casefile-order-details-form-data.interface';
import type { ICasesCreateCasefileOrderDetailsForm } from './interfaces/cases-create-casefile-order-details-form.interface';
import { CasesCreateCasefileOrderDetailsMapperService } from './services/cases-create-casefile-order-details-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-order-details',
  imports: [CasesCreateCasefileOrderDetailsFormComponent, GovukBackLinkComponent],
  templateUrl: './cases-create-casefile-order-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderDetailsComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly mapper = inject(CasesCreateCasefileOrderDetailsMapperService);
  private readonly records = (
    this.route.snapshot.data['applications'] as IOpalMaintenanceApplicationReferenceDataResponse
  ).refData;
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

  public readonly applicationAutocompleteItems = this.mapper.toAutocompleteItems(this.records);
  public readonly initialFormData: ICasesCreateCasefileOrderDetailsFormData;

  public constructor() {
    super();
    this.initialFormData = this.mapper.toFormData(this.store.orderDetails());
  }

  public handleFormSubmit(form: ICasesCreateCasefileOrderDetailsForm): void {
    this.store.setOrderDetails(this.mapper.toOrderDetails(form.formData, this.records));
    this.stateUnsavedChanges = false;
    this.routerNavigate(this.reviewNavigation.returnPath(this.taskListPath), true);
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleCancel(): void {
    this.routerNavigate(this.reviewNavigation.returnPath(this.taskListPath), true);
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
