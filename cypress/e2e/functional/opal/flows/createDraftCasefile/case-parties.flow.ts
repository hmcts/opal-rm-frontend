import { CasePartiesActions } from '../../actions/createDraftCasefile/case-parties.actions';
import { LiveCasefileSessionActions } from '../../actions/createDraftCasefile/live-casefile-session.actions';
import type { CasePartyPath } from '../../types/createDraftCasefile/case-party-path.type';

/** Composes live party capture and local replay for role-based casefile journeys. */
export class CasePartiesFlow {
  private readonly parties = new CasePartiesActions();
  private readonly session = new LiveCasefileSessionActions();

  /**
   * Requires a live role account satisfying the create-casefile prerequisites.
   * @param role Expected BU 44 create permission for the configured account.
   */
  public authenticate(role: 'authorised' | 'denied'): void {
    this.session.authenticate(role);
  }
  /**
   * Begins a new independent REMO In draft for the selected applicant path.
   * @param path Applicant category selected on the case-type page.
   */
  public start(path: CasePartyPath): void {
    this.parties.start(path);
  }
  /** Completes both mandatory party tasks through local page saves. */
  public captureIndividual(): void {
    this.parties.fillRespondent();
    this.parties.saveRespondent();
    this.parties.fillIndividual();
    this.parties.saveIndividual();
  }
  /** Proves both completed tasks retain their entered values when reopened. */
  public verifyIndividual(): void {
    this.parties.assertProvided();
    this.parties.verifyRespondent();
    this.parties.verifyIndividual();
  }
}
