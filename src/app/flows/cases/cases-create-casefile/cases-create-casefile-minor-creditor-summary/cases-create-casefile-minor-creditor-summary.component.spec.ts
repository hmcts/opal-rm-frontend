import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { getState, patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ICasesCreateCasefileState } from '../interfaces/cases-create-casefile-state.interface';
import { CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS } from '../cases-create-casefile-applicant-individual/mocks/cases-create-casefile-applicant-individual.mock';
import { MINOR_CREDITOR_DETAILS_MOCK } from '../cases-create-casefile-minor-creditor-details/mocks/cases-create-casefile-minor-creditor.mock';
import { CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS } from '../cases-create-casefile-respondent-details/mocks/cases-create-casefile-respondent-details.mock';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import { CasesCreateCasefileMinorCreditorSummaryComponent } from './cases-create-casefile-minor-creditor-summary.component';

const term = {
  termId: 1,
  resultId: 'MAT',
  parameters: {},
  creditor: null,
  presentation: { title: 'Maintenance', fields: [] },
};
const draft = {
  termId: 1,
  branch: 'add-new' as const,
  details: MINOR_CREDITOR_DETAILS_MOCK,
  countryName: 'United Kingdom',
};
const patch = (store: InstanceType<typeof CasesCreateCasefileStore>, state: Partial<ICasesCreateCasefileState>) =>
  patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, state);

async function setup(state: Partial<ICasesCreateCasefileState> = {}, restoreRemovalFocus = false) {
  await TestBed.configureTestingModule({
    imports: [CasesCreateCasefileMinorCreditorSummaryComponent],
    providers: [CasesCreateCasefileStore, provideRouter([])],
  }).compileComponents();
  const store = TestBed.inject(CasesCreateCasefileStore);
  patch(store, {
    orderTerms: [term],
    currentOrderTermId: 1,
    nextMinorCreditorSequence: 1,
    creditorDraft: draft,
    ...state,
  });
  const router = TestBed.inject(Router);
  if (restoreRemovalFocus) {
    vi.spyOn(router, 'currentNavigation').mockReturnValue({
      extras: { state: { minorCreditorRemovalReturnFocus: true } },
    } as never);
  }
  const fixture = TestBed.createComponent(CasesCreateCasefileMinorCreditorSummaryComponent);
  return { fixture, component: fixture.componentInstance, store, router };
}

const amendmentState = (): Partial<ICasesCreateCasefileState> => {
  const selected = { ...term, termId: 2, parameters: { amount: '20.00' }, creditor: { type: 'applicant' as const } };
  return {
    orderTerms: [{ ...term, termId: 1, parameters: { amount: '10.00' } }, selected],
    currentOrderTermId: 2,
    nextOrderTermId: 3,
    orderTermAmendment: {
      termId: 2,
      term: { ...selected, parameters: { amount: '30.00' } },
      inputComplete: true,
      ready: false,
    },
    creditorDraft: { ...draft, termId: 2 },
  };
};

describe('CasesCreateCasefileMinorCreditorSummaryComponent', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('captures the reviewed creditor before navigating to removal', async () => {
    const { component, store, router } = await setup();
    const reviewed = store.creditorDraft();
    vi.spyOn(router, 'navigateByUrl').mockImplementation(async () => {
      expect(store.minorCreditorRemoval()?.expectedDraft).toBe(reviewed);
      return true;
    });

    await component.handleRemove();

    expect(store.creditorDraft()).toBe(reviewed);
  });

  it.each([false, new Error('Synthetic navigation failure')])(
    'clears only its captured selection after failed removal entry: %s',
    async (result) => {
      const { component, store, router } = await setup();
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValue(result);
      else navigate.mockResolvedValue(result);

      await component.handleRemove();

      expect(store.creditorDraft()).toBe(draft);
      expect(store.minorCreditorRemoval()).toBeNull();
      expect(component.navigationFailed()).toBe(true);
    },
  );

  it('does not clear a newer selection when earlier removal navigation fails late', async () => {
    const { component, store, router } = await setup();
    let finish!: (result: boolean) => void;
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const first = component.handleRemove();
    const original = store.minorCreditorRemoval();
    const newer = store.beginMinorCreditorRemoval();

    finish(false);
    await first;

    expect(newer).not.toBe(original);
    expect(store.minorCreditorRemoval()).toBe(newer);
  });

  it('focuses the summary heading after cancellation when the Remove action is absent', async () => {
    const { fixture } = await setup({}, true);
    const host = fixture.nativeElement as HTMLElement;
    const querySelector = host.querySelector.bind(host);
    vi.spyOn(host, 'querySelector').mockImplementation((selector: string) =>
      selector === '#Remove' ? null : querySelector(selector),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(querySelector('h1'));
  });

  it('does not move focus on ordinary summary entry', async () => {
    const sentinel = document.createElement('button');
    document.body.appendChild(sentinel);
    sentinel.focus();
    const { fixture } = await setup();

    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(sentinel);
    sentinel.remove();
  });

  it('renders the review card, semantic actions and escaped stored text', async () => {
    const details = structuredClone(MINOR_CREDITOR_DETAILS_MOCK);
    details.identity = { type: 'organisation', organisationName: '<em>Example</em>' };
    const { fixture, component } = await setup({ creditorDraft: { ...draft, details } });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.govuk-grid-column-two-thirds h1').textContent).toBe(
      'Minor creditor summary',
    );
    expect(fixture.nativeElement.querySelector('.govuk-caption-l').textContent).toBe('Order terms');
    expect(fixture.nativeElement.querySelector('.govuk-summary-card__title').textContent).toBe(
      'Minor creditor details',
    );
    expect(fixture.nativeElement.querySelector('#minorCreditorDetailsNameValue').textContent.trim()).toBe(
      '<em>Example</em>',
    );
    expect(fixture.nativeElement.querySelector('#minorCreditorDetailsNameValue em')).toBeNull();
    expect(fixture.nativeElement.querySelector('#Change strong').textContent).toBe('Change');
    expect(fixture.nativeElement.querySelector('#Change .govuk-visually-hidden').textContent).toBe(
      'minor creditor details',
    );
    expect(fixture.nativeElement.querySelector('#Remove strong').textContent).toBe('Remove');
    expect(fixture.nativeElement.querySelector('#Remove .govuk-visually-hidden').textContent).toBe(
      'minor creditor details',
    );
    expect(component.detailsPath).toBe('/cases/create-casefile/order-terms/creditor/minor-creditor-details');
    expect(component.removePath).toBe('/cases/create-casefile/order-terms/creditor/minor-creditor-remove');
  });

  it('accepts exactly the reviewed draft once and requests the order terms summary', async () => {
    const { component, store, router } = await setup();
    const reviewed = structuredClone(store.creditorDraft()?.details);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.handleContinue();
    await component.handleContinue();

    expect(store.creditorDraft()).toBeNull();
    expect(store.minorCreditors()).toEqual([{ sequenceNumber: 1, displayName: 'Example creditor', details: reviewed }]);
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 1 });
    expect(store.nextMinorCreditorSequence()).toBe(2);
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenLastCalledWith('/cases/create-casefile/order-terms/summary');
  });

  it.each([false, new Error('Synthetic navigation error')])(
    'keeps the accepted review stable and retries Continue without reallocating after %s',
    async (result) => {
      const { fixture, component, store, router } = await setup();
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValueOnce(result);
      else navigate.mockResolvedValueOnce(result);
      navigate.mockResolvedValueOnce(true);

      fixture.detectChanges();
      await component.handleContinue();
      fixture.detectChanges();

      expect(component.rows().find((row) => row.id === 'name')?.values).toEqual(['Example creditor']);
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
      await component.handleContinue();
      expect(store.minorCreditors()).toHaveLength(1);
      expect(store.nextMinorCreditorSequence()).toBe(2);
      expect(navigate).toHaveBeenCalledTimes(2);
    },
  );

  it.each([
    ['missing', null],
    ['missing details', { termId: 1, branch: 'add-new' as const, countryName: 'United Kingdom' }],
    ['missing country label', { termId: 1, branch: 'add-new' as const, details: MINOR_CREDITOR_DETAILS_MOCK }],
  ])('refuses Continue when the live pending draft is %s', async (_description, creditorDraft) => {
    const { component, store, router } = await setup();
    patch(store, { creditorDraft });
    const before = structuredClone(getState(store));
    const navigate = vi.spyOn(router, 'navigateByUrl');

    await component.handleContinue();

    expect(navigate).not.toHaveBeenCalled();
    expect(getState(store)).toEqual(before);
  });

  it.each([
    ['a replacement draft', { creditorDraft: draft }],
    ['a removed term', { orderTerms: [] }],
    ['a removed assignment', { orderTerms: [term] }],
    ['an applicant assignment', { orderTerms: [{ ...term, creditor: { type: 'applicant' as const } }] }],
    [
      'another minor creditor',
      {
        orderTerms: [{ ...term, creditor: { type: 'minor' as const, sequenceNumber: 2 } }],
        minorCreditors: [
          { sequenceNumber: 2, displayName: 'Replacement creditor', details: MINOR_CREDITOR_DETAILS_MOCK },
        ],
        nextMinorCreditorSequence: 3,
      },
    ],
  ])('refuses a Continue retry after declined navigation and %s', async (_description, replacementState) => {
    const { component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(false);
    await component.handleContinue();
    expect(store.orderTerms()[0].creditor).toEqual({ type: 'minor', sequenceNumber: 1 });
    expect(store.nextMinorCreditorSequence()).toBe(2);
    patch(store, replacementState);
    const before = structuredClone(getState(store));

    await component.handleContinue();

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/cases/create-casefile/order-terms/summary');
    expect(getState(store)).toEqual(before);
  });

  it('preserves a replacement draft when earlier Cancel navigation completes', async () => {
    const { component, store, router } = await setup();
    let finish!: (value: boolean) => void;
    const navigate = vi.spyOn(router, 'navigateByUrl').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const cancellation = component.handleCancel();
    const replacementDraft = {
      ...draft,
      details: {
        ...MINOR_CREDITOR_DETAILS_MOCK,
        identity: { type: 'organisation' as const, organisationName: 'New pending creditor' },
      },
    };
    patch(store, { creditorDraft: replacementDraft });
    const before = structuredClone(getState(store));

    finish(true);
    await cancellation;

    expect(store.creditorDraft()).toBe(replacementDraft);
    expect(getState(store)).toEqual(before);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/cases/create-casefile/order-terms/creditor');
  });

  it('cancels only the pending draft after successful navigation', async () => {
    const { component, store, router } = await setup({
      applicantDetails: CASES_CREATE_CASEFILE_APPLICANT_INDIVIDUAL_MOCKS.saved,
      respondentDetails: CASES_CREATE_CASEFILE_RESPONDENT_DETAILS_MOCKS.saved,
      orderDetails: {
        applicationId: 901,
        court: null,
        dateOrderMade: null,
        paymentFrequency: 'Weekly',
        dateArrearsLastUpdated: '2026-09-15',
      },
    });
    const before = structuredClone({
      terms: store.orderTerms(),
      creditors: store.minorCreditors(),
      applicant: store.applicantDetails(),
      respondent: store.respondentDetails(),
      orderDetails: store.orderDetails(),
      statuses: store.taskStatuses(),
    });
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.handleCancel();

    expect(store.creditorDraft()).toBeNull();
    expect({
      terms: store.orderTerms(),
      creditors: store.minorCreditors(),
      applicant: store.applicantDetails(),
      respondent: store.respondentDetails(),
      orderDetails: store.orderDetails(),
      statuses: store.taskStatuses(),
    }).toEqual(before);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/cases/create-casefile/order-terms/creditor');
  });

  it.each([false, new Error('Synthetic cancellation error')])(
    'retains the pending draft after declined/failed Cancel %s',
    async (result) => {
      const { component, store, router } = await setup();
      const navigate = vi.spyOn(router, 'navigateByUrl');
      if (result instanceof Error) navigate.mockRejectedValue(result);
      else navigate.mockResolvedValue(result);

      await component.handleCancel();

      expect(store.creditorDraft()).toEqual(draft);
      expect(store.orderTerms()).toEqual([term]);
      expect(store.minorCreditors()).toEqual([]);
    },
  );

  it.each([
    ['/cases/create-casefile/order-terms/creditor/minor-creditor-details'],
    ['/cases/create-casefile/order-terms/creditor/minor-creditor-remove'],
  ])('navigates to %s without mutating the term or draft', async (path) => {
    const { component, store, router } = await setup();
    const before = structuredClone({ term: store.orderTerms()[0], draft: store.creditorDraft() });
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.navigateTo(path);

    expect(navigate).toHaveBeenCalledExactlyOnceWith(path);
    expect({ term: store.orderTerms()[0], draft: store.creditorDraft() }).toEqual(before);
  });

  it('prevents acceptance and cancellation after the current term becomes stale', async () => {
    const { component, store, router } = await setup({
      orderTerms: [term, { ...term, termId: 2 }],
    });
    const navigate = vi.spyOn(router, 'navigateByUrl');
    const otherDraft = { ...draft, termId: 2 };
    patch(store, { currentOrderTermId: 2, creditorDraft: otherDraft });
    const before = structuredClone({ terms: store.orderTerms(), draft: store.creditorDraft() });

    await component.handleContinue();
    await component.handleCancel();

    expect(navigate).not.toHaveBeenCalled();
    expect(store.minorCreditors()).toEqual([]);
    expect({ terms: store.orderTerms(), draft: store.creditorDraft() }).toEqual(before);
    expect(component.rows()).toEqual([]);
  });

  it('does not expose stale reviewed rows or action navigation without a live draft', async () => {
    const { component, store, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    store.clearCreditorDraft();
    component.navigateTo(component.detailsPath);

    expect(component.rows()).toEqual([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not allow Change or Remove after Continue consumes the pending draft', async () => {
    const { component, router } = await setup();
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await component.handleContinue();
    component.navigateTo(component.detailsPath);
    component.navigateTo(component.removePath);

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/cases/create-casefile/order-terms/summary');
  });

  it('ignores repeated actions while navigation is pending', async () => {
    const { component, store, router } = await setup();
    let finish!: (value: boolean) => void;
    const navigate = vi.spyOn(router, 'navigateByUrl').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );

    const continuing = component.handleContinue();
    void component.handleContinue();
    void component.handleCancel();
    component.navigateTo(component.detailsPath);

    expect(navigate).toHaveBeenCalledOnce();
    expect(store.minorCreditors()).toHaveLength(1);
    finish(true);
    await continuing;
  });

  it('commits the selected amendment and one new creditor only after successful navigation', async () => {
    const { component, store, router } = await setup(amendmentState());
    const acceptedBefore = structuredClone(store.orderTerms());
    let finish!: (value: boolean) => void;
    const navigate = vi
      .spyOn(router, 'navigateByUrl')
      .mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));

    const first = component.handleContinue();
    void component.handleContinue();
    expect(navigate).toHaveBeenCalledOnce();
    expect(store.orderTerms()).toEqual(acceptedBefore);
    expect(store.minorCreditors()).toEqual([]);

    finish(false);
    await first;
    expect(store.orderTerms()).toEqual(acceptedBefore);
    expect(store.orderTermAmendment()).toMatchObject({ termId: 2, ready: true });

    navigate.mockRejectedValueOnce(new Error('Synthetic navigation failure')).mockResolvedValueOnce(true);
    await component.handleContinue();
    expect(store.orderTerms()).toEqual(acceptedBefore);
    await component.handleContinue();

    expect(store.orderTerms()).toHaveLength(2);
    expect(store.orderTerms()[0]).toEqual(acceptedBefore[0]);
    expect(store.orderTerms()[1]).toMatchObject({
      termId: 2,
      parameters: { amount: '30.00' },
      creditor: { type: 'minor', sequenceNumber: 1 },
    });
    expect(store.minorCreditors()).toEqual([
      { sequenceNumber: 1, displayName: 'Example creditor', details: MINOR_CREDITOR_DETAILS_MOCK },
    ]);
    expect(store.nextMinorCreditorSequence()).toBe(2);
    expect(store.orderTermAmendment()).toBeNull();
    expect(store.creditorDraft()).toBeNull();
  });

  it('cancels the whole amendment from review only after successful summary navigation', async () => {
    const { component, store, router } = await setup(amendmentState());
    const acceptedBefore = structuredClone(store.orderTerms());
    vi.spyOn(router, 'navigateByUrl')
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('Synthetic cancellation failure'))
      .mockResolvedValueOnce(true);

    await component.handleCancel();
    expect(store.orderTermAmendment()).not.toBeNull();
    expect(store.creditorDraft()).not.toBeNull();
    await component.handleCancel();
    expect(store.orderTermAmendment()).not.toBeNull();
    await component.handleCancel();

    expect(router.navigateByUrl).toHaveBeenLastCalledWith('/cases/create-casefile/order-terms/summary');
    expect(store.orderTermAmendment()).toBeNull();
    expect(store.creditorDraft()).toBeNull();
    expect(store.orderTerms()).toEqual(acceptedBefore);
  });

  it('does not complete a replacement amendment after late review navigation succeeds', async () => {
    const { component, store, router } = await setup(amendmentState());
    let finish!: (value: boolean) => void;
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => new Promise<boolean>((resolve) => (finish = resolve)));
    const completion = component.handleContinue();
    const original = store.orderTermAmendment();

    store.resetStore();
    patch(store, amendmentState());
    const replacement = store.orderTermAmendment();
    expect(replacement).not.toBe(original);
    finish(true);
    await completion;

    expect(store.orderTermAmendment()).toBe(replacement);
    expect(store.orderTerms()).toHaveLength(2);
    expect(store.minorCreditors()).toEqual([]);
  });
});
