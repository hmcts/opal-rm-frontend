export type CasesCreateCasefileMinorCreditorBank =
  | { type: 'none' }
  | { type: 'uk'; nameOnAccount: string; sortCode: string; accountNumber: string; paymentReference: string }
  | {
      type: 'non-uk';
      nameOnAccount: string;
      paymentReference: string;
      accountNumber: string | null;
      bicSwiftCode: string | null;
      iban: string | null;
      bankName: string | null;
      branchSortCode: string | null;
    };
