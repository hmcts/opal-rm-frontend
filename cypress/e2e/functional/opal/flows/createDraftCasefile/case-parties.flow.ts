import { CasefilePermissionsActions } from '../../actions/createDraftCasefile/casefile-permissions.actions';
import { CasePartiesActions } from '../../actions/createDraftCasefile/case-parties.actions';
import { CasefilePermissionPreflightActions } from '../../actions/createDraftCasefile/casefile-permission-preflight.actions';
import type { CasePartyPath } from '../../types/createDraftCasefile/case-party-path.type';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from 'src/app/flows/cases/cases-create-casefile/constants/cases-create-casefile-case-types.constant';

/** Composes live party capture and local replay for casefile journeys. */
export class CasePartiesFlow {
  private readonly parties = new CasePartiesActions();
  private readonly preflight = new CasefilePermissionPreflightActions();
  private readonly permissions = new CasefilePermissionsActions();

  /** Proves the released case-type entry is available for the signed-in creator. */
  public assertReleasedEntry(): void {
    this.permissions.assertReleasedEntry();
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
   * Checks the current user's live create-casefile permission prerequisites.
   * @param expectedAllowed Whether the current user must have create-casefile permission.
   */
  public assertPermission(expectedAllowed: boolean): void {
    this.preflight.assertPermission(expectedAllowed);
  }

  /**
   * Begins a new independent REMO In draft for the selected applicant path.
   * @param path Applicant category selected on the case-type page.
   */
  public start(path: CasePartyPath): void {
    this.parties.start(path);
  }

  /**
   * Starts an independent outbound draft after validating the requested case type.
   * @param value REMO Out or REMO Out (CMS) from the scenario.
   */
  public startOutbound(value: string): void {
    this.parties.startOutbound(this.outboundCaseType(value));
  }

  /**
   * Verifies the outbound case type and absence of an applicant type without submission.
   * @param value Expected outbound case type from the scenario.
   */
  public assertOutboundTaskList(value: string): void {
    this.parties.assertOutboundTaskList(this.outboundCaseType(value));
  }

  /** Checks the initial Order-task gate for the journey that owns progression coverage. */
  public assertInitialOrderTasksBlocked(): void {
    this.parties.assertInitialOrderTasksBlocked();
  }

  /** Checks that completing parties unlocks Order Details before the later Order tasks. */
  public assertOrderDetailsAvailableAfterParties(): void {
    this.parties.assertOrderDetailsAvailableAfterParties();
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

  /**
   * Narrows scenario input to an outbound case type before selector use.
   * @param value Case type supplied by the scenario.
   * @returns The supported outbound case type.
   */
  private outboundCaseType(value: string) {
    if (
      value !== CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT &&
      value !== CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT_CMS
    ) {
      throw new Error('Unsupported outbound RM casefile type');
    }
    return value;
  }
}
