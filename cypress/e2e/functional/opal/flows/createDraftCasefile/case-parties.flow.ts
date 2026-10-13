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

  /** Opens the respondent page for its initial scan. */
  public openRespondentForAccessibility(): void {
    this.parties.openRespondent();
  }
  /** Populates the respondent baseline for material-state scans. */
  public populateRespondentForAccessibility(): void {
    this.parties.populateRespondent();
  }
  /** Saves the respondent baseline after optional controls are collapsed. */
  public saveRespondentForAccessibility(): void {
    this.parties.saveRespondent();
  }
  /** Scans expanded respondent controls and restores the mandatory baseline. */
  public scanRespondentOptionalControls(): void {
    this.parties.scanExpandedRespondent();
  }
  /** Opens the individual applicant page for its initial scan. */
  public openIndividualForAccessibility(): void {
    this.parties.openApplicant('Individual');
  }
  /** Populates the individual applicant baseline for material-state scans. */
  public populateIndividualForAccessibility(): void {
    this.parties.populateIndividual();
  }
  /** Saves the individual baseline after conditional controls are collapsed. */
  public saveIndividualForAccessibility(): void {
    this.parties.saveIndividual();
  }
  /** Scans individual bank branches and optional controls. */
  public scanIndividualBankControls(): void {
    this.parties.scanBankBranches('Individual');
  }
  /** Opens the organisation applicant page for its initial scan. */
  public openOrganisationForAccessibility(): void {
    this.parties.openApplicant('Organisation');
  }
  /** Populates the organisation baseline for material-state scans. */
  public populateOrganisationForAccessibility(): void {
    this.parties.populateOrganisation();
  }
  /** Saves the organisation baseline after bank controls are collapsed. */
  public saveOrganisationForAccessibility(): void {
    this.parties.saveOrganisation();
  }
  /** Scans organisation bank branches and restores the mandatory baseline. */
  public scanOrganisationBankControls(): void {
    this.parties.scanBankBranches('Organisation');
  }
}
