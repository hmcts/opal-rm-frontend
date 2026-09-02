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
  respondent_title: null,
  respondent_first_names: null,
  respondent_last_name: null,
  respondent_add_aliases: false,
  respondent_aliases: [],
  respondent_date_of_birth: null,
  respondent_national_insurance_number: null,
  respondent_other_personal_information: null,
  respondent_main_email_address: null,
  respondent_other_email_address: null,
  respondent_main_telephone_number: null,
  respondent_other_telephone_number: null,
  respondent_address_line_1: null,
  respondent_address_line_2: null,
  respondent_address_line_3: null,
  respondent_address_line_4: null,
  respondent_address_line_5: null,
  respondent_postal_or_zip_code: null,
  respondent_country_id: null,
  respondent_send_correspondence_to_third_party: false,
  respondent_third_party_name_or_organisation: null,
  respondent_third_party_relationship: null,
  respondent_third_party_reference: null,
  respondent_third_party_address_line_1: null,
  respondent_third_party_address_line_2: null,
  respondent_third_party_address_line_3: null,
  respondent_third_party_address_line_4: null,
  respondent_third_party_address_line_5: null,
  respondent_third_party_postal_or_zip_code: null,
  respondent_third_party_country_id: null,
  respondent_add_employer_details: false,
  respondent_employer_name: null,
  respondent_employee_reference: null,
  respondent_employer_email_address: null,
  respondent_employer_telephone_number: null,
  respondent_employer_address_line_1: null,
  respondent_employer_address_line_2: null,
  respondent_employer_address_line_3: null,
  respondent_employer_address_line_4: null,
  respondent_employer_address_line_5: null,
  respondent_employer_postal_or_zip_code: null,
  respondent_employer_country_id: null,
  respondent_restricted_information: false,
  respondent_restricted_information_reason: null,
};

@Injectable({ providedIn: 'root' })
export class CasesCreateCasefileRespondentDetailsMapperService {
  private readonly dateService = inject(DateService);

  public toFormData(
    saved: ICasesCreateCasefileRespondentDetails | null,
  ): ICasesCreateCasefileRespondentDetailsFormData {
    if (saved === null) {
      return { ...EMPTY_FORM_DATA, respondent_aliases: [] };
    }

    return {
      respondent_title: saved.title,
      respondent_first_names: saved.firstNames,
      respondent_last_name: saved.lastName,
      respondent_add_aliases: saved.aliases.length > 0,
      respondent_aliases: saved.aliases.map((alias) => ({ ...alias })),
      respondent_date_of_birth: saved.dateOfBirth
        ? this.dateService.getFromFormatToFormat(saved.dateOfBirth, 'yyyy-MM-dd', 'dd/MM/yyyy')
        : null,
      respondent_national_insurance_number: saved.nationalInsuranceNumber,
      respondent_other_personal_information: saved.otherPersonalInformation,
      respondent_main_email_address: saved.contactDetails.mainEmailAddress,
      respondent_other_email_address: saved.contactDetails.otherEmailAddress,
      respondent_main_telephone_number: saved.contactDetails.mainTelephoneNumber,
      respondent_other_telephone_number: saved.contactDetails.otherTelephoneNumber,
      respondent_address_line_1: saved.contactDetails.address.addressLine1,
      respondent_address_line_2: saved.contactDetails.address.addressLine2,
      respondent_address_line_3: saved.contactDetails.address.addressLine3,
      respondent_address_line_4: saved.contactDetails.address.addressLine4,
      respondent_address_line_5: saved.contactDetails.address.addressLine5,
      respondent_postal_or_zip_code: saved.contactDetails.address.postalOrZipCode,
      respondent_country_id: saved.contactDetails.address.countryId,
      respondent_send_correspondence_to_third_party: saved.thirdParty !== null,
      respondent_third_party_name_or_organisation: saved.thirdParty?.nameOrOrganisation ?? null,
      respondent_third_party_relationship: saved.thirdParty?.relationship ?? null,
      respondent_third_party_reference: saved.thirdParty?.reference ?? null,
      respondent_third_party_address_line_1: saved.thirdParty?.address.addressLine1 ?? null,
      respondent_third_party_address_line_2: saved.thirdParty?.address.addressLine2 ?? null,
      respondent_third_party_address_line_3: saved.thirdParty?.address.addressLine3 ?? null,
      respondent_third_party_address_line_4: saved.thirdParty?.address.addressLine4 ?? null,
      respondent_third_party_address_line_5: saved.thirdParty?.address.addressLine5 ?? null,
      respondent_third_party_postal_or_zip_code: saved.thirdParty?.address.postalOrZipCode ?? null,
      respondent_third_party_country_id: saved.thirdParty?.address.countryId ?? null,
      respondent_add_employer_details: saved.employer !== null,
      respondent_employer_name: saved.employer?.employerName ?? null,
      respondent_employee_reference: saved.employer?.employeeReference ?? null,
      respondent_employer_email_address: saved.employer?.emailAddress ?? null,
      respondent_employer_telephone_number: saved.employer?.telephoneNumber ?? null,
      respondent_employer_address_line_1: saved.employer?.address.addressLine1 ?? null,
      respondent_employer_address_line_2: saved.employer?.address.addressLine2 ?? null,
      respondent_employer_address_line_3: saved.employer?.address.addressLine3 ?? null,
      respondent_employer_address_line_4: saved.employer?.address.addressLine4 ?? null,
      respondent_employer_address_line_5: saved.employer?.address.addressLine5 ?? null,
      respondent_employer_postal_or_zip_code: saved.employer?.address.postalOrZipCode ?? null,
      respondent_employer_country_id: saved.employer?.address.countryId ?? null,
      respondent_restricted_information: saved.restrictedInformation.restricted,
      respondent_restricted_information_reason: saved.restrictedInformation.restricted
        ? saved.restrictedInformation.reason
        : null,
    };
  }

  public toRespondentDetails(
    formData: ICasesCreateCasefileRespondentDetailsFormData,
  ): ICasesCreateCasefileRespondentDetails {
    const thirdParty = formData.respondent_send_correspondence_to_third_party
      ? {
          nameOrOrganisation: requiredString(
            formData.respondent_third_party_name_or_organisation,
            'third-party name or organisation',
          ),
          relationship: requiredString(formData.respondent_third_party_relationship, 'third-party relationship'),
          reference: optional(formData.respondent_third_party_reference),
          address: mapCasesCreateCasefileAddress(
            {
              addressLine1: formData.respondent_third_party_address_line_1,
              addressLine2: formData.respondent_third_party_address_line_2,
              addressLine3: formData.respondent_third_party_address_line_3,
              addressLine4: formData.respondent_third_party_address_line_4,
              addressLine5: formData.respondent_third_party_address_line_5,
              postalOrZipCode: formData.respondent_third_party_postal_or_zip_code,
              countryId: formData.respondent_third_party_country_id,
            },
            'third-party',
          ),
        }
      : null;

    const employer = formData.respondent_add_employer_details
      ? {
          employerName: requiredString(formData.respondent_employer_name, 'employer name'),
          employeeReference: optional(formData.respondent_employee_reference),
          emailAddress: optional(formData.respondent_employer_email_address),
          telephoneNumber: optional(formData.respondent_employer_telephone_number),
          address: mapCasesCreateCasefileAddress(
            {
              addressLine1: formData.respondent_employer_address_line_1,
              addressLine2: formData.respondent_employer_address_line_2,
              addressLine3: formData.respondent_employer_address_line_3,
              addressLine4: formData.respondent_employer_address_line_4,
              addressLine5: formData.respondent_employer_address_line_5,
              postalOrZipCode: formData.respondent_employer_postal_or_zip_code,
              countryId: formData.respondent_employer_country_id,
            },
            'employer',
          ),
        }
      : null;

    return {
      title: optional(formData.respondent_title),
      firstNames: requiredString(formData.respondent_first_names, 'respondent first names'),
      lastName: requiredString(formData.respondent_last_name, 'respondent last name'),
      aliases: formData.respondent_add_aliases
        ? formData.respondent_aliases.map((alias, index) => ({
            firstNames: requiredString(alias.firstNames, `alias ${index + 1} first names`),
            lastName: requiredString(alias.lastName, `alias ${index + 1} last name`),
          }))
        : [],
      dateOfBirth: formData.respondent_date_of_birth
        ? this.dateService.getFromFormatToFormat(formData.respondent_date_of_birth, 'dd/MM/yyyy', 'yyyy-MM-dd')
        : null,
      nationalInsuranceNumber: optional(formData.respondent_national_insurance_number),
      otherPersonalInformation: optional(formData.respondent_other_personal_information),
      contactDetails: {
        mainEmailAddress: optional(formData.respondent_main_email_address),
        otherEmailAddress: optional(formData.respondent_other_email_address),
        mainTelephoneNumber: optional(formData.respondent_main_telephone_number),
        otherTelephoneNumber: optional(formData.respondent_other_telephone_number),
        address: mapCasesCreateCasefileAddress(
          {
            addressLine1: formData.respondent_address_line_1,
            addressLine2: formData.respondent_address_line_2,
            addressLine3: formData.respondent_address_line_3,
            addressLine4: formData.respondent_address_line_4,
            addressLine5: formData.respondent_address_line_5,
            postalOrZipCode: formData.respondent_postal_or_zip_code,
            countryId: formData.respondent_country_id,
          },
          'respondent',
        ),
      },
      thirdParty,
      employer,
      restrictedInformation: {
        restricted: formData.respondent_restricted_information,
        reason: formData.respondent_restricted_information
          ? requiredString(formData.respondent_restricted_information_reason, 'restricted information reason')
          : null,
      },
    };
  }
}
