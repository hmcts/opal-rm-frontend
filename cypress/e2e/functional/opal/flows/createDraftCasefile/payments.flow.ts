import { OrderDetailsFlow } from './order-details.flow';
import { PaymentsActions } from '../../actions/createDraftCasefile/payments.actions';

/** Composes isolated payment journeys using live party and Order Details prerequisites. */
export class PaymentsFlow {
  private readonly details = new OrderDetailsFlow();
  private readonly payments = new PaymentsActions();

  /** Starts a fresh draft and completes its mandatory party and Order Details tasks through UI. */
  public start(): void {
    this.details.startLive();
    this.details.openLive();
    this.details.saveLiveDetails();
    this.details.assertLiveProvided();
    this.payments.assertReady();
  }

  /** Opens the Interest and Indexation task from Case Details. */
  public openInterest(): void {
    this.payments.openInterest();
  }

  /** Selects interest and indexation without saving yet.
   * @param interest Yes or No interest decision.
   * @param indexation Controlled indexation choice.
   */
  public chooseInterest(interest: string, indexation: string): void {
    this.payments.chooseInterest(interest, indexation);
  }

  /** Selects the representative interest choices using keyboard controls. */
  public chooseInterestUsingKeyboard(): void {
    this.payments.chooseInterestUsingKeyboard();
  }

  /** Saves the interest choices and checks local task completion. */
  public saveInterest(): void {
    this.payments.saveInterest();
  }

  /** Prepares scenario-owned interest choices before recording a payment arrangement.
   * @param interest Yes or No interest decision.
   * @param indexation Controlled indexation choice.
   */
  public prepareInterest(interest: string, indexation: string): void {
    this.openInterest();
    this.chooseInterest(interest, indexation);
    this.saveInterest();
  }

  /** Proves saved interest choices are restored in the reopened task.
   * @param interest Expected Yes or No decision.
   * @param indexation Expected indexation choice.
   */
  public assertInterest(interest: string, indexation: string): void {
    this.payments.assertInterest(interest, indexation);
  }

  /** Opens the Managing Payments task from Case Details. */
  public openPayments(): void {
    this.payments.openPayments();
  }

  /** Selects the arrangement without saving yet.
   * @param arrangement Court or direct payment choice.
   */
  public chooseArrangement(arrangement: string): void {
    this.payments.chooseArrangement(arrangement);
  }

  /** Selects direct payments using the keyboard and checks onward focus. */
  public chooseDirectUsingKeyboard(): void {
    this.payments.chooseDirectUsingKeyboard();
  }

  /** Saves the arrangement and checks local task completion. */
  public savePayments(): void {
    this.payments.savePayments();
  }

  /** Replays both payment tasks to prove neither local save overwrites the other task.
   * @param arrangement Expected court or direct payment choice.
   */
  public assertPaymentsAndInterest(arrangement: string): void {
    this.openPayments();
    this.payments.assertArrangement(arrangement);
    this.savePayments();
    this.openInterest();
    this.assertInterest('Yes', 'CPI');
    this.saveInterest();
    this.openPayments();
    this.payments.assertArrangement(arrangement);
  }
}
