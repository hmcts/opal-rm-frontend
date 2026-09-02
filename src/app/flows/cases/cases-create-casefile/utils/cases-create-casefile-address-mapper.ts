import type { ICasesCreateCasefilePartyAddress } from '../interfaces/cases-create-casefile-party-address.interface';

export interface ICasesCreateCasefileAddressSource {
  addressLine1: string | null;
  addressLine2: string | null;
  addressLine3: string | null;
  addressLine4: string | null;
  addressLine5: string | null;
  postalOrZipCode: string | null;
  countryId: number | null;
}

const optionalString = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
};

const requiredString = (value: string | null, description: string): string => {
  const trimmed = optionalString(value);
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

export const mapCasesCreateCasefileAddress = (
  source: ICasesCreateCasefileAddressSource,
  description: string,
): ICasesCreateCasefilePartyAddress => ({
  addressLine1: requiredString(source.addressLine1, `${description} address line 1`),
  addressLine2: optionalString(source.addressLine2),
  addressLine3: optionalString(source.addressLine3),
  addressLine4: optionalString(source.addressLine4),
  addressLine5: optionalString(source.addressLine5),
  postalOrZipCode: optionalString(source.postalOrZipCode),
  countryId: requiredId(source.countryId, `${description} country`),
});
