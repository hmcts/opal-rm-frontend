import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_INDEXATION_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-indexation-types.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import type { ICasesCreateCasefileInterestIndexation } from 'src/app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-interest-indexation.interface';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import type { CasesCreateCasefileIndexationType } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-indexation-type.type';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { setupInterestAndIndexation } from './setup/interest-and-indexation.setup';
import { externalDestinationPath, type CasesCreateCasefileStoreInstance } from './setup/interest-and-indexation.setup';

const STORY_TAG = '@JIRA-STORY:PO-9814';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];
const interestPath =
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.root +
  '/' +
  CASES_CREATE_CASEFILE_ROUTING_PATHS.children.interestAndIndexation;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const managingPaymentsPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments;
const UNSAVED_CHANGES_WARNING =
  'WARNING: Are you sure you want to leave this page? Any information you entered will be lost.';
const SAVED_INTEREST_AND_INDEXATION: ICasesCreateCasefileInterestIndexation = {
  interestApplies: true,
  indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
};

const normalizeText = (text: string | null | undefined): string => text?.replace(/\s+/g, ' ').trim() ?? '';

const assertNormalizedText = (selector: string, expectedText: string): void => {
  cy.get(selector).then(($element) => {
    expect(normalizeText($element.text())).to.equal(expectedText);
  });
};

const assertRouterPath = (expectedPath: string): void => {
  cy.get('@angularRouter').should((router: Router) => {
    expect(router.url).to.equal(expectedPath);
  });
};

const assertInlineError = (selector: string, expectedMessage: string): void => {
  cy.get(selector).then(($error) => {
    const error = $error[0].cloneNode(true) as HTMLElement;
    error.querySelector('.govuk-visually-hidden')?.remove();
    expect(normalizeText(error.textContent)).to.equal(expectedMessage);
  });
};

const choose = (interestApplies: boolean, indexationType: CasesCreateCasefileIndexationType): void => {
  cy.get(Page.interestAndIndexation.interestRadio(interestApplies)).check();
  cy.get(Page.interestAndIndexation.indexationRadio(indexationType)).check();
};

describe('Create Casefile Interest and Indexation', () => {
  it('AC1. should render the exact empty accessible screen and no excluded controls', { tags: buildTags() }, () => {
    setupInterestAndIndexation();

    cy.get(Page.interestAndIndexation.heading).should('have.text', 'Interest and indexation');
    cy.get(Page.interestAndIndexation.interestGroup).should('match', 'fieldset');
    assertNormalizedText(Page.interestAndIndexation.interestLegend, 'Does interest apply?');
    cy.get(Page.interestAndIndexation.interestRadios)
      .should('have.length', 2)
      .then(($radios) => {
        expect([...$radios].map((radio) => (radio as HTMLInputElement).value)).to.deep.equal(['true', 'false']);
      });
    cy.get(Page.interestAndIndexation.interestLabels).then(($labels) => {
      expect([...$labels].map((label) => normalizeText(label.textContent))).to.deep.equal(['Yes', 'No']);
    });
    cy.get(Page.interestAndIndexation.indexationGroup).should('match', 'fieldset');
    assertNormalizedText(Page.interestAndIndexation.indexationLegend, 'What type of indexation applies?');
    cy.get(Page.interestAndIndexation.indexationRadios)
      .should('have.length', 4)
      .then(($radios) => {
        expect([...$radios].map((radio) => (radio as HTMLInputElement).value)).to.deep.equal([
          CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI,
          CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI,
          CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER,
          CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE,
        ]);
      });
    cy.get(Page.interestAndIndexation.indexationLabels).then(($labels) => {
      expect([...$labels].map((label) => normalizeText(label.textContent))).to.deep.equal([
        'Retail Price Index (RPI)',
        'Consumer Price Index (CPI)',
        'Other indexation',
        'No indexation',
      ]);
    });
    cy.get(Page.interestAndIndexation.indexationDivider).should('have.text', 'or');
    cy.get(`${Page.interestAndIndexation.interestRadios}:checked`).should('not.exist');
    cy.get(`${Page.interestAndIndexation.indexationRadios}:checked`).should('not.exist');
    assertNormalizedText(Page.interestAndIndexation.returnToCaseDetails, 'Return to case details');
    assertNormalizedText(Page.interestAndIndexation.cancelLink, 'Cancel');
    cy.get('.govuk-back-link').should('not.exist');
    cy.get('input[type="text"], input[name*="amount"], input[name*="rate"]').should('not.exist');
  });

  it('AC1. should restore both previously saved controlled values', { tags: buildTags() }, () => {
    setupInterestAndIndexation(SAVED_INTEREST_AND_INDEXATION);

    cy.get(Page.interestAndIndexation.interestRadio(true)).should('be.checked');
    cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI)).should('be.checked');
  });

  it('AC2, EMAC1. should show both exact errors, focus the summary and retain the route', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('invalidDraftCasefilePost');
    cy.intercept({ method: 'POST', url: '**/draft-casefiles*' }, postRequestSpy);
    setupInterestAndIndexation();

    cy.get(Page.interestAndIndexation.returnToCaseDetails).click();

    assertInlineError(Page.interestAndIndexation.interestError, 'Choose whether interest applies');
    assertInlineError(Page.interestAndIndexation.indexationError, 'Select what type of indexation applies');
    cy.get(Page.interestAndIndexation.errorSummary)
      .should('be.focused')
      .and('contain.text', 'Choose whether interest applies')
      .and('contain.text', 'Select what type of indexation applies');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.interestAndIndexation()).to.equal(null);
      expect(store.taskStatuses().interestAndIndexation).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.REQUIRED);
    });
    cy.get('@invalidDraftCasefilePost').should('not.have.been.called');
    assertRouterPath(interestPath);
  });

  for (const partial of [
    {
      name: 'Interest',
      select: () => cy.get(Page.interestAndIndexation.interestRadio(false)).check(),
      presentError: 'Select what type of indexation applies',
      absentError: 'Choose whether interest applies',
    },
    {
      name: 'Indexation',
      select: () =>
        cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER)).check(),
      presentError: 'Choose whether interest applies',
      absentError: 'Select what type of indexation applies',
    },
  ]) {
    it(`AC2. should show only the missing-group error after selecting ${partial.name}`, { tags: buildTags() }, () => {
      setupInterestAndIndexation();
      partial.select();

      cy.get(Page.interestAndIndexation.returnToCaseDetails).click();

      cy.get(Page.interestAndIndexation.errorSummary)
        .should('contain.text', partial.presentError)
        .and('not.contain.text', partial.absentError);
      assertRouterPath(interestPath);
    });
  }

  it('AC2, EMAC1a. should link each summary error to the first radio in its group', { tags: buildTags() }, () => {
    setupInterestAndIndexation();
    cy.get(Page.interestAndIndexation.returnToCaseDetails).click();

    cy.get(Page.interestAndIndexation.errorSummaryLinks).contains('Choose whether interest applies').click();
    cy.get(Page.interestAndIndexation.interestRadio(true)).should('be.focused');
    cy.get(Page.interestAndIndexation.returnToCaseDetails).click();
    cy.get(Page.interestAndIndexation.errorSummaryLinks).contains('Select what type of indexation applies').click();
    cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI)).should('be.focused');
  });

  for (const saved of [
    { interestApplies: true, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI },
    { interestApplies: false, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.CPI },
    { interestApplies: true, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER },
    { interestApplies: false, indexationType: CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE },
  ] as const) {
    it(
      `AC3. should save interest=${saved.interestApplies} and indexation=${saved.indexationType} locally`,
      { tags: buildTags() },
      () => {
        const postRequestSpy = cy.spy().as('draftCasefilePost');
        cy.intercept({ method: 'POST', url: '**/draft-casefiles*' }, postRequestSpy);
        setupInterestAndIndexation();
        choose(saved.interestApplies, saved.indexationType);

        cy.get(Page.interestAndIndexation.returnToCaseDetails).click();

        cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
          expect(store.interestAndIndexation()).to.deep.equal(saved);
          expect(store.taskStatuses().interestAndIndexation).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
          expect(store.unsavedChanges()).to.equal(false);
          expect(store.stateChanges()).to.equal(true);
        });
        assertRouterPath(taskListPath);
        cy.get(Page.caseDetails.interestAndIndexationStatus).should('contain.text', 'Provided');
        cy.get('@draftCasefilePost').should('not.have.been.called');
      },
    );
  }

  it('AC3, RGAC1. should Cancel directly when no edits have been made', { tags: buildTags() }, () => {
    const cleanCancelConfirm = cy.stub().as('cleanCancelConfirm').returns(true);
    cy.on('window:confirm', cleanCancelConfirm);
    setupInterestAndIndexation();

    cy.get(Page.interestAndIndexation.cancelLink).click();

    cy.get('@cleanCancelConfirm').should('not.have.been.called');
    assertRouterPath(taskListPath);
  });

  it(
    'AC3, RGAC2. should stay on dirty Cancel and preserve edited controls plus saved state',
    { tags: buildTags() },
    () => {
      const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
      cy.on('window:confirm', rejectCancelConfirm);
      setupInterestAndIndexation(SAVED_INTEREST_AND_INDEXATION);
      choose(false, CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER);

      cy.get(Page.interestAndIndexation.cancelLink).click();

      cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(interestPath);
      cy.get(Page.interestAndIndexation.interestRadio(false)).should('be.checked');
      cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER)).should(
        'be.checked',
      );
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.interestAndIndexation()).to.deep.equal(SAVED_INTEREST_AND_INDEXATION);
        expect(store.unsavedChanges()).to.equal(true);
      });
    },
  );

  it('AC3, RGAC3. should leave on dirty Cancel and preserve only the last saved state', { tags: buildTags() }, () => {
    const acceptCancelConfirm = cy.stub().as('acceptCancelConfirm').returns(true);
    cy.on('window:confirm', acceptCancelConfirm);
    setupInterestAndIndexation(SAVED_INTEREST_AND_INDEXATION);
    choose(false, CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE);

    cy.get(Page.interestAndIndexation.cancelLink).click();

    cy.get('@acceptCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.interestAndIndexation()).to.deep.equal(SAVED_INTEREST_AND_INDEXATION);
      expect(store.taskStatuses().interestAndIndexation).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it(
    'AC3, RGAC2. should protect another route after edits and preserve the working selection when staying',
    { tags: buildTags() },
    () => {
      const rejectNavigationConfirm = cy.stub().as('rejectNavigationConfirm').returns(false);
      cy.on('window:confirm', rejectNavigationConfirm);
      setupInterestAndIndexation();
      choose(true, CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI);

      cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(managingPaymentsPath));

      cy.get('@rejectNavigationConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
      assertRouterPath(interestPath);
      cy.get(Page.interestAndIndexation.interestRadio(true)).should('be.checked');
      cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI)).should(
        'be.checked',
      );
    },
  );

  it('AC3, RGAC2. should warn once and complete external navigation after accepting', { tags: buildTags() }, () => {
    const acceptExternalNavigationConfirm = cy.stub().as('acceptExternalNavigationConfirm').returns(true);
    cy.on('window:confirm', acceptExternalNavigationConfirm);
    setupInterestAndIndexation(SAVED_INTEREST_AND_INDEXATION);
    choose(false, CASES_CREATE_CASEFILE_INDEXATION_TYPES.NONE);

    cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(externalDestinationPath));

    cy.get('@acceptExternalNavigationConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(externalDestinationPath);
  });

  it('AC4. should preserve native radio keyboard behaviour and logical action order', { tags: buildTags() }, () => {
    setupInterestAndIndexation();

    cy.get(Page.interestAndIndexation.interestRadio(true)).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.press(Cypress.Keyboard.Keys.DOWN);
    cy.get(Page.interestAndIndexation.interestRadio(false)).should('be.checked').and('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.interestAndIndexation.indexationRadio(CASES_CREATE_CASEFILE_INDEXATION_TYPES.RPI)).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.interestAndIndexation.returnToCaseDetails).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(Page.interestAndIndexation.cancelLink).should('be.focused');
  });

  it('AC4. should have no detected Axe violations in a representative valid state', { tags: buildTags() }, () => {
    setupInterestAndIndexation();
    choose(true, CASES_CREATE_CASEFILE_INDEXATION_TYPES.OTHER);

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC4. should have no detected Axe violations in the validation-error state', { tags: buildTags() }, () => {
    setupInterestAndIndexation();
    cy.get(Page.interestAndIndexation.returnToCaseDetails).click();

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  for (const width of [1280, 320]) {
    it(`AC4. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupInterestAndIndexation();
      if (width === 320) {
        cy.get(Page.interestAndIndexation.returnToCaseDetails).click();
        cy.get(Page.interestAndIndexation.errorSummary).should('contain.text', 'There is a problem');
      }

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }
});
