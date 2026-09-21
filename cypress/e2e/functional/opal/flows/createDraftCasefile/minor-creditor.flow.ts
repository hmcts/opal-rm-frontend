import { CreditorFlow } from './creditor.flow';
import { OrderTermsFlow } from './order-terms.flow';
import { MinorCreditorActions } from '../../actions/createDraftCasefile/minor-creditor.actions';

/** Composes the accepted-order-term to Minor Creditor journey. */
export class MinorCreditorFlow {
  private readonly orderTerms = new OrderTermsFlow();
  private readonly creditor = new CreditorFlow();
  private readonly actions = new MinorCreditorActions();

  /** Completes prerequisites and opens Minor Creditor Details through the real routes. */
  public openMinorCreditor(): void {
    this.creditor.prepareMajorCreditors();
    this.creditor.prepareCountries();
    this.orderTerms.openSummary();
    this.orderTerms.startAdd();
    this.orderTerms.choose('MAT');
    this.orderTerms.continue();
    this.orderTerms.enterAmount('12.30');
    this.orderTerms.continueInput();
    this.creditor.assertReady();
    this.creditor.chooseAddNew();
    this.creditor.continue();
    this.actions.assertDetails();
  }

  /** Enters the valid international Organisation branch. */
  public enterInternationalOrganisation(): void {
    this.actions.enterInternationalOrganisation();
  }

  /** Saves Minor Creditor Details. */
  public saveDetails(): void {
    this.actions.saveDetails();
  }

  /** Checks the required validation state. */
  public assertRequiredValidation(): void {
    this.actions.assertRequiredValidation();
  }

  /** Checks the Summary destination and no-write boundary. */
  public assertSummaryWithoutDraftWrite(): void {
    this.actions.assertSummaryWithoutDraftWrite();
  }

  /** Enters an unsaved identity name. */
  public enterUnsavedName(): void {
    this.actions.enterUnsavedName();
  }

  /**
   * Cancels with the requested confirmation outcome.
   * @param accept Whether to accept the warning.
   */
  public cancelDetails(accept: boolean): void {
    this.actions.cancelDetails(accept);
  }

  /** Checks a declined Cancel retained the unsaved edit. */
  public assertUnsavedNameRetained(): void {
    this.actions.assertUnsavedNameRetained();
  }

  /** Checks accepted Cancel returned without creating a Minor creditor. */
  public assertCreditorWithoutNewMinor(): void {
    this.actions.assertCreditorWithoutNewMinor();
  }
}
