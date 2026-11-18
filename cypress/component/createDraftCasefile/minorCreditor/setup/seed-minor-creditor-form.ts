import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CasesCreateCasefileMinorCreditorDetailsFormComponent } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/cases-create-casefile-minor-creditor-details-form/cases-create-casefile-minor-creditor-details-form.component';
import type { ICasesCreateCasefileMinorCreditorFormData } from 'src/app/flows/cases/cases-create-casefile/cases-create-casefile-minor-creditor-details/interfaces/cases-create-casefile-minor-creditor-form-data.interface';

/** Seeds setup-only fields on the active routed form; Save and subsequent transitions remain real interactions. */
export function seedMinorCreditorForm(values: Partial<ICasesCreateCasefileMinorCreditorFormData>) {
  return cy.get<ComponentFixture<unknown>>('@casefileFixture').then((fixture) => {
    const child = fixture.debugElement.query(By.directive(CasesCreateCasefileMinorCreditorDetailsFormComponent))
      ?.componentInstance as CasesCreateCasefileMinorCreditorDetailsFormComponent | undefined;
    if (!child) throw new Error('Minor Creditor seed requires the rendered form');
    child.form.patchValue(structuredClone(values));
    fixture.detectChanges();
  });
}
