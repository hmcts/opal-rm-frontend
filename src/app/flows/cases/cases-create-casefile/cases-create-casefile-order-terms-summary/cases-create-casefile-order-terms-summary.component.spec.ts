import { createCasesCreateCasefileReviewState } from '../mocks/cases-create-casefile-review-state.mock';
import { CasesCreateCasefileReviewNavigationService } from '../services/cases-create-casefile-review-navigation.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { patchState, type WritableStateSource } from '@ngrx/signals';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileOrderTermCardComponent } from '../components/cases-create-casefile-order-term-card/cases-create-casefile-order-term-card.component';
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
    expect(fixture.debugElement.queryAll(By.directive(CasesCreateCasefileOrderTermCardComponent))).toHaveLength(2);
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

  it('captures the selected term before navigating to removal without changing accepted data', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const before = structuredClone(store.orderTerms());

    const click = new MouseEvent('click', { cancelable: true });
    await fixture.componentInstance.handleRemove(click, 12);

    expect(click.defaultPrevented).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/order-terms/remove/1');
    expect(store.orderTermRemoval()?.termId).toBe(12);
    expect(store.orderTerms()).toEqual(before);
  });

  it.each(['false', 'rejection'])(
    'clears only its own removal selection when navigation returns %s',
    async (failure) => {
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTerms: structuredClone(acceptedTerms),
      });
      if (failure === 'false') router.navigateByUrl.mockResolvedValueOnce(false);
      else router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic failure'));

      await fixture.componentInstance.handleRemove(new MouseEvent('click', { cancelable: true }), 7);

      expect(store.orderTermRemoval()).toBeNull();
      expect(store.orderTerms()).toEqual(acceptedTerms);
    },
  );

  it('preserves a newer removal selection when an older navigation fails late', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const first = fixture.componentInstance.handleRemove(new MouseEvent('click', { cancelable: true }), 7);
    const newer = store.beginOrderTermRemoval(12);

    resolveNavigation(false);
    await first;

    expect(store.orderTermRemoval()).toBe(newer);
    expect(store.orderTermRemovalOutcome()).toBeNull();
  });

  it('does not navigate Change for a term absent from the current summary', async () => {
    await fixture.componentInstance.handleChange(99);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(store.orderTermAmendment()).toBeNull();
  });

  it('does not begin removal while an amendment is active', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.beginOrderTermAmendment(7);

    await fixture.componentInstance.handleRemove(new MouseEvent('click', { cancelable: true }), 12);

    expect(store.orderTermRemoval()).toBeNull();
    expect(store.orderTermAmendment()?.termId).toBe(7);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('blocks Remove and Back while Change navigation is pending', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    let resolveNavigation!: (value: boolean) => void;
    router.navigateByUrl.mockReturnValueOnce(new Promise<boolean>((resolve) => (resolveNavigation = resolve)));
    const change = fixture.componentInstance.handleChange(7);

    const removeClick = new MouseEvent('click', { cancelable: true });
    await fixture.componentInstance.handleRemove(removeClick, 12);
    await fixture.componentInstance.handleBack();

    expect(removeClick.defaultPrevented).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledOnce();
    expect(store.orderTermRemoval()).toBeNull();
    resolveNavigation(false);
    await change;
  });

  it('releases the Back navigation lock after rejection', async () => {
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    await fixture.componentInstance.handleBack();
    await fixture.componentInstance.handleBack();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(2);
  });

  it('shows the success notice and focuses its host on summary entry', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const selection = store.beginOrderTermRemoval(7)!;
    store.confirmOrderTermRemoval(selection);
    fixture.detectChanges();
    await fixture.whenStable();

    const notice = fixture.nativeElement.querySelector('#create_casefile_order_terms_removal_notice');
    expect(notice.textContent).toContain('Order terms removed.');
    expect(document.activeElement).toBe(notice);
    expect(store.orderTerms().map((term) => term.termId)).toEqual([12]);
  });

  it('does not steal focus again for the same success outcome after an unrelated render', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const selection = store.beginOrderTermRemoval(7)!;
    store.confirmOrderTermRemoval(selection);
    fixture.detectChanges();
    await fixture.whenStable();
    const heading = fixture.nativeElement.querySelector('#create_casefile_order_terms_heading') as HTMLElement;
    heading.focus();

    store.setUnsavedChanges(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(heading);
    expect(store.orderTermRemovalOutcome()).toBe('removed');
  });

  it('dismisses the notice and focuses the summary heading', async () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    const selection = store.beginOrderTermRemoval(7)!;
    store.confirmOrderTermRemoval(selection);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.nativeElement.querySelector('#create_casefile_order_terms_removal_dismiss').click();
    fixture.detectChanges();

    expect(store.orderTermRemovalOutcome()).toBeNull();
    expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_removal_notice')).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#create_casefile_order_terms_heading'));
  });

  it.each([7, 99])('restores cancellation focus to an existing Remove link or heading for term %s', async (termId) => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.setOrderTermRemovalReturnFocusId(termId);
    fixture.detectChanges();
    await fixture.whenStable();

    const expected = termId === 7 ? `#order-term-${termId}-remove` : '#create_casefile_order_terms_heading';
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector(expected));
    expect(store.orderTermRemovalReturnFocusId()).toBeNull();
  });

  it('clears a transient outcome when the summary is actually destroyed', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      orderTerms: structuredClone(acceptedTerms),
    });
    store.markOrderTermRemovalUnavailable();
    fixture.detectChanges();

    fixture.destroy();

    expect(store.orderTermRemovalOutcome()).toBeNull();
  });

  it('returns quietly from an invalid removal link without showing an unavailable notice', async () => {
    store.markOrderTermRemovalUnavailable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#create_casefile_order_terms_removal_notice')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('These order terms are no longer available');
    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe('Order terms');
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
    await fixture.componentInstance.handleRemove(new Event('click', { cancelable: true }), 7);
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
  it.each(['orderTermAmendment', 'creditorDraft', 'orderTermRemoval', 'orderTermDraft', 'unsavedChanges'] as const)(
    'waits for %s to clear before returning to review',
    async (pending) => {
      const state = createCasesCreateCasefileReviewState();
      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);
      const term = state.orderTerms[0];
      if (pending === 'orderTermAmendment') store.beginOrderTermAmendment(term.termId);
      if (pending === 'creditorDraft') {
        patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
          creditorDraft: { termId: term.termId, branch: 'add-new' },
        });
      }
      if (pending === 'orderTermRemoval') store.beginOrderTermRemoval(term.termId);
      if (pending === 'orderTermDraft') {
        patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
          orderTermDraft: {
            resultId: term.resultId,
            fieldTypes: {},
            values: {},
            dirty: false,
            presentation: term.presentation,
          },
        });
      }
      store.setUnsavedChanges(pending === 'unsavedChanges');
      TestBed.inject(CasesCreateCasefileReviewNavigationService).setContext({
        origin: 'review',
        section: 'orderTerm',
        termId: term.termId,
      });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(router.navigateByUrl).not.toHaveBeenCalled();

      patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
        orderTermAmendment: null,
        creditorDraft: null,
        orderTermRemoval: null,
        orderTermDraft: null,
        unsavedChanges: false,
      });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(router.navigateByUrl).toHaveBeenCalledOnce();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/check-case-details');
      expect(store.orderTerms()).toEqual(state.orderTerms);
    },
  );

  it('keeps accepted terms intact if returning to review rejects navigation', async () => {
    const state = createCasesCreateCasefileReviewState();
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);
    TestBed.inject(CasesCreateCasefileReviewNavigationService).setContext({
      origin: 'review',
      section: 'orderTerm',
      termId: state.orderTerms[0].termId,
    });
    router.navigateByUrl.mockRejectedValueOnce(new Error('Synthetic navigation failure'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/cases/create-casefile/check-case-details');
    expect(store.orderTerms()).toEqual(state.orderTerms);
  });
});
