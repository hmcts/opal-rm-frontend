import { inject, Injectable } from '@angular/core';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantAddress } from '../../interfaces/cases-create-casefile-applicant-address.interface';
import type { ICasesCreateCasefileApplicantIndividual } from '../../interfaces/cases-create-casefile-applicant-individual.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileApplicantDetails } from '../../types/cases-create-casefile-applicant-details.type';
import type { ICasesCreateCasefileApplicantIndividualFormData } from '../interfaces/cases-create-casefile-applicant-individual-form-data.interface';

const optional = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

const requiredString = (value: string | null, description: string): string => {
  const trimmed = optional(value);
  if (trimmed === null) {
    throw new Error(`Required ${description} is missing`);
  }
  return trimmed;
};

const requiredId = (value: number | null, description: string): number => {
  if (value === null) {
    throw new Error(`Required ${description} is missing`);
  }
  return value;
};

const EMPTY_FORM_DATA: ICasesCreateCasefileApplicantIndividualFormData = {
  applicant_title: null,
  applicant_first_names: null,
  applicant_last_name: null,
  applicant_add_aliases: false,
  applicant_aliases: [],
  applicant_date_of_birth: null,
  applicant_main_email_address: null,
  applicant_other_email_address: null,
  applicant_main_telephone_number: null,
  applicant_other_telephone_number: null,
  applicant_address_line_1: null,
  applicant_address_line_2: null,
  applicant_address_line_3: null,
  applicant_address_line_4: null,
  applicant_address_line_5: null,
  applicant_postal_or_zip_code: null,
  applicant_country_id: null,
  applicant_send_correspondence_to_third_party: false,
  applicant_third_party_name_or_organisation: null,
  applicant_third_party_relationship: null,
  applicant_third_party_reference: null,
  applicant_third_party_address_line_1: null,
  applicant_third_party_address_line_2: null,
  applicant_third_party_address_line_3: null,
  applicant_third_party_address_line_4: null,
  applicant_third_party_address_line_5: null,
  applicant_third_party_postal_or_zip_code: null,
  applicant_third_party_country_id: null,
  applicant_bank_type: null,
  applicant_uk_bank_name_on_account: null,
  applicant_uk_bank_sort_code: null,
  applicant_uk_bank_account_number: null,
  applicant_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name_on_account: null,
  applicant_non_uk_bank_account_number: null,
  applicant_non_uk_bank_payment_reference: null,
  applicant_non_uk_bank_bic_swift_code: null,
  applicant_non_uk_bank_iban: null,
  applicant_non_uk_bank_name: null,
  applicant_non_uk_bank_branch_sort_code: null,
  applicant_restricted_information: false,
  applicant_restricted_information_reason: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileApplicantIndividualMapperService {
  private readonly dateService = inject(DateService);

  private buildAddress(
    addressLine1: string | null,
    addressLine2: string | null,
    addressLine3: string | null,
    addressLine4: string | null,
    addressLine5: string | null,
    postalOrZipCode: string | null,
    countryId: number | null,
    description: string,
  ): ICasesCreateCasefileApplicantAddress {
    return {
      addressLine1: requiredString(addressLine1, `${description} address line 1`),
      addressLine2: optional(addressLine2),
      addressLine3: optional(addressLine3),
      addressLine4: optional(addressLine4),
      addressLine5: optional(addressLine5),
      postalOrZipCode: optional(postalOrZipCode),
      countryId: requiredId(countryId, `${description} country`),
    };
  }

  private buildBankDetails(
    formData: ICasesCreateCasefileApplicantIndividualFormData,
  ): CasesCreateCasefileApplicantBankDetails {
    switch (formData.applicant_bank_type) {
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK:
        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
          nameOnAccount: requiredString(formData.applicant_uk_bank_name_on_account, 'UK bank name on account'),
          sortCode: requiredString(formData.applicant_uk_bank_sort_code, 'UK bank sort code').replaceAll('-', ''),
          accountNumber: requiredString(formData.applicant_uk_bank_account_number, 'UK bank account number'),
          paymentReference: requiredString(formData.applicant_uk_bank_payment_reference, 'UK bank payment reference'),
        };
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK: {
        const accountNumber = optional(formData.applicant_non_uk_bank_account_number);
        const bicSwiftCode = optional(formData.applicant_non_uk_bank_bic_swift_code);
        const iban = optional(formData.applicant_non_uk_bank_iban);

        if (bicSwiftCode === null && iban === null) {
          throw new Error('Required non-UK bank BIC/SWIFT code or IBAN is missing');
        }

        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
          nameOnAccount: requiredString(formData.applicant_non_uk_bank_name_on_account, 'non-UK bank name on account'),
          accountNumber,
          paymentReference: optional(formData.applicant_non_uk_bank_payment_reference),
          bicSwiftCode,
          iban,
          bankName: optional(formData.applicant_non_uk_bank_name),
          branchSortCode: optional(formData.applicant_non_uk_bank_branch_sort_code),
        };
      }
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE:
        return { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE };
      case null:
        throw new Error('Required applicant bank type is missing');
      default:
        throw new Error(`Unsupported applicant bank type: ${String(formData.applicant_bank_type)}`);
    }
  }

  public toFormData(
    saved: CasesCreateCasefileApplicantDetails | null,
  ): ICasesCreateCasefileApplicantIndividualFormData {
    if (saved === null || 'organisationName' in saved) {
      return { ...EMPTY_FORM_DATA, applicant_aliases: [] };
    }

    const ukBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK ? saved.bankDetails : null;
    const nonUkBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK ? saved.bankDetails : null;

    return {
      applicant_title: saved.title,
      applicant_first_names: saved.firstNames,
      applicant_last_name: saved.lastName,
      applicant_add_aliases: saved.aliases.length > 0,
      applicant_aliases: saved.aliases.map((alias) => ({ ...alias })),
      applicant_date_of_birth: saved.dateOfBirth
        ? this.dateService.getFromFormatToFormat(saved.dateOfBirth, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
      applicant_main_email_address: saved.contactDetails.mainEmailAddress,
      applicant_other_email_address: saved.contactDetails.otherEmailAddress,
      applicant_main_telephone_number: saved.contactDetails.mainTelephoneNumber,
      applicant_other_telephone_number: saved.contactDetails.otherTelephoneNumber,
      applicant_address_line_1: saved.contactDetails.address.addressLine1,
      applicant_address_line_2: saved.contactDetails.address.addressLine2,
      applicant_address_line_3: saved.contactDetails.address.addressLine3,
      applicant_address_line_4: saved.contactDetails.address.addressLine4,
      applicant_address_line_5: saved.contactDetails.address.addressLine5,
      applicant_postal_or_zip_code: saved.contactDetails.address.postalOrZipCode,
      applicant_country_id: saved.contactDetails.address.countryId,
      applicant_send_correspondence_to_third_party: saved.thirdParty !== null,
      applicant_third_party_name_or_organisation: saved.thirdParty?.nameOrOrganisation ?? null,
      applicant_third_party_relationship: saved.thirdParty?.relationship ?? null,
      applicant_third_party_reference: saved.thirdParty?.reference ?? null,
      applicant_third_party_address_line_1: saved.thirdParty?.address.addressLine1 ?? null,
      applicant_third_party_address_line_2: saved.thirdParty?.address.addressLine2 ?? null,
      applicant_third_party_address_line_3: saved.thirdParty?.address.addressLine3 ?? null,
      applicant_third_party_address_line_4: saved.thirdParty?.address.addressLine4 ?? null,
      applicant_third_party_address_line_5: saved.thirdParty?.address.addressLine5 ?? null,
      applicant_third_party_postal_or_zip_code: saved.thirdParty?.address.postalOrZipCode ?? null,
      applicant_third_party_country_id: saved.thirdParty?.address.countryId ?? null,
      applicant_bank_type: saved.bankDetails.type,
      applicant_uk_bank_name_on_account: ukBankDetails?.nameOnAccount ?? null,
      applicant_uk_bank_sort_code: ukBankDetails?.sortCode ?? null,
      applicant_uk_bank_account_number: ukBankDetails?.accountNumber ?? null,
      applicant_uk_bank_payment_reference: ukBankDetails?.paymentReference ?? null,
      applicant_non_uk_bank_name_on_account: nonUkBankDetails?.nameOnAccount ?? null,
      applicant_non_uk_bank_account_number: nonUkBankDetails?.accountNumber ?? null,
      applicant_non_uk_bank_payment_reference: nonUkBankDetails?.paymentReference ?? null,
      applicant_non_uk_bank_bic_swift_code: nonUkBankDetails?.bicSwiftCode ?? null,
      applicant_non_uk_bank_iban: nonUkBankDetails?.iban ?? null,
      applicant_non_uk_bank_name: nonUkBankDetails?.bankName ?? null,
      applicant_non_uk_bank_branch_sort_code: nonUkBankDetails?.branchSortCode ?? null,
      applicant_restricted_information: saved.restrictedInformation.restricted,
      applicant_restricted_information_reason: saved.restrictedInformation.restricted
        ? saved.restrictedInformation.reason
        : null,
    };
  }

  public toApplicantDetails(
    formData: ICasesCreateCasefileApplicantIndividualFormData,
  ): ICasesCreateCasefileApplicantIndividual {
    const dateOfBirth = optional(formData.applicant_date_of_birth);
    const thirdParty = formData.applicant_send_correspondence_to_third_party
      ? {
          nameOrOrganisation: requiredString(
            formData.applicant_third_party_name_or_organisation,
            'third-party name or organisation',
          ),
          relationship: requiredString(formData.applicant_third_party_relationship, 'third-party relationship'),
          reference: optional(formData.applicant_third_party_reference),
          address: this.buildAddress(
            formData.applicant_third_party_address_line_1,
            formData.applicant_third_party_address_line_2,
            formData.applicant_third_party_address_line_3,
            formData.applicant_third_party_address_line_4,
            formData.applicant_third_party_address_line_5,
            formData.applicant_third_party_postal_or_zip_code,
            formData.applicant_third_party_country_id,
            'third-party',
          ),
        }
      : null;

    return {
      title: optional(formData.applicant_title),
      firstNames: requiredString(formData.applicant_first_names, 'applicant first names'),
      lastName: requiredString(formData.applicant_last_name, 'applicant last name'),
      aliases: formData.applicant_add_aliases
        ? formData.applicant_aliases.map((alias, index) => ({
            firstNames: requiredString(alias.firstNames, `alias ${index + 1} first names`),
            lastName: requiredString(alias.lastName, `alias ${index + 1} last name`),
          }))
        : [],
      dateOfBirth: dateOfBirth ? this.dateService.getFromFormatToFormat(dateOfBirth, 'dd/MM/yyyy', 'yyyy-MM-dd') : null,
      contactDetails: {
        mainEmailAddress: optional(formData.applicant_main_email_address),
        otherEmailAddress: optional(formData.applicant_other_email_address),
        mainTelephoneNumber: optional(formData.applicant_main_telephone_number),
        otherTelephoneNumber: optional(formData.applicant_other_telephone_number),
        address: this.buildAddress(
          formData.applicant_address_line_1,
          formData.applicant_address_line_2,
          formData.applicant_address_line_3,
          formData.applicant_address_line_4,
          formData.applicant_address_line_5,
          formData.applicant_postal_or_zip_code,
          formData.applicant_country_id,
          'applicant',
        ),
      },
      thirdParty,
      bankDetails: this.buildBankDetails(formData),
      restrictedInformation: {
        restricted: formData.applicant_restricted_information,
        reason: formData.applicant_restricted_information
          ? requiredString(formData.applicant_restricted_information_reason, 'restricted information reason')
          : null,
      },
    };
  }
}
