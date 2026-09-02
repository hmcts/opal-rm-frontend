import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';
import type { ICasesCreateCasefileApplicantContactDetails } from './cases-create-casefile-applicant-contact-details.interface';

export interface ICasesCreateCasefileApplicantOrganisation {
  organisationName: string;
  foreignAuthorityReference: string;
  contactDetails: ICasesCreateCasefileApplicantContactDetails;
  bankDetails: CasesCreateCasefileApplicantBankDetails;
}
