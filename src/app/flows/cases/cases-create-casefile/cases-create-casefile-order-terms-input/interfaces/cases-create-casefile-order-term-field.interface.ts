import type { CasesCreateCasefileOrderTermBound } from '../types/cases-create-casefile-order-term-bound.type';
export interface ICasesCreateCasefileOrderTermField {
  name: string;
  id: string;
  label: string;
  kind:
    'money' | 'integer' | 'text' | 'long_text' | 'date' | 'radio' | 'select' | 'autocomplete' | 'checkbox' | 'readonly';
  required: boolean;
  hint: string;
  min: CasesCreateCasefileOrderTermBound;
  max: CasesCreateCasefileOrderTermBound;
  past: boolean;
  options: { value: string; label: string }[];
  lookup: 'mock:order-term-options' | null;
}
