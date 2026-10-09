import type { IOpalMaintenanceDraftCasefileRequest } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-draft-casefile-request.interface';
import type { IOpalMaintenanceCountryReferenceDataItem } from '../../../../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { ICasesCreateCasefilePartyAddress } from '../../../../interfaces/cases-create-casefile-party-address.interface';
import type { ICasesCreateCasefilePartyContactDetails } from '../../../../interfaces/cases-create-casefile-party-contact-details.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '../../../../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefilePartyThirdParty } from '../../../../interfaces/cases-create-casefile-party-third-party.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../../../../interfaces/cases-create-casefile-respondent-details.interface';
import type { CasesCreateCasefileApplicantDetails } from '../../../../types/cases-create-casefile-applicant-details.type';

import { mapSavedBank } from './cases-create-casefile-payload-map-bank';

type SavedApplicant = IOpalMaintenanceDraftCasefileRequest['casefile']['applicant'];
type SavedParty = SavedApplicant['party_details'];
type Countries = readonly IOpalMaintenanceCountryReferenceDataItem[];
type Individual = Pick<
  ICasesCreateCasefileApplicantIndividual,
  'title' | 'firstNames' | 'lastName' | 'aliases' | 'dateOfBirth' | 'contactDetails' | 'restrictedInformation'
>;

function requireText(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Unusable saved party');
}

function checkOptionalText(values: readonly unknown[]): void {
  if (values.some((value) => value !== undefined && typeof value !== 'string')) {
    throw new Error('Unusable saved party');
  }
}

/** Resolve even inactive saved countries, rejecting missing or ambiguous references. */
export function mapSavedAddress(value: SavedParty['address'], countries: Countries): ICasesCreateCasefilePartyAddress {
  requireText(value?.address_line_1);
  checkOptionalText([
    value.address_line_2,
    value.address_line_3,
    value.address_line_4,
    value.address_line_5,
    value.postcode,
  ]);
  if (!Number.isSafeInteger(value.cjs_code)) throw new Error('Unusable saved country');
  const matches = countries.filter((country) => country.cjs_code === value.cjs_code);
  if (matches.length !== 1 || !Number.isSafeInteger(matches[0].country_id) || matches[0].country_id < 1) {
    throw new Error('Unusable saved country');
  }
  return {
    addressLine1: value.address_line_1,
    addressLine2: value.address_line_2 ?? null,
    addressLine3: value.address_line_3 ?? null,
    addressLine4: value.address_line_4 ?? null,
    addressLine5: value.address_line_5 ?? null,
    postalOrZipCode: value.postcode ?? null,
    countryId: matches[0].country_id,
  };
}

export function mapSavedContacts(party: SavedParty, countries: Countries): ICasesCreateCasefilePartyContactDetails {
  const contacts = party?.contact_details;
  if (contacts !== undefined && (!contacts || typeof contacts !== 'object' || Array.isArray(contacts))) {
    throw new Error('Unusable saved party');
  }
  checkOptionalText([
    contacts?.primary_email_address,
    contacts?.secondary_email_address,
    contacts?.main_telephone_number,
    contacts?.other_telephone_number,
  ]);
  return {
    mainEmailAddress: contacts?.primary_email_address ?? null,
    otherEmailAddress: contacts?.secondary_email_address ?? null,
    mainTelephoneNumber: contacts?.main_telephone_number ?? null,
    otherTelephoneNumber: contacts?.other_telephone_number ?? null,
    address: mapSavedAddress(party?.address, countries),
  };
}

function mapAliases(aliases: SavedParty['aliases']): Individual['aliases'] {
  if (aliases === undefined) return [];
  if (!Array.isArray(aliases)) throw new Error('Unusable saved party');
  const sequences = new Set<number>();
  for (const alias of aliases) {
    if (
      !alias ||
      !Number.isSafeInteger(alias.sequence_number) ||
      alias.sequence_number < 1 ||
      sequences.has(alias.sequence_number)
    ) {
      throw new Error('Unusable saved party');
    }
    sequences.add(alias.sequence_number);
    if (typeof alias.forenames !== 'string') throw new Error('Unusable saved party');
    requireText(alias.surname);
  }
  return [...aliases]
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map((alias) => ({ firstNames: alias.forenames, lastName: alias.surname }));
}

export function mapSavedIndividual(party: SavedParty, countries: Countries): Individual {
  const details = party?.individual_details;
  if (party?.organisation !== false || party.organisation_details !== undefined || !details)
    throw new Error('Unusable saved party');
  requireText(details.surname);
  checkOptionalText([
    details.title,
    details.forenames,
    details.date_of_birth,
    details.national_insurance_number,
    details.other_personal_information,
    details.restriction_reason,
  ]);
  if (
    details.restrict_personal_information !== undefined &&
    typeof details.restrict_personal_information !== 'boolean'
  ) {
    throw new Error('Unusable saved party');
  }
  const restricted = details.restrict_personal_information ?? false;
  let reason: string | null = null;
  if (restricted) {
    const savedReason = details.restriction_reason;
    requireText(savedReason);
    reason = savedReason;
  }
  return {
    title: details.title ?? null,
    firstNames: details.forenames ?? '',
    lastName: details.surname,
    aliases: mapAliases(party.aliases),
    dateOfBirth: details.date_of_birth ?? null,
    contactDetails: mapSavedContacts(party, countries),
    restrictedInformation: { restricted, reason },
  };
}

export function mapSavedThirdParty(
  value: SavedApplicant['third_party_details'],
  countries: Countries,
): ICasesCreateCasefilePartyThirdParty | null {
  if (value === undefined) return null;
  requireText(value?.name);
  requireText(value.relationship);
  checkOptionalText([value.reference]);
  return {
    nameOrOrganisation: value.name,
    relationship: value.relationship,
    reference: value.reference ?? null,
    address: mapSavedAddress(value.address, countries),
  };
}

type SavedRespondent = IOpalMaintenanceDraftCasefileRequest['casefile']['respondent_account']['respondent'];
function mapEmployer(
  value: SavedRespondent['debtor_details'],
  countries: Countries,
): ICasesCreateCasefileRespondentDetails['employer'] {
  if (value === undefined) return null;
  requireText(value?.employer_name);
  checkOptionalText([value.employee_reference, value.employer_email_address, value.employer_telephone_number]);
  return {
    employerName: value.employer_name,
    employeeReference: value.employee_reference ?? null,
    emailAddress: value.employer_email_address ?? null,
    telephoneNumber: value.employer_telephone_number ?? null,
    address: mapSavedAddress(value.employer_address, countries),
  };
}

export function mapSavedRespondent(
  value: SavedRespondent,
  countries: Countries,
): ICasesCreateCasefileRespondentDetails {
  const individual = mapSavedIndividual(value?.party_details, countries);
  const details = value.party_details.individual_details;
  return {
    ...individual,
    nationalInsuranceNumber: details?.national_insurance_number ?? null,
    otherPersonalInformation: details?.other_personal_information ?? null,
    thirdParty: mapSavedThirdParty(value.third_party_details, countries),
    employer: mapEmployer(value.debtor_details, countries),
  };
}

export function mapSavedApplicant(
  value: SavedApplicant,
  countries: Countries,
): CasesCreateCasefileApplicantDetails & { bankDetails: ReturnType<typeof mapSavedBank> } {
  const party = value?.party_details;
  if (party?.organisation !== true) {
    return {
      ...mapSavedIndividual(party, countries),
      thirdParty: mapSavedThirdParty(value.third_party_details, countries),
      bankDetails: mapSavedBank(value.bank_account_details),
    };
  }
  if (party.individual_details !== undefined || party.aliases !== undefined || value.third_party_details !== undefined)
    throw new Error('Unusable saved party');
  const details = party.organisation_details;
  requireText(details?.organisation_name);
  checkOptionalText([details.foreign_authority_reference]);
  return {
    organisationName: details.organisation_name,
    foreignAuthorityReference: details.foreign_authority_reference ?? '',
    contactDetails: mapSavedContacts(party, countries),
    bankDetails: mapSavedBank(value.bank_account_details),
  };
}
