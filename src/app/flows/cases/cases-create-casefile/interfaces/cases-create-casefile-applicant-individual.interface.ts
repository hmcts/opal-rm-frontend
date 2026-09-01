import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';
import type { ICasesCreateCasefileApplicantAlias } from './cases-create-casefile-applicant-alias.interface';
import type { ICasesCreateCasefileApplicantContactDetails } from './cases-create-casefile-applicant-contact-details.interface';
import type { ICasesCreateCasefileApplicantRestrictedInformation } from './cases-create-casefile-applicant-restricted-information.interface';
import type { ICasesCreateCasefileApplicantThirdParty } from './cases-create-casefile-applicant-third-party.interface';

export interface ICasesCreateCasefileApplicantIndividual {
  title: string | null;
  firstNames: string;
  lastName: string;
  aliases: ICasesCreateCasefileApplicantAlias[];
  dateOfBirth: string | null;
  contactDetails: ICasesCreateCasefileApplicantContactDetails;
  thirdParty: ICasesCreateCasefileApplicantThirdParty | null;
  bankDetails: CasesCreateCasefileApplicantBankDetails;
  restrictedInformation: ICasesCreateCasefileApplicantRestrictedInformation;
}
