import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { GovukBackLinkComponent } from '@hmcts/opal-frontend-common/components/govuk/govuk-back-link';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileCentralAuthorityFormComponent } from './cases-create-casefile-central-authority-form/cases-create-casefile-central-authority-form.component';
import type { ICasesCreateCasefileCentralAuthorityFormData } from './interfaces/cases-create-casefile-central-authority-form-data.interface';
import type { ICasesCreateCasefileCentralAuthorityForm } from './interfaces/cases-create-casefile-central-authority-form.interface';
import { CasesCreateCasefileCentralAuthorityMapperService } from './services/cases-create-casefile-central-authority-mapper.service';

@Component({
  selector: 'app-cases-create-casefile-central-authority',
  imports: [GovukBackLinkComponent, CasesCreateCasefileCentralAuthorityFormComponent],
  templateUrl: './cases-create-casefile-central-authority.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCentralAuthorityComponent extends AbstractFormParentBaseComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly mapper = inject(CasesCreateCasefileCentralAuthorityMapperService);
  private readonly records = (
    this.route.snapshot.data['centralAuthorities'] as IOpalMaintenanceMajorCreditorReferenceDataResponse
  ).refData;
  private readonly taskListPath =
    '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;

  public readonly centralAuthorityAutocompleteItems = this.mapper.toAutocompleteItems(this.records);
  public readonly initialFormData: ICasesCreateCasefileCentralAuthorityFormData;

  public constructor() {
    super();

    const saved = this.store.centralAuthorityDetails();
    const reconciled = this.mapper.reconcileSavedDetails(saved, this.records);

    if (saved?.majorCreditor !== reconciled?.majorCreditor && reconciled) {
      this.store.setCentralAuthorityDetails(reconciled);
    }

    this.initialFormData = this.mapper.toFormData(reconciled);
  }

  public handleFormSubmit(form: ICasesCreateCasefileCentralAuthorityForm): void {
    this.store.setCentralAuthorityDetails(this.mapper.toCentralAuthorityDetails(form.formData, this.records));
    this.stateUnsavedChanges = false;
    this.routerNavigate(this.taskListPath, true);
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.store.setUnsavedChanges(unsavedChanges);
    this.stateUnsavedChanges = unsavedChanges;
  }

  public handleBack(): void {
    this.routerNavigate(this.taskListPath, true);
  }

  public handleCancel(): void {
    this.routerNavigate(this.taskListPath, true);
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
