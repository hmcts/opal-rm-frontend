import type { Router } from '@angular/router';
import { CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-comments-notes/constants/cases-create-casefile-comments-notes-field-names.constant';
import { CASES_CREATE_CASEFILE_TASK_STATUSES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-task-statuses.constant';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as Page } from 'cypress/shared/selectors/create-casefile.selectors';
import { ERROR_SUMMARY_TITLE, UNSAVED_CHANGES_WARNING } from '../constants/create-casefile-test-copy.constant';
import { COMMENTS_AND_NOTES_ERROR_MESSAGES } from './constants/comments-and-notes-errors.constant';
import { REPLACEMENT_COMMENTS_AND_NOTES, SAVED_COMMENTS_AND_NOTES } from './mocks/comments-and-notes.mock';
import { setupCommentsAndNotes, type CasesCreateCasefileStoreInstance } from './setup/comments-and-notes.setup';

const STORY_TAG = '@JIRA-STORY:PO-9816';
const EPIC_TAG = '@JIRA-EPIC:PO-6506';
const buildTags = (...tags: string[]): string[] => [...tags, STORY_TAG, EPIC_TAG];
const commentsAndNotesPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.commentsAndNotes;
const taskListPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.taskList;
const managingPaymentsPath =
  '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.root + '/' + CASES_CREATE_CASEFILE_ROUTING_PATHS.children.managingPayments;
const DRAFT_CASEFILE_WRITE_URL = /\/draft-casefiles(?:[/?#]|$)/;

const normalizeText = (text: string | null | undefined): string => text?.replace(/\s+/g, ' ').trim() ?? '';

const assertNormalizedText = (selector: string, expectedText: string): void => {
  cy.get(selector).should(($element) => expect(normalizeText($element.text())).to.equal(expectedText));
};

const assertRouterPath = (expectedPath: string): void => {
  cy.get('@angularRouter').should((router: Router) => expect(router.url).to.equal(expectedPath));
};

const assertInlineError = (selector: string, expectedMessage: string): void => {
  cy.get(selector).then(($error) => {
    const error = $error[0].cloneNode(true) as HTMLElement;
    error.querySelector('.govuk-visually-hidden')?.remove();
    expect(normalizeText(error.textContent)).to.equal(expectedMessage);
  });
};

const setTextareaValue = (selector: string, value: string): void => {
  cy.get(selector).invoke('val', value).trigger('input');
};

describe('Create Casefile Comments and notes', () => {
  it(
    'AC1. should render exact accessible content with canonical IDs and no native maxlength',
    { tags: buildTags() },
    () => {
      setupCommentsAndNotes();

      cy.get(Page.commentsAndNotes.heading).should('have.text', 'Comments and notes');
      assertNormalizedText(Page.commentsAndNotes.inset, 'These will be added to the respondent account only.');
      assertNormalizedText(Page.commentsAndNotes.commentLabel, 'Add comment');
      assertNormalizedText(
        Page.commentsAndNotes.commentHint,
        'For example, terms that affect the case, which will appear on the respondent account’s ‘At a glance’ view',
      );
      assertNormalizedText(Page.commentsAndNotes.noteLabel, 'Add account notes');
      assertNormalizedText(
        Page.commentsAndNotes.noteHint,
        'You can view notes in the respondent account’s history after the case is published',
      );
      cy.get(Page.commentsAndNotes.comment).should(
        'have.attr',
        'name',
        CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment,
      );
      cy.get(Page.commentsAndNotes.comment).should('not.have.attr', 'maxlength');
      cy.get(Page.commentsAndNotes.comment).should(
        'have.attr',
        'aria-describedby',
        `${CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment}-hint ${CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.comment}-with-hint-info`,
      );
      cy.get(Page.commentsAndNotes.note).should(
        'have.attr',
        'name',
        CASES_CREATE_CASEFILE_COMMENTS_NOTES_FIELD_NAMES.note,
      );
      cy.get(Page.commentsAndNotes.note).should('not.have.attr', 'maxlength');
      assertNormalizedText(Page.commentsAndNotes.commentLimit, 'You can enter up to 250 characters');
      assertNormalizedText(Page.commentsAndNotes.noteLimit, 'You can enter up to 1000 characters');
      cy.get(Page.commentsAndNotes.sectionBreak).should('exist');
      assertNormalizedText(Page.commentsAndNotes.returnToCaseDetails, 'Return to case details');
      assertNormalizedText(Page.commentsAndNotes.cancelLink, 'Cancel');
      cy.get('.govuk-back-link').should('not.exist');
    },
  );

  it('AC1. should restore both saved values and their live remaining counts', { tags: buildTags() }, () => {
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });

    cy.get(Page.commentsAndNotes.comment).should('have.value', SAVED_COMMENTS_AND_NOTES.comment);
    cy.get(Page.commentsAndNotes.note).should('have.value', SAVED_COMMENTS_AND_NOTES.note);
    assertNormalizedText(
      Page.commentsAndNotes.commentCounter,
      `You have ${250 - SAVED_COMMENTS_AND_NOTES.comment!.length} characters remaining`,
    );
    assertNormalizedText(
      Page.commentsAndNotes.noteCounter,
      `You have ${1000 - SAVED_COMMENTS_AND_NOTES.note!.length} characters remaining`,
    );
  });

  it(
    'AC1, AC3. should show boundary, singular, zero and negative live counts without truncating',
    { tags: buildTags() },
    () => {
      setupCommentsAndNotes();

      setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(249));
      assertNormalizedText(Page.commentsAndNotes.commentCounter, 'You have 1 character remaining');
      setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(250));
      assertNormalizedText(Page.commentsAndNotes.commentCounter, 'You have 0 characters remaining');
      setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(251));
      cy.get(Page.commentsAndNotes.comment).should('have.value', 'a'.repeat(251));
      assertNormalizedText(Page.commentsAndNotes.commentCounter, 'You have -1 characters remaining');

      setTextareaValue(Page.commentsAndNotes.note, 'b'.repeat(1001));
      cy.get(Page.commentsAndNotes.note).should('have.value', 'b'.repeat(1001));
      assertNormalizedText(Page.commentsAndNotes.noteCounter, 'You have -1 characters remaining');
    },
  );

  it(
    'AC3, EMAC1. should reject both over-limit values, focus the summary, retain text and avoid POST',
    { tags: buildTags() },
    () => {
      const postRequestSpy = cy.spy().as('invalidDraftCasefilePost');
      cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
      setupCommentsAndNotes();
      setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(251));
      setTextareaValue(Page.commentsAndNotes.note, 'b'.repeat(1001));

      cy.get(Page.commentsAndNotes.returnToCaseDetails).click();

      assertInlineError(Page.commentsAndNotes.commentError, COMMENTS_AND_NOTES_ERROR_MESSAGES.comment);
      assertInlineError(Page.commentsAndNotes.noteError, COMMENTS_AND_NOTES_ERROR_MESSAGES.note);
      cy.get(Page.commentsAndNotes.errorSummary)
        .should('be.focused')
        .and('contain.text', ERROR_SUMMARY_TITLE)
        .and('contain.text', COMMENTS_AND_NOTES_ERROR_MESSAGES.comment)
        .and('contain.text', COMMENTS_AND_NOTES_ERROR_MESSAGES.note);
      cy.get(Page.commentsAndNotes.comment).should('have.value', 'a'.repeat(251));
      cy.get(Page.commentsAndNotes.note).should('have.value', 'b'.repeat(1001));
      cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
        expect(store.commentsAndNotes()).to.equal(null);
        expect(store.taskStatuses().commentsAndNotes).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
      });
      cy.get('@invalidDraftCasefilePost').should('not.have.been.called');
      assertRouterPath(commentsAndNotesPath);
    },
  );

  it('AC3, EMAC1a. should move each summary error link to its textarea', { tags: buildTags() }, () => {
    setupCommentsAndNotes();
    setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(251));
    setTextareaValue(Page.commentsAndNotes.note, 'b'.repeat(1001));
    cy.get(Page.commentsAndNotes.returnToCaseDetails).click();

    cy.get(Page.commentsAndNotes.errorSummaryLinks).contains(COMMENTS_AND_NOTES_ERROR_MESSAGES.comment).click();
    cy.get(Page.commentsAndNotes.comment).should('be.focused');
    cy.get(Page.commentsAndNotes.returnToCaseDetails).click();
    cy.get(Page.commentsAndNotes.errorSummaryLinks).contains(COMMENTS_AND_NOTES_ERROR_MESSAGES.note).click();
    cy.get(Page.commentsAndNotes.note).should('be.focused');
  });

  it('AC2. should save blank values as null, keep Optional and avoid POST', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('blankDraftCasefilePost');
    cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });
    cy.get(Page.commentsAndNotes.comment).clear();
    setTextareaValue(Page.commentsAndNotes.note, '   ');

    cy.get(Page.commentsAndNotes.returnToCaseDetails).click();

    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.commentsAndNotes()).to.deep.equal({ comment: null, note: null });
      expect(store.taskStatuses().commentsAndNotes).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.OPTIONAL);
      expect(store.unsavedChanges()).to.equal(false);
      expect(store.stateChanges()).to.equal(true);
    });
    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.commentsAndNotesStatus).should('contain.text', 'Optional');
    cy.get('@blankDraftCasefilePost').should('not.have.been.called');
  });

  it('AC2. should replace both saved values, mark Provided and avoid POST', { tags: buildTags() }, () => {
    const postRequestSpy = cy.spy().as('draftCasefilePost');
    cy.intercept({ method: 'POST', url: DRAFT_CASEFILE_WRITE_URL }, postRequestSpy);
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });
    cy.get(Page.commentsAndNotes.comment).clear().type(REPLACEMENT_COMMENTS_AND_NOTES.comment!);
    cy.get(Page.commentsAndNotes.note).clear().type(REPLACEMENT_COMMENTS_AND_NOTES.note!);

    cy.get(Page.commentsAndNotes.returnToCaseDetails).click();

    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.commentsAndNotes()).to.deep.equal(REPLACEMENT_COMMENTS_AND_NOTES);
      expect(store.taskStatuses().commentsAndNotes).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
      expect(store.stateChanges()).to.equal(true);
    });
    assertRouterPath(taskListPath);
    cy.get(Page.caseDetails.commentsAndNotesStatus).should('contain.text', 'Provided');
    cy.get('@draftCasefilePost').should('not.have.been.called');
  });

  it('AC4, RGAC1. should Cancel directly when no edits have been made', { tags: buildTags() }, () => {
    const cleanCancelConfirm = cy.stub().as('cleanCancelConfirm').returns(true);
    cy.on('window:confirm', cleanCancelConfirm);
    setupCommentsAndNotes();

    cy.get(Page.commentsAndNotes.cancelLink).click();

    cy.get('@cleanCancelConfirm').should('not.have.been.called');
    assertRouterPath(taskListPath);
  });

  it('AC4, RGAC2. should stay on dirty Cancel with edits and saved state intact', { tags: buildTags() }, () => {
    const rejectCancelConfirm = cy.stub().as('rejectCancelConfirm').returns(false);
    cy.on('window:confirm', rejectCancelConfirm);
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });
    cy.get(Page.commentsAndNotes.comment).clear().type('Unsaved edit');

    cy.get(Page.commentsAndNotes.cancelLink).click();

    cy.get('@rejectCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(commentsAndNotesPath);
    cy.get(Page.commentsAndNotes.comment).should('have.value', 'Unsaved edit');
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.commentsAndNotes()).to.deep.equal(SAVED_COMMENTS_AND_NOTES);
      expect(store.unsavedChanges()).to.equal(true);
    });
  });

  it('AC4, RGAC3. should leave on dirty Cancel and keep only saved values', { tags: buildTags() }, () => {
    const acceptCancelConfirm = cy.stub().as('acceptCancelConfirm').returns(true);
    cy.on('window:confirm', acceptCancelConfirm);
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });
    cy.get(Page.commentsAndNotes.note).clear().type('Unsaved note');

    cy.get(Page.commentsAndNotes.cancelLink).click();

    cy.get('@acceptCancelConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(taskListPath);
    cy.get('@casesCreateCasefileStore').then((store: CasesCreateCasefileStoreInstance) => {
      expect(store.commentsAndNotes()).to.deep.equal(SAVED_COMMENTS_AND_NOTES);
      expect(store.taskStatuses().commentsAndNotes).to.equal(CASES_CREATE_CASEFILE_TASK_STATUSES.PROVIDED);
      expect(store.unsavedChanges()).to.equal(false);
    });
  });

  it('AC4, RGAC2. should protect another in-journey route and retain edits when staying', { tags: buildTags() }, () => {
    const rejectNavigationConfirm = cy.stub().as('rejectNavigationConfirm').returns(false);
    cy.on('window:confirm', rejectNavigationConfirm);
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });
    cy.get(Page.commentsAndNotes.comment).clear().type('Unsaved edit');

    cy.get('@angularRouter').then((router: Router) => router.navigateByUrl(managingPaymentsPath));

    cy.get('@rejectNavigationConfirm').should('have.been.calledOnceWithExactly', UNSAVED_CHANGES_WARNING);
    assertRouterPath(commentsAndNotesPath);
    cy.get(Page.commentsAndNotes.comment).should('have.value', 'Unsaved edit');
  });

  it(
    'AC5. should support native editing and logical comment, note, Return, Cancel tab order',
    { tags: buildTags() },
    () => {
      setupCommentsAndNotes();

      cy.get(Page.commentsAndNotes.comment).focus().type('Keyboard comment').should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.commentsAndNotes.note).should('be.focused').type('Keyboard note');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.commentsAndNotes.returnToCaseDetails).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(Page.commentsAndNotes.cancelLink).should('be.focused');
    },
  );

  it('AC5. should have no detected Axe violations in a representative valid state', { tags: buildTags() }, () => {
    setupCommentsAndNotes({ savedCommentsAndNotes: SAVED_COMMENTS_AND_NOTES });

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  it('AC3, AC5. should have no detected Axe violations in the error state', { tags: buildTags() }, () => {
    setupCommentsAndNotes();
    setTextareaValue(Page.commentsAndNotes.comment, 'a'.repeat(251));
    cy.get(Page.commentsAndNotes.returnToCaseDetails).click();

    cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
    cy.checkA11y();
  });

  for (const width of [1280, 320]) {
    it(`AC5. should reflow without horizontal page overflow at ${width}px`, { tags: buildTags() }, () => {
      cy.viewport(width, 900);
      setupCommentsAndNotes();
      if (width === 320) {
        setTextareaValue(Page.commentsAndNotes.note, 'b'.repeat(1001));
        cy.get(Page.commentsAndNotes.returnToCaseDetails).click();
        cy.get(Page.commentsAndNotes.errorSummary).should('contain.text', ERROR_SUMMARY_TITLE);
      }

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
      });
    });
  }
});
