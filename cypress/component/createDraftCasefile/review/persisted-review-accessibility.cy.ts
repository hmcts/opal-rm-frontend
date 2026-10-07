import { createPersistedCasefileResolved } from 'src/app/flows/cases/cases-draft/mocks/cases-draft-casefile-resolved.mock';
import { createPersistedCasefileDetail } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-draft-casefile-detail.mock';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { reviewUser, setupReview } from './setup/review.setup';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-10608', '@JIRA-EPIC:PO-10817', '@JIRA-LABEL:create-draft-casefile'];
const scan = () => {
  cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
  cy.checkA11y();
};

describe('Persisted case review accessibility', () => {
  beforeEach(() => cy.viewport(1280, 900));
  it('AC1. should have no detected Axe violations in inputter view', { tags: buildTags() }, () => {
    setupReview({
      resolved: createPersistedCasefileResolved({
        intent: 'inputter-view',
        mode: 'view',
        context: 'inputter',
        dashboardMode: 'inputter',
      }),
      user: reviewUser('inputter'),
    });
    cy.get(S.heading).should('be.visible');
    cy.get(S.decisionHost).should('not.exist');
    scan();
  });

  it('AC1, AC3. should have no detected Axe violations in eligible review', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    cy.get(S.decisionGroup).should('contain.text', 'Review decision');
    scan();
  });

  it(
    'AC3. should associate the revealed rejection hint and live character count without Axe violations',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      cy.get(S.decisionReject).check();
      cy.get(S.rejectionReason).should(
        'have.attr',
        'aria-describedby',
        'create_casefile_review_rejection_reason-hint create_casefile_review_rejection_reason-count',
      );
      cy.get(S.rejectionReasonHint).should('have.text', 'You can enter up to 250 characters');
      cy.get(S.rejectionReasonCount)
        .should('have.attr', 'aria-live', 'polite')
        .and('contain.text', 'You have 250 characters remaining');
      cy.get(S.rejectionReason).type('Synthetic');
      cy.get(S.rejectionReasonCount).should('contain.text', 'You have 241 characters remaining');
      scan();
    },
  );

  it(
    'AC3. should have no detected Axe violations with a focused missing-decision summary',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      cy.get(S.decisionContinue).click();
      cy.get(S.decisionSummary).should('be.focused');
      cy.contains(S.rejectionReasonSummaryLink, 'Select a review decision').should(
        'have.text',
        'Select a review decision',
      );
      scan();
    },
  );

  it('AC3. should have no detected Axe violations with the linked missing-reason error', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    cy.get(S.decisionReject).check();
    cy.get(S.decisionContinue).click();
    cy.get(S.decisionSummary).should('be.focused');
    cy.get(S.rejectionReason)
      .should('have.attr', 'aria-invalid', 'true')
      .and(
        'have.attr',
        'aria-describedby',
        'create_casefile_review_rejection_reason-hint create_casefile_review_rejection_reason-count create_casefile_review_rejection_reason-error-message',
      );
    cy.get(S.rejectionReasonError).should('contain.text', 'Enter reason for rejection');
    scan();
  });

  it('AC3. should have no detected Axe violations with an over-length reason error', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    cy.get(S.decisionReject).check();
    cy.get(S.rejectionReason).type('R'.repeat(251));
    cy.get(S.decisionContinue).click();
    cy.get(S.decisionSummary).should('be.focused');
    cy.get(S.rejectionReasonError).should('contain.text', 'Reason for rejection must be 250 characters or fewer');
    cy.get(S.rejectionReasonCount).should('contain.text', 'You have 1 character too many');
    scan();
  });

  it('AC3. should reveal Reject with native Space and Tab into the conditional textarea', { tags: buildTags() }, () => {
    setupReview({ resolved: createPersistedCasefileResolved() });
    cy.get(S.decisionReject).focus();
    cy.press(Cypress.Keyboard.Keys.SPACE);
    cy.get(S.decisionReject).should('be.checked').and('be.focused');
    cy.get(S.rejectionReason).should('be.visible');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.rejectionReason).should('be.focused');
    cy.press(Cypress.Keyboard.Keys.TAB);
    cy.get(S.decisionContinue).should('be.focused').type('{enter}');
    cy.get(S.decisionSummary).should('be.focused');
    cy.contains(S.rejectionReasonSummaryLink, 'Enter reason for rejection').focus();
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.rejectionReason).should('be.focused');
    cy.get('@routerNavigate').should('not.have.been.called');
  });

  it(
    'AC3. should activate Approve with native Space and Tab then submit Continue with Enter',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved() });
      cy.get(S.decisionApprove).focus();
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.decisionApprove).should('be.checked');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.decisionContinue).should('be.focused');
      cy.get(S.decisionContinue).type('{enter}');
      cy.get('@routerNavigate').should('have.been.calledOnce');
    },
  );

  it(
    'AC2, AC5. should expand and collapse minor-creditor bank details using the keyboard',
    { tags: buildTags() },
    () => {
      const draft = createPersistedCasefileDetail();
      draft.casefile.minor_creditors = [
        {
          creditor_sequence: 4,
          party_details: structuredClone(draft.casefile.applicant.party_details),
          bank_account_details: {
            bank_account_type: 'UK Bank',
            uk_bank_details: {
              account_name: 'Synthetic account',
              sort_code: '001122',
              account_number: '00112233',
              payment_reference: 'SYNTHETIC',
            },
          },
        },
      ];
      draft.casefile.respondent_account.order_details.order_terms[0].creditor_type = 'Minor Creditor';
      draft.casefile.respondent_account.order_details.order_terms[0].minor_creditor_sequence = 4;
      setupReview({ resolved: createPersistedCasefileResolved({ draft }) });
      cy.get(S.heading).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.bankToggle).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.section('minor-creditor-4-term-1')).find('summary').should('be.focused');
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.section('minor-creditor-4-term-1')).find('details').should('have.attr', 'open');
      cy.get(S.section('minor-creditor-4-term-1')).find('details').should('contain.text', '00112233');
      scan();
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.section('minor-creditor-4-term-1')).find('details').should('not.have.attr', 'open');
    },
  );

  it('AC1, AC3. should reflow saved review and rejection validation at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupReview({ resolved: createPersistedCasefileResolved() });
    cy.get(S.heading).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-10608-persisted-review-320');
    cy.get(S.decisionReject).check();
    cy.get(S.decisionContinue).click();
    cy.get(S.decisionSummary).should('be.focused');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-10608-persisted-validation-320');
  });

  it(
    'AC5. should focus the Delete heading and return by keyboard without detected Axe violations',
    { tags: buildTags() },
    () => {
      setupReview({ resolved: createPersistedCasefileResolved({ intent: 'checker-delete' }), deleteScreen: true });
      cy.get('@reviewHost').find(CreateCasefileSelectors.heading).should('be.focused');
      scan();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.deleteReturn).should('be.focused');
      cy.get(S.deleteReturn).type('{enter}');
      cy.get('@routerNavigate').should('have.been.calledOnce');
    },
  );
});
