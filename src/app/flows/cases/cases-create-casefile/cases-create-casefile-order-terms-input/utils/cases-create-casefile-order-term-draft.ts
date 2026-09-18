import type { ICasesCreateCasefileOrderTermDraft } from '../../interfaces/cases-create-casefile-order-term-draft.interface';
import type { ICasesCreateCasefileOrderTermPage } from '../interfaces/cases-create-casefile-order-term-page.interface';

export function restoreOrderTermDraft(
  page: ICasesCreateCasefileOrderTermPage,
  previous: ICasesCreateCasefileOrderTermDraft | null,
): ICasesCreateCasefileOrderTermDraft {
  const editable = page.fields.filter((field) => field.kind !== 'readonly');
  const fieldTypes = Object.fromEntries(editable.map((field) => [field.name, field.kind]));
  const values = Object.fromEntries(
    editable
      .filter(
        (field) =>
          previous?.resultId === page.resultId &&
          previous.fieldTypes[field.name] === field.kind &&
          Object.hasOwn(previous.values, field.name),
      )
      .map((field) => [field.name, previous!.values[field.name]]),
  );
  return {
    resultId: page.resultId,
    fieldTypes,
    values,
    dirty: previous?.resultId === page.resultId && previous.dirty && Object.keys(values).length > 0,
  };
}
