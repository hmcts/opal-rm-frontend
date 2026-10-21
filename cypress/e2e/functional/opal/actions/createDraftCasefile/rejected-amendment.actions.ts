import { UNSAVED_CHANGES_WARNING } from '../../../../../shared/constants/create-casefile-test-copy.constant';
import { accessibilityActions } from '../accessibility/accessibility.actions';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CasesDraftSelectors as D } from '../../../../../shared/selectors/cases-draft.selectors';
import { checkerUser, type CheckerRole } from '../../mocks/createDraftCasefile/checker-dashboard.mock';
import { rejectedAmendmentDraft } from '../../mocks/createDraftCasefile/rejected-amendment.mock';
import { stubPersistedCasefileReferences } from './check-case-details-modes.actions';
import { PERSISTED_CASEFILE_REFERENCES } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { createCasesDraftSummary } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-summary.mock';

/** Real routed journey with synthetic HTTP boundaries and one respondent correction. */
export class RejectedAmendmentActions {
  private draft = rejectedAmendmentDraft();
  private unknown = false;
  private replaced = false;
  private entryId = '17';

  /** Installs synthetic inputter and persisted-record HTTP boundaries.
   * @param submitter Synthetic owner of the saved record.
   * @param denial Named eligibility failure.
   */
  public prepare(submitter: string, denial = ''): void {
    if (submitter !== 'me' && submitter !== 'another') throw new Error('Unknown synthetic submitter');
    this.entryId = denial === 'malformed-id' ? 'bad' : '17';
    this.draft = rejectedAmendmentDraft(submitter);
    this.unknown = false;
    this.replaced = false;
    const role: CheckerRole = denial === 'checker-only' ? 'checker' : 'inputter';
    cy.intercept('GET', '**/api/user-state', { body: checkerUser(role) });
    stubPersistedCasefileReferences();
    // Editor reference requests are intentionally active-only; resolver requests include history.
    cy.intercept('GET', '**/opal-maintenance-service/countries?active=true', {
      body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.countries) },
    });
    cy.intercept('GET', '**/opal-maintenance-service/maintenance-applications*active=true*', {
      body: { refData: structuredClone(PERSISTED_CASEFILE_REFERENCES.applications) },
    });
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*active=true*', { body: { refData: [] } });
    cy.intercept('GET', /\/opal-maintenance-service\/results(?:\?|$)/, {
      body: { refData: [{ result_id: 'TEST01', result_title: 'Test order term' }] },
    });
    if (denial === 'wrong-business-unit') {
      this.draft.business_unit_id = 45;
      this.draft.casefile.respondent_account.business_unit_id = 45;
    }
    if (denial === 'non-rejected') this.draft.casefile_status = 'SUBMITTED';
    cy.intercept('GET', '/opal-maintenance-service/draft-casefiles/17*', {
      body: this.draft,
      headers: { ETag: '"4"' },
    }).as('amendmentGet');
    cy.intercept('GET', /\/opal-maintenance-service\/draft-casefiles(?:\?|$)/, (request) => {
      const summary = createCasesDraftSummary({
        draft_casefile_id: 17,
        business_unit_id: 44,
        submitted_by: this.draft.submitted_by,
        casefile_status: 'REJECTED',
        casefile_snapshot: this.draft.casefile_snapshot,
      });
      const matches =
        !this.replaced &&
        String(request.query['casefile_status']).split(',').includes('REJECTED') &&
        (!request.query['submitted_by'] || request.query['submitted_by'] === summary.submitted_by) &&
        request.query['not_submitted_by'] !== summary.submitted_by;
      const summaries = matches ? [summary] : [];
      request.reply({
        body:
          request.query['restrict'] === 'counts' ? { count: summaries.length } : { count: summaries.length, summaries },
      });
    });
    cy.intercept('POST', '/opal-maintenance-service/draft-casefiles', { statusCode: 405 }).as('amendmentPost');
    cy.intercept('PUT', '/opal-maintenance-service/draft-casefiles/17', (request) => {
      if (this.unknown) {
        request.reply({ statusCode: 503, body: { retriable: true } });
        return;
      }
      const receipt = structuredClone(this.draft);
      receipt.casefile = request.body.casefile;
      receipt.submitted_by = 'BUU-CHECKER';
      receipt.casefile_status = 'RESUBMITTED';
      this.replaced = true;
      request.reply({ body: receipt, headers: { ETag: '"5"' } });
    }).as('amendmentPut');
  }

  /** Enters the saved record through its rejected collection action.
   */
  public openRejectedAmendment(): void {
    cy.visit('/cases/draft/create-and-manage/tabs#rejected');
    if (this.draft.submitted_by !== 'BUU-CHECKER') cy.get(D.allRejected).click();
    cy.get(D.row(17)).find('a').click();
    cy.location('pathname').should('eq', '/cases/create-casefile/task-list/17');
    cy.get(S.caseDetails.heading).should('have.text', 'Synthetic Respondent');
    cy.get(S.caseDetails.respondentLink).should('be.visible');
  }

  /** Opens the canonical ID amendment route.
   */
  public openDirect(): void {
    cy.visit('/cases/create-casefile/task-list/' + this.entryId);
  }

  /** Saves one respondent correction through the actual form.
   */
  public correctRespondentAndReview(): void {
    cy.get(S.caseDetails.respondentLink).click();
    cy.get(S.respondentDetails.firstNames).clear().type('Corrected');
    cy.get(S.respondentDetails.returnToCaseDetails).click();
    cy.get(S.caseDetails.checkCaseButton).click();
  }

  /** Checks corrected respondent and independently retained summaries.
   */
  public expectCorrectedDetails(): void {
    cy.get(S.review.rowValue('respondent', 'FirstNames')).should('contain.text', 'Corrected');
    cy.get(S.review.section('applicant')).should('contain.text', 'Synthetic').and('contain.text', 'Applicant');
    cy.get(S.review.section('orderTerms')).should('contain.text', '£100.00');
    cy.get(S.review.change('caseType')).should('not.exist');
  }

  /** Activates the real submission control.
   */
  public resubmitCorrectedCase(): void {
    cy.get(S.review.submit).click();
  }
  /** Enters the correction journey and submits once with an uncertain server outcome. */
  public prepareUncertain(): void {
    this.prepare('me');
    this.openRejectedAmendment();
    this.correctRespondentAndReview();
    cy.then(() => {
      this.unknown = true;
    });
    this.resubmitCorrectedCase();
  }

  /** Checks exact replacement aggregate, opaque version and write count.
   */
  public expectReplacement(): void {
    const expected = structuredClone(this.draft.casefile);
    expected.respondent_account.respondent.party_details.individual_details!.forenames = 'Corrected';
    cy.wait('@amendmentPut').then(({ request }) => {
      expect(request.headers['if-match']).to.equal('"4"');
      expect(request.body).to.deep.equal({ business_unit_id: 44, casefile: expected });
    });
    cy.get('@amendmentPut.all').should('have.length', 1);
    cy.get('@amendmentPost.all').should('have.length', 0);
    const otherInputter = this.draft.submitted_by !== 'BUU-CHECKER';
    cy.location('pathname').should(
      'eq',
      otherInputter ? '/cases/draft/create-and-manage/rejections' : '/cases/draft/create-and-manage/tabs',
    );
    if (!otherInputter) cy.location('hash').should('eq', '#rejected');
    cy.get(otherInputter ? D.allRejectedSuccess : D.success)
      .should('be.visible')
      .and('contain.text', "You have submitted Corrected Respondent's case for review.");
    cy.get(D.row(17)).should('not.exist');
  }

  /** Checks dismissal or refresh removes the inputter notice without another replacement.
   * @param method Dismiss or refresh boundary. */
  public clearResubmissionNotice(method: string): void {
    if (!['dismiss', 'refresh'].includes(method)) throw new Error('Unsupported resubmission notice operation');
    const otherInputter = this.draft.submitted_by !== 'BUU-CHECKER';
    const notice = otherInputter ? D.allRejectedSuccess : D.success;
    const dismiss = otherInputter ? D.allRejectedDismiss : D.successDismiss;
    const heading = otherInputter ? D.allRejectedHeading : D.heading;
    if (method === 'dismiss') {
      cy.get(dismiss).focus();
      cy.press(Cypress.Keyboard.Keys.ENTER);
      cy.get(heading).should('be.focused');
    } else cy.reload();
    cy.get(heading).should('be.visible');
    cy.get(notice).should('not.exist');
    cy.get('@amendmentPut.all').should('have.length', 1);
    cy.get('@amendmentPost.all').should('have.length', 0);
  }

  /** Uses Back and declines the shared departure confirmation. */
  public declineBack(): void {
    cy.wait('@amendmentPut');
    cy.get(S.globalErrorBanner).should('be.visible');
    cy.get(S.review.submit).should('be.enabled').click();
    cy.get('@amendmentPut.all').should('have.length', 1);
    cy.get('@amendmentPost.all').should('have.length', 0);
    const confirmation = cy.spy().as('declinedReload');
    cy.once('window:confirm', (message) => {
      confirmation(message);
      return false;
    });
    cy.get(S.review.back).click();
    cy.get('@declinedReload').should('have.been.calledOnceWith', UNSAVED_CHANGES_WARNING);
  }

  /** Checks declined departure preserves the correction without reads or writes. */
  public expectUncertainRetention(): void {
    this.expectCorrectedDetails();
    cy.get('@amendmentPut.all').should('have.length', 1);
    cy.get('@amendmentGet.all').should('have.length', 1);
    cy.get('@amendmentPost.all').should('have.length', 0);
  }

  /** Accepts shared departure protection so the normal resolver reloads saved data. */
  public acceptBack(): void {
    const confirmation = cy.spy().as('acceptedReload');
    cy.once('window:confirm', (message) => {
      confirmation(message);
      return true;
    });
    cy.get(S.review.back).click();
    cy.get('@acceptedReload').should('have.been.calledOnceWith', UNSAVED_CHANGES_WARNING);
  }

  /** Checks one fresh resolver read restored persisted values without PUT replay. */
  public expectReloaded(): void {
    cy.get(S.caseDetails.respondentLink).click();
    cy.get(S.respondentDetails.firstNames).should('have.value', 'Synthetic');
    cy.get('@amendmentGet.all').should('have.length', 2);
    cy.get('@amendmentPut.all').should('have.length', 1);
    cy.get('@amendmentPost.all').should('have.length', 0);
  }

  /** Checks denied entry and prohibited network requests.
   * @param reason Named permission or eligibility failure.
   */
  public expectDenied(reason: string): void {
    const early = reason === 'checker-only' || reason === 'release-disabled';
    cy.location('pathname').should('eq', early ? '/access-denied' : '/error/permission-denied');
    if (!early) cy.contains('h1', 'You do not have permission for this').should('be.visible');
    cy.get('@amendmentGet.all').should('have.length', early || reason === 'malformed-id' ? 0 : 1);
    cy.get('@amendmentPut.all').should('have.length', 0);
    cy.get('@amendmentPost.all').should('have.length', 0);
  }

  /** Scans the rendered state and checks horizontal reflow.
   * @param width Viewport width in CSS pixels.
   */
  public expectAccessibleReflow(width: number): void {
    cy.viewport(width, 900);
    accessibilityActions.checkAccessibilityOnly();
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
  }

  /** Checks native keyboard access to the existing review controls.
   */
  public expectKeyboardActions(): void {
    cy.get(S.review.submit).focus();
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.review.cancel).should('be.focused');
  }
}
