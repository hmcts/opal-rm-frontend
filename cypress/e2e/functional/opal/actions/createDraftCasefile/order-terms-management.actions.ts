import type { IOpalMaintenanceResultDetail } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-detail.interface';
import type { IOpalMaintenanceResultReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-result-reference-data-response.interface';
import type { IOpalMaintenanceMajorCreditorReferenceDataResponse } from 'src/app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-major-creditor-reference-data-response.interface';
import type { IResultParameter } from '../../types/createDraftCasefile/result-parameter.interface';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';

/** Drives Order Term management with observed real reference data and scenario-owned identities. */
export class OrderTermsManagementActions {
  /** Observes real Result and Major Creditor lookups without replacing responses. */
  public observe(): void {
    cy.intercept('GET', '**/opal-maintenance-service/results?*').as('orderTermResults');
    cy.intercept('GET', '**/opal-maintenance-service/results/MAT').as('matResult');
    cy.intercept('GET', '**/opal-maintenance-service/major-creditors*').as('majorCreditorLookup');
  }

  /** Opens the empty summary for this independent draft without submitting it. */
  public openSummary(): void {
    cy.get(S.caseDetails.orderTermsLink).click();
    cy.get(S.orderTermsSummary.cards).should('not.exist');
    cy.get(S.orderTerms.add).should('be.visible');
    this.assertNoSubmission();
  }

  /** Checks the active Order Term request and requires selectable MAT reference data. */
  public openSelection(): void {
    cy.get(S.orderTerms.add).click();
    cy.wait('@orderTermResults').then(({ request, response }) => {
      expect(request.query).to.deep.equal({ order_term: 'true', active: 'true' });
      if (response?.statusCode !== 200) throw new Error('Order Term Results must return 200');
      const body = response.body as IOpalMaintenanceResultReferenceDataResponse;
      if (!Array.isArray(body.refData) || !body.refData.some((item) => item.result_id === 'MAT')) {
        throw new Error('Provision an active MAT Order Term Result for QA');
      }
    });
    cy.get(S.orderTerms.select).should('be.visible');
  }

  /** Selects MAT and checks its metadata-driven input controls. */
  public openInput(): void {
    this.openSelection();
    this.continueSelectedInput();
  }

  /** Activates the focused Continue button once to open MAT and capture its observed metadata. */
  public continueSelectedInput(): void {
    cy.get(S.orderTerms.select).select('MAT');
    cy.get(S.orderTerms.continueButton).focus().should('be.focused').click();
    cy.wait('@matResult').then(({ response }) => {
      if (response?.statusCode !== 200) throw new Error('MAT detail must return 200');
      this.captureParameters(response.body as IOpalMaintenanceResultDetail);
    });
    this.assertRenderedParameters();
    cy.wrap(true, { log: false }).as('matInputIsNew');
  }

  /** Validates the representative fixture and captures its metadata within the current scenario.
   * @param detail Observed MAT detail response.
   */
  private captureParameters(detail: IOpalMaintenanceResultDetail): void {
    if (detail.result_id !== 'MAT' || !detail.result_title?.trim() || typeof detail.result_parameters !== 'string') {
      throw new Error('MAT must contain its title and parameter JSON string');
    }
    const parsed: unknown = JSON.parse(detail.result_parameters);
    if (!Array.isArray(parsed) || !parsed.length) throw new Error('MAT parameters must be a nonempty array');
    const parameters = parsed as IResultParameter[];
    try {
      parameters.forEach((field) => this.assertParameter(field));
    } catch (error) {
      const shape = parameters.map((field) => ({ name: field?.name, type: field?.type, mandatory: field?.mandatory }));
      throw new Error(
        `MAT QA fixture prerequisite: ${String(error)}; observed parameter definitions ${JSON.stringify(shape)}`,
      );
    }
    expect(new Set(parameters.map((field) => field.name.toLowerCase())).size).to.equal(parameters.length);
    const amount = parameters.find((field) => field.name.toLowerCase() === 'amount');
    const frequency = parameters.find((field) => field.name.toLowerCase() === 'frequency');
    if (!amount || !frequency) throw new Error('MAT must expose amount and inherited frequency');
    expect(amount.mandatory).to.equal(true);
    expect(Number(amount.min ?? 0)).to.be.at.most(10);
    if (amount.max !== 'No Limit') expect(Number(amount.max ?? 25)).to.be.at.least(25);
    cy.wrap(parameters, { log: false }).as('matParameters');
    cy.wrap(detail.result_title.trim(), { log: false }).as('matTitle');
  }

  /** Checks a representative MAT parameter without calling the production mapper.
   * @param field Observed parameter from the real MAT payload.
   */
  private assertParameter(field: IResultParameter): void {
    const names = [
      'amount',
      'frequency',
      'expiry',
      'expiry_date',
      'arrears',
      'creditor',
      'respondent',
      'payment',
      'commencement',
    ];
    if (!field || typeof field.name !== 'string' || typeof field.prompt !== 'string' || !field.prompt.trim()) {
      throw new Error('MAT parameters require a name and prompt');
    }
    const name = field.name.toLowerCase();
    if (!names.includes(name) || typeof field.mandatory !== 'boolean') {
      throw new Error('Provision the documented representative MAT fixture for this QA pack');
    }
    const kinds: Record<string, string[]> = {
      amount: ['decimal-2dp', 'money', 'decimal'],
      arrears: ['decimal-2dp', 'money', 'decimal'],
      frequency: ['menu-radio', 'read-only', 'select'],
      expiry: ['date'],
      expiry_date: ['date'],
      creditor: ['text-60'],
      respondent: ['text-60'],
      payment: ['menu-radio'],
      commencement: ['date'],
    };
    expect(kinds[name], 'Representative MAT parameter type').to.include(field.type);
    if (['expiry', 'expiry_date', 'arrears'].includes(name)) expect(field.mandatory).to.equal(false);
    if (['creditor', 'respondent'].includes(name)) this.assertTextBounds(field);
    if (name === 'payment') this.courtOption(field);
    if (name === 'commencement') this.assertCommencementBounds(field);
  }

  /** Requires the synthetic identity labels to fit the observed MAT text constraints.
   * @param field Creditor or Respondent metadata.
   */
  private assertTextBounds(field: IResultParameter): void {
    const value = this.supplementaryText().find((entry) => entry.name === field.name.toLowerCase())?.value;
    if (!value) throw new Error('Unsupported MAT identity field');
    expect(value.length).to.be.at.least(Number(field.min ?? 0));
    if (field.max !== 'No Limit') expect(value.length).to.be.at.most(Number(field.max ?? 60));
  }

  /** Requires the synthetic commencement date to fit observed MAT date bounds.
   * @param field Commencement metadata.
   */
  private assertCommencementBounds(field: IResultParameter): void {
    const date = Date.parse('2026-01-01');
    if (field.min !== undefined && field.min !== 'No Limit') expect(date).to.be.at.least(Date.parse(String(field.min)));
    if (field.max !== undefined && field.max !== 'No Limit') expect(date).to.be.at.most(Date.parse(String(field.max)));
  }

  /** Selects the concrete Court choice from the independently observed Payment options.
   * @param field Payment metadata.
   * @returns The observed option value for payment through the Court.
   */
  private courtOption(field: IResultParameter): string {
    if (!Array.isArray(field.options) || !field.options.every((option) => typeof option === 'string')) {
      throw new Error('MAT Payment must provide string options');
    }
    const option = field.options.find((value) => value === 'Payable through the Court');
    if (!option) throw new Error('Provision MAT Payment option Payable through the Court');
    return option;
  }

  /** Provides bounded synthetic values for the two observed additional identity controls.
   * @returns Synthetic Creditor and Respondent inputs.
   */
  private supplementaryText(): { name: string; value: string }[] {
    return [
      { name: 'creditor', value: 'Synthetic Creditor' },
      { name: 'respondent', value: 'Synthetic Respondent' },
    ];
  }

  /** Checks that the rendered input agrees with the independently observed MAT metadata. */
  private assertRenderedParameters(): void {
    cy.get('@matTitle').then((title) => cy.get(S.heading).should('have.text', `MAT - ${title}`));
    cy.get<IResultParameter[]>('@matParameters').then((parameters) => {
      parameters.forEach((field) => {
        if (field.name.toLowerCase() === 'frequency') {
          cy.get(S.orderTermsInput.field(field.name))
            .should('contain.text', field.prompt)
            .and('contain.text', 'Monthly');
        } else if (field.name.toLowerCase() === 'payment') {
          cy.get(S.orderTermsInput.field(field.name)).should('be.visible').and('contain.text', field.prompt);
          cy.get(S.orderTermsInput.fieldRadios(field.name)).should((radios) => {
            expect([...radios].map((radio) => (radio as HTMLInputElement).value)).to.deep.equal(field.options);
          });
        } else {
          cy.get(S.orderTermsInput.field(field.name)).should('be.visible');
          cy.get(S.orderTermsInput.fieldLabel(field.name)).should('contain.text', field.prompt);
        }
      });
    });
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Enters the synthetic amount and verifies the inherited payment frequency.
   * @param amount Synthetic amount to enter or expect.
   */
  public fillInput(amount: string): void {
    cy.get(S.orderTermsInput.amount).clear().type(amount);
    cy.get<boolean>('@matInputIsNew').then((isNew) => {
      if (isNew) this.fillSupplementaryInput();
    });
    cy.get(S.orderTermsInput.frequency).should('contain.text', 'Monthly');
  }

  /** Completes only the four known supplementary MAT fields when creating a new term. */
  private fillSupplementaryInput(): void {
    cy.get<IResultParameter[]>('@matParameters').then((parameters) => {
      const names = parameters.map((field) => field.name.toLowerCase());
      this.supplementaryText().forEach(({ name, value }) => {
        if (names.includes(name)) cy.get(S.orderTermsInput.field(name)).type(value);
      });
      const payment = parameters.find((field) => field.name.toLowerCase() === 'payment');
      if (payment) cy.get(S.orderTermsInput.fieldRadios(payment.name)).check(this.courtOption(payment));
      if (names.includes('commencement')) cy.get(S.orderTermsInput.field('commencement')).type('01/01/2026');
    });
  }

  /** Proves supplementary MAT values survived reopening before amount-only amendment. */
  private assertSupplementaryInput(): void {
    cy.get<IResultParameter[]>('@matParameters').then((parameters) => {
      const names = parameters.map((field) => field.name.toLowerCase());
      this.supplementaryText().forEach(({ name, value }) => {
        if (names.includes(name)) cy.get(S.orderTermsInput.field(name)).should('have.value', value);
      });
      const payment = parameters.find((field) => field.name.toLowerCase() === 'payment');
      if (payment)
        cy.get(S.orderTermsInput.fieldRadios(payment.name))
          .filter(':checked')
          .should('have.value', this.courtOption(payment));
      if (names.includes('commencement'))
        cy.get(S.orderTermsInput.field('commencement')).should('have.value', '01/01/2026');
    });
  }

  /** Continues to creditor selection, observing the first uncached Major lookup when requested.
   * @param firstMajorRequest Whether this navigation triggers the first uncached Major lookup.
   */
  public continueInput(firstMajorRequest: boolean): void {
    cy.get(S.orderTermsInput.continueButton).focus().should('be.focused').type('{enter}');
    if (firstMajorRequest) {
      cy.wait('@majorCreditorLookup').then(({ request, response }) => {
        expect(request.query).to.deep.equal({ business_unit_id: '44', active: 'true', central_authority: 'false' });
        if (response?.statusCode !== 200) throw new Error('Major Creditor lookup must return 200');
        const body = response.body as IOpalMaintenanceMajorCreditorReferenceDataResponse;
        if (!Array.isArray(body.refData) || !body.refData.length) {
          throw new Error('Provision an active BU 44 non-Central-Authority Major Creditor');
        }
        expect(
          body.refData.every((item) => item.active && item.business_unit_id === 44 && !item.central_authority),
        ).to.equal(true);
        cy.wrap(body.refData, { log: false }).as('observedMajors');
      });
    }
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.creditor.choiceFieldset).should('be.visible');
    this.assertNoSubmission();
  }

  /** Accepts the applicant creditor through the rendered choice and returns to summary. */
  public acceptApplicant(): void {
    cy.get(S.creditor.applicant).check();
    cy.get(S.creditor.continueButton).focus().should('be.focused').type('{enter}');
    cy.get(S.orderTerms.add).should('be.visible');
  }

  /** Captures the unique term DOM identity for the supplied amount in a scenario alias.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public rememberTerm(alias: string, amount: string): void {
    cy.get(S.orderTermsSummary.cards)
      .filter((_, card) => card.textContent?.includes(`£${Number(amount).toFixed(2)}`) ?? false)
      .should('have.length', 1)
      .invoke('attr', 'data-order-term-id')
      .then((value) => {
        const id = Number(value);
        expect(Number.isInteger(id) && id > 0, 'Stable Order Term DOM identifier').to.equal(true);
        cy.wrap(id, { log: false }).as(alias);
      });
  }

  /** Checks the saved term by stable DOM identity and its observed Result title.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public assertTerm(alias: string, amount: string): void {
    cy.get<number>(`@${alias}`).then((id) => {
      cy.get(S.orderTermsSummary.card(id))
        .should('contain.text', `£${Number(amount).toFixed(2)}`)
        .and('contain.text', 'Monthly');
      cy.get('@matTitle').then((title) => cy.get(S.orderTermsSummary.card(id)).should('contain.text', String(title)));
    });
    this.assertNoSubmission();
  }

  /** Reopens the identified term and checks retained amount and frequency.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public reopenInput(alias: string, amount: string): void {
    cy.get<number>(`@${alias}`).then((id) => cy.get(S.orderTermsSummary.change(id)).click());
    cy.get(S.orderTermsInput.amount).should('have.value', Number(amount).toFixed(2));
    this.assertSupplementaryInput();
    cy.wrap(false, { log: false }).as('matInputIsNew');
    cy.get(S.orderTermsInput.frequency).should('contain.text', 'Monthly');
    this.assertNoSubmission();
  }

  /** Opens removal for the identified term without submitting the draft.
   * @param alias Scenario alias holding the stable term DOM identity.
   */
  public openRemoval(alias: string): void {
    cy.get<number>(`@${alias}`).then((id) => cy.get(S.orderTermsSummary.remove(id)).click());
    cy.get(S.orderTermsRemoval.confirm).should('be.visible');
    this.assertNoSubmission();
  }

  /** Returns from removal using keyboard activation without deleting a term. */
  public cancelRemoval(): void {
    cy.get(S.orderTermsRemoval.cancel).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.orderTerms.add).should('be.visible');
  }

  /** Confirms removal and checks the identified term is absent with a success notice.
   * @param alias Scenario alias holding the stable term DOM identity.
   */
  public confirmRemoval(alias: string): void {
    cy.get(S.orderTermsRemoval.confirm).focus().should('be.focused').type('{enter}');
    cy.get<number>(`@${alias}`).then((id) => cy.get(S.orderTermsSummary.card(id)).should('not.exist'));
    cy.get(S.orderTermsRemoval.notice).should('be.visible').and('contain.text', 'Order terms removed.');
    this.assertNoSubmission();
  }

  /** Checks the exact number of accepted terms in the visible summary.
   * @param count Expected exact accepted term count.
   */
  public assertCount(count: number): void {
    cy.get(S.orderTermsSummary.cards).should('have.length', count);
  }

  /** Requires the scenario-owned draft-creation observer to remain untouched. */
  public assertNoSubmission(): void {
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
}
