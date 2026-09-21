export type CasesCreateCasefileMinorCreditorIdentity =
  | { type: 'individual'; title: string | null; firstNames: string; lastName: string }
  | { type: 'organisation'; organisationName: string };
