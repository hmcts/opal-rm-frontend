import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

/** Drives the Order Terms selection acceptance journey. */
export class OrderTermsActions {
  /** Opens the Order Terms Summary from Case Details without calling a Results HTTP endpoint. */
  public openSummary(): void {
    const unexpectedResults = cy.spy().as('unexpectedResultsHttp');
    cy.intercept('GET', '**/opal-maintenance-service/results', unexpectedResults);
    cy.intercept('GET', '**/opal-maintenance-service/results/*', unexpectedResults);
    cy.get(S.caseDetails.orderTermsLink).click();
    this.assertSummary();
  }

  /** Checks the summary route and its Add terms action. */
  public assertSummary(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSummary);
    cy.get(S.orderTerms.heading).should('have.text', 'Order terms');
    cy.get(S.orderTerms.add).should('be.visible');
  }

  /** Starts a fresh pending order-term selection. */
  public startAdd(): void {
    cy.get(S.orderTerms.add).click();
  }

  /**
   * Selects an order term by its Result ID.
   * @param id The Result ID to select.
   */
  public choose(id: string): void {
    cy.get(S.orderTerms.select).select(id);
  }

  /** Continues from the selection page. */
  public continue(): void {
    cy.get(S.orderTerms.continueButton).click();
  }

  /** Returns from the input destination to the selection page. */
  public back(): void {
    cy.get(S.orderTerms.back).click();
  }

  /**
   * Checks that a pending selection has been restored.
   * @param id The expected Result ID.
   */
  public assertSelection(id: string): void {
    cy.get(S.orderTerms.select).should('have.value', id);
  }

  /**
   * Checks the Result-specific input route without persistence or Results HTTP traffic.
   * @param id The Result ID expected in the route and heading.
   */
  public assertInput(id: string): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsInput + '/' + id);
    const titles: Record<string, string> = { MAT: 'Maintenance', MCHILD: 'Child maintenance' };
    cy.get(S.orderTerms.heading).should('have.text', titles[id]);
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get('@unexpectedResultsHttp').should('not.have.been.called');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Checks validation focus and the link back to the required select. */
  public assertValidation(): void {
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    cy.get(S.errorSummaryLinks).should('have.length', 1).and('have.text', 'Select an order').click();
    cy.get(S.orderTerms.select).should('be.focused');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSelect);
  }

  /** Reloads the pending input route and checks the journey resets to Case Type. */
  public reload(): void {
    cy.reload();
    cy.get(S.caseTypeGroup).should('be.visible');
    cy.get(S.orderTerms.select).should('not.exist');
    cy.get(S.primaryNavigation).should('not.exist');
  }
  /** Enters the amount for the pending term.
   * @param amount Raw amount to enter.
   */
  public enterAmount(amount: string): void {
    cy.get(S.orderTermsInput.amount).clear().type(amount);
  }
  /** Submits the pending term. */
  public continueInput(): void {
    cy.get(S.orderTermsInput.continueButton).click();
  }
  /** Checks Creditor is reached without backend draft creation. */
  public assertCreditor(): void {
    cy.location('pathname').should('eq', '/cases/create-casefile/order-terms/creditor');
    cy.get(S.orderTerms.heading).should('have.text', 'Creditor');
    cy.get('@draftCreation').should('not.have.been.called');
    cy.get('@unexpectedResultsHttp').should('not.have.been.called');
  }
  /** Checks required amount validation and summary focus. */
  public assertAmountRequired(): void {
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'Enter an amount');
    cy.get(S.errorSummaryLinks).contains('Enter an amount').click();
    cy.get(S.orderTermsInput.amount).should('be.focused');
  }
}
