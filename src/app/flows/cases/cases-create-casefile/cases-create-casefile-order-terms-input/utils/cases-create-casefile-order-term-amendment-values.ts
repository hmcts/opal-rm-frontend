import type { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import type { ICasesCreateCasefileAcceptedOrderTerm } from '../../interfaces/cases-create-casefile-accepted-order-term.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';
import type { CasesCreateCasefileOrderTermRawValue } from '../types/cases-create-casefile-order-term-raw-value.type';

export function amendmentRawValues(
  term: ICasesCreateCasefileAcceptedOrderTerm,
  page: ICasesCreateCasefileOrderTermPage,
  dates: DateService,
): Record<string, CasesCreateCasefileOrderTermRawValue> {
  return Object.fromEntries(
    page.fields
      .filter((field) => field.kind !== 'readonly' && Object.hasOwn(term.parameters, field.name))
      .filter((field) =>
        term.presentation.fields.some((saved) => saved.name === field.name && saved.kind === field.kind),
      )
      .map((field) => {
        const value = term.parameters[field.name];
        return [
          field.name,
          field.kind === 'date' ? dates.getFromFormat(String(value), 'yyyy-MM-dd').toFormat('dd/MM/yyyy') : value,
        ];
      }),
  );
}
