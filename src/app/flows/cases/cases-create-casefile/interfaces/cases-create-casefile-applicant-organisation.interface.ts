import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';
import type { ICasesCreateCasefilePartyContactDetails } from './cases-create-casefile-party-contact-details.interface';

export interface ICasesCreateCasefileApplicantOrganisation {
  organisationName: string;
  foreignAuthorityReference: string;
  contactDetails: ICasesCreateCasefilePartyContactDetails;
  bankDetails: CasesCreateCasefileApplicantBankDetails;
}
