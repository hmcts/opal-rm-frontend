import { Injectable } from '@angular/core';
import { defer, Observable, of } from 'rxjs';
import type { ICasesCreateCasefileOrderTermField } from '../interfaces/cases-create-casefile-order-term-field.interface';
import { CASES_CREATE_CASEFILE_ORDER_TERM_LOOKUP_MOCK } from '../mocks/cases-create-casefile-order-term-lookup.mock';

@Injectable()
export class CasesCreateCasefileOrderTermLookupsService {
  public resolve(fields: ICasesCreateCasefileOrderTermField[]): Observable<ICasesCreateCasefileOrderTermField[]> {
    return defer(() =>
      of(
        fields.map((field) => {
          if (field.lookup === null) return field;
          if (field.lookup !== 'mock:order-term-options') throw new Error('Unsupported order-term lookup');
          return {
            ...field,
            options: CASES_CREATE_CASEFILE_ORDER_TERM_LOOKUP_MOCK.map((option) => ({ ...option })),
          };
        }),
      ),
    );
  }
}
