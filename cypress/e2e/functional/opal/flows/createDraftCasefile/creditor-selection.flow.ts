import { OrderTermsManagementFlow } from './order-terms-management.flow';
import { MinorCreditorManagementFlow } from './minor-creditor-management.flow';
import { OrderTermsManagementActions } from '../../actions/createDraftCasefile/order-terms-management.actions';
import { CreditorSelectionActions } from '../../actions/createDraftCasefile/creditor-selection.actions';
import { CreditorActions } from '../../actions/createDraftCasefile/creditor.actions';

/** Composes independent creditor selection journeys using live Order Term and Minor helpers. */
export class CreditorSelectionFlow {
  private readonly terms = new OrderTermsManagementFlow();
  private readonly minors = new MinorCreditorManagementFlow();
  private readonly termActions = new OrderTermsManagementActions();
  private readonly actions = new CreditorSelectionActions();
  private readonly creditor = new CreditorActions();

  /** Supplies scenario-owned Major reference data for frontend selection and replay coverage. */
  public prepareMajorCreditors(): void {
    this.creditor.prepareMajorCreditors();
  }

  /** Starts an independent live draft and completes the observed MAT input for creditor selection. */
  public startChoice(): void {
    this.terms.start();
    this.terms.openInput();
    this.terms.completeInput('10');
  }
  /** Accepts the applicant and captures the first stable term identity with its synthetic amount. */
  public acceptApplicant(): void {
    this.terms.acceptApplicant('firstTerm', '10');
  }
  /** Verifies the saved Applicant choice through reopened UI and preserves the same term on acceptance. */
  public assertApplicant(): void {
    this.terms.assertTerm('firstTerm', '10');
    this.actions.assertApplicant();
    this.termActions.reopenInput('firstTerm', '10');
    this.terms.completeInput('10', false);
    this.actions.assertApplicantChoice();
    this.actions.accept();
    this.terms.assertTerm('firstTerm', '10');
    this.actions.assertApplicant();
  }
  /** Accepts an observed Major and captures the first stable term identity. */
  public acceptMajor(): void {
    this.actions.chooseMajor();
    this.actions.accept();
    this.termActions.rememberTerm('firstTerm', '10');
  }
  /** Requires the observed Major name on the stable term and verifies its identity through replay. */
  public assertMajor(): void {
    this.terms.assertTerm('firstTerm', '10');
    this.actions.assertMajor();
    this.termActions.reopenInput('firstTerm', '10');
    this.terms.completeInput('10', false);
    this.actions.assertMajorChoice();
    this.actions.accept();
    this.terms.assertTerm('firstTerm', '10');
    this.actions.assertMajor();
  }
  /** Creates a scenario-owned Organisation Minor and opens a second term using cached live reference data. */
  public prepareReuse(): void {
    this.minors.createAccepted('Organisation');
    this.terms.openInput();
    this.terms.completeInput('20', false);
  }
  /** Captures the only scenario-owned Minor option value and selects it without assuming its sequence. */
  public chooseExistingMinor(): void {
    this.actions.chooseExistingMinor();
  }
  /** Accepts the existing Minor and captures the second stable term identity. */
  public acceptExistingMinor(): void {
    this.actions.accept();
    this.termActions.rememberTerm('secondTerm', '20');
  }
  /** Requires both stable terms to retain the same synthetic Minor and no draft submission. */
  public assertReuse(): void {
    this.terms.assertTerm('firstTerm', '10');
    this.terms.assertTerm('secondTerm', '20');
    this.actions.assertReuse();
  }
  /** Reopens the first term, proves one retained Minor choice, then rechecks both associations. */
  public assertNoDuplicate(): void {
    this.termActions.reopenInput('firstTerm', '10');
    this.terms.completeInput('10', false);
    this.actions.assertSingleMinorChoice();
    this.actions.accept();
    this.assertReuse();
  }
  /** Requires no existing-Minor option and no draft submission in a fresh order. */
  public assertHidden(): void {
    this.actions.assertHidden();
  }
  /** Reveals the actual Major conditional controls through the rendered radio. */
  public showMajorConditional(): void {
    this.actions.showMajorConditional();
  }
  /** Requires the revealed Major selector before accessibility scanning. */
  public assertMajorConditional(): void {
    this.actions.assertMajorConditional();
  }
}
