import type { Subject } from 'rxjs';
import type { CasesCreateCasefileSubmissionOutcome } from 'src/app/flows/cases/cases-create-casefile/types/cases-create-casefile-submission-outcome.type';
import type { CasesCreateCasefileSubmissionService } from 'src/app/flows/cases/cases-create-casefile/services/cases-create-casefile-submission.service';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors } from '../../../shared/selectors/create-casefile.selectors';
import { setupReview } from './setup/review.setup';
import { REVIEW_RECEIPT } from './mocks/review.mock';

const S = CreateCasefileSelectors.review;
const buildTags = (): string[] => ['@JIRA-STORY:PO-9817', '@JIRA-EPIC:PO-6506', '@JIRA-LABEL:create-draft-casefile'];

describe('Check case details accessibility', () => {
  it(
    'AC6. should have no detected Axe violations in the valid review and expanded bank disclosure',
    { tags: buildTags() },
    () => {
      setupReview();
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.get(S.change('applicant')).focus();
      cy.press(Cypress.Keyboard.Keys.TAB);
      cy.get(S.bankToggle).should('be.focused');
      cy.press(Cypress.Keyboard.Keys.SPACE);
      cy.get(S.bankDetails).should('have.attr', 'open');
      cy.checkA11y();
    },
  );

  it(
    'AC2, AC6. should announce and focus validation errors without detected Axe violations',
    { tags: buildTags() },
    () => {
      setupReview({ staleReferences: true });
      cy.get(S.submit).click();
      cy.get(S.errors).should('be.focused').and('have.attr', 'role', 'alert');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po-9817-review-validation-error');
    },
  );

  it('AC6. should reflow before and after disclosure at 320 CSS pixels', { tags: buildTags() }, () => {
    cy.viewport(320, 900);
    setupReview();
    cy.get(S.heading).should('be.visible');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9817-review-collapsed-320px');
    cy.get(S.bankToggle).click();
    cy.get(S.bankDetails).should('have.attr', 'open');
    cy.document().should((document) =>
      expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth),
    );
    cy.screenshot('po-9817-review-expanded-320px');
  });

  it(
    'AC5, AC6. should render an accessible retained mock receipt and start a new journey without replay',
    { tags: buildTags() },
    () => {
      setupReview({ receipt: true });
      cy.get<CasesCreateCasefileSubmissionService>('@submission').then((service) => service.submit());
      cy.get<Subject<CasesCreateCasefileSubmissionOutcome>>('@gatewayOutcomes').then((subject) =>
        subject.next({ status: 'success', receipt: REVIEW_RECEIPT }),
      );
      cy.get(S.receipt).should('have.text', REVIEW_RECEIPT);
      cy.get(S.receiptHeading).should('be.focused');
      cy.contains('No case has been saved or submitted for review. This is a local simulation.').should('be.visible');
      cy.injectAxe({ axeCorePath: 'node_modules/axe-core/axe.min.js' });
      cy.checkA11y();
      cy.screenshot('po-9817-mock-receipt');
      cy.get(S.newCase).focus().type('{enter}');
      cy.get('@routerNavigate').should('have.been.calledWith', '/' + PATHS.root + '/' + PATHS.children.caseType);
      cy.get<CasesCreateCasefileSubmissionService>('@submission').should(
        (service) => expect(service.receipt()).to.be.null,
      );
      cy.get('@gatewaySubmit').should('have.been.calledOnce');
    },
  );
});
