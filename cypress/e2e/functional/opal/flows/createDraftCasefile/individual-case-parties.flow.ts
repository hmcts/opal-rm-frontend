import { ApplicantIndividualActions } from 'cypress/e2e/functional/opal/actions/createDraftCasefile/applicant-individual.actions';
import { CaseDetailsActions } from 'cypress/e2e/functional/opal/actions/createDraftCasefile/case-details.actions';
import { CaseTypeActions } from 'cypress/e2e/functional/opal/actions/createDraftCasefile/case-type.actions';
import { RespondentDetailsActions } from 'cypress/e2e/functional/opal/actions/createDraftCasefile/respondent-details.actions';

const RESPONDENT = {
  firstNames: 'Robin',
  lastName: 'Respondent',
  addressLine1: '1 Respondent Street',
  countryName: 'United Kingdom',
} as const;

const APPLICANT = {
  firstNames: 'Alex',
  lastName: 'Applicant',
  addressLine1: '2 Applicant Street',
  countryName: 'United Kingdom',
} as const;

/** Composes the Individual Applicant and Respondent journey for a REMO In Draft Casefile. */
export class IndividualCasePartiesFlow {
  private readonly caseType = new CaseTypeActions();
  private readonly caseDetails = new CaseDetailsActions();
  private readonly respondentDetails = new RespondentDetailsActions();
  private readonly applicantIndividual = new ApplicantIndividualActions();

  /** Starts a REMO In Draft Casefile with an Individual Applicant and reaches the task list. */
  public startRemoInIndividual(): void {
    this.caseType.startRemoInIndividual();
  }

  /** Opens Respondent Details and checks the live Country option sample ordering. */
  public assertRespondentCountrySampleOrdered(): void {
    this.caseDetails.openRespondentAndObserveCountries();
    this.respondentDetails.assertCountrySampleOrdered();
  }

  /** Completes the minimum Respondent details and returns to the task list. */
  public completeMinimumRespondent(): void {
    this.respondentDetails.completeMinimum(RESPONDENT);
  }

  /** Opens and completes the minimum Individual Applicant details, then returns to the task list. */
  public completeMinimumApplicant(): void {
    this.caseDetails.openApplicant();
    this.applicantIndividual.completeMinimum(APPLICANT);
  }

  /** Checks that both mandatory party-detail tasks have the Provided status. */
  public assertMandatoryPartyTasksProvided(): void {
    this.caseDetails.assertMandatoryPartyTasksProvided();
  }

  /** Reopens both party tasks in turn and checks that their entered details were retained. */
  public assertBothPartiesRetained(): void {
    this.caseDetails.openRespondentAndObserveCountries();
    this.respondentDetails.assertRetained(RESPONDENT);
    this.respondentDetails.returnToCaseDetails();
    this.caseDetails.openApplicant();
    this.applicantIndividual.assertRetained(APPLICANT);
    this.applicantIndividual.returnToCaseDetails();
  }
}
