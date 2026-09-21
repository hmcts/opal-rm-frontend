import { OPAL_MAINTENANCE_RESULT_DETAILS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-result-details.mock';
import { OPAL_MAINTENANCE_RESULTS_MOCK } from 'src/app/flows/cases/services/opal-maintenance-service/mocks/opal-maintenance-results.mock';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { E2E_CREDITOR_MAJOR_RESPONSE } from '../../mocks/createDraftCasefile/creditor.mock';
import { E2E_MINOR_CREDITOR } from '../../mocks/createDraftCasefile/minor-creditor.mock';

/** Drives the Order Terms selection acceptance journey. */
export class OrderTermsActions {
  private readonly firstTermId = 1;
  private readonly secondTermId = 2;

  /** Opens the Order Terms Summary from Case Details without calling a Results HTTP endpoint. */
  public openSummary(): void {
    cy.intercept(
      { method: 'GET', pathname: '/opal-maintenance-service/results', query: { order_term: 'true', active: 'true' } },
      { statusCode: 200, body: OPAL_MAINTENANCE_RESULTS_MOCK },
    ).as('results');
    cy.intercept('GET', '**/opal-maintenance-service/results/*', (request) => {
      const resultId = decodeURIComponent(new URL(request.url).pathname.split('/').at(-1)!);
      const detail = Object.hasOwn(OPAL_MAINTENANCE_RESULT_DETAILS_MOCK, resultId)
        ? OPAL_MAINTENANCE_RESULT_DETAILS_MOCK[resultId]
        : null;
      request.reply(detail ? { statusCode: 200, body: detail } : { statusCode: 404, body: {} });
    }).as('resultDetail');
    cy.get(S.caseDetails.orderTermsLink).click();
    this.assertSummary();
    cy.get('@results.all').should('have.length', 0);
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
    cy.wait('@results').its('response.statusCode').should('eq', 200);
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
   * Checks the Result-specific input route without persisting a draft.
   * @param id The Result ID expected in the route and heading.
   */
  public assertInput(id: string): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsInput + '/' + id);
    const titles: Record<string, string> = { MAT: 'Maintenance', MCHILD: 'Child maintenance' };
    cy.get(S.orderTerms.heading).should('have.text', titles[id]);
    cy.get('@draftCreation').should('not.have.been.called');
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
    cy.get('@resultDetail.all').should('have.length.at.least', 1);
  }
  /** Checks required amount validation and summary focus. */
  public assertAmountRequired(): void {
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'Enter an amount');
    cy.get(S.errorSummaryLinks).contains('Enter an amount').click();
    cy.get(S.orderTermsInput.amount).should('be.focused');
  }

  /**
   * Adds a Maintenance term and assigns it to the applicant.
   * @param amount Amount entered for the synthetic term.
   */
  private addApplicantTerm(amount: string): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
      body: structuredClone(E2E_CREDITOR_MAJOR_RESPONSE),
    }).as('amendmentMajorCreditors');
    cy.get(S.orderTerms.add).click();
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.orderTermsInput.amount).type(amount);
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.applicant).check();
    cy.get(S.creditor.continueButton).click();
    this.assertSummary();
  }

  /** Creates two accepted Maintenance terms with controlled stable identities. */
  public addTwoAcceptedMaintenanceOrders(): void {
    this.addApplicantTerm('10');
    this.addApplicantTerm('20');
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
  }

  /** Changes only the second accepted Maintenance term and completes creditor selection. */
  public amendSecondMaintenanceOrder(): void {
    cy.get(S.orderTermsSummary.change(this.secondTermId)).click();
    cy.get(S.orderTermsInput.amount).should('have.value', '20.00').clear().type('25');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.applicant).should('be.checked');
    cy.get(S.creditor.continueButton).click();
  }

  /** Checks stable-card amendment isolation. */
  public assertOnlySecondOrderAmended(): void {
    cy.get(S.orderTermsSummary.card(this.firstTermId)).should('contain.text', '£10.00');
    cy.get(S.orderTermsSummary.card(this.secondTermId)).should('contain.text', '£25.00');
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
  }

  /** Adds the first term with a new minor creditor and the second with the same accepted creditor. */
  public addSharedMinorCreditorOrders(): void {
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*', {
      body: structuredClone(E2E_CREDITOR_MAJOR_RESPONSE),
    }).as('sharedMajorCreditors');
    cy.get(S.orderTerms.add).click();
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.orderTermsInput.amount).type('10');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.addNew).check();
    cy.get(S.creditor.continueButton).click();
    this.enterNewMinorCreditor('Shared synthetic creditor');
    cy.get(S.minorCreditorSummary.continue).click();
    this.assertSummary();

    cy.get(S.orderTerms.add).click();
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).click();
    cy.get(S.orderTermsInput.amount).type('20');
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.minor(1)).check();
    cy.get(S.creditor.continueButton).click();
    this.assertSummary();

    cy.get(S.orderTermsSummary.change(this.secondTermId)).click();
    cy.get(S.orderTermsInput.amount).clear().type('30');
    cy.get(S.orderTermsInput.continueButton).click();
  }

  /**
   * Enters and reviews a synthetic minor creditor.
   * @param name Synthetic organisation name to enter.
   */
  private enterNewMinorCreditor(name: string): void {
    cy.get(S.minorCreditor.organisation).check();
    cy.get(S.minorCreditor.organisationName).type(name);
    cy.get(S.minorCreditor.addressLine1).type(E2E_MINOR_CREDITOR.addressLine1);
    cy.get(S.minorCreditor.countryAutocomplete).type(E2E_MINOR_CREDITOR.countryName).type('{downArrow}{enter}');
    cy.get(S.minorCreditor.bankNone).check();
    cy.get(S.minorCreditor.save).click();
    cy.get(S.minorCreditorSummary.continue).should('be.visible');
  }

  /** Starts a new creditor during amendment and cancels from its review page. */
  public enterNewCreditorAndCancelReview(): void {
    cy.get(S.creditor.addNew).check();
    cy.get(S.creditor.continueButton).click();
    this.enterNewMinorCreditor('Cancelled synthetic creditor');
    cy.get(S.minorCreditorSummary.cancel).click();
    this.assertSummary();
  }

  /** Checks the accepted shared creditor and both original term values survived cancellation. */
  public assertOriginalOrderAndCreditor(): void {
    cy.get(S.orderTermsSummary.card(this.firstTermId))
      .should('contain.text', '£10.00')
      .and('contain.text', 'Shared synthetic creditor');
    cy.get(S.orderTermsSummary.card(this.secondTermId))
      .should('contain.text', '£20.00')
      .and('contain.text', 'Shared synthetic creditor');
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
  }

  /** Reopens the selected term and checks the cancelled creditor was never accepted. */
  public assertNewCreditorUnavailable(): void {
    cy.get(S.orderTermsSummary.change(this.secondTermId)).click();
    cy.get(S.orderTermsInput.continueButton).click();
    cy.get(S.creditor.minor(1)).should('exist');
    cy.get(S.creditor.minor(2)).should('not.exist');
    cy.contains('label', 'Cancelled synthetic creditor').should('not.exist');
  }

  /** Opens removal for the second stable term. */
  public openSecondRemoval(): void {
    cy.get(S.orderTermsSummary.remove(this.secondTermId)).click();
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsRemove + '/1');
    cy.get(S.heading).should('have.text', 'Remove order term');
  }

  /** Returns from the removal placeholder. */
  public returnFromRemoval(): void {
    cy.get(S.orderTermsSummary.removeReturn).click();
    this.assertSummary();
  }

  /** Checks both controlled original terms remain accepted. */
  public assertBothOriginalOrders(): void {
    cy.get(S.orderTermsSummary.card(this.firstTermId)).should('contain.text', '£10.00');
    cy.get(S.orderTermsSummary.card(this.secondTermId)).should('contain.text', '£20.00');
    cy.get(S.orderTermsSummary.cards).should('have.length', 2);
  }

  /** Checks the journey did not submit a draft casefile. */
  public assertCasefileNotSubmitted(): void {
    cy.get('@draftCreation').should('not.have.been.called');
  }
}
