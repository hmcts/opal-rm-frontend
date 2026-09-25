import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { GENERIC_HTTP_ERROR_MESSAGE } from '@hmcts/opal-frontend-common/interceptors/http-error/constants';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermCreditorFormComponent } from './cases-create-casefile-order-term-creditor-form/cases-create-casefile-order-term-creditor-form.component';
import type { ICasesCreateCasefileOrderTermCreditorForm } from './interfaces/cases-create-casefile-order-term-creditor-form.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import { creditorAssignment, creditorFormValue } from './utils/cases-create-casefile-creditor-form-value';

function applicantLabel(details: CasesCreateCasefileApplicantDetails | null): string {
  if (!details) return 'Applicant (Applicant)';
  const name =
    'organisationName' in details
      ? details.organisationName
      : [details.title, details.firstNames, details.lastName]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(' ');
  return `${name} (Applicant)`;
}

@Component({
  selector: 'app-cases-create-casefile-order-term-creditor',
  imports: [CasesCreateCasefileOrderTermCreditorFormComponent],
  templateUrl: './cases-create-casefile-order-term-creditor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileOrderTermCreditorComponent
  extends AbstractFormParentBaseComponent
  implements OnDestroy
{
  private readonly route = inject(ActivatedRoute);
  private readonly navigationRouter = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly entryTermId = this.store.currentOrderTermId();
  private readonly paths = CASES_CREATE_CASEFILE_ROUTING_PATHS;
  private readonly summaryPath = '/' + this.paths.root + '/' + this.paths.children.orderTermsSummary;
  private readonly minorCreditorDetailsPath = '/' + this.paths.root + '/' + this.paths.children.minorCreditorDetails;
  private navigationInFlight = false;
  public readonly majorCreditors = (
    this.route.snapshot.data['majorCreditors'] as IOpalMaintenanceMajorCreditorReferenceDataResponse
  ).refData;
  public readonly applicantLabel = computed(() => applicantLabel(this.store.applicantDetails()));
  public readonly minorCreditors = this.store.minorCreditors;
  public readonly navigationFailed = signal(false);
  public readonly safeNavigationErrorMessage = GENERIC_HTTP_ERROR_MESSAGE;
  public readonly initialFormData = computed(() => {
    const term = this.store.orderTerms().find((candidate) => candidate.termId === this.entryTermId);
    return creditorFormValue(term?.creditor ?? null, this.store.creditorDraft()?.termId === this.entryTermId);
  });

  private async navigateAccepted(path: string): Promise<void> {
    if (this.navigationInFlight) return;
    this.navigationInFlight = true;
    this.navigationFailed.set(false);
    try {
      const navigated = await this.navigationRouter.navigateByUrl(path);
      if (!navigated) this.navigationFailed.set(true);
    } catch {
      this.navigationFailed.set(true);
    } finally {
      this.navigationInFlight = false;
    }
  }

  public handleUnsavedChanges(unsavedChanges: boolean): void {
    this.stateUnsavedChanges = unsavedChanges;
    this.store.setUnsavedChanges(unsavedChanges);
  }

  public handleFormSubmit(value: ICasesCreateCasefileOrderTermCreditorForm): void {
    if (this.navigationInFlight) return;
    const termId = this.entryTermId;
    if (termId === null || this.store.currentOrderTermId() !== termId) return;

    if (value.formData.create_casefile_order_term_creditor_choice === 'add-new') {
      if (!this.store.setPendingNewMinorCreditor(termId)) return;
      this.handleUnsavedChanges(false);
      this.changeDetector.detectChanges();
      void this.navigateAccepted(this.minorCreditorDetailsPath);
      return;
    }

    const assignment = creditorAssignment(value.formData, this.store.minorCreditors(), this.majorCreditors);
    if (!assignment || !this.store.assignCurrentOrderTermCreditor(termId, assignment)) return;
    this.handleUnsavedChanges(false);
    this.changeDetector.detectChanges();
    void this.navigateAccepted(this.summaryPath);
  }

  public async handleCancel(): Promise<void> {
    if (this.navigationInFlight) return;
    this.navigationInFlight = true;
    this.navigationFailed.set(false);
    try {
      const navigated = await this.navigationRouter.navigateByUrl(this.summaryPath);
      if (!navigated) return;
      this.store.clearCreditorDraft();
      this.handleUnsavedChanges(false);
    } catch {
      this.navigationFailed.set(true);
    } finally {
      this.navigationInFlight = false;
    }
  }

  public ngOnDestroy(): void {
    this.store.setUnsavedChanges(false);
  }
}
