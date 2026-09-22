import { CASES_CREATE_CASEFILE_ROUTING_PATHS as PATHS } from 'src/app/flows/cases/cases-create-casefile/routing/constants/cases-create-casefile-routing-paths.constant';
import { CreateCasefileSelectors as S } from '../../../../../shared/selectors/create-casefile.selectors';
import { UNSAVED_CHANGES_WARNING } from '../../../../../component/createDraftCasefile/constants/create-casefile-test-copy.constant';
import { E2E_MINOR_CREDITOR as M } from '../../mocks/createDraftCasefile/minor-creditor.mock';

/** Drives the Minor Creditor Details journey. */
export class MinorCreditorActions {
  /** Checks the real routed Details page is ready. */
  public assertDetails(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorDetails);
    cy.get(S.heading).should('have.text', 'Minor creditor details');
    cy.get(S.minorCreditor.type).should('be.visible');
    cy.get(S.minorCreditor.organisation).should('be.enabled');
    cy.get(S.primaryNavigation).should('not.exist');
  }

  /** Enters a valid Organisation/non-UK branch while leaving both international identifiers blank. */
  public enterInternationalOrganisation(): void {
    cy.get(S.minorCreditor.organisation).check();
    cy.get(S.minorCreditor.organisationName).type(M.organisationName);
    cy.get(S.minorCreditor.addressLine1).type(M.addressLine1);
    cy.get(S.minorCreditor.countryAutocomplete).type(M.countryName).type('{downArrow}{enter}');
    cy.get(S.minorCreditor.bankNonUk).check();
    cy.get(S.minorCreditor.nonUkNameOnAccount).type(M.nameOnAccount);
    cy.get(S.minorCreditor.nonUkPaymentReference).type(M.paymentReference);
    cy.get(S.minorCreditor.nonUkBicSwiftCode).should('have.value', '');
    cy.get(S.minorCreditor.nonUkIban).should('have.value', '');
  }

  /** Submits Minor Creditor Details. */
  public saveDetails(): void {
    cy.get(S.minorCreditor.save).click();
  }

  /** Checks empty submission rendered the complete ordered required-error state. */
  public assertRequiredValidation(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorDetails);
    cy.get(S.errorSummary).should('be.focused').and('contain.text', 'There is a problem');
    cy.get(S.errorSummaryLinks).then(($links) => {
      expect([...$links].map((link) => link.textContent?.trim())).to.deep.equal([
        'Select minor creditor type',
        'Enter an address',
        'Select a country',
        'Select an option',
      ]);
    });
  }

  /** Checks Summary was reached without calling the draft-write endpoint. */
  public assertSummaryWithoutDraftWrite(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorSummary);
    cy.get(S.heading).should('have.text', 'Minor creditor summary');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /**
   * Activates the selected minor creditor review action.
   * @param action The review action to perform.
   */
  public reviewAction(action: 'Change' | 'Remove' | 'Continue' | 'Cancel'): void {
    const selectors = S.minorCreditorSummary;
    const targets = {
      Change: selectors.change,
      Remove: selectors.remove,
      Continue: selectors.continue,
      Cancel: selectors.cancel,
    };
    cy.get(targets[action]).click();
  }

  /** Checks review acceptance navigated without writing a draft casefile. */
  public assertAcceptedReview(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermsSummary);
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /** Checks the guarded removal confirmation is ready for its accessibility scan. */
  public assertRemoval(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.minorCreditorRemove);
    cy.get(S.minorCreditorRemoval.heading)
      .invoke('text')
      .then((text) => expect(text.trim()).to.eq('Are you sure you want to remove this minor creditor?'));
    cy.get(S.minorCreditorRemoval.confirm).should('contain.text', 'Yes - remove minor creditor');
    cy.get(S.minorCreditorRemoval.cancel).should('have.text', 'No - cancel');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /** Confirms removal of the displayed local creditor. */
  public confirmRemoval(): void {
    cy.get(S.minorCreditorRemoval.confirm).click();
  }

  /** Returns to Summary without changing creditor data. */
  public cancelRemoval(): void {
    cy.get(S.minorCreditorRemoval.cancel).click();
  }

  /** Proves removal arrived without persisting a draft casefile. */
  public assertRemovalSuccess(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.minorCreditorRemoval.success).should('contain.text', 'Minor creditor removed.');
    cy.get(S.minorCreditorRemoval.dismiss).should('have.text', 'Dismiss');
    cy.get(S.creditor.addNew).should('not.be.checked');
    cy.get('@draftCreation').should('not.have.been.called');
  }

  /** Dismisses success and checks heading focus. */
  public dismissRemovalSuccess(): void {
    cy.get(S.minorCreditorRemoval.dismiss).click();
    cy.get(S.minorCreditorRemoval.success).should('not.exist');
    cy.get(S.minorCreditorRemoval.creditorHeading).should('be.focused');
  }

  /** Creates an unsaved Organisation identity edit. */
  public enterUnsavedName(): void {
    cy.get(S.minorCreditor.organisation).check();
    cy.get(S.minorCreditor.organisationName).type(M.unsavedName);
  }

  /**
   * Cancels with the requested unsaved-changes confirmation result.
   * @param accept Whether to accept the warning.
   */
  public cancelDetails(accept: boolean): void {
    cy.once('window:confirm', (message) => {
      expect(message).to.eq(UNSAVED_CHANGES_WARNING);
      return accept;
    });
    cy.get(S.minorCreditor.cancel).click();
  }

  /** Checks a declined Cancel retained the unsaved identity edit. */
  public assertUnsavedNameRetained(): void {
    this.assertDetails();
    cy.get(S.minorCreditor.organisationName).should('have.value', M.unsavedName);
  }

  /** Checks accepted Cancel returned to Creditor without creating or selecting a Minor creditor. */
  public assertCreditorWithoutNewMinor(): void {
    cy.location('pathname').should('eq', '/' + PATHS.root + '/' + PATHS.children.orderTermCreditor);
    cy.get(S.heading).should('have.text', 'Creditor');
    cy.get(S.creditor.choiceFieldset).should('be.visible');
    cy.get(S.creditor.applicant).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.major).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.addNew).should('be.enabled').and('not.be.checked');
    cy.get(S.creditor.minor(1)).should('not.exist');
    cy.get('@draftCreation').should('not.have.been.called');
  }
}
