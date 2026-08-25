import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-state.constant';
import { CASES_CREATE_CASEFILE_APPLICANT_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-applicant-types.constant';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileCaseTypeSelection } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-case-type-selection.type';
import type { CasesCreateCasefileTask } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-task.type';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupCaseDetailsTaskList } from './setup/case-details-task-list.setup';
import type { CasesCreateCasefileStoreInstance } from './setup/case-details-task-list.setup';

const CREATE_CASEFILE_STORY_TAG = '@JIRA-STORY:PO-9800';
const CREATE_CASEFILE_EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, CREATE_CASEFILE_STORY_TAG, CREATE_CASEFILE_EPIC_TAG];
const taskListPath = CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const mandatoryTasks: CasesCreateCasefileTask[] = [
  'respondent',
  'applicant',
  'orderDetails',
  'orderTerms',
  'interestAndIndexation',
  'managingPayments',
];
const partyTasks: CasesCreateCasefileTask[] = ['respondent', 'applicant'];
const remainingOrderPrerequisites: CasesCreateCasefileTask[] = [...partyTasks, 'orderDetails'];

const createJourneyPath = (childPath: string): string =>
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + childPath;

const assertExactText = (selector: string, expectedText: string): void => {
  cy.get(selector)
    .invoke('text')
    .then((text) => expect(text.trim()).to.equal(expectedText));
};

const assertRouterPath = (childPath: string): void => {
  cy.get('@angularRouter').then((router: Router) => {
    expect(router.url).to.equal(createJourneyPath(childPath));
  });
};

const assertStoreState = (
  expectedSelection: CasesCreateCasefileCaseTypeSelection,
  expectedProvidedTasks: CasesCreateCasefileTask[],
): void => {
  cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
    expect(store.caseTypeSelection()).to.deep.equal(expectedSelection);
    expect(store.taskStatuses()).to.deep.equal({
      ...CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES,
      ...Object.fromEntries(expectedProvidedTasks.map((task) => [task, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED])),
    });
    expect(store.stateChanges()).to.equal(true);
    expect(store.unsavedChanges()).to.equal(false);
  });
};

const assertStatus = (selector: string, expectedStatus: string): void => {
  assertExactText(selector, expectedStatus);
};

const assertTabMovesTo = (selector: string): void => {
  cy.press(Cypress.Keyboard.Keys.TAB);
  cy.get(selector).should('have.focus');
};

type DestinationScenario = {
  childPath: string;
  taskLinkSelector: string;
  heading: string;
  prerequisiteTasks: CasesCreateCasefileTask[];
  selection?: CasesCreateCasefileCaseTypeSelection;
};

const destinationScenarios: DestinationScenario[] = [
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails,
    taskLinkSelector: Page.caseDetails.respondentLink,
    heading: 'Respondent details',
    prerequisiteTasks: [],
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual,
    taskLinkSelector: Page.caseDetails.applicantLink,
    heading: 'Applicant details - Individual',
    prerequisiteTasks: [],
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantOrganisation,
    taskLinkSelector: Page.caseDetails.applicantLink,
    heading: 'Applicant details - Organisation',
    prerequisiteTasks: [],
    selection: {
      caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
      applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
    },
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.centralAuthorityDetails,
    taskLinkSelector: Page.caseDetails.centralAuthorityLink,
    heading: 'Central authority details',
    prerequisiteTasks: [],
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderDetails,
    taskLinkSelector: Page.caseDetails.orderDetailsLink,
    heading: 'Order details',
    prerequisiteTasks: partyTasks,
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.orderTermsSummary,
    taskLinkSelector: Page.caseDetails.orderTermsLink,
    heading: 'Order terms',
    prerequisiteTasks: remainingOrderPrerequisites,
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation,
    taskLinkSelector: Page.caseDetails.interestAndIndexationLink,
    heading: 'Interest and indexation',
    prerequisiteTasks: remainingOrderPrerequisites,
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments,
    taskLinkSelector: Page.caseDetails.managingPaymentsLink,
    heading: 'Managing payments',
    prerequisiteTasks: remainingOrderPrerequisites,
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.commentsAndNotes,
    taskLinkSelector: Page.caseDetails.commentsAndNotesLink,
    heading: 'Comments and notes',
    prerequisiteTasks: [],
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.checkCaseDetails,
    taskLinkSelector: Page.caseDetails.checkCaseButton,
    heading: 'Check case details',
    prerequisiteTasks: mandatoryTasks,
  },
  {
    childPath: CASES_CREATE_CASEFILE_ROUTING_PATHS.children.cancel,
    taskLinkSelector: Page.caseDetails.cancelLink,
    heading: 'Cancel case creation',
    prerequisiteTasks: [],
  },
];

describe('Create Casefile Case Details Task List', () => {
  it(
    'AC1. should render the exact initial REMO In summary, section order, tasks, statuses and blocking guidance',
    { tags: buildTags() },
    () => {
      setupCaseDetailsTaskList();

      assertExactText(Page.caseDetails.caption, 'Create an order');
      assertExactText(Page.caseDetails.heading, 'Case details');
      assertExactText(Page.caseDetails.caseTypeValue, CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN);
      assertExactText(Page.caseDetails.applicantTypeValue, CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL);
      cy.get([Page.caseDetails.caseTypeRow, Page.caseDetails.applicantTypeRow].join(', ')).then(($rows) => {
        expect([...$rows].map((row) => row.id)).to.deep.equal(['caseDetailsCaseType', 'caseDetailsApplicantType']);
        expect(
          [...$rows].map((row) => row.querySelector('.govuk-summary-list__key')?.textContent?.trim()),
        ).to.deep.equal(['Case type', 'Applicant type']);
      });
      cy.get('h2').then(($headings) => {
        expect([...$headings].map((heading) => heading.textContent?.trim())).to.deep.equal([
          'Party details',
          'Order',
          'Additional information',
          'Check and submit',
        ]);
      });
      cy.get(
        [Page.caseDetails.partyDetails, Page.caseDetails.order, Page.caseDetails.additionalInformation].join(', '),
      ).then(($sections) => {
        expect([...$sections].map((section) => section.id)).to.deep.equal([
          'partyDetails',
          'order',
          'additionalInformation',
        ]);
      });
      cy.get(
        [
          Page.caseDetails.respondentItem,
          Page.caseDetails.applicantItem,
          Page.caseDetails.centralAuthorityItem,
          Page.caseDetails.orderDetailsItem,
          Page.caseDetails.orderTermsItem,
          Page.caseDetails.interestAndIndexationItem,
          Page.caseDetails.managingPaymentsItem,
          Page.caseDetails.commentsAndNotesItem,
        ].join(', '),
      ).then(($items) => {
        expect([...$items].map((item) => item.id)).to.deep.equal([
          'respondentItem',
          'applicantItem',
          'centralAuthorityItem',
          'orderDetailsItem',
          'orderTermsItem',
          'interestAndIndexationItem',
          'managingPaymentsItem',
          'commentsAndNotesItem',
        ]);
      });
      cy.get(Page.caseDetails.taskNames).then(($names) => {
        expect([...$names].map((name) => name.textContent?.trim())).to.deep.equal([
          'Respondent',
          'Applicant',
          'Central authority',
          'Order details',
          'Order terms',
          'Interest and indexation',
          'Managing payments',
          'Comments and notes',
        ]);
      });
      assertStatus(Page.caseDetails.respondentStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      assertStatus(Page.caseDetails.applicantStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      assertStatus(Page.caseDetails.centralAuthorityStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
      assertStatus(Page.caseDetails.orderDetailsStatus, 'Cannot start yet');
      assertStatus(Page.caseDetails.orderTermsStatus, 'Cannot start yet');
      assertStatus(Page.caseDetails.interestAndIndexationStatus, 'Cannot start yet');
      assertStatus(Page.caseDetails.managingPaymentsStatus, 'Cannot start yet');
      assertStatus(Page.caseDetails.commentsAndNotesStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
      cy.get(Page.caseDetails.respondentStatus).find('.govuk-tag').should('have.class', 'govuk-tag--purple');
      cy.get(Page.caseDetails.centralAuthorityStatus).find('.govuk-tag').should('have.class', 'govuk-tag--grey');
      cy.get(Page.caseDetails.orderDetailsLink).should('not.exist');
      cy.get(Page.caseDetails.orderTermsLink).should('not.exist');
      cy.get(Page.caseDetails.interestAndIndexationLink).should('not.exist');
      cy.get(Page.caseDetails.managingPaymentsLink).should('not.exist');
      assertExactText(
        Page.caseDetails.blockingGuidance,
        'You cannot proceed until all required sections have been completed.',
      );
      cy.get(Page.caseDetails.checkCaseButton).should('not.exist');
      assertExactText(Page.caseDetails.cancelLink, 'Cancel case creation');
    },
  );

  for (const caseType of [CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT, CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS]) {
    it(
      `AC1, AC2. should omit Applicant type and route outbound ${caseType} applicants to Individual`,
      { tags: buildTags() },
      () => {
        setupCaseDetailsTaskList({ selection: { caseType } });

        assertExactText(Page.caseDetails.caseTypeValue, caseType);
        cy.get(Page.caseDetails.applicantTypeValue).should('not.exist');
        cy.get(Page.caseDetails.applicantLink).should(
          'have.attr',
          'href',
          createJourneyPath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual),
        );
        cy.get(Page.caseDetails.applicantLink).click();
        assertRouterPath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.applicantIndividual);
        assertExactText(Page.caseDetails.heading, 'Applicant details - Individual');
      },
    );
  }

  it('AC3. should unlock Order details only after Respondent and Applicant are Provided', { tags: buildTags() }, () => {
    setupCaseDetailsTaskList({ providedTasks: partyTasks });

    assertStatus(Page.caseDetails.respondentStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    assertStatus(Page.caseDetails.applicantStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
    assertExactText(Page.caseDetails.orderDetailsLink, 'Order details');
    assertStatus(Page.caseDetails.orderDetailsStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    cy.get(Page.caseDetails.orderTermsLink).should('not.exist');
  });

  it(
    'AC3. should unlock every remaining Order task after Party details and Order details are Provided',
    { tags: buildTags() },
    () => {
      setupCaseDetailsTaskList({ providedTasks: remainingOrderPrerequisites });

      for (const [link, status] of [
        [Page.caseDetails.orderTermsLink, Page.caseDetails.orderTermsStatus],
        [Page.caseDetails.interestAndIndexationLink, Page.caseDetails.interestAndIndexationStatus],
        [Page.caseDetails.managingPaymentsLink, Page.caseDetails.managingPaymentsStatus],
      ]) {
        cy.get(link).should('be.visible');
        assertStatus(status, CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
      }
    },
  );

  it(
    'AC4. should expose Check case when mandatory tasks are Provided without requiring optional tasks',
    { tags: buildTags() },
    () => {
      setupCaseDetailsTaskList({ providedTasks: mandatoryTasks });

      cy.get(Page.caseDetails.checkCaseButton).should('be.visible');
      assertExactText(Page.caseDetails.checkCaseButton, 'Check case');
      cy.get(Page.caseDetails.blockingGuidance).should('not.exist');
      assertStatus(Page.caseDetails.centralAuthorityStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
      assertStatus(Page.caseDetails.commentsAndNotesStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
    },
  );

  for (const scenario of destinationScenarios) {
    it(
      `AC2, AC4. should route to ${scenario.heading}, preserve store state and return to Case details`,
      { tags: buildTags() },
      () => {
        const selection = scenario.selection ?? {
          caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
          applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.INDIVIDUAL,
        };
        setupCaseDetailsTaskList({ selection, providedTasks: scenario.prerequisiteTasks });

        cy.get(scenario.taskLinkSelector).click();
        assertRouterPath(scenario.childPath);
        assertExactText(Page.caseDetails.heading, scenario.heading);
        assertStoreState(selection, scenario.prerequisiteTasks);
        cy.get(Page.caseDetails.backLink).click();
        assertRouterPath(taskListPath);
        assertExactText(Page.caseDetails.heading, 'Case details');
        assertStoreState(selection, scenario.prerequisiteTasks);
      },
    );
  }

  it(
    'AC4. should reset task progress, preserve Case Type and rehydrate REMO In controls on Task List Back',
    { tags: buildTags() },
    () => {
      const selection = {
        caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN,
        applicantType: CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION,
      } as const;
      setupCaseDetailsTaskList({ selection, providedTasks: mandatoryTasks });

      cy.get(Page.caseDetails.backLink).click();
      assertRouterPath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType);
      assertExactText(Page.heading, 'Create a case');
      cy.get(Page.caseTypeRadio(CASES_CREATE_CASEFILE_CASE_TYPES.REMO_IN)).should('be.checked');
      cy.get(Page.applicantConditional).should('not.have.class', 'govuk-radios__conditional--hidden');
      cy.get(Page.applicantTypeSelectedOption).should('have.text', CASES_CREATE_CASEFILE_APPLICANT_TYPES.ORGANISATION);
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.caseTypeSelection()).to.deep.equal(selection);
        expect(store.taskStatuses()).to.deep.equal(CASES_CREATE_CASEFILE_INITIAL_TASK_STATUSES);
        expect(store.stateChanges()).to.equal(false);
        expect(store.unsavedChanges()).to.equal(true);
      });
    },
  );

  for (const childPath of [
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList,
    CASES_CREATE_CASEFILE_ROUTING_PATHS.children.respondentDetails,
  ]) {
    it(`AC4. should redirect an empty-store deep link from ${childPath} to Case Type`, { tags: buildTags() }, () => {
      setupCaseDetailsTaskList({ selection: null, initialChildPath: childPath });

      assertRouterPath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.caseType);
      assertExactText(Page.heading, 'Create a case');
    });
  }

  it('AC5. should keep blocked tasks out of the initial keyboard order', { tags: buildTags() }, () => {
    setupCaseDetailsTaskList();

    cy.get(Page.caseDetails.orderDetailsLink).should('not.exist');
    cy.get(Page.caseDetails.orderTermsLink).should('not.exist');
    cy.get(Page.caseDetails.interestAndIndexationLink).should('not.exist');
    cy.get(Page.caseDetails.managingPaymentsLink).should('not.exist');
    cy.get(Page.caseDetails.backLink).focus();
    assertTabMovesTo(Page.caseDetails.respondentLink);
    assertTabMovesTo(Page.caseDetails.applicantLink);
    assertTabMovesTo(Page.caseDetails.centralAuthorityLink);
    assertTabMovesTo(Page.caseDetails.commentsAndNotesLink);
    assertTabMovesTo(Page.caseDetails.cancelLink);
  });

  it(
    'AC5. should place every available task, Check case and Cancel in source keyboard order',
    { tags: buildTags() },
    () => {
      setupCaseDetailsTaskList({ providedTasks: mandatoryTasks });

      cy.get(Page.caseDetails.backLink).focus();
      for (const selector of [
        Page.caseDetails.respondentLink,
        Page.caseDetails.applicantLink,
        Page.caseDetails.centralAuthorityLink,
        Page.caseDetails.orderDetailsLink,
        Page.caseDetails.orderTermsLink,
        Page.caseDetails.interestAndIndexationLink,
        Page.caseDetails.managingPaymentsLink,
        Page.caseDetails.commentsAndNotesLink,
        Page.caseDetails.checkCaseButton,
        Page.caseDetails.cancelLink,
      ]) {
        assertTabMovesTo(selector);
      }
    },
  );

  it('AC5. should associate every available task link with its visible status', { tags: buildTags() }, () => {
    setupCaseDetailsTaskList({ providedTasks: remainingOrderPrerequisites });

    for (const [link, status, expectedStatus] of [
      [
        Page.caseDetails.respondentLink,
        Page.caseDetails.respondentStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
      ],
      [Page.caseDetails.applicantLink, Page.caseDetails.applicantStatus, CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED],
      [
        Page.caseDetails.centralAuthorityLink,
        Page.caseDetails.centralAuthorityStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
      ],
      [
        Page.caseDetails.orderDetailsLink,
        Page.caseDetails.orderDetailsStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED,
      ],
      [
        Page.caseDetails.orderTermsLink,
        Page.caseDetails.orderTermsStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
      ],
      [
        Page.caseDetails.interestAndIndexationLink,
        Page.caseDetails.interestAndIndexationStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
      ],
      [
        Page.caseDetails.managingPaymentsLink,
        Page.caseDetails.managingPaymentsStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED,
      ],
      [
        Page.caseDetails.commentsAndNotesLink,
        Page.caseDetails.commentsAndNotesStatus,
        CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL,
      ],
    ]) {
      const statusId = status.slice(1);
      cy.get(link).should('have.attr', 'aria-describedby', statusId);
      cy.get(status).should('be.visible');
      assertStatus(status, expectedStatus);
    }
  });

  for (const [stateName, providedTasks] of [
    ['initial', []],
    ['unlocked', remainingOrderPrerequisites],
    ['mandatory-complete', mandatoryTasks],
  ] as const) {
    it(`AC5. should have no detected Axe violations in the ${stateName} state`, { tags: buildTags() }, () => {
      setupCaseDetailsTaskList({ providedTasks: [...providedTasks] });

      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
    });
  }

  for (const width of [1280, 320]) {
    it(`AC5. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupCaseDetailsTaskList({ providedTasks: remainingOrderPrerequisites });

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }

  it('AC4. should not POST a draft casefile during routed task-list interactions', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('postRequest');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles**' }, (request) => {
      postRequestSpy(request);
      request.continue();
    });
    setupCaseDetailsTaskList({ providedTasks: mandatoryTasks });

    cy.get(Page.caseDetails.respondentLink).click();
    cy.get(Page.caseDetails.backLink).click();
    cy.get(Page.caseDetails.orderTermsLink).click();
    cy.get(Page.caseDetails.backLink).click();
    cy.get(Page.caseDetails.checkCaseButton).click();
    cy.get(Page.caseDetails.backLink).click();
    cy.get(Page.caseDetails.cancelLink).click();
    assertRouterPath(CASES_CREATE_CASEFILE_ROUTING_PATHS.children.cancel);
    cy.get('@postRequest').should('not.have.been.called');
  });
});
