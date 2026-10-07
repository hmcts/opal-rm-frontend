import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS } from '../cases-create-casefile-applicant-organisation/mocks/cases-create-casefile-applicant-organisation.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
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
    router.navigateByUrl.mockReset().mockResolvedValue(true);
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileOrderTermsSummaryComponent],
      providers: [{ provide: Router, useValue: router }, CasesCreateCasefileStore],
    }).compileComponents();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    store.setTaskStatus('respondent', CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    fixture = TestBed.createComponent(CasesCreateCasefileOrderTermsSummaryComponent);
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders the Order terms placeholder and returns to Case details without changing state', () => {
    const before = {
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-full')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.govuk-grid-column-full h1')?.textContent.trim()).toBe('Order terms');
    fixture.nativeElement.querySelector('#create_casefile_order_terms_return').click();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
    expect({
      caseTypeSelection: store.caseTypeSelection(),
      taskStatuses: store.taskStatuses(),
      unsavedChanges: store.unsavedChanges(),
      stateChanges: store.stateChanges(),
    }).toEqual(before);
  });

  it('groups the primary return action before the secondary add action below a divider', () => {
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('hr')).not.toBeNull();
    const buttons = root.querySelectorAll('.govuk-button-group button');
    expect(Array.from(buttons).map((button) => button.textContent?.trim())).toEqual([
      'Return to case details',
      'Add terms',
    ]);
    expect(buttons[0].classList.contains('govuk-button--secondary')).toBe(false);
    expect(buttons[1].classList.contains('govuk-button--secondary')).toBe(true);
    buttons[0].dispatchEvent(new MouseEvent('click'));
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/task-list');
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

  for (const failure of ['false', 'rejection'] as const) {
    it(`clears a new amendment after navigation ${failure} so another card remains usable`, async () => {
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTerms: structuredClone(acceptedTerms),
      });
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));

      await fixture.componentInstance.handleChange(12);

      expect(store.orderTermAmendment()).toBeNull();
      expect(store.currentOrderTermId()).toBeNull();
      expect(store.pendingOrderTermResultId()).toBeNull();
      expect(store.orderTerms()).toEqual(acceptedTerms);
      await fixture.componentInstance.handleChange(7);
      expect(store.orderTermAmendment()?.termId).toBe(7);
      expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    });

    it(`retains an existing amendment after navigation ${failure}`, async () => {
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTerms: structuredClone(acceptedTerms),
      });
      store.beginOrderTermAmendment(7);
      const amendment = store.orderTermAmendment();
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));

      await fixture.componentInstance.handleChange(7);

      expect(store.orderTermAmendment()).toBe(amendment);
    });
  }

  it('preserves a replacement amendment with the same term ID after a late failure', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const change = fixture.componentInstance.handleChange(7);
    store.cancelOrderTermAmendment(7);
    store.beginOrderTermAmendment(7);
    const replacement = store.orderTermAmendment();

    resolveNavigation(false);
    await change;

    expect(store.orderTermAmendment()).toBe(replacement);
  });

  it('preserves an amendment edited before navigation fails', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const change = fixture.componentInstance.handleChange(7);
    const amendment = store.orderTermAmendment();
    store.setUnsavedChanges(true);

    resolveNavigation(false);
    await change;

    expect(store.orderTermAmendment()).toBe(amendment);
    expect(store.unsavedChanges()).toBe(true);
  });

  it('opens another term after confirming abandonment of the existing amendment', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(12);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await fixture.componentInstance.handleChange(7);

    expect(store.orderTermAmendment()?.termId).toBe(7);
    expect(store.orderTermAmendment()?.term).toEqual(acceptedTerms[0]);
    expect(store.orderTerms()).toEqual(acceptedTerms);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
  });

  it('clears the replacement amendment when switching cards fails to navigate', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(12);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    router.navigateByUrl.mockResolvedValueOnce(false);

    await fixture.componentInstance.handleChange(7);

    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedTerms);
    await fixture.componentInstance.handleChange(12);
    expect(store.orderTermAmendment()?.termId).toBe(12);
  });

  it('preserves the pending amendment when switching terms is declined', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(12);
    const amendment = store.orderTermAmendment();
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await fixture.componentInstance.handleChange(7);

    expect(window.confirm).toHaveBeenCalledOnce();
    expect(store.orderTermAmendment()).toBe(amendment);
    expect(store.orderTerms()).toEqual(acceptedTerms);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
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

  it('prevents Add from cancelling an amendment while Change navigation is active', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const change = fixture.componentInstance.handleChange(7);

    fixture.componentInstance.handleAddTerms();

    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
    expect(store.orderTermAmendment()?.termId).toBe(7);
    resolveNavigation(true);
    await change;
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

  it('cancels an existing amendment only after Return navigation succeeds', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(7);
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

  it('retains an existing amendment when Return navigation rejects', async () => {
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

  it('abandons an existing amendment before starting Add while preserving accepted terms', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(7);

    fixture.componentInstance.handleAddTerms();

    expect(store.orderTermAmendment()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedTerms);
    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/order-terms/select');
  });
  it.each([
    [CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved, 'Mr Test Applicant'],
    [
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk,
      CASES_CREATE_CASEFILE_APPLICANT_ORGANISATION_MOCKS.savedUk.organisationName,
    ],
    [null, undefined],
  ])('renders the assigned applicant name and bank details %#', (applicantDetails, name) => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      applicantDetails,
      orderTerms: [{ ...acceptedTerms[0], creditor: { type: 'applicant' } }],
    });
    fixture.detectChanges();
    const card = fixture.componentInstance.cards()[0];
    expect(card.rows.find((row) => row.id === 'assigned-creditor')?.value).toBe(name);
    expect(card.bankRows.find((row) => row.id === 'nameOnAccount')?.value).toBe(
      applicantDetails?.bankDetails.type === 'uk' ? applicantDetails.bankDetails.nameOnAccount : undefined,
    );
  });

  it.each([true, false])('renders minor creditor details only when the assigned record exists (%s)', (exists) => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: [{ ...acceptedTerms[0], creditor: { type: 'minor', sequenceNumber: 3 } }],
      minorCreditors: exists
        ? [
            {
              sequenceNumber: 3,
              displayName: 'Synthetic minor creditor',
              details: {
                ...MINOR_CREDITOR_DETAILS_MOCK,
                bank: {
                  type: 'uk',
                  nameOnAccount: 'Synthetic minor creditor',
                  sortCode: '123456',
                  accountNumber: '12345678',
                  paymentReference: 'REF-123',
                },
              },
            },
          ]
        : [],
    });
    const card = fixture.componentInstance.cards()[0];
    expect(card.rows.find((row) => row.id === 'assigned-creditor')?.value).toBe(
      exists ? 'Synthetic minor creditor' : undefined,
    );
    expect(card.bankRows).toEqual(
      exists
        ? [
            { id: 'nameOnAccount', label: 'Name on account', value: 'Synthetic minor creditor' },
            { id: 'sortCode', label: 'Sort code', value: '123456' },
            { id: 'accountNumber', label: 'Account number', value: '12345678' },
            { id: 'paymentReference', label: 'Payment reference', value: 'REF-123' },
          ]
        : [],
    );
  });

  it('ignores Change for a removed card', async () => {
    await fixture.componentInstance.handleChange(999);
    expect(store.orderTermAmendment()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not navigate when the store refuses to open an amendment', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    vi.spyOn(store, 'beginOrderTermAmendment').mockReturnValue(false);
    await fixture.componentInstance.handleChange(7);
    expect(store.orderTerms()).toEqual(acceptedTerms);
    expect(store.orderTermAmendment()).toBeNull();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('keeps the pending Change intact when Remove or Return is clicked before navigation settles', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let finish!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (finish = resolve)));
    const change = fixture.componentInstance.handleChange(7);
    fixture.componentInstance.handleRemove(fixture.componentInstance.cards()[0].removePath);
    await fixture.componentInstance.handleBack();
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(store.orderTermAmendment()?.termId).toBe(7);
    finish(true);
    await change;
  });

  it('allows Return to retry after a rejected navigation without an amendment', async () => {
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic return failure'));
    await fixture.componentInstance.handleBack();
    await fixture.componentInstance.handleBack();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/task-list');
    expect(store.orderTermAmendment()).toBeNull();
  });
});
