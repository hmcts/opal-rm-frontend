import type { ICasesCreateCasefileRespondentEmployer } from './cases-create-casefile-respondent-employer.interface';
import type { ICasesCreateCasefilePartyAlias } from './cases-create-casefile-party-alias.interface';
import type { ICasesCreateCasefilePartyContactDetails } from './cases-create-casefile-party-contact-details.interface';
import type { ICasesCreateCasefilePartyRestrictedInformation } from './cases-create-casefile-party-restricted-information.interface';
import type { ICasesCreateCasefilePartyThirdParty } from './cases-create-casefile-party-third-party.interface';

export interface ICasesCreateCasefileRespondentDetails {
  title: string | null;
  firstNames: string;
  lastName: string;
  aliases: ICasesCreateCasefilePartyAlias[];
  dateOfBirth: string | null;
  nationalInsuranceNumber: string | null;
  otherPersonalInformation: string | null;
  contactDetails: ICasesCreateCasefilePartyContactDetails;
  thirdParty: ICasesCreateCasefilePartyThirdParty | null;
  employer: ICasesCreateCasefileRespondentEmployer | null;
  restrictedInformation: ICasesCreateCasefilePartyRestrictedInformation;
}
