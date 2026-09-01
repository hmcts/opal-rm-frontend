import { FormControl } from '@angular/forms';
import {
  casesCreateCasefileApplicantIndividualBicSwiftValidator,
  casesCreateCasefileApplicantIndividualBranchSortCodeValidator,
  casesCreateCasefileApplicantIndividualIbanValidator,
  casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator,
  casesCreateCasefileApplicantIndividualUkAccountNumberValidator,
  casesCreateCasefileApplicantIndividualUkSortCodeValidator,
} from './cases-create-casefile-applicant-individual-bank.validator';
import { casesCreateCasefileApplicantIndividualTrimRequiredValidator } from './cases-create-casefile-applicant-individual-trim-required.validator';

describe('CasesCreateCasefileApplicantIndividualBankValidator', () => {
  describe('casesCreateCasefileApplicantIndividualUkSortCodeValidator', () => {
    it.each(['112233', '11-22-33'])('accepts the valid UK sort code %s', (value) => {
      expect(casesCreateCasefileApplicantIndividualUkSortCodeValidator(new FormControl(value))).toBeNull();
    });

    it('returns ukSortCodePattern when the sort code contains letters', () => {
      expect(casesCreateCasefileApplicantIndividualUkSortCodeValidator(new FormControl('11AB33'))).toEqual({
        ukSortCodePattern: true,
      });
    });

    it.each(['11223', '1122334'])('returns ukSortCodeLength when %s has the wrong number of digits', (value) => {
      expect(casesCreateCasefileApplicantIndividualUkSortCodeValidator(new FormControl(value))).toEqual({
        ukSortCodeLength: true,
      });
    });
  });

  describe('casesCreateCasefileApplicantIndividualUkAccountNumberValidator', () => {
    it.each(['123456', '1234567', '12345678'])('accepts the valid UK account number %s', (value) => {
      expect(casesCreateCasefileApplicantIndividualUkAccountNumberValidator(new FormControl(value))).toBeNull();
    });

    it('returns ukAccountNumberPattern when the account number contains letters', () => {
      expect(casesCreateCasefileApplicantIndividualUkAccountNumberValidator(new FormControl('12345A'))).toEqual({
        ukAccountNumberPattern: true,
      });
    });

    it.each(['12345', '123456789'])('returns ukAccountNumberLength when %s is outside 6 to 8 digits', (value) => {
      expect(casesCreateCasefileApplicantIndividualUkAccountNumberValidator(new FormControl(value))).toEqual({
        ukAccountNumberLength: true,
      });
    });
  });

  describe('casesCreateCasefileApplicantIndividualBicSwiftValidator', () => {
    it.each(['', '   ', 'ABCD1234', 'ABCDEF12345'])('accepts the optional valid BIC or SWIFT value %j', (value) => {
      expect(casesCreateCasefileApplicantIndividualBicSwiftValidator(new FormControl(value))).toBeNull();
    });

    it.each(['ABC1234', 'ABCDEF123456', 'ABCD-123'])('returns internationalIdentifierPattern for %j', (value) => {
      expect(casesCreateCasefileApplicantIndividualBicSwiftValidator(new FormControl(value))).toEqual({
        internationalIdentifierPattern: true,
      });
    });
  });

  describe('casesCreateCasefileApplicantIndividualIbanValidator', () => {
    it.each(['', '   ', 'A', 'GB82WEST12345698765432', 'A'.repeat(34)])(
      'accepts the optional valid IBAN value %j',
      (value) => {
        expect(casesCreateCasefileApplicantIndividualIbanValidator(new FormControl(value))).toBeNull();
      },
    );

    it.each(['GB82 WEST 1234', 'A'.repeat(35), 'GB82-WEST'])(
      'returns internationalIdentifierPattern for %j',
      (value) => {
        expect(casesCreateCasefileApplicantIndividualIbanValidator(new FormControl(value))).toEqual({
          internationalIdentifierPattern: true,
        });
      },
    );
  });

  describe('casesCreateCasefileApplicantIndividualBranchSortCodeValidator', () => {
    it.each(['', '   ', '1', '123456789012'])('accepts the optional valid branch or sort code %j', (value) => {
      expect(casesCreateCasefileApplicantIndividualBranchSortCodeValidator(new FormControl(value))).toBeNull();
    });

    it('returns branchSortCodePattern when the branch or sort code contains letters', () => {
      expect(casesCreateCasefileApplicantIndividualBranchSortCodeValidator(new FormControl('123A'))).toEqual({
        branchSortCodePattern: true,
      });
    });

    it('returns branchSortCodeLength when the branch or sort code exceeds 12 digits', () => {
      expect(casesCreateCasefileApplicantIndividualBranchSortCodeValidator(new FormControl('1234567890123'))).toEqual({
        branchSortCodeLength: true,
      });
    });
  });

  describe('casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator', () => {
    it('accepts a populated BIC or SWIFT control', () => {
      const ibanControl = new FormControl('');
      const validator = casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator(ibanControl);

      expect(validator(new FormControl('ABCD1234'))).toBeNull();
    });

    it('accepts a populated IBAN control', () => {
      const ibanControl = new FormControl('GB82WEST12345698765432');
      const validator = casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator(ibanControl);

      expect(validator(new FormControl(''))).toBeNull();
    });

    it('returns internationalIdentifierRequired on the BIC control when both identifiers are blank', () => {
      const ibanControl = new FormControl('   ');
      const validator = casesCreateCasefileApplicantIndividualInternationalIdentifierRequiredValidator(ibanControl);

      expect(validator(new FormControl('   '))).toEqual({ internationalIdentifierRequired: true });
    });
  });

  describe('casesCreateCasefileApplicantIndividualTrimRequiredValidator', () => {
    it('accepts text containing a non-whitespace character', () => {
      expect(casesCreateCasefileApplicantIndividualTrimRequiredValidator(new FormControl(' Applicant '))).toBeNull();
    });

    it.each(['', '   ', null])('returns required for the blank value %j', (value) => {
      expect(casesCreateCasefileApplicantIndividualTrimRequiredValidator(new FormControl(value))).toEqual({
        required: true,
      });
    });
  });
});
