import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileOrderTermsSummaryComponent } from './cases-create-casefile-order-terms-summary.component';

describe('CasesCreateCasefileOrderTermsSummaryComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileOrderTermsSummaryComponent>;
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  const acceptedTerms: ICasesCreateCasefileAcceptedOrderTerm[] = [
    {
      termId: 7,
      resultId: 'MAT',
      parameters: { amount: '10.00' },
      creditor: { type: 'major', majorCreditorId: 101, displayName: 'Synthetic major creditor' },
      presentation: {
        title: 'Maintenance',
        fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
      },
    },
    {
      termId: 12,
      resultId: 'MAT',
      parameters: { amount: '20.00' },
      creditor: null,
      presentation: {
        title: 'Maintenance',
        fields: [{ name: 'amount', label: 'Amount', kind: 'money', options: [] }],
      },
    },
  ];

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

  it('renders multiple accepted terms as distinct cards with accessible actions', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('[data-order-term-id]');
    expect(cards).toHaveLength(2);
    expect(Array.from(cards).map((card) => (card as HTMLElement).querySelector('h2')?.textContent?.trim())).toEqual([
      'Maintenance',
      'Maintenance',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('There are currently no order terms.');
    const actions = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.govuk-summary-card__action a'));
    expect(actions.map((action) => action.querySelector('strong')?.textContent?.trim())).toEqual([
      'Change',
      'Remove',
      'Change',
      'Remove',
    ]);
    expect(actions.map((action) => action.querySelector('.govuk-visually-hidden')?.textContent?.trim())).toEqual([
      'Maintenance',
      'Maintenance',
      'Maintenance',
      'Maintenance',
    ]);
  });

  it('starts an amendment for the stable term ID and preserves accepted data while navigation fails', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const before = structuredClone(store.orderTerms());
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    fixture.detectChanges();

    await fixture.componentInstance.handleChange(12);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/add/MAT');
    expect(store.orderTermAmendment()?.termId).toBe(12);
    expect(store.orderTerms()).toEqual(before);
  });

  it('prevents a second Change from superseding the active navigation transaction', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const first = fixture.componentInstance.handleChange(7);

    await fixture.componentInstance.handleChange(12);

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(store.orderTermAmendment()?.termId).toBe(7);
    resolveNavigation(true);
    await first;
  });

  it('navigates Remove by the current array index without changing accepted data', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const before = structuredClone(store.orderTerms());

    fixture.componentInstance.handleRemove(fixture.componentInstance.cards()[1].removePath);

    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/remove/1');
    expect(store.orderTerms()).toEqual(before);
  });

  it('cancels a failed Change only after Return navigation succeeds', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic change failure'));
    await fixture.componentInstance.handleChange(7);
    const amendment = store.orderTermAmendment();
    router.navigateByUrl.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    await fixture.componentInstance.handleBack();
    expect(store.orderTermAmendment()).toBe(amendment);

    await fixture.componentInstance.handleBack();
    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedTerms);
    await fixture.componentInstance.handleChange(12);
    expect(store.orderTermAmendment()?.termId).toBe(12);
  });

  it('retains a failed Change when Return navigation rejects', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(7);
    const amendment = store.orderTermAmendment();
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic return failure'));

    await fixture.componentInstance.handleBack();

    expect(store.orderTermAmendment()).toBe(amendment);
    expect(store.orderTerms()).toEqual(acceptedTerms);
  });

  it('abandons a failed Change before starting Add while preserving accepted terms', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic change failure'));
    await fixture.componentInstance.handleChange(7);

    fixture.componentInstance.handleAddTerms();

    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedTerms);
    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/order-terms/select');
  });
});
