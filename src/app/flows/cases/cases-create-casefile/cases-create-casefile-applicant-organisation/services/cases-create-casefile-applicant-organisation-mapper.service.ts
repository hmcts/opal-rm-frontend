import { Injectable } from '@angular/core';
import { CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES } from '../../constants/cases-create-casefile-applicant-bank-types.constant';
import type { ICasesCreateCasefileApplicantOrganisation } from '../../interfaces/cases-create-casefile-applicant-organisation.interface';
import type { CasesCreateCasefileApplicantBankDetails } from '../../types/cases-create-casefile-applicant-bank-details.type';
import type { CasesCreateCasefileApplicantDetails } from '../../types/cases-create-casefile-applicant-details.type';
import { mapCasesCreateCasefileAddress } from '../../utils/cases-create-casefile-address-mapper';
import type { ICasesCreateCasefileApplicantOrganisationFormData } from '../interfaces/cases-create-casefile-applicant-organisation-form-data.interface';

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

const isOrganisationApplicant = (
  applicant: CasesCreateCasefileApplicantDetails,
): applicant is ICasesCreateCasefileApplicantOrganisation => 'organisationName' in applicant;

const EMPTY_FORM_DATA: ICasesCreateCasefileApplicantOrganisationFormData = {
  create_casefile_applicant_organisation_name: null,
  create_casefile_applicant_organisation_foreign_authority_reference: null,
  create_casefile_applicant_organisation_main_email_address: null,
  create_casefile_applicant_organisation_other_email_address: null,
  create_casefile_applicant_organisation_main_telephone_number: null,
  create_casefile_applicant_organisation_other_telephone_number: null,
  create_casefile_applicant_organisation_address_line_1: null,
  create_casefile_applicant_organisation_address_line_2: null,
  create_casefile_applicant_organisation_address_line_3: null,
  create_casefile_applicant_organisation_address_line_4: null,
  create_casefile_applicant_organisation_address_line_5: null,
  create_casefile_applicant_organisation_postal_or_zip_code: null,
  create_casefile_applicant_organisation_country_id: null,
  create_casefile_applicant_organisation_bank_type: null,
  create_casefile_applicant_organisation_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_uk_bank_sort_code: null,
  create_casefile_applicant_organisation_uk_bank_account_number: null,
  create_casefile_applicant_organisation_uk_bank_payment_reference: null,
  create_casefile_applicant_organisation_non_uk_bank_name_on_account: null,
  create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: null,
  create_casefile_applicant_organisation_non_uk_bank_iban: null,
  create_casefile_applicant_organisation_non_uk_bank_payment_reference: null,
  create_casefile_applicant_organisation_non_uk_bank_name: null,
  create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: null,
  create_casefile_applicant_organisation_non_uk_bank_account_number: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileApplicantOrganisationMapperService {
  private buildBankDetails(
    formData: ICasesCreateCasefileApplicantOrganisationFormData,
  ): CasesCreateCasefileApplicantBankDetails {
    switch (formData.create_casefile_applicant_organisation_bank_type) {
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK:
        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK,
          nameOnAccount: requiredString(
            formData.create_casefile_applicant_organisation_uk_bank_name_on_account,
            'UK bank name on account',
          ),
          sortCode: requiredString(
            formData.create_casefile_applicant_organisation_uk_bank_sort_code,
            'UK bank sort code',
          ).replaceAll('-', ''),
          accountNumber: requiredString(
            formData.create_casefile_applicant_organisation_uk_bank_account_number,
            'UK bank account number',
          ),
          paymentReference: requiredString(
            formData.create_casefile_applicant_organisation_uk_bank_payment_reference,
            'UK bank payment reference',
          ),
        };
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK: {
        const bicSwiftCode = optional(formData.create_casefile_applicant_organisation_non_uk_bank_bic_swift_code);
        const iban = optional(formData.create_casefile_applicant_organisation_non_uk_bank_iban);
        if (bicSwiftCode === null && iban === null) {
          throw new Error('Required non-UK bank BIC/SWIFT code or IBAN is missing');
        }
        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
          nameOnAccount: requiredString(
            formData.create_casefile_applicant_organisation_non_uk_bank_name_on_account,
            'non-UK bank name on account',
          ),
          accountNumber: optional(formData.create_casefile_applicant_organisation_non_uk_bank_account_number),
          paymentReference: optional(formData.create_casefile_applicant_organisation_non_uk_bank_payment_reference),
          bicSwiftCode,
          iban,
          bankName: optional(formData.create_casefile_applicant_organisation_non_uk_bank_name),
          branchSortCode: optional(formData.create_casefile_applicant_organisation_non_uk_bank_branch_sort_code),
        };
      }
      case CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE:
        return { type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NONE };
      case null:
        throw new Error('Required applicant bank type is missing');
      default:
        throw new Error(
          `Unsupported applicant bank type: ${String(formData.create_casefile_applicant_organisation_bank_type)}`,
        );
    }
  }

  public toFormData(
    saved: CasesCreateCasefileApplicantDetails | null,
  ): ICasesCreateCasefileApplicantOrganisationFormData {
    if (saved === null || !isOrganisationApplicant(saved)) {
      return { ...EMPTY_FORM_DATA };
    }

    const ukBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK ? saved.bankDetails : null;
    const nonUkBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK ? saved.bankDetails : null;

    return {
      create_casefile_applicant_organisation_name: saved.organisationName,
      create_casefile_applicant_organisation_foreign_authority_reference: saved.foreignAuthorityReference,
      create_casefile_applicant_organisation_main_email_address: saved.contactDetails.mainEmailAddress,
      create_casefile_applicant_organisation_other_email_address: saved.contactDetails.otherEmailAddress,
      create_casefile_applicant_organisation_main_telephone_number: saved.contactDetails.mainTelephoneNumber,
      create_casefile_applicant_organisation_other_telephone_number: saved.contactDetails.otherTelephoneNumber,
      create_casefile_applicant_organisation_address_line_1: saved.contactDetails.address.addressLine1,
      create_casefile_applicant_organisation_address_line_2: saved.contactDetails.address.addressLine2,
      create_casefile_applicant_organisation_address_line_3: saved.contactDetails.address.addressLine3,
      create_casefile_applicant_organisation_address_line_4: saved.contactDetails.address.addressLine4,
      create_casefile_applicant_organisation_address_line_5: saved.contactDetails.address.addressLine5,
      create_casefile_applicant_organisation_postal_or_zip_code: saved.contactDetails.address.postalOrZipCode,
      create_casefile_applicant_organisation_country_id: saved.contactDetails.address.countryId,
      create_casefile_applicant_organisation_bank_type: saved.bankDetails.type,
      create_casefile_applicant_organisation_uk_bank_name_on_account: ukBankDetails?.nameOnAccount ?? null,
      create_casefile_applicant_organisation_uk_bank_sort_code: ukBankDetails?.sortCode ?? null,
      create_casefile_applicant_organisation_uk_bank_account_number: ukBankDetails?.accountNumber ?? null,
      create_casefile_applicant_organisation_uk_bank_payment_reference: ukBankDetails?.paymentReference ?? null,
      create_casefile_applicant_organisation_non_uk_bank_name_on_account: nonUkBankDetails?.nameOnAccount ?? null,
      create_casefile_applicant_organisation_non_uk_bank_bic_swift_code: nonUkBankDetails?.bicSwiftCode ?? null,
      create_casefile_applicant_organisation_non_uk_bank_iban: nonUkBankDetails?.iban ?? null,
      create_casefile_applicant_organisation_non_uk_bank_payment_reference: nonUkBankDetails?.paymentReference ?? null,
      create_casefile_applicant_organisation_non_uk_bank_name: nonUkBankDetails?.bankName ?? null,
      create_casefile_applicant_organisation_non_uk_bank_branch_sort_code: nonUkBankDetails?.branchSortCode ?? null,
      create_casefile_applicant_organisation_non_uk_bank_account_number: nonUkBankDetails?.accountNumber ?? null,
    };
  }

  public toApplicantDetails(
    formData: ICasesCreateCasefileApplicantOrganisationFormData,
  ): ICasesCreateCasefileApplicantOrganisation {
    return {
      organisationName: requiredString(formData.create_casefile_applicant_organisation_name, 'organisation name'),
      foreignAuthorityReference: requiredString(
        formData.create_casefile_applicant_organisation_foreign_authority_reference,
        'foreign authority reference',
      ),
      contactDetails: {
        mainEmailAddress: optional(formData.create_casefile_applicant_organisation_main_email_address),
        otherEmailAddress: optional(formData.create_casefile_applicant_organisation_other_email_address),
        mainTelephoneNumber: optional(formData.create_casefile_applicant_organisation_main_telephone_number),
        otherTelephoneNumber: optional(formData.create_casefile_applicant_organisation_other_telephone_number),
        address: mapCasesCreateCasefileAddress(
          {
            addressLine1: formData.create_casefile_applicant_organisation_address_line_1,
            addressLine2: formData.create_casefile_applicant_organisation_address_line_2,
            addressLine3: formData.create_casefile_applicant_organisation_address_line_3,
            addressLine4: formData.create_casefile_applicant_organisation_address_line_4,
            addressLine5: formData.create_casefile_applicant_organisation_address_line_5,
            postalOrZipCode: formData.create_casefile_applicant_organisation_postal_or_zip_code,
            countryId: formData.create_casefile_applicant_organisation_country_id,
          },
          'applicant',
        ),
      },
      bankDetails: this.buildBankDetails(formData),
    };
  }
}
