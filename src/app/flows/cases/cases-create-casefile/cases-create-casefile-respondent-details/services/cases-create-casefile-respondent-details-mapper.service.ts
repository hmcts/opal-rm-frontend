import { inject, Injectable } from '@angular/core';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileRespondentDetails } from '../../interfaces/cases-create-casefile-respondent-details.interface';
import { mapCasesCreateCasefileAddress } from '../../utils/cases-create-casefile-address-mapper';
import type { ICasesCreateCasefileRespondentDetailsFormData } from '../interfaces/cases-create-casefile-respondent-details-form-data.interface';

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

const EMPTY_FORM_DATA: ICasesCreateCasefileRespondentDetailsFormData = {
  create_casefile_respondent_details_title: null,
  create_casefile_respondent_details_first_names: null,
  create_casefile_respondent_details_last_name: null,
  create_casefile_respondent_details_add_aliases: false,
  create_casefile_respondent_details_aliases: [],
  create_casefile_respondent_details_date_of_birth: null,
  create_casefile_respondent_details_national_insurance_number: null,
  create_casefile_respondent_details_other_personal_information: null,
  create_casefile_respondent_details_main_email_address: null,
  create_casefile_respondent_details_other_email_address: null,
  create_casefile_respondent_details_main_telephone_number: null,
  create_casefile_respondent_details_other_telephone_number: null,
  create_casefile_respondent_details_address_line_1: null,
  create_casefile_respondent_details_address_line_2: null,
  create_casefile_respondent_details_address_line_3: null,
  create_casefile_respondent_details_address_line_4: null,
  create_casefile_respondent_details_address_line_5: null,
  create_casefile_respondent_details_postal_or_zip_code: null,
  create_casefile_respondent_details_country_id: null,
  create_casefile_respondent_details_send_correspondence_to_third_party: false,
  create_casefile_respondent_details_third_party_name_or_organisation: null,
  create_casefile_respondent_details_third_party_relationship: null,
  create_casefile_respondent_details_third_party_reference: null,
  create_casefile_respondent_details_third_party_address_line_1: null,
  create_casefile_respondent_details_third_party_address_line_2: null,
  create_casefile_respondent_details_third_party_address_line_3: null,
  create_casefile_respondent_details_third_party_address_line_4: null,
  create_casefile_respondent_details_third_party_address_line_5: null,
  create_casefile_respondent_details_third_party_postal_or_zip_code: null,
  create_casefile_respondent_details_third_party_country_id: null,
  create_casefile_respondent_details_add_employer_details: false,
  create_casefile_respondent_details_employer_name: null,
  create_casefile_respondent_details_employee_reference: null,
  create_casefile_respondent_details_employer_email_address: null,
  create_casefile_respondent_details_employer_telephone_number: null,
  create_casefile_respondent_details_employer_address_line_1: null,
  create_casefile_respondent_details_employer_address_line_2: null,
  create_casefile_respondent_details_employer_address_line_3: null,
  create_casefile_respondent_details_employer_address_line_4: null,
  create_casefile_respondent_details_employer_address_line_5: null,
  create_casefile_respondent_details_employer_postal_or_zip_code: null,
  create_casefile_respondent_details_employer_country_id: null,
  create_casefile_respondent_details_restricted_information: false,
  create_casefile_respondent_details_restricted_information_reason: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileRespondentDetailsMapperService {
  private readonly dateService = inject(DateService);

  public toFormData(
    saved: ICasesCreateCasefileRespondentDetails | null,
  ): ICasesCreateCasefileRespondentDetailsFormData {
    if (saved === null) {
      return { ...EMPTY_FORM_DATA, create_casefile_respondent_details_aliases: [] };
    }

    return {
      create_casefile_respondent_details_title: saved.title,
      create_casefile_respondent_details_first_names: saved.firstNames,
      create_casefile_respondent_details_last_name: saved.lastName,
      create_casefile_respondent_details_add_aliases: saved.aliases.length > 0,
      create_casefile_respondent_details_aliases: saved.aliases.map((alias) => ({ ...alias })),
      create_casefile_respondent_details_date_of_birth: saved.dateOfBirth
        ? this.dateService.getFromFormatToFormat(saved.dateOfBirth, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
      create_casefile_respondent_details_national_insurance_number: saved.nationalInsuranceNumber,
      create_casefile_respondent_details_other_personal_information: saved.otherPersonalInformation,
      create_casefile_respondent_details_main_email_address: saved.contactDetails.mainEmailAddress,
      create_casefile_respondent_details_other_email_address: saved.contactDetails.otherEmailAddress,
      create_casefile_respondent_details_main_telephone_number: saved.contactDetails.mainTelephoneNumber,
      create_casefile_respondent_details_other_telephone_number: saved.contactDetails.otherTelephoneNumber,
      create_casefile_respondent_details_address_line_1: saved.contactDetails.address.addressLine1,
      create_casefile_respondent_details_address_line_2: saved.contactDetails.address.addressLine2,
      create_casefile_respondent_details_address_line_3: saved.contactDetails.address.addressLine3,
      create_casefile_respondent_details_address_line_4: saved.contactDetails.address.addressLine4,
      create_casefile_respondent_details_address_line_5: saved.contactDetails.address.addressLine5,
      create_casefile_respondent_details_postal_or_zip_code: saved.contactDetails.address.postalOrZipCode,
      create_casefile_respondent_details_country_id: saved.contactDetails.address.countryId,
      create_casefile_respondent_details_send_correspondence_to_third_party: saved.thirdParty !== null,
      create_casefile_respondent_details_third_party_name_or_organisation: saved.thirdParty?.nameOrOrganisation ?? null,
      create_casefile_respondent_details_third_party_relationship: saved.thirdParty?.relationship ?? null,
      create_casefile_respondent_details_third_party_reference: saved.thirdParty?.reference ?? null,
      create_casefile_respondent_details_third_party_address_line_1: saved.thirdParty?.address.addressLine1 ?? null,
      create_casefile_respondent_details_third_party_address_line_2: saved.thirdParty?.address.addressLine2 ?? null,
      create_casefile_respondent_details_third_party_address_line_3: saved.thirdParty?.address.addressLine3 ?? null,
      create_casefile_respondent_details_third_party_address_line_4: saved.thirdParty?.address.addressLine4 ?? null,
      create_casefile_respondent_details_third_party_address_line_5: saved.thirdParty?.address.addressLine5 ?? null,
      create_casefile_respondent_details_third_party_postal_or_zip_code:
        saved.thirdParty?.address.postalOrZipCode ?? null,
      create_casefile_respondent_details_third_party_country_id: saved.thirdParty?.address.countryId ?? null,
      create_casefile_respondent_details_add_employer_details: saved.employer !== null,
      create_casefile_respondent_details_employer_name: saved.employer?.employerName ?? null,
      create_casefile_respondent_details_employee_reference: saved.employer?.employeeReference ?? null,
      create_casefile_respondent_details_employer_email_address: saved.employer?.emailAddress ?? null,
      create_casefile_respondent_details_employer_telephone_number: saved.employer?.telephoneNumber ?? null,
      create_casefile_respondent_details_employer_address_line_1: saved.employer?.address.addressLine1 ?? null,
      create_casefile_respondent_details_employer_address_line_2: saved.employer?.address.addressLine2 ?? null,
      create_casefile_respondent_details_employer_address_line_3: saved.employer?.address.addressLine3 ?? null,
      create_casefile_respondent_details_employer_address_line_4: saved.employer?.address.addressLine4 ?? null,
      create_casefile_respondent_details_employer_address_line_5: saved.employer?.address.addressLine5 ?? null,
      create_casefile_respondent_details_employer_postal_or_zip_code: saved.employer?.address.postalOrZipCode ?? null,
      create_casefile_respondent_details_employer_country_id: saved.employer?.address.countryId ?? null,
      create_casefile_respondent_details_restricted_information: saved.restrictedInformation.restricted,
      create_casefile_respondent_details_restricted_information_reason: saved.restrictedInformation.restricted
        ? saved.restrictedInformation.reason
        : null,
    };
  }

  public toRespondentDetails(
    formData: ICasesCreateCasefileRespondentDetailsFormData,
  ): ICasesCreateCasefileRespondentDetails {
    const thirdParty = formData.create_casefile_respondent_details_send_correspondence_to_third_party
      ? {
          nameOrOrganisation: requiredString(
            formData.create_casefile_respondent_details_third_party_name_or_organisation,
            'third-party name or organisation',
          ),
          relationship: requiredString(
            formData.create_casefile_respondent_details_third_party_relationship,
            'third-party relationship',
          ),
          reference: optional(formData.create_casefile_respondent_details_third_party_reference),
          address: mapCasesCreateCasefileAddress(
            {
              addressLine1: formData.create_casefile_respondent_details_third_party_address_line_1,
              addressLine2: formData.create_casefile_respondent_details_third_party_address_line_2,
              addressLine3: formData.create_casefile_respondent_details_third_party_address_line_3,
              addressLine4: formData.create_casefile_respondent_details_third_party_address_line_4,
              addressLine5: formData.create_casefile_respondent_details_third_party_address_line_5,
              postalOrZipCode: formData.create_casefile_respondent_details_third_party_postal_or_zip_code,
              countryId: formData.create_casefile_respondent_details_third_party_country_id,
            },
            'third-party',
          ),
        }
      : null;

    const employer = formData.create_casefile_respondent_details_add_employer_details
      ? {
          employerName: requiredString(formData.create_casefile_respondent_details_employer_name, 'employer name'),
          employeeReference: optional(formData.create_casefile_respondent_details_employee_reference),
          emailAddress: optional(formData.create_casefile_respondent_details_employer_email_address),
          telephoneNumber: optional(formData.create_casefile_respondent_details_employer_telephone_number),
          address: mapCasesCreateCasefileAddress(
            {
              addressLine1: formData.create_casefile_respondent_details_employer_address_line_1,
              addressLine2: formData.create_casefile_respondent_details_employer_address_line_2,
              addressLine3: formData.create_casefile_respondent_details_employer_address_line_3,
              addressLine4: formData.create_casefile_respondent_details_employer_address_line_4,
              addressLine5: formData.create_casefile_respondent_details_employer_address_line_5,
              postalOrZipCode: formData.create_casefile_respondent_details_employer_postal_or_zip_code,
              countryId: formData.create_casefile_respondent_details_employer_country_id,
            },
            'employer',
          ),
        }
      : null;

    return {
      title: optional(formData.create_casefile_respondent_details_title),
      firstNames: requiredString(formData.create_casefile_respondent_details_first_names, 'respondent first names'),
      lastName: requiredString(formData.create_casefile_respondent_details_last_name, 'respondent last name'),
      aliases: formData.create_casefile_respondent_details_add_aliases
        ? formData.create_casefile_respondent_details_aliases.map((alias, index) => ({
            firstNames: requiredString(alias.firstNames, `alias ${index + 1} first names`),
            lastName: requiredString(alias.lastName, `alias ${index + 1} last name`),
          }))
        : [],
      dateOfBirth: formData.create_casefile_respondent_details_date_of_birth
        ? this.dateService.getFromFormatToFormat(
            formData.create_casefile_respondent_details_date_of_birth,
            'dd/MM/yyyy',
            'yyyy-MM-dd',
          )
        : null,
      nationalInsuranceNumber: optional(formData.create_casefile_respondent_details_national_insurance_number),
      otherPersonalInformation: optional(formData.create_casefile_respondent_details_other_personal_information),
      contactDetails: {
        mainEmailAddress: optional(formData.create_casefile_respondent_details_main_email_address),
        otherEmailAddress: optional(formData.create_casefile_respondent_details_other_email_address),
        mainTelephoneNumber: optional(formData.create_casefile_respondent_details_main_telephone_number),
        otherTelephoneNumber: optional(formData.create_casefile_respondent_details_other_telephone_number),
        address: mapCasesCreateCasefileAddress(
          {
            addressLine1: formData.create_casefile_respondent_details_address_line_1,
            addressLine2: formData.create_casefile_respondent_details_address_line_2,
            addressLine3: formData.create_casefile_respondent_details_address_line_3,
            addressLine4: formData.create_casefile_respondent_details_address_line_4,
            addressLine5: formData.create_casefile_respondent_details_address_line_5,
            postalOrZipCode: formData.create_casefile_respondent_details_postal_or_zip_code,
            countryId: formData.create_casefile_respondent_details_country_id,
          },
          'respondent',
        ),
      },
      thirdParty,
      employer,
      restrictedInformation: {
        restricted: formData.create_casefile_respondent_details_restricted_information,
        reason: formData.create_casefile_respondent_details_restricted_information
          ? requiredString(
              formData.create_casefile_respondent_details_restricted_information_reason,
              'restricted information reason',
            )
          : null,
      },
    };
  }
}
