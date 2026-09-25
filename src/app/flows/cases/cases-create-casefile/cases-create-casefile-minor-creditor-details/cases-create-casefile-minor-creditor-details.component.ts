import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import type { IOpalMaintenanceCountryReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-response.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from './cases-create-casefile-minor-creditor-details-form/cases-create-casefile-minor-creditor-details-form.component';
import type { ICasesCreateCasefileMinorCreditorForm } from './interfaces/cases-create-casefile-minor-creditor-form.interface';
import { toMinorCreditorDetails, toMinorCreditorFormData } from './utils/cases-create-casefile-minor-creditor-mapper';

@Component({
  selector: 'app-cases-create-casefile-minor-creditor-details',
  imports: [CasesCreateCasefileMinorCreditorDetailsFormComponent],
  templateUrl: './cases-create-casefile-minor-creditor-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileMinorCreditorDetailsComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly navigationRouter = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly formComponent = viewChild(CasesCreateCasefileMinorCreditorDetailsFormComponent);
  private readonly entryTermId = this.store.currentOrderTermId();
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly summaryPath = '/' + this.paths.root + '/' + this.paths.children.minorCreditorSummary;
  private readonly entryCreditor = this.findEntryCreditor();
  private readonly entryDraft = this.store.creditorDraft();
  private navigationInFlight = false;
  private readonly countries = [
    ...(this.route.snapshot.data['countries'] as IOpalMaintenanceCountryReferenceDataResponse).refData,
  ].sort(
    (a, b) =>
      Number(b.country_name === 'United Kingdom') - Number(a.country_name === 'United Kingdom') ||
      a.country_name.localeCompare(b.country_name, 'en'),
  );
  public readonly creditorPath = '/' + this.paths.root + '/' + this.paths.children.orderTermCreditor;
  public readonly initialFormData = toMinorCreditorFormData(
    this.entryDraft?.termId === this.entryTermId
      ? (this.entryDraft.details ?? null)
      : (this.entryCreditor?.details ?? null),
  );
  public readonly countryAutocompleteItems = this.countries.map((country) => ({
    name: country.country_name,
    value: country.country_id,
  }));
  public readonly countrySelectOptions = [{ name: 'Select', value: '' }, ...this.countryAutocompleteItems];

  private findEntryCreditor() {
    if (this.store.creditorDraft()?.termId === this.entryTermId) return null;
    const assignment = this.store.orderTerms().find((term) => term.termId === this.entryTermId)?.creditor;
    return assignment?.type === 'minor'
      ? (this.store.minorCreditors().find((creditor) => creditor.sequenceNumber === assignment.sequenceNumber) ?? null)
      : null;
  }

  private async navigateSummary(): Promise<void> {
    this.navigationInFlight = true;
    try {
      await this.navigationRouter.navigateByUrl(this.summaryPath);
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.stateUnsavedChanges = unsavedChanges;
    this.store.setUnsavedChanges(unsavedChanges);
  }

  public handleFormSubmit(value: ICasesCreateCasefileMinorCreditorForm): void {
    if (this.navigationInFlight || this.entryTermId === null || this.store.currentOrderTermId() !== this.entryTermId)
      return;
    const details = toMinorCreditorDetails(value.formData);
    const draft = this.store.creditorDraft();
    const assignment = this.store.orderTerms().find((term) => term.termId === this.entryTermId)?.creditor;
    if (this.entryDraft?.termId === this.entryTermId) {
      if (draft?.termId !== this.entryTermId) return;
    } else if (
      !this.entryCreditor ||
      assignment?.type !== 'minor' ||
      assignment.sequenceNumber !== this.entryCreditor.sequenceNumber ||
      (draft && draft.existingSequenceNumber !== this.entryCreditor.sequenceNumber)
    )
      return;
    const countryName = this.countries.find(
      (country) => country.country_id === details.address.countryId,
    )?.country_name;
    if (!countryName || !this.store.savePendingMinorCreditorDetails(this.entryTermId, details, countryName)) return;
    this.formComponent()?.acceptSavedData(toMinorCreditorFormData(details));
    this.handleUnsavedChanges(false);
    this.changeDetector.detectChanges();
    void this.navigateSummary();
  }

  public async handleCancel(): Promise<void> {
    if (this.navigationInFlight) return;
    this.navigationInFlight = true;
    try {
      if (!(await this.navigationRouter.navigateByUrl(this.creditorPath))) return;
      if (this.store.creditorDraft()?.termId === this.entryTermId) this.store.clearCreditorDraft();
      this.handleUnsavedChanges(false);
    } catch {
      return;
    } finally {
      this.navigationInFlight = false;
    }
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
