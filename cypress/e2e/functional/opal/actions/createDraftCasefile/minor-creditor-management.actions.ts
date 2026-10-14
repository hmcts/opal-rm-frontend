import type { MinorCreditorKind } from '../../types/createDraftCasefile/minor-creditor-kind.type';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { accessibilityActions } from '../accessibility/accessibility.actions';

/** Exercises local Minor Creditor management against the real draft journey. */
export class MinorCreditorManagementActions {
  /** Returns the synthetic identity expected on the review and associated term.
   * @param kind Supported synthetic identity branch.
   * @param updated Whether to expect the locally amended synthetic name.
   * @returns The exact visible synthetic creditor name.
   */
  private expectedName(kind: MinorCreditorKind, updated = false): string {
    if (kind === 'Individual') return updated ? 'Synthetic Updated Minor' : 'Synthetic Minor';
    return updated ? 'Updated Synthetic Minor Organisation' : 'Synthetic Minor Organisation';
  }

  /** Opens an empty Minor Creditor form from the real creditor selection page.
   */
  public openNew(): void {
    cy.get(S.creditor.addNew).check();
    cy.get(S.creditor.continueButton).focus().should('be.focused').type('{enter}');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorDetails);
    cy.get(S.minorCreditor.type).should('be.visible');
  }

  /** Enters synthetic identity details, proves the full observed Country order and selects bank None.
   * @param kind Supported synthetic identity branch.
   */
  public fill(kind: MinorCreditorKind): void {
    if (kind === 'Individual') {
      cy.get(S.minorCreditor.individual).check();
      cy.get(S.minorCreditor.firstNames).type('Synthetic');
      cy.get(S.minorCreditor.lastName).type('Minor');
    } else {
      cy.get(S.minorCreditor.organisation).check();
      cy.get(S.minorCreditor.organisationName).type(this.expectedName(kind));
    }
    cy.get(S.minorCreditor.addressLine1).type('4 Synthetic Street');
    cy.get('@liveCountryNames').then((names) => {
      cy.get(S.minorCreditor.countryAutocomplete).clear().focus();
      cy.get(S.minorCreditor.countryOptions).should((options) => {
        expect(
          [...options].map((option) => option.textContent?.trim()),
          'Full visible Country order',
        ).to.deep.equal(names);
      });
      cy.get(S.minorCreditor.countryAutocomplete).type('United Kingdom').type('{downArrow}{enter}');
      cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'United Kingdom');
    });
    cy.get(S.minorCreditor.bankNone).check();
  }

  /** Saves the local form and requires the review page without submitting the casefile.
   */
  public save(): void {
    cy.get(S.minorCreditor.save).focus().should('be.focused').type('{enter}');
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorSummary);
    cy.get(S.minorCreditorSummary.continue).should('be.visible');
  }

  /** Requires exact locally reviewed identity and bank type, retained address and zero submission.
   * @param kind Supported synthetic identity branch.
   * @param updated Whether to expect the locally amended synthetic name.
   */
  public assertSummary(kind: MinorCreditorKind, updated = false): void {
    const name = this.expectedName(kind, updated);
    cy.get(S.minorCreditorSummary.rowValue('Name')).should('have.text', name);
    cy.get(S.minorCreditorSummary.rowValue('Address'))
      .should('contain.text', '4 Synthetic Street')
      .and('contain.text', 'United Kingdom');
    cy.get(S.minorCreditorSummary.rowValue('BankType')).should('have.text', 'None');
    cy.wrap(name, { log: false }).as('minorCreditorName');
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }

  /** Reopens the locally saved review and proves retained fields before changing only the name.
   * @param kind Supported synthetic identity branch.
   */
  public changeReviewed(kind: MinorCreditorKind): void {
    cy.get(S.minorCreditorSummary.change).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.minorCreditor.addressLine1).should('have.value', '4 Synthetic Street');
    cy.get(S.minorCreditor.countryAutocomplete).should('have.value', 'United Kingdom');
    cy.get(S.minorCreditor.bankNone).should('be.checked');
    if (kind === 'Individual') {
      cy.get(S.minorCreditor.individual).should('be.checked');
      cy.get(S.minorCreditor.firstNames).should('have.value', 'Synthetic');
      cy.get(S.minorCreditor.lastName).should('have.value', 'Minor').clear().type('Updated Minor');
    } else {
      cy.get(S.minorCreditor.organisation).should('be.checked');
      cy.get(S.minorCreditor.organisationName)
        .should('have.value', this.expectedName(kind))
        .clear()
        .type(this.expectedName(kind, true));
    }
    this.save();
  }

  /** Accepts the reviewed creditor into its Order Term through the rendered Continue control.
   */
  public accept(): void {
    cy.get(S.minorCreditorSummary.continue).focus().should('be.focused').type('{enter}');
    cy.get(S.orderTerms.add).should('be.visible');
  }

  /** Requires the expected creditor name on the scenario-owned stable Order Term card.
   * @param kind Supported synthetic identity branch.
   * @param updated Whether to expect the locally amended synthetic name.
   */
  public assertOnTerm(kind: MinorCreditorKind, updated = false): void {
    cy.get<number>('@firstTerm').then((id) => {
      cy.get(S.orderTermsSummary.card(id)).should('contain.text', this.expectedName(kind, updated));
    });
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }

  /** Opens the local review removal confirmation through keyboard activation.
   */
  public openRemoval(): void {
    cy.get(S.minorCreditorSummary.remove).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.minorCreditorRemoval.heading).should(
      'contain.text',
      'Are you sure you want to remove this minor creditor?',
    );
    cy.get(S.minorCreditorRemoval.confirm).should('be.visible');
  }
  /** Confirms local removal and requires success with no selectable Minor remaining.
   */
  public confirmRemoval(): void {
    cy.get(S.minorCreditorRemoval.confirm).focus().should('be.focused').type('{enter}');
    this.assertRemovalSuccess();
  }
  /** Abandons removal and requires review heading focus on return.
   */
  public cancelRemoval(): void {
    cy.get(S.minorCreditorRemoval.cancel).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorSummary);
    cy.get(S.heading).should('be.focused');
  }
  /** Requires the creditor selection success state and no remaining Minor option or submission.
   */
  public assertRemovalSuccess(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.minorCreditorRemoval.success).should('be.visible').and('contain.text', 'Minor creditor removed.');
    cy.get(S.creditor.minorChoices).should('not.exist');
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
  /** Reopens creation after removal and proves the removed identity and fields were cleared.
   * @param kind Supported synthetic identity branch.
   */
  public assertFreshBlank(kind: MinorCreditorKind): void {
    this.assertRemovalSuccess();
    this.openNew();
    cy.get(S.minorCreditor.addressLine1).should('have.value', '');
    cy.get(S.minorCreditor.countryAutocomplete).should('have.value', '');
    cy.get(S.minorCreditor.bankNone).should('not.be.checked');
    cy.get(S.minorCreditor.bankUk).should('not.be.checked');
    cy.get(S.minorCreditor.bankNonUk).should('not.be.checked');
    if (kind === 'Individual') {
      cy.get(S.minorCreditor.individual).check();
      cy.get(S.minorCreditor.firstNames).should('have.value', '');
      cy.get(S.minorCreditor.lastName).should('have.value', '');
    } else {
      cy.get(S.minorCreditor.organisation).check();
      cy.get(S.minorCreditor.organisationName).should('have.value', '');
    }
    cy.get('@liveDraftCreation').should('not.have.been.called');
  }
  /** Reopens the actual locally saved details form for accessibility scans.
   */
  public openReviewChange(): void {
    cy.get(S.minorCreditorSummary.change).focus().should('be.focused');
    cy.press(Cypress.Keyboard.Keys.ENTER);
    cy.get(S.minorCreditor.type).should('be.visible');
  }

  /** Scans the real conditional UK, non-UK and None bank form states without submitting.
   */
  public scanBankBranches(): void {
    cy.get(S.minorCreditor.bankUk).check();
    cy.get(S.minorCreditor.ukNameOnAccount).should('be.visible');
    accessibilityActions.checkAccessibilityOnly();
    cy.get(S.minorCreditor.bankNonUk).check();
    cy.get(S.minorCreditor.nonUkNameOnAccount).should('be.visible');
    accessibilityActions.checkAccessibilityOnly();
    cy.get(S.minorCreditor.bankNone).check();
    accessibilityActions.checkAccessibilityOnly();
  }
}
