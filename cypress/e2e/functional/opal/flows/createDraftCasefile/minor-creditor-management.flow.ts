import type { MinorCreditorKind } from '../../types/createDraftCasefile/minor-creditor-kind.type';
import { OrderTermsManagementFlow } from './order-terms-management.flow';
import { OrderTermsManagementActions } from '../../actions/createDraftCasefile/order-terms-management.actions';
import { MinorCreditorManagementActions } from '../../actions/createDraftCasefile/minor-creditor-management.actions';

/** Composes scenario-owned local Minor Creditor creation, acceptance and review management. */
export class MinorCreditorManagementFlow {
  private readonly terms = new OrderTermsManagementFlow();
  private readonly termActions = new OrderTermsManagementActions();
  private readonly actions = new MinorCreditorManagementActions();

  /** Starts a scenario-owned draft and locally reviews a new synthetic Minor for its MAT term.
   * @param kind Supported synthetic identity branch.
   */
  public createReviewed(kind: MinorCreditorKind): void {
    this.terms.start();
    this.terms.openInput();
    this.terms.completeInput('10');
    this.actions.openNew();
    this.actions.fill(kind);
    this.actions.save();
    this.actions.assertSummary(kind);
  }
  /** Creates and accepts an independent Minor, exposing firstTerm and minorCreditorName aliases.
   * @param kind Supported synthetic identity branch.
   */
  public createAccepted(kind: MinorCreditorKind): void {
    this.createReviewed(kind);
    this.acceptReviewed();
    this.assertAccepted(kind);
  }
  /** Accepts the current local review and captures the stable firstTerm DOM identity.
   */
  public acceptReviewed(): void {
    this.actions.accept();
    this.termActions.rememberTerm('firstTerm', '10');
  }
  /** Requires the stable term amount and the expected associated Minor name.
   * @param kind Supported synthetic identity branch.
   * @param updated Whether to expect the locally amended synthetic name.
   */
  public assertAccepted(kind: MinorCreditorKind, updated = false): void {
    this.termActions.assertTerm('firstTerm', '10');
    this.actions.assertOnTerm(kind, updated);
  }
  /** Reopens the locally saved review and proves retained fields before changing only the name.
   * @param kind Supported synthetic identity branch.
   */
  public changeReviewed(kind: MinorCreditorKind): void {
    this.actions.changeReviewed(kind);
  }
  /** Requires the expected local review values before final acceptance.
   * @param kind Supported synthetic identity branch.
   * @param updated Whether to expect the locally amended synthetic name.
   */
  public assertReviewed(kind: MinorCreditorKind, updated = false): void {
    this.actions.assertSummary(kind, updated);
  }
  /** Opens the local review removal confirmation through keyboard activation.
   */
  public openRemoval(): void {
    this.actions.openRemoval();
  }
  /** Confirms local removal and requires success with no selectable Minor remaining.
   */
  public confirmRemoval(): void {
    this.actions.confirmRemoval();
  }
  /** Abandons removal and requires review heading focus on return.
   */
  public cancelRemoval(): void {
    this.actions.cancelRemoval();
  }
  /** Proves the removed Minor is absent and a fresh form has no replayed details.
   * @param kind Supported synthetic identity branch.
   */
  public assertRemoved(kind: MinorCreditorKind): void {
    this.actions.assertFreshBlank(kind);
  }
  /** Opens the actual saved details form from local review before accessibility checks.
   */
  public reopenDetails(): void {
    this.actions.openReviewChange();
  }
  /** Saves the scanned details and requires the original synthetic identity in local review.
   * @param kind Supported synthetic identity branch.
   */
  public saveReviewed(kind: MinorCreditorKind): void {
    this.actions.save();
    this.actions.assertSummary(kind);
  }
  /** Scans the real conditional UK, non-UK and None bank form states without submitting.
   */
  public scanBankBranches(): void {
    this.actions.scanBankBranches();
  }
}
