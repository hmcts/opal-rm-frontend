import { CasefilePermissionsActions } from '../../actions/createDraftCasefile/casefile-permissions.actions';
import { CasePartiesActions } from '../../actions/createDraftCasefile/case-parties.actions';
import { LiveCasefileSessionActions } from '../../actions/createDraftCasefile/live-casefile-session.actions';
import type { CasePartyPath } from '../../types/createDraftCasefile/case-party-path.type';

/** Composes live party capture and local replay for role-based casefile journeys. */
export class CasePartiesFlow {
  private readonly parties = new CasePartiesActions();
  private readonly session = new LiveCasefileSessionActions();
  private readonly permissions = new CasefilePermissionsActions();

  /** Proves released entry before switching to the live denied account. */
  public authenticateDenied(): void {
    this.session.authenticate('authorised');
    this.permissions.assertReleasedEntry();
    this.session.authenticate('denied');
  }

  /**
   * Attempts direct navigation as the authenticated denied account.
   * @param path Protected task route covered by the shared outline.
   */
  public openDeniedTask(path: string): void {
    this.permissions.openTask(path);
  }

  /** Verifies permission rejection before any protected task form is shown. */
  public assertDenied(): void {
    this.permissions.assertDenied();
  }

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

  /** Completes both mandatory organisation-path party tasks through local page saves. */
  public captureOrganisation(): void {
    this.parties.fillRespondent();
    this.parties.saveRespondent();
    this.parties.fillOrganisation();
    this.parties.saveOrganisation();
  }

  /** Proves both completed organisation-path tasks retain their entered values when reopened. */
  public verifyOrganisation(): void {
    this.parties.assertProvided();
    this.parties.verifyRespondent();
    this.parties.verifyOrganisation();
  }

  /**
   * Completes the mandatory parties for the selected applicant path.
   * @param path Applicant category chosen for this independent casefile.
   */
  public captureMandatory(path: CasePartyPath): void {
    if (path === 'Individual') this.captureIndividual();
    else this.captureOrganisation();
  }
}
