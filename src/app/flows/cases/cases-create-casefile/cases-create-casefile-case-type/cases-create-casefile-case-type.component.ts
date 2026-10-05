import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CasesDraftNavigationService } from '../../cases-draft/services/cases-draft-navigation.service';
import { Router, NavigationCancel, NavigationCancellationCode } from '@angular/router';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractFormParentBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-parent-base';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from '../routing/constants/cases-create-casefile-routing-paths.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileApplicantType } from '../types/cases-create-casefile-applicant-type.type';
import { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import { CasesCreateCasefileCaseType } from '../types/cases-create-casefile-case-type.type';
import { CasesCreateCasefileCaseTypeFormComponent } from './cases-create-casefile-case-type-form/cases-create-casefile-case-type-form.component';
import { CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES } from './constants/cases-create-casefile-case-type-field-names.constant';
import { ICasesCreateCasefileCaseTypeFormData } from './interfaces/cases-create-casefile-case-type-form-data.interface';
import { ICasesCreateCasefileCaseTypeForm } from './interfaces/cases-create-casefile-case-type-form.interface';

@Component({
  selector: 'app-cases-create-casefile-case-type',
  imports: [CasesCreateCasefileCaseTypeFormComponent],
  templateUrl: './cases-create-casefile-case-type.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCaseTypeComponent extends AbstractFormParentBaseComponent implements OnInit {
  private readonly cancelRouter = inject(Router);
  private readonly arrivalNavigation = this.cancelRouter.currentNavigation();
  private readonly reviewNavigation = inject(CasesCreateCasefileReviewNavigationService);
  private readonly store = inject(CasesCreateCasefileStore);
  private readonly dashboardNavigation = inject(CasesDraftNavigationService);
  private readonly injector = inject(Injector);
  private readonly cancelError = viewChild<ElementRef<HTMLElement>>('cancelError');
  private cancelRejectedByGuard = false;
  public readonly cancelling = signal(false);
  public readonly cancelNavigationFailed = signal(false);

  public readonly focusHeadingOnArrival = this.arrivalNavigation?.extras.state?.['focusCaseTypeHeading'] === true;

  constructor() {
    super();
    this.cancelRouter.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (
        this.cancelling() &&
        event instanceof NavigationCancel &&
        event.code === NavigationCancellationCode.GuardRejected
      ) {
        this.cancelRejectedByGuard = true;
      }
    });
  }

  private isCaseType(value: unknown): value is CasesCreateCasefileCaseType {
    return Object.values(CASES_CREATE_CASEFILE_CASE_TYPES).includes(value as CasesCreateCasefileCaseType);
  }

  private isApplicantType(value: unknown): value is CasesCreateCasefileApplicantType {
    return Object.values(CASES_CREATE_CASEFILE_APPLICANT_TYPES).includes(value as CasesCreateCasefileApplicantType);
  }

  public get initialFormData(): ICasesCreateCasefileCaseTypeFormData {
    const selection = this.store.caseTypeSelection();
    const { caseType, applicantType } = CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES;

    if (!selection || !this.isCaseType(selection.caseType)) {
      return { [caseType]: null, [applicantType]: null };
    }

    if (selection.caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      if (!('applicantType' in selection) || !this.isApplicantType(selection.applicantType)) {
        return { [caseType]: null, [applicantType]: null };
      }

      return { [caseType]: selection.caseType, [applicantType]: selection.applicantType };
    }

    if ('applicantType' in selection) {
      return { [caseType]: null, [applicantType]: null };
    }

    return { [caseType]: selection.caseType, [applicantType]: null };
  }

  public ngOnInit(): void {
    const navigation = this.arrivalNavigation;
    if (navigation?.trigger === 'imperative' && navigation.extras.state?.['startNewCase'] === true) {
      this.store.resetStore();
      this.reviewNavigation.clearContext();
    }
  }

  public handleFormSubmit(form: ICasesCreateCasefileCaseTypeForm): void {
    const {
      [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.caseType]: caseType,
      [CASES_CREATE_CASEFILE_CASE_TYPE_FIELD_NAMES.applicantType]: applicantType,
    } = form.formData;
    let selection: CasesCreateCasefileCaseTypeSelection;

    if (!this.isCaseType(caseType)) {
      return;
    }

    if (caseType === CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN) {
      if (!this.isApplicantType(applicantType)) {
        return;
      }

      selection = { caseType, applicantType };
    } else {
      selection = { caseType };
    }

    this.reviewNavigation.clearContext();
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

  public async handleCancel(): Promise<void> {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.cancelNavigationFailed.set(false);
    this.cancelRejectedByGuard = false;
    try {
      const success = await this.cancelRouter.navigateByUrl(this.dashboardNavigation.creationReturnUrl());
      this.cancelNavigationFailed.set(!success && !this.cancelRejectedByGuard);
    } catch {
      this.cancelNavigationFailed.set(true);
    } finally {
      this.cancelling.set(false);
      if (this.cancelNavigationFailed()) {
        afterNextRender(() => this.cancelError()?.nativeElement.focus(), { injector: this.injector });
      }
    }
  }
}
