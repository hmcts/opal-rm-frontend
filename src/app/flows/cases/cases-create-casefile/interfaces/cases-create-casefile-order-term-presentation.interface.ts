import type { ICasesCreateCasefileOrderTermField } from '../cases-create-casefile-order-terms-input/interfaces/cases-create-casefile-order-term-field.interface';

export interface ICasesCreateCasefileOrderTermPresentation {
  title: string;
  fields: Pick<ICasesCreateCasefileOrderTermField, 'name' | 'label' | 'kind' | 'options'>[];
}
