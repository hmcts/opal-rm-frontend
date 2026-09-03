import { inject, Injectable } from '@angular/core';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantIndividual } from '../../interfaces/cases-create-casefile-applicant-individual.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileApplicantDetails } from '../../types/cases-create-casefile-applicant-details.type';
import { mapCasesCreateCasefileAddress } from '../../utils/cases-create-casefile-address-mapper';
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

const EMPTY_FORM_DATA: ICasesCreateCasefileApplicantIndividualFormData = {
  create_casefile_applicant_individual_title: null,
  create_casefile_applicant_individual_first_names: null,
  create_casefile_applicant_individual_last_name: null,
  create_casefile_applicant_individual_add_aliases: false,
  create_casefile_applicant_individual_aliases: [],
  create_casefile_applicant_individual_date_of_birth: null,
  create_casefile_applicant_individual_main_email_address: null,
  create_casefile_applicant_individual_other_email_address: null,
  create_casefile_applicant_individual_main_telephone_number: null,
  create_casefile_applicant_individual_other_telephone_number: null,
  create_casefile_applicant_individual_address_line_1: null,
  create_casefile_applicant_individual_address_line_2: null,
  create_casefile_applicant_individual_address_line_3: null,
  create_casefile_applicant_individual_address_line_4: null,
  create_casefile_applicant_individual_address_line_5: null,
  create_casefile_applicant_individual_postal_or_zip_code: null,
  create_casefile_applicant_individual_country_id: null,
  create_casefile_applicant_individual_send_correspondence_to_third_party: false,
  create_casefile_applicant_individual_third_party_name_or_organisation: null,
  create_casefile_applicant_individual_third_party_relationship: null,
  create_casefile_applicant_individual_third_party_reference: null,
  create_casefile_applicant_individual_third_party_address_line_1: null,
  create_casefile_applicant_individual_third_party_address_line_2: null,
  create_casefile_applicant_individual_third_party_address_line_3: null,
  create_casefile_applicant_individual_third_party_address_line_4: null,
  create_casefile_applicant_individual_third_party_address_line_5: null,
  create_casefile_applicant_individual_third_party_postal_or_zip_code: null,
  create_casefile_applicant_individual_third_party_country_id: null,
  create_casefile_applicant_individual_bank_type: null,
  create_casefile_applicant_individual_uk_bank_name_on_account: null,
  create_casefile_applicant_individual_uk_bank_sort_code: null,
  create_casefile_applicant_individual_uk_bank_account_number: null,
  create_casefile_applicant_individual_uk_bank_payment_reference: null,
  create_casefile_applicant_individual_non_uk_bank_name_on_account: null,
  create_casefile_applicant_individual_non_uk_bank_account_number: null,
  create_casefile_applicant_individual_non_uk_bank_payment_reference: null,
  create_casefile_applicant_individual_non_uk_bank_bic_swift_code: null,
  create_casefile_applicant_individual_non_uk_bank_iban: null,
  create_casefile_applicant_individual_non_uk_bank_name: null,
  create_casefile_applicant_individual_non_uk_bank_branch_sort_code: null,
  create_casefile_applicant_individual_restricted_information: false,
  create_casefile_applicant_individual_restricted_information_reason: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileApplicantIndividualMapperService {
  private readonly dateService = inject(DateService);

  private buildBankDetails(
    formData: ICasesCreateCasefileApplicantIndividualFormData,
  ): CasesCreateCasefileApplicantBankDetails {
    switch (formData.create_casefile_applicant_individual_bank_type) {
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK:
        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
          nameOnAccount: requiredString(
            formData.create_casefile_applicant_individual_uk_bank_name_on_account,
            'UK bank name on account',
          ),
          sortCode: requiredString(
            formData.create_casefile_applicant_individual_uk_bank_sort_code,
            'UK bank sort code',
          ).replaceAll('-', ''),
          accountNumber: requiredString(
            formData.create_casefile_applicant_individual_uk_bank_account_number,
            'UK bank account number',
          ),
          paymentReference: requiredString(
            formData.create_casefile_applicant_individual_uk_bank_payment_reference,
            'UK bank payment reference',
          ),
        };
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK: {
        const accountNumber = optional(formData.create_casefile_applicant_individual_non_uk_bank_account_number);
        const bicSwiftCode = optional(formData.create_casefile_applicant_individual_non_uk_bank_bic_swift_code);
        const iban = optional(formData.create_casefile_applicant_individual_non_uk_bank_iban);

        if (bicSwiftCode === null && iban === null) {
          throw new Error('Required non-UK bank BIC/SWIFT code or IBAN is missing');
        }

        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
          nameOnAccount: requiredString(
            formData.create_casefile_applicant_individual_non_uk_bank_name_on_account,
            'non-UK bank name on account',
          ),
          accountNumber,
          paymentReference: optional(formData.create_casefile_applicant_individual_non_uk_bank_payment_reference),
          bicSwiftCode,
          iban,
          bankName: optional(formData.create_casefile_applicant_individual_non_uk_bank_name),
          branchSortCode: optional(formData.create_casefile_applicant_individual_non_uk_bank_branch_sort_code),
        };
      }
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE:
        return { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE };
      case null:
        throw new Error('Required applicant bank type is missing');
      default:
        throw new Error(
          `Unsupported applicant bank type: ${String(formData.create_casefile_applicant_individual_bank_type)}`,
        );
    }
  }

  public toFormData(
    saved: CasesCreateCasefileApplicantDetails | null,
  ): ICasesCreateCasefileApplicantIndividualFormData {
    if (saved === null || 'organisationName' in saved) {
      return { ...EMPTY_FORM_DATA, create_casefile_applicant_individual_aliases: [] };
    }

    const ukBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK ? saved.bankDetails : null;
    const nonUkBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK ? saved.bankDetails : null;

    return {
      create_casefile_applicant_individual_title: saved.title,
      create_casefile_applicant_individual_first_names: saved.firstNames,
      create_casefile_applicant_individual_last_name: saved.lastName,
      create_casefile_applicant_individual_add_aliases: saved.aliases.length > 0,
      create_casefile_applicant_individual_aliases: saved.aliases.map((alias) => ({ ...alias })),
      create_casefile_applicant_individual_date_of_birth: saved.dateOfBirth
        ? this.dateService.getFromFormatToFormat(saved.dateOfBirth, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
      create_casefile_applicant_individual_main_email_address: saved.contactDetails.mainEmailAddress,
      create_casefile_applicant_individual_other_email_address: saved.contactDetails.otherEmailAddress,
      create_casefile_applicant_individual_main_telephone_number: saved.contactDetails.mainTelephoneNumber,
      create_casefile_applicant_individual_other_telephone_number: saved.contactDetails.otherTelephoneNumber,
      create_casefile_applicant_individual_address_line_1: saved.contactDetails.address.addressLine1,
      create_casefile_applicant_individual_address_line_2: saved.contactDetails.address.addressLine2,
      create_casefile_applicant_individual_address_line_3: saved.contactDetails.address.addressLine3,
      create_casefile_applicant_individual_address_line_4: saved.contactDetails.address.addressLine4,
      create_casefile_applicant_individual_address_line_5: saved.contactDetails.address.addressLine5,
      create_casefile_applicant_individual_postal_or_zip_code: saved.contactDetails.address.postalOrZipCode,
      create_casefile_applicant_individual_country_id: saved.contactDetails.address.countryId,
      create_casefile_applicant_individual_send_correspondence_to_third_party: saved.thirdParty !== null,
      create_casefile_applicant_individual_third_party_name_or_organisation:
        saved.thirdParty?.nameOrOrganisation ?? null,
      create_casefile_applicant_individual_third_party_relationship: saved.thirdParty?.relationship ?? null,
      create_casefile_applicant_individual_third_party_reference: saved.thirdParty?.reference ?? null,
      create_casefile_applicant_individual_third_party_address_line_1: saved.thirdParty?.address.addressLine1 ?? null,
      create_casefile_applicant_individual_third_party_address_line_2: saved.thirdParty?.address.addressLine2 ?? null,
      create_casefile_applicant_individual_third_party_address_line_3: saved.thirdParty?.address.addressLine3 ?? null,
      create_casefile_applicant_individual_third_party_address_line_4: saved.thirdParty?.address.addressLine4 ?? null,
      create_casefile_applicant_individual_third_party_address_line_5: saved.thirdParty?.address.addressLine5 ?? null,
      create_casefile_applicant_individual_third_party_postal_or_zip_code:
        saved.thirdParty?.address.postalOrZipCode ?? null,
      create_casefile_applicant_individual_third_party_country_id: saved.thirdParty?.address.countryId ?? null,
      create_casefile_applicant_individual_bank_type: saved.bankDetails.type,
      create_casefile_applicant_individual_uk_bank_name_on_account: ukBankDetails?.nameOnAccount ?? null,
      create_casefile_applicant_individual_uk_bank_sort_code: ukBankDetails?.sortCode ?? null,
      create_casefile_applicant_individual_uk_bank_account_number: ukBankDetails?.accountNumber ?? null,
      create_casefile_applicant_individual_uk_bank_payment_reference: ukBankDetails?.paymentReference ?? null,
      create_casefile_applicant_individual_non_uk_bank_name_on_account: nonUkBankDetails?.nameOnAccount ?? null,
      create_casefile_applicant_individual_non_uk_bank_account_number: nonUkBankDetails?.accountNumber ?? null,
      create_casefile_applicant_individual_non_uk_bank_payment_reference: nonUkBankDetails?.paymentReference ?? null,
      create_casefile_applicant_individual_non_uk_bank_bic_swift_code: nonUkBankDetails?.bicSwiftCode ?? null,
      create_casefile_applicant_individual_non_uk_bank_iban: nonUkBankDetails?.iban ?? null,
      create_casefile_applicant_individual_non_uk_bank_name: nonUkBankDetails?.bankName ?? null,
      create_casefile_applicant_individual_non_uk_bank_branch_sort_code: nonUkBankDetails?.branchSortCode ?? null,
      create_casefile_applicant_individual_restricted_information: saved.restrictedInformation.restricted,
      create_casefile_applicant_individual_restricted_information_reason: saved.restrictedInformation.restricted
        ? saved.restrictedInformation.reason
        : null,
    };
  }

  public toApplicantDetails(
    formData: ICasesCreateCasefileApplicantIndividualFormData,
  ): ICasesCreateCasefileApplicantIndividual {
    const dateOfBirth = optional(formData.create_casefile_applicant_individual_date_of_birth);
    const thirdParty = formData.create_casefile_applicant_individual_send_correspondence_to_third_party
      ? {
          nameOrOrganisation: requiredString(
            formData.create_casefile_applicant_individual_third_party_name_or_organisation,
            'third-party name or organisation',
          ),
          relationship: requiredString(
            formData.create_casefile_applicant_individual_third_party_relationship,
            'third-party relationship',
          ),
          reference: optional(formData.create_casefile_applicant_individual_third_party_reference),
          address: mapCasesCreateCasefileAddress(
            {
              addressLine1: formData.create_casefile_applicant_individual_third_party_address_line_1,
              addressLine2: formData.create_casefile_applicant_individual_third_party_address_line_2,
              addressLine3: formData.create_casefile_applicant_individual_third_party_address_line_3,
              addressLine4: formData.create_casefile_applicant_individual_third_party_address_line_4,
              addressLine5: formData.create_casefile_applicant_individual_third_party_address_line_5,
              postalOrZipCode: formData.create_casefile_applicant_individual_third_party_postal_or_zip_code,
              countryId: formData.create_casefile_applicant_individual_third_party_country_id,
            },
            'third-party',
          ),
        }
      : null;

    return {
      title: optional(formData.create_casefile_applicant_individual_title),
      firstNames: requiredString(formData.create_casefile_applicant_individual_first_names, 'applicant first names'),
      lastName: requiredString(formData.create_casefile_applicant_individual_last_name, 'applicant last name'),
      aliases: formData.create_casefile_applicant_individual_add_aliases
        ? formData.create_casefile_applicant_individual_aliases.map((alias, index) => ({
            firstNames: requiredString(alias.firstNames, `alias ${index + 1} first names`),
            lastName: requiredString(alias.lastName, `alias ${index + 1} last name`),
          }))
        : [],
      dateOfBirth: dateOfBirth ? this.dateService.getFromFormatToFormat(dateOfBirth, 'dd/MM/yyyy', 'yyyy-MM-dd') : null,
      contactDetails: {
        mainEmailAddress: optional(formData.create_casefile_applicant_individual_main_email_address),
        otherEmailAddress: optional(formData.create_casefile_applicant_individual_other_email_address),
        mainTelephoneNumber: optional(formData.create_casefile_applicant_individual_main_telephone_number),
        otherTelephoneNumber: optional(formData.create_casefile_applicant_individual_other_telephone_number),
        address: mapCasesCreateCasefileAddress(
          {
            addressLine1: formData.create_casefile_applicant_individual_address_line_1,
            addressLine2: formData.create_casefile_applicant_individual_address_line_2,
            addressLine3: formData.create_casefile_applicant_individual_address_line_3,
            addressLine4: formData.create_casefile_applicant_individual_address_line_4,
            addressLine5: formData.create_casefile_applicant_individual_address_line_5,
            postalOrZipCode: formData.create_casefile_applicant_individual_postal_or_zip_code,
            countryId: formData.create_casefile_applicant_individual_country_id,
          },
          'applicant',
        ),
      },
      thirdParty,
      bankDetails: this.buildBankDetails(formData),
      restrictedInformation: {
        restricted: formData.create_casefile_applicant_individual_restricted_information,
        reason: formData.create_casefile_applicant_individual_restricted_information
          ? requiredString(
              formData.create_casefile_applicant_individual_restricted_information_reason,
              'restricted information reason',
            )
          : null,
      },
    };
  }
}
