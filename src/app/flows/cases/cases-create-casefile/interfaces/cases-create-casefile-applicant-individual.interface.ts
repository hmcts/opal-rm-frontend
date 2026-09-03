import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';
import type { ICasesCreateCasefilePartyAlias } from './cases-create-casefile-party-alias.interface';
import type { ICasesCreateCasefilePartyContactDetails } from './cases-create-casefile-party-contact-details.interface';
import type { ICasesCreateCasefilePartyRestrictedInformation } from './cases-create-casefile-party-restricted-information.interface';
import type { ICasesCreateCasefilePartyThirdParty } from './cases-create-casefile-party-third-party.interface';

export interface ICasesCreateCasefileApplicantIndividual {
  title: string | null;
  firstNames: string;
  lastName: string;
  aliases: ICasesCreateCasefilePartyAlias[];
  dateOfBirth: string | null;
  contactDetails: ICasesCreateCasefilePartyContactDetails;
  thirdParty: ICasesCreateCasefilePartyThirdParty | null;
  bankDetails: CasesCreateCasefileApplicantBankDetails;
  restrictedInformation: ICasesCreateCasefilePartyRestrictedInformation;
}
