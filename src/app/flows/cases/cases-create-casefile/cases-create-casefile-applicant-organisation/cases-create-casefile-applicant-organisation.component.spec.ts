import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileApplicantOrganisationComponent } from './cases-create-casefile-applicant-organisation.component';

describe('CasesCreateCasefileApplicantOrganisationComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileApplicantOrganisationComponent>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    router.navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileApplicantOrganisationComponent],
      providers: [{ provide: Router, useValue: router }, CasesCreateCasefileStore],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    fixture = TestBed.createComponent(CasesCreateCasefileApplicantOrganisationComponent);
    fixture.detectChanges();
  });

  it('renders the Applicant details - Organisation placeholder and returns to Case details without changing state', () => {
    const before = {
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    };
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds h1')?.textContent.trim()).toBe(
      'Applicant details - Organisation',
    );
    fixture.nativeElement.querySelector('a.govuk-back-link').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
    expect({
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });
});
