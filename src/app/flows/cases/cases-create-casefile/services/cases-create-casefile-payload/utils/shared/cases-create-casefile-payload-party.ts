import type { IOpalMaintenanceDraftCasefileRequest as Request } from '@app/flows/cases/services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { ICasesCreateCasefilePayloadReferences as References } from '../../interfaces/cases-create-casefile-payload-references.interface';
import type { ICasesCreateCasefilePartyAddress } from '@app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-party-address.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '@app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileRespondentDetails } from '@app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefilePartyContactDetails } from '@app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-party-contact-details.interface';
import type { ICasesCreateCasefilePartyThirdParty } from '@app/flows/cases/cases-create-casefile/interfaces/cases-create-casefile-party-third-party.interface';
import { text, required } from './cases-create-casefile-payload-values';
type Party = Request['casefile']['applicant']['party_details'];
export function address(value: ICasesCreateCasefilePartyAddress, references: References): Party['address'] {
  const countries = references.countries.filter((country) => country.active && country.country_id === value.countryId);
  const code = countries[0]?.cjs_code;
  if (
    countries.length !== 1 ||
    !Number.isInteger(code) ||
    references.countries.filter((country) => country.active && country.cjs_code === code).length !== 1
  ) {
    throw new Error('Country cannot be resolved to a unique CJS code');
  }
  return {
    address_line_1: required(value.addressLine1),
    address_line_2: text(value.addressLine2),
    address_line_3: text(value.addressLine3),
    address_line_4: text(value.addressLine4),
    address_line_5: text(value.addressLine5),
    postcode: text(value.postalOrZipCode),
    cjs_code: code,
  };
}
export function contacts(value: ICasesCreateCasefilePartyContactDetails): Party['contact_details'] {
  if (
    ![value.mainEmailAddress, value.otherEmailAddress, value.mainTelephoneNumber, value.otherTelephoneNumber].some(text)
  )
    return undefined;
  return {
    primary_email_address: text(value.mainEmailAddress),
    secondary_email_address: text(value.otherEmailAddress),
    main_telephone_number: text(value.mainTelephoneNumber),
    other_telephone_number: text(value.otherTelephoneNumber),
  };
}
export function individual(
  value: ICasesCreateCasefileApplicantIndividual | ICasesCreateCasefileRespondentDetails,
  references: References,
): Party {
  return {
    organisation: false,
    individual_details: {
      title: text(value.title),
      forenames: text(value.firstNames),
      surname: required(value.lastName),
      date_of_birth: text(value.dateOfBirth),
      ...('nationalInsuranceNumber' in value
        ? {
            national_insurance_number: text(value.nationalInsuranceNumber),
            other_personal_information: text(value.otherPersonalInformation),
          }
        : {}),
      restrict_personal_information: value.restrictedInformation.restricted,
      restriction_reason: value.restrictedInformation.restricted
        ? required(value.restrictedInformation.reason)
        : undefined,
    },
    address: address(value.contactDetails.address, references),
    contact_details: contacts(value.contactDetails),
    aliases: value.aliases.length
      ? value.aliases.map((alias, index) => ({
          sequence_number: index + 1,
          forenames: required(alias.firstNames),
          surname: required(alias.lastName),
        }))
      : undefined,
  };
}
export function thirdParty(
  value: ICasesCreateCasefilePartyThirdParty | null,
  references: References,
): Request['casefile']['applicant']['third_party_details'] {
  return value
    ? {
        name: required(value.nameOrOrganisation),
        relationship: required(value.relationship),
        reference: text(value.reference),
        address: address(value.address, references),
      }
    : undefined;
}
