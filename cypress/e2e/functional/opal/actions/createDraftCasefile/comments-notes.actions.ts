import type { Interception } from 'cypress/types/net-stubbing';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CHECK_CASE_DETAILS_SUBMISSION as DATA } from '../../mocks/createDraftCasefile/check-case-details.mock';
import type { IOpalMaintenanceDraftCasefileRequest } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';

/** Exercises optional comments and notes through the rendered task and review pages. */
export class CommentsNotesActions {
  /** Opens the optional task from the case details task list. */
  public openFromTaskList(): void {
    cy.get(S.caseDetails.commentsAndNotesLink).click();
    cy.get(S.commentsAndNotes.heading).should('have.text', 'Comments and notes');
  }

  /** Opens the saved optional task from its contextual review action. */
  public openFromReview(): void {
    cy.get(S.review.change('commentsAndNotes')).click();
    cy.get(S.commentsAndNotes.heading).should('have.text', 'Comments and notes');
  }

  /** Enters controlled synthetic values into both optional fields. */
  public fill(): void {
    cy.get(S.commentsAndNotes.comment).clear().type(DATA.commentsAndNotes.comment);
    cy.get(S.commentsAndNotes.note).clear().type(DATA.commentsAndNotes.note);
  }

  /** Saves optional comments and notes using native Tab navigation and Space activation of the submit button. */
  public saveUsingKeyboard(): void {
    cy.get(S.commentsAndNotes.comment).focus().should('be.focused').type(DATA.commentsAndNotes.comment);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.commentsAndNotes.note).should('be.focused').type(DATA.commentsAndNotes.note);
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.commentsAndNotes.returnToCaseDetails).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.caseTypeHeading).should('not.exist');
    cy.get(S.caseDetails.commentsAndNotesLink).should('be.visible');
  }

  /** Saves the current form and follows its contextual return navigation. */
  public save(): void {
    cy.get(S.commentsAndNotes.returnToCaseDetails).click();
  }

  /** Checks that reopening the optional task restores both saved fields. */
  public assertSaved(): void {
    cy.get(S.commentsAndNotes.comment).should('have.value', DATA.commentsAndNotes.comment);
    cy.get(S.commentsAndNotes.note).should('have.value', DATA.commentsAndNotes.note);
  }

  /** Checks optional values alongside the required review sections before submission. */
  public assertReview(): void {
    cy.get(S.review.section('commentsAndNotes'))
      .should('contain.text', DATA.commentsAndNotes.comment)
      .and('contain.text', DATA.commentsAndNotes.note);
    for (const section of [
      'caseType',
      'respondent',
      'applicant',
      'orderDetails',
      'orderTerms',
      'interestAndIndexation',
      'managingPayments',
    ]) {
      cy.get(S.review.section(section)).should('be.visible');
    }
    cy.get('@draftSubmission.all').should('have.length', 0);
  }

  /** Checks that an untouched optional task has no review section. */
  public assertAbsent(): void {
    cy.get(S.review.section('commentsAndNotes')).should('not.exist');
  }

  /** Checks that submitting without optional values leaves both wire fields out. */
  public assertOmittedFromSubmission(): void {
    cy.get<Interception[]>('@draftSubmission.all')
      .should('have.length', 1)
      .then(([call]) => {
        const payload = call.request.body as IOpalMaintenanceDraftCasefileRequest;
        expect(payload.casefile.respondent_account).not.to.have.property('account_comment');
        expect(payload.casefile.respondent_account).not.to.have.property('notes');
      });
  }
}
