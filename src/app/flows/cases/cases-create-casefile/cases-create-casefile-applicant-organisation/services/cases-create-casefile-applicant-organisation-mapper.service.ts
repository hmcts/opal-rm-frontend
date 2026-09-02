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
  applicant_organisation_name: null,
  applicant_foreign_authority_reference: null,
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
  applicant_bank_type: null,
  applicant_uk_bank_name_on_account: null,
  applicant_uk_bank_sort_code: null,
  applicant_uk_bank_account_number: null,
  applicant_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name_on_account: null,
  applicant_non_uk_bank_bic_swift_code: null,
  applicant_non_uk_bank_iban: null,
  applicant_non_uk_bank_payment_reference: null,
  applicant_non_uk_bank_name: null,
  applicant_non_uk_bank_branch_sort_code: null,
  applicant_non_uk_bank_account_number: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileApplicantOrganisationMapperService {
  private buildBankDetails(
    formData: ICasesCreateCasefileApplicantOrganisationFormData,
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
        const bicSwiftCode = optional(formData.applicant_non_uk_bank_bic_swift_code);
        const iban = optional(formData.applicant_non_uk_bank_iban);
        if (bicSwiftCode === null && iban === null) {
          throw new Error('Required non-UK bank BIC/SWIFT code or IBAN is missing');
        }
        return {
          type: CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK,
          nameOnAccount: requiredString(formData.applicant_non_uk_bank_name_on_account, 'non-UK bank name on account'),
          accountNumber: optional(formData.applicant_non_uk_bank_account_number),
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
  ): ICasesCreateCasefileApplicantOrganisationFormData {
    if (saved === null || !isOrganisationApplicant(saved)) {
      return { ...EMPTY_FORM_DATA };
    }

    const ukBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.UK ? saved.bankDetails : null;
    const nonUkBankDetails =
      saved.bankDetails.type === CASES_CREATE_CASEFILE_APPLICANT_BANK_TYPES.NON_UK ? saved.bankDetails : null;

    return {
      applicant_organisation_name: saved.organisationName,
      applicant_foreign_authority_reference: saved.foreignAuthorityReference,
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
      applicant_bank_type: saved.bankDetails.type,
      applicant_uk_bank_name_on_account: ukBankDetails?.nameOnAccount ?? null,
      applicant_uk_bank_sort_code: ukBankDetails?.sortCode ?? null,
      applicant_uk_bank_account_number: ukBankDetails?.accountNumber ?? null,
      applicant_uk_bank_payment_reference: ukBankDetails?.paymentReference ?? null,
      applicant_non_uk_bank_name_on_account: nonUkBankDetails?.nameOnAccount ?? null,
      applicant_non_uk_bank_bic_swift_code: nonUkBankDetails?.bicSwiftCode ?? null,
      applicant_non_uk_bank_iban: nonUkBankDetails?.iban ?? null,
      applicant_non_uk_bank_payment_reference: nonUkBankDetails?.paymentReference ?? null,
      applicant_non_uk_bank_name: nonUkBankDetails?.bankName ?? null,
      applicant_non_uk_bank_branch_sort_code: nonUkBankDetails?.branchSortCode ?? null,
      applicant_non_uk_bank_account_number: nonUkBankDetails?.accountNumber ?? null,
    };
  }

  public toApplicantDetails(
    formData: ICasesCreateCasefileApplicantOrganisationFormData,
  ): ICasesCreateCasefileApplicantOrganisation {
    return {
      organisationName: requiredString(formData.applicant_organisation_name, 'organisation name'),
      foreignAuthorityReference: requiredString(
        formData.applicant_foreign_authority_reference,
        'foreign authority reference',
      ),
      contactDetails: {
        mainEmailAddress: optional(formData.applicant_main_email_address),
        otherEmailAddress: optional(formData.applicant_other_email_address),
        mainTelephoneNumber: optional(formData.applicant_main_telephone_number),
        otherTelephoneNumber: optional(formData.applicant_other_telephone_number),
        address: mapCasesCreateCasefileAddress(
          {
            addressLine1: formData.applicant_address_line_1,
            addressLine2: formData.applicant_address_line_2,
            addressLine3: formData.applicant_address_line_3,
            addressLine4: formData.applicant_address_line_4,
            addressLine5: formData.applicant_address_line_5,
            postalOrZipCode: formData.applicant_postal_or_zip_code,
            countryId: formData.applicant_country_id,
          },
          'applicant',
        ),
      },
      bankDetails: this.buildBankDetails(formData),
    };
  }
}
