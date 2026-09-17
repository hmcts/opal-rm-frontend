export interface ICasesCreateCasefileOrderTermField {
  name: string;
  id: string;
  label: string;
  kind:
    'money' | 'integer' | 'text' | 'long_text' | 'date' | 'radio' | 'select' | 'autocomplete' | 'checkbox' | 'readonly';
  required: boolean;
  hint: string;
  min: string | number | null;
  max: string | number | null;
  past: boolean;
  options: { value: string; label: string }[];
  lookup: 'mock:order-term-options' | null;
}
