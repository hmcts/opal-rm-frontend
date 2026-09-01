import type { ICasesCreateCasefileRespondentAlias } from './cases-create-casefile-respondent-alias.interface';
import type { ICasesCreateCasefileRespondentContactDetails } from './cases-create-casefile-respondent-contact-details.interface';
import type { ICasesCreateCasefileRespondentEmployer } from './cases-create-casefile-respondent-employer.interface';
import type { ICasesCreateCasefileRespondentRestrictedInformation } from './cases-create-casefile-respondent-restricted-information.interface';
import type { ICasesCreateCasefileRespondentThirdParty } from './cases-create-casefile-respondent-third-party.interface';

export interface ICasesCreateCasefileRespondentDetails {
  title: string | null;
  firstNames: string;
  lastName: string;
  aliases: ICasesCreateCasefileRespondentAlias[];
  dateOfBirth: string | null;
  nationalInsuranceNumber: string | null;
  otherPersonalInformation: string | null;
  contactDetails: ICasesCreateCasefileRespondentContactDetails;
  thirdParty: ICasesCreateCasefileRespondentThirdParty | null;
  employer: ICasesCreateCasefileRespondentEmployer | null;
  restrictedInformation: ICasesCreateCasefileRespondentRestrictedInformation;
}
