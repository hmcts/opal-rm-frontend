import type { ICasesCreateCasefileOrderTermPresentation } from '../../interfaces/cases-create-casefile-order-term-presentation.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';

export function orderTermPresentation(
  page: ICasesCreateCasefileOrderTermPage,
): ICasesCreateCasefileOrderTermPresentation {
  return {
    title: page.title,
    fields: page.fields.map(({ name, label, kind, options }) => ({
      name,
      label,
      kind,
      options: options.map((option) => ({ ...option })),
    })),
  };
}
