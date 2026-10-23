import { OrderDetailsFlow } from './order-details.flow';
import { OrderTermsManagementActions } from '../../actions/createDraftCasefile/order-terms-management.actions';

/** Composes isolated Order Term journeys using the existing party and Order Details setup. */
export class OrderTermsManagementFlow {
  private readonly details = new OrderDetailsFlow();
  private readonly actions = new OrderTermsManagementActions();

  /** Starts an independent draft and completes mandatory parties and Order Details through UI. */
  public start(): void {
    this.details.startLive();
    this.details.openLive();
    this.details.saveLiveDetails();
    this.details.assertLiveProvided();
    this.actions.observe();
    this.actions.openSummary();
  }

  /** Adds an observed MAT/Applicant term to the draft already on its task list.
   * @param amount Synthetic amount to enter and verify.
   * @param alias Scenario alias holding the stable term identity.
   */
  public addApplicantTermToCurrentDraft(amount: string, alias: string): void {
    this.actions.observe();
    this.actions.openSummary();
    this.addApplicantTerm(amount, alias);
    this.assertTerm(alias, amount);
  }
  /** Opens Result selection for a new Order Term. */
  public openSelection(): void {
    this.actions.openSelection();
  }
  /** Continues from selection to the observed MAT input. */
  public continueSelectedInput(): void {
    this.actions.continueSelectedInput();
  }
  /** Opens the observed MAT input from the summary. */
  public openInput(): void {
    this.actions.openInput();
  }
  /** Saves an amount and enters creditor selection, respecting lookup caching on replay.
   * @param amount Synthetic amount to enter or expect.
   * @param firstMajorRequest Whether this navigation triggers the first uncached Major lookup.
   */
  public completeInput(amount: string, firstMajorRequest = true): void {
    this.actions.fillInput(amount);
    this.actions.continueInput(firstMajorRequest);
  }
  /** Creates an applicant term and remembers its stable identity within this scenario.
   * @param amount Synthetic amount to enter or expect.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param firstMajorRequest Whether this navigation triggers the first uncached Major lookup.
   */
  public addApplicantTerm(amount: string, alias: string, firstMajorRequest = true): void {
    this.openInput();
    this.completeInput(amount, firstMajorRequest);
    this.acceptApplicant(alias, amount);
  }
  /** Accepts the applicant and captures the resulting term identity.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public acceptApplicant(alias: string, amount: string): void {
    this.actions.acceptApplicant();
    this.actions.rememberTerm(alias, amount);
  }
  /** Checks the identified term retains its expected amount and inherited frequency.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public assertTerm(alias: string, amount: string): void {
    this.actions.assertTerm(alias, amount);
  }
  /** Creates two independently identifiable applicant terms within a fresh draft. */
  public prepareTwo(): void {
    this.start();
    this.addApplicantTerm('10', 'firstTerm');
    this.addApplicantTerm('20', 'secondTerm', false);
    this.actions.assertCount(2);
  }
  /** Changes only the second term amount and preserves its applicant creditor. */
  public amendSecond(): void {
    this.actions.reopenInput('secondTerm', '20');
    this.completeInput('25', false);
    this.actions.acceptApplicant();
  }
  /** Checks both stable identities, amounts and exact summary cardinality.
   * @param first Expected first term amount.
   * @param second Expected second term amount.
   */
  public assertBoth(first: string, second: string): void {
    this.assertTerm('firstTerm', first);
    this.assertTerm('secondTerm', second);
    this.actions.assertCount(2);
  }
  /** Opens removal for the scenario-owned term identity.
   * @param alias Scenario alias holding the stable term DOM identity.
   */
  public openRemoval(alias: string): void {
    this.actions.openRemoval(alias);
  }
  /** Abandons removal through the rendered return control. */
  public cancelRemoval(): void {
    this.actions.cancelRemoval();
  }
  /** Confirms removal of the identified term and verifies success.
   * @param alias Scenario alias holding the stable term DOM identity.
   */
  public confirmRemoval(alias: string): void {
    this.actions.confirmRemoval(alias);
  }
  /** Reopens and accepts the existing term through UI to prove retained input.
   * @param alias Scenario alias holding the stable term DOM identity.
   * @param amount Synthetic amount to enter or expect.
   */
  public replay(alias: string, amount: string): void {
    this.actions.reopenInput(alias, amount);
    this.completeInput(amount, false);
    this.actions.acceptApplicant();
  }
}
