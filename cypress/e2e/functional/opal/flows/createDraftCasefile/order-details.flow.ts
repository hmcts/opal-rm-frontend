import { CasePartiesFlow } from './case-parties.flow';
import { OrderDetailsActions } from '../../actions/createDraftCasefile/order-details.actions';

/** Drives the Order Details acceptance journey. */
export class OrderDetailsFlow {
  private readonly actions = new OrderDetailsActions();
  private readonly parties = new CasePartiesFlow();

  /** Prepares an independent live draft with both mandatory parties completed. */
  public startLive(): void {
    this.parties.authenticate('authorised');
    this.parties.start('Individual');
    this.parties.captureIndividual();
  }

  /** Completes the required party pages through the real UI. */
  public completeParties(): void {
    this.actions.completeParties();
  }
  /** Opens Order Details after the applications response. */
  public openAvailable(): void {
    this.actions.openAvailable();
  }
  /** Saves the application, payment frequency and both required dates. */
  public saveRequiredDetails(): void {
    this.actions.saveRequiredDetails();
  }
  /** Checks task availability and absence of draft creation. */
  public assertProvided(): void {
    this.actions.assertProvided();
  }
  /** Re-enters the form and verifies a fresh lookup. */
  public reopen(): void {
    this.actions.reopen();
  }
  /** Checks that all saved values are restored for editing. */
  public assertEditable(): void {
    this.actions.assertEditable();
  }
  /** Returns a correlated service failure when entering the form. */
  public openWithFailure(): void {
    this.actions.openWithFailure();
  }
  /** Checks shared HTTP error presentation and preserved parties. */
  public assertSharedHttpFailure(): void {
    this.actions.assertSharedHttpFailure();
  }
  /** Retries entry using native keyboard activation. */
  public retryUsingKeyboard(): void {
    this.actions.retryUsingKeyboard();
  }
  /** Checks the activated form is available. */
  public assertAvailable(): void {
    this.actions.assertAvailable();
  }
  /** Submits the empty form to expose validation. */
  public submitEmpty(): void {
    this.actions.submitEmpty();
  }
  /** Checks that validation focuses the linked summary. */
  public assertErrorFocus(): void {
    this.actions.assertErrorFocus();
  }
  /** Opens the unavailable empty-list state. */
  public openEmpty(): void {
    this.actions.openEmpty();
  }
  /** Checks refreshed journey navigation and direct-link protection. */
  public reloadJourney(): void {
    this.actions.reloadJourney();
  }

  /** Opens the form with observed live active applications. */
  public openLive(): void {
    this.actions.openLive();
  }

  /** Captures and saves the selected live application and associated fields. */
  public saveLiveDetails(): void {
    this.actions.saveLiveDetails();
  }

  /** Checks completed order and party tasks without draft submission. */
  public assertLiveProvided(): void {
    this.actions.assertLiveProvided();
  }

  /** Reopens saved Order Details through the task list. */
  public reopenLive(): void {
    this.actions.reopenLive();
  }

  /** Checks the restored live application and associated fields. */
  public assertLiveEditable(): void {
    this.actions.assertLiveEditable();
  }
}
