import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsSummaryComponent } from './cases-create-casefile-order-terms-summary.component';

describe('CasesCreateCasefileOrderTermsSummaryComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileOrderTermsSummaryComponent>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };

  beforeEach(async () => {
    router.navigateByUrl.mockClear();
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermsSummaryComponent],
      providers: [{ provide: Router, useValue: router }, CasesCreateCasefileStore],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsSummaryComponent);
  });

  it('renders the Order terms placeholder and returns to Case details without changing state', () => {
    const before = {
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds h1')?.textContent.trim()).toBe(
      'Order terms',
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

  it('starts a fresh add without marking Order Terms provided', () => {
    store.setPendingOrderTermResultId('MOCK02');
    const statuses = { ...store.taskStatuses() };
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#create_casefile_order_terms_add').click();
    expect(store.pendingOrderTermResultId()).toBeNull();
    expect(store.taskStatuses()).toEqual(statuses);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/select');
  });

  it('shows an empty Summary even when an input selection exists', () => {
    store.setPendingOrderTermResultId('MOCK01');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('There are currently no order terms.');
    fixture.nativeElement.querySelector('#create_casefile_order_terms_return').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
  });
});
