import type { ICasesCreateCasefileOrderTermField } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-field.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../cases-create-casefile-order-terms-input/types/cases-create-casefile-order-term-raw-value.type';
import type { ICasesCreateCasefileOrderTermPresentation } from './cases-create-casefile-order-term-presentation.interface';

export interface ICasesCreateCasefileOrderTermDraft {
  resultId: string;
  fieldTypes: Record<string, ICasesCreateCasefileOrderTermField['kind']>;
  values: Record<string, CasesCreateCasefileOrderTermRawValue>;
  dirty: boolean;
  presentation: ICasesCreateCasefileOrderTermPresentation;
}
