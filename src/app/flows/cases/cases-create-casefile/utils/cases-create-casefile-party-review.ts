import { CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS } from '../constants/cases-create-casefile-applicant-bank-options.constant';
import type { ICasesCreateCasefileMinorCreditor } from '../interfaces/cases-create-casefile-minor-creditor.interface';
import { DateTime } from 'luxon';
import type { IOpalMaintenanceCountryReferenceDataItem } from '../../services/opal-maintenance-service/interfaces/opal-maintenance-country-reference-data-item.interface';
import type { ICasesCreateCasefilePartyAddress } from '../interfaces/cases-create-casefile-party-address.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '../interfaces/cases-create-casefile-applicant-individual.interface';
import type { ICasesCreateCasefileRespondentDetails } from '../interfaces/cases-create-casefile-respondent-details.interface';
import type { ICasesCreateCasefilePartyContactDetails } from '../interfaces/cases-create-casefile-party-contact-details.interface';
import type { ICasesCreateCasefilePartyThirdParty } from '../interfaces/cases-create-casefile-party-third-party.interface';
import type { ReviewRow } from '../interfaces/cases-create-casefile-review-row.interface';
import type { ReviewSection } from '../interfaces/cases-create-casefile-review-section.interface';
import type { CasesCreateCasefileApplicantDetails } from '../types/cases-create-casefile-applicant-details.type';
import type { CasesCreateCasefileApplicantBankDetails } from '../types/cases-create-casefile-applicant-bank-details.type';

const row = (id: string, label: string, value: string | null): ReviewRow => ({
  id,
  label,
  values: [value ?? 'Not provided'],
});

export function reviewAddressLines(address: ICasesCreateCasefilePartyAddress, countryName: string): string[] {
  return [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.addressLine4,
    address.addressLine5,
    address.postalOrZipCode,
    countryName,
  ].filter((line): line is string => !!line?.trim());
}

function addressRow(
  id: string,
  label: string,
  address: ICasesCreateCasefilePartyAddress,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewRow {
  return {
    id,
    label,
    values: reviewAddressLines(
      address,
      countries.find((country) => country.country_id === address.countryId)?.country_name ?? '',
    ),
  };
}

function contactRows(
  contact: ICasesCreateCasefilePartyContactDetails,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewRow[] {
  return [
    row('mainEmailAddress', 'Main email address', contact.mainEmailAddress),
    row('otherEmailAddress', 'Other email address', contact.otherEmailAddress),
    row('mainTelephoneNumber', 'Main telephone number', contact.mainTelephoneNumber),
    row('otherTelephoneNumber', 'Other telephone number', contact.otherTelephoneNumber),
    addressRow('address', 'Address', contact.address, countries),
  ];
}

function thirdPartyRows(
  party: ICasesCreateCasefilePartyThirdParty | null,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewRow[] {
  if (!party) return [];
  return [
    row('thirdPartyName', 'Third party name', party.nameOrOrganisation),
    row('thirdPartyRelationship', 'Third party relationship', party.relationship),
    row('thirdPartyReference', 'Third party reference', party.reference),
    addressRow('thirdPartyAddress', 'Third party address', party.address, countries),
  ];
}

function personRows(
  person: ICasesCreateCasefileApplicantIndividual | ICasesCreateCasefileRespondentDetails,
): ReviewRow[] {
  return [
    row('title', 'Title', person.title),
    row('firstNames', 'First names', person.firstNames),
    row('lastName', 'Last name', person.lastName),
    {
      id: 'aliases',
      label: 'Aliases',
      values: person.aliases.length
        ? person.aliases.map((alias) => `${alias.firstNames} ${alias.lastName}`)
        : ['Not provided'],
    },
    row(
      'dateOfBirth',
      'Date of birth',
      person.dateOfBirth ? DateTime.fromISO(person.dateOfBirth).setLocale('en-GB').toFormat('d LLLL yyyy') : null,
    ),
  ];
}

function restrictionRows(
  person: ICasesCreateCasefileApplicantIndividual | ICasesCreateCasefileRespondentDetails,
): ReviewRow[] {
  const restriction = person.restrictedInformation;
  return [
    row('restricted', 'Restrict personal information', restriction.restricted ? 'Yes' : 'No'),
    ...(restriction.restricted ? [row('restrictionReason', 'Reason for restriction', restriction.reason)] : []),
  ];
}

function bankRows(bank: CasesCreateCasefileApplicantBankDetails): ReviewRow[] {
  const type = row(
    'bankType',
    'Type of bank account',
    CASES_CREATE_CASEFILE_APPLICANT_BANK_OPTIONS.find((option) => option.value === bank.type)?.key ?? '',
  );
  if (bank.type === 'none') return [type];
  const name = row('nameOnAccount', 'Name on account', bank.nameOnAccount);
  if (bank.type === 'uk')
    return [
      type,
      name,
      row('sortCode', 'Sort code', bank.sortCode),
      row('accountNumber', 'Account number', bank.accountNumber),
      row('paymentReference', 'Payment reference', bank.paymentReference),
    ];
  return [
    type,
    name,
    row('bicSwiftCode', 'BIC or SWIFT code', bank.bicSwiftCode),
    row('iban', 'IBAN', bank.iban),
    row('paymentReference', 'Payment reference', bank.paymentReference),
    row('bankName', 'Bank name', bank.bankName),
    row('branchSortCode', 'Branch code or sort code', bank.branchSortCode),
    row('accountNumber', 'Account number', bank.accountNumber),
  ];
}

export function reviewRespondent(
  person: ICasesCreateCasefileRespondentDetails,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewSection {
  const employer = person.employer;
  return {
    id: 'respondent',
    title: 'Respondent details',
    warning: person.restrictedInformation.restricted ? 'Respondent’s personal information should not be shared.' : null,
    rows: [
      ...personRows(person),
      row('nationalInsuranceNumber', 'UK National Insurance number', person.nationalInsuranceNumber),
      row('otherPersonalInformation', 'Other personal information', person.otherPersonalInformation),
      ...contactRows(person.contactDetails, countries),
      ...thirdPartyRows(person.thirdParty, countries),
      ...(employer
        ? [
            row('employerName', 'Employer name', employer.employerName),
            row('employeeReference', 'Employee reference', employer.employeeReference),
            row('employerEmail', 'Employer email', employer.emailAddress),
            row('employerTelephone', 'Employer telephone', employer.telephoneNumber),
            addressRow('employerAddress', 'Employer address', employer.address, countries),
          ]
        : []),
      ...restrictionRows(person),
    ],
    bankRows: [],
  };
}

export function reviewApplicant(
  applicant: CasesCreateCasefileApplicantDetails,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewSection {
  const individual = 'firstNames' in applicant;
  return {
    id: 'applicant',
    title: 'Applicant details',
    warning:
      individual && applicant.restrictedInformation.restricted
        ? 'Applicant’s personal information should not be shared.'
        : null,
    rows: [
      ...(individual
        ? personRows(applicant)
        : [
            row('organisationName', 'Organisation name', applicant.organisationName),
            row('foreignAuthorityReference', 'Foreign authority reference', applicant.foreignAuthorityReference),
          ]),
      ...contactRows(applicant.contactDetails, countries),
      ...(individual ? [...thirdPartyRows(applicant.thirdParty, countries), ...restrictionRows(applicant)] : []),
    ],
    bankRows: bankRows(applicant.bankDetails),
  };
}

export function reviewMinorCreditor(
  creditor: ICasesCreateCasefileMinorCreditor,
  countries: readonly IOpalMaintenanceCountryReferenceDataItem[],
): ReviewSection {
  const identity = creditor.details.identity;
  return {
    id: `minor-creditor-${creditor.sequenceNumber}`,
    title: 'Creditor details',
    warning: null,
    rows: [
      ...(identity.type === 'individual'
        ? [
            row('title', 'Title', identity.title),
            row('firstNames', 'First names', identity.firstNames),
            row('lastName', 'Last name', identity.lastName),
          ]
        : [row('organisationName', 'Organisation name', identity.organisationName)]),
      addressRow('address', 'Address', creditor.details.address, countries),
    ],
    bankRows: bankRows(creditor.details.bank),
  };
}
