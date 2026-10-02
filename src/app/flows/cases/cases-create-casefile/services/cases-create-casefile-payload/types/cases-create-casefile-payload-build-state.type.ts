import type { ICasesCreateCasefileState } from '../../../interfaces/cases-create-casefile-state.interface';

export type CasesCreateCasefilePayloadBuildState = ICasesCreateCasefileState & {
  [
    Key in
      | 'caseTypeSelection'
      | 'respondentDetails'
      | 'applicantDetails'
      | 'orderDetails'
      | 'interestAndIndexation'
      | 'paymentArrangement'
  ]: NonNullable<ICasesCreateCasefileState[Key]>;
};
