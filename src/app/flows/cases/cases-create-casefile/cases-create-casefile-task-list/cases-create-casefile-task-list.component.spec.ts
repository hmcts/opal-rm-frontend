import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from '../constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from '../constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } from '../constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from '../constants/cases-create-casefile-task-statuses.constant';
import { CasesCreateCasefileStore } from '../stores/cases-create-casefile.store';
import type { CasesCreateCasefileCaseTypeSelection } from '../types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileTask } from '../types/cases-create-casefile-task.type';
import { CasesCreateCasefileTaskListComponent } from './cases-create-casefile-task-list.component';

describe('CasesCreateCasefileTaskListComponent', () => {
  let store: InstanceType<typeof CasesCreateCasefileStore>;
  const navigateByUrl = vi.fn();

  const defaultSelection: CasesCreateCasefileCaseTypeSelection = {
    caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
    applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
  };

  const paths = {
    caseType: '/cases/create-casefile/case-type',
    respondent: '/cases/create-casefile/respondent-details',
    applicantIndividual: '/cases/create-casefile/applicant-details/individual',
    applicantOrganisation: '/cases/create-casefile/applicant-details/organisation',
    centralAuthority: '/cases/create-casefile/central-authority-details',
    orderDetails: '/cases/create-casefile/order-details',
    orderTerms: '/cases/create-casefile/order-terms/summary',
    interestAndIndexation: '/cases/create-casefile/interest-and-indexation',
    managingPayments: '/cases/create-casefile/managing-payments',
    commentsAndNotes: '/cases/create-casefile/comments-and-notes',
    checkCase: '/cases/create-casefile/check-case-details',
    cancel: '/cases/create-casefile/cancel',
  } as const;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileTaskListComponent],
      providers: [{ provide: Router, useValue: { navigateByUrl } }],
    }).compileComponents();

    navigateByUrl.mockReset();
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
  });

  const provideTasks = (...tasks: CasesCreateCasefileTask[]): void => {
    tasks.forEach((task) => store.setTaskStatus(task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED));
  };

  const getRoot = (fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>): HTMLElement =>
    fixture.nativeElement as HTMLElement;

  const render = (
    selection: CasesCreateCasefileCaseTypeSelection = defaultSelection,
    arrangeStore: () => void = () => undefined,
  ): ComponentFixture<CasesCreateCasefileTaskListComponent> => {
    store.setCaseTypeSelection(selection);
    arrangeStore();
    const fixture = TestBed.createComponent(CasesCreateCasefileTaskListComponent);
    fixture.detectChanges();
    return fixture;
  };

  const getTaskItem = (
    fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>,
    itemId: string,
  ): HTMLElement => {
    const taskItem = getRoot(fixture).querySelector<HTMLElement>(`#${itemId}`);
    expect(taskItem).not.toBeNull();
    return taskItem!;
  };

  const getTaskLink = (
    fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>,
    name: string,
  ): HTMLAnchorElement => {
    const taskLink = Array.from(getRoot(fixture).querySelectorAll<HTMLAnchorElement>('a.govuk-task-list__link')).find(
      (link) => link.textContent?.trim() === name,
    );
    expect(taskLink).toBeDefined();
    return taskLink!;
  };

  const expectBlockedTask = (fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>, itemId: string): void => {
    const taskItem = getTaskItem(fixture, itemId);
    expect(taskItem.querySelector('a')).toBeNull();
    expect(taskItem.querySelector('.govuk-task-list__status')?.textContent?.trim()).toBe('Cannot start yet');
  };

  const expectStatus = (
    fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>,
    statusId: string,
    status: string,
    colourModifier: string,
  ): void => {
    const statusContainer = getRoot(fixture).querySelector<HTMLElement>(`#${statusId}`);
    const tag = statusContainer?.querySelector<HTMLElement>('.govuk-tag');
    expect(statusContainer?.textContent?.trim()).toBe(status);
    expect(tag).not.toBeNull();
    expect(tag?.classList.contains(colourModifier)).toBe(true);
  };

  it('renders the exact summary, section, task, guidance, and cancel content in DOM order', () => {
    const fixture = render();
    const pageColumn = getRoot(fixture).querySelector<HTMLElement>('.govuk-grid-column-two-thirds');

    expect(pageColumn?.firstElementChild?.querySelector('.govuk-back-link')?.textContent?.trim()).toBe('Back');
    expect(pageColumn?.querySelector('.govuk-caption-l')?.textContent?.trim()).toBe('Create an order');
    expect(pageColumn?.querySelector('h1')?.textContent?.trim()).toBe('Case details');
    expect(pageColumn?.querySelector('#caseDetailsCaseTypeKey')?.textContent?.trim()).toBe('Case type');
    expect(pageColumn?.querySelector('#caseDetailsCaseTypeValue')?.textContent?.trim()).toBe('REMO In');
    expect(pageColumn?.querySelector('#caseDetailsApplicantTypeKey')?.textContent?.trim()).toBe('Applicant type');
    expect(pageColumn?.querySelector('#caseDetailsApplicantTypeValue')?.textContent?.trim()).toBe('Individual');

    expect(
      Array.from(pageColumn?.querySelectorAll<HTMLHeadingElement>('h2') ?? []).map((heading) =>
        heading.textContent?.trim(),
      ),
    ).toEqual(['Party details', 'Order', 'Additional information', 'Check and submit']);
    expect(
      Array.from(pageColumn?.querySelectorAll<HTMLElement>('.govuk-task-list__name-and-hint') ?? []).map((task) =>
        task.textContent?.trim(),
      ),
    ).toEqual([
      'Respondent',
      'Applicant',
      'Central authority',
      'Order details',
      'Order terms',
      'Interest and indexation',
      'Managing payments',
      'Comments and notes',
    ]);
    expect(pageColumn?.querySelector('#checkCaseBlockingGuidance')?.textContent?.trim()).toBe(
      'You cannot proceed until all required sections have been completed.',
    );
    expect(pageColumn?.querySelector('#cancelCaseCreation')?.textContent?.trim()).toBe('Cancel case creation');
  });

  it.each([
    { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT },
    { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS },
  ] as CasesCreateCasefileCaseTypeSelection[])('omits Applicant type for $caseType', (selection) => {
    const fixture = render(selection);

    expect(getRoot(fixture).querySelector('#caseDetailsCaseTypeKey')?.textContent?.trim()).toBe('Case type');
    expect(getRoot(fixture).querySelector('#caseDetailsApplicantType')).toBeNull();
  });

  it('starts available party and optional tasks with exact statuses and blocks every Order task', () => {
    const fixture = render();

    expect(getTaskLink(fixture, 'Respondent').getAttribute('href')).toBe(paths.respondent);
    expect(getTaskLink(fixture, 'Applicant').getAttribute('href')).toBe(paths.applicantIndividual);
    expect(getTaskLink(fixture, 'Central authority').getAttribute('href')).toBe(paths.centralAuthority);
    expect(getTaskLink(fixture, 'Comments and notes').getAttribute('href')).toBe(paths.commentsAndNotes);
    expectStatus(fixture, 'respondentStatus', 'Required', 'govuk-tag--purple');
    expectStatus(fixture, 'applicantStatus', 'Required', 'govuk-tag--purple');
    expectStatus(fixture, 'centralAuthorityStatus', 'Optional', 'govuk-tag--grey');
    expectStatus(fixture, 'commentsAndNotesStatus', 'Optional', 'govuk-tag--grey');
    expectBlockedTask(fixture, 'orderDetailsItem');
    expectBlockedTask(fixture, 'orderTermsItem');
    expectBlockedTask(fixture, 'interestAndIndexationItem');
    expectBlockedTask(fixture, 'managingPaymentsItem');
  });

  it('keeps Order details blocked when only Respondent is Provided', () => {
    const fixture = render(defaultSelection, () => provideTasks('respondent'));

    expectBlockedTask(fixture, 'orderDetailsItem');
  });

  it('makes Order details an available Required link after both party tasks are Provided', () => {
    const fixture = render(defaultSelection, () => provideTasks('respondent', 'applicant'));

    expect(getTaskLink(fixture, 'Order details').getAttribute('href')).toBe(paths.orderDetails);
    expectStatus(fixture, 'orderDetailsStatus', 'Required', 'govuk-tag--purple');
    expectBlockedTask(fixture, 'orderTermsItem');
    expectBlockedTask(fixture, 'interestAndIndexationItem');
    expectBlockedTask(fixture, 'managingPaymentsItem');
  });

  it('makes the later Order tasks available Required links after party and Order details are Provided', () => {
    const fixture = render(defaultSelection, () => provideTasks('respondent', 'applicant', 'orderDetails'));

    expect(getTaskLink(fixture, 'Order terms').getAttribute('href')).toBe(paths.orderTerms);
    expect(getTaskLink(fixture, 'Interest and indexation').getAttribute('href')).toBe(paths.interestAndIndexation);
    expect(getTaskLink(fixture, 'Managing payments').getAttribute('href')).toBe(paths.managingPayments);
    expectStatus(fixture, 'orderTermsStatus', 'Required', 'govuk-tag--purple');
    expectStatus(fixture, 'interestAndIndexationStatus', 'Required', 'govuk-tag--purple');
    expectStatus(fixture, 'managingPaymentsStatus', 'Required', 'govuk-tag--purple');
  });

  it('shows Provided optional tasks without allowing them to satisfy the mandatory Check case gate', () => {
    const fixture = render(defaultSelection, () => provideTasks('centralAuthority', 'commentsAndNotes'));

    for (const statusId of ['centralAuthorityStatus', 'commentsAndNotesStatus']) {
      const tag = getRoot(fixture).querySelector<HTMLElement>(`#${statusId} .govuk-tag`);
      expect(tag?.textContent?.trim()).toBe('Provided');
      expect(tag?.className.trim()).toBe('govuk-tag');
    }
    expect(getRoot(fixture).querySelector('#checkCaseButton')).toBeNull();
    expect(getRoot(fixture).querySelector('#checkCaseBlockingGuidance')).not.toBeNull();
  });

  it('shows Check case and removes blocking guidance when all six mandatory tasks are Provided', () => {
    const fixture = render(defaultSelection, () =>
      provideTasks(
        'respondent',
        'applicant',
        'orderDetails',
        'orderTerms',
        'interestAndIndexation',
        'managingPayments',
      ),
    );

    expect(getRoot(fixture).querySelector('#checkCaseButton')?.textContent?.trim()).toBe('Check case');
    expect(getRoot(fixture).querySelector('#checkCaseBlockingGuidance')).toBeNull();
    expectStatus(fixture, 'centralAuthorityStatus', 'Optional', 'govuk-tag--grey');
    expectStatus(fixture, 'commentsAndNotesStatus', 'Optional', 'govuk-tag--grey');
  });

  it('navigates available tasks, Check case, and Cancel using exact absolute paths', () => {
    const fixture = render(defaultSelection, () =>
      provideTasks(
        'respondent',
        'applicant',
        'orderDetails',
        'orderTerms',
        'interestAndIndexation',
        'managingPayments',
      ),
    );
    const taskRoutes = [
      ['Respondent', paths.respondent],
      ['Central authority', paths.centralAuthority],
      ['Order details', paths.orderDetails],
      ['Order terms', paths.orderTerms],
      ['Interest and indexation', paths.interestAndIndexation],
      ['Managing payments', paths.managingPayments],
      ['Comments and notes', paths.commentsAndNotes],
    ] as const;

    for (const [taskName, path] of taskRoutes) {
      const link = getTaskLink(fixture, taskName);
      expect(link.getAttribute('href')).toBe(path);
      link.click();
      expect(navigateByUrl).toHaveBeenLastCalledWith(path);
    }

    getRoot(fixture).querySelector<HTMLButtonElement>('#checkCaseButton')?.click();
    expect(navigateByUrl).toHaveBeenLastCalledWith(paths.checkCase);

    const cancelLink = getRoot(fixture).querySelector<HTMLAnchorElement>('#cancelCaseCreation');
    expect(cancelLink?.getAttribute('href')).toBe(paths.cancel);
    cancelLink?.click();
    expect(navigateByUrl).toHaveBeenLastCalledWith(paths.cancel);
  });

  it.each([
    {
      description: 'REMO In Organisation',
      selection: {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      },
      expectedPath: paths.applicantOrganisation,
    },
    {
      description: 'REMO In Individual',
      selection: defaultSelection,
      expectedPath: paths.applicantIndividual,
    },
    {
      description: 'REMO Out',
      selection: { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT },
      expectedPath: paths.applicantIndividual,
    },
    {
      description: 'REMO Out (CMS)',
      selection: { caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS },
      expectedPath: paths.applicantIndividual,
    },
  ] as {
    description: string;
    selection: CasesCreateCasefileCaseTypeSelection;
    expectedPath: string;
  }[])('uses the applicant route for $description', ({ selection, expectedPath }) => {
    const fixture = render(selection);
    const applicantLink = getTaskLink(fixture, 'Applicant');

    expect(applicantLink.getAttribute('href')).toBe(expectedPath);
    applicantLink.click();
    expect(navigateByUrl).toHaveBeenCalledWith(expectedPath);
  });

  it.each([CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED])(
    'uses the Order terms summary route when its status is %s',
    (orderTermsStatus) => {
      const fixture = render(defaultSelection, () => {
        provideTasks('respondent', 'applicant', 'orderDetails');
        store.setTaskStatus('orderTerms', orderTermsStatus);
      });

      expect(getTaskLink(fixture, 'Order terms').getAttribute('href')).toBe(paths.orderTerms);
      expect(getRoot(fixture).querySelector('#orderTermsStatus .govuk-tag')?.textContent?.trim()).toBe(
        orderTermsStatus,
      );
    },
  );

  it('gives each available task link a real href describing its unique status container', () => {
    const fixture = render(defaultSelection, () => provideTasks('respondent', 'applicant', 'orderDetails'));
    const taskLinks = Array.from(getRoot(fixture).querySelectorAll<HTMLAnchorElement>('a.govuk-task-list__link'));
    const describedStatusIds = taskLinks.map((link) => link.getAttribute('aria-describedby'));

    expect(taskLinks.length).toBeGreaterThan(0);
    expect(new Set(describedStatusIds).size).toBe(taskLinks.length);
    taskLinks.forEach((link) => {
      const statusId = link.getAttribute('aria-describedby');
      expect(link.getAttribute('href')).toMatch(/^\/cases\/create-casefile\//);
      expect(statusId).not.toBeNull();
      expect(getRoot(fixture).querySelectorAll(`#${statusId}`)).toHaveLength(1);
    });
  });

  it('resets to only the selected Case Type before navigating Back', () => {
    const selection = {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    } as const;
    const fixture = render(selection, () =>
      provideTasks('respondent', 'applicant', 'centralAuthority', 'orderDetails'),
    );
    const resetSpy = vi.spyOn(store, 'resetForCaseTypeEdit');

    getRoot(fixture).querySelector<HTMLAnchorElement>('.govuk-back-link')?.click();

    expect(resetSpy).toHaveBeenCalledOnce();
    expect(store.caseTypeSelection()).toEqual(selection);
    expect(store.taskStatuses()).toEqual(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
    expect(store.stateChanges()).toBe(false);
    expect(store.unsavedChanges()).toBe(true);
    expect(navigateByUrl).toHaveBeenCalledWith(paths.caseType);
    expect(resetSpy.mock.invocationCallOrder[0]).toBeLessThan(navigateByUrl.mock.invocationCallOrder[0]);
  });

  it('uses native keyboard-operable links without live regions, tabindex overrides, or keyboard event bindings', () => {
    const fixture = render(defaultSelection, () => provideTasks('respondent', 'applicant', 'orderDetails'));
    const templateFunction = (
      CasesCreateCasefileTaskListComponent as unknown as { ɵcmp?: { template?: () => void } }
    ).ɵcmp?.template?.toString();

    expect(getRoot(fixture).querySelector('[aria-live]')).toBeNull();
    expect(getRoot(fixture).querySelector('[tabindex]')).toBeNull();
    expect(templateFunction).not.toContain('keydown');
    expect(templateFunction).not.toContain('keyup');
  });
});
