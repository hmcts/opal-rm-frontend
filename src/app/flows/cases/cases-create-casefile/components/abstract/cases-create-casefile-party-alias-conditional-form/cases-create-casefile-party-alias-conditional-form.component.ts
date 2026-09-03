import { Component, type OnDestroy } from '@angular/core';
import type { ValidatorFn } from '@angular/forms';
import { AbstractFormAliasBaseComponent } from '@hmcts/opal-frontend-common/components/abstract/abstract-form-alias-base';
import { Subject, takeUntil, type Observable } from 'rxjs';
import type { ICasesCreateCasefilePartyAlias } from '../../../interfaces/cases-create-casefile-party-alias.interface';
import { updateCasesCreateCasefileConditionalControls } from '../../../utils/cases-create-casefile-conditional-controls';

export interface ICasesCreateCasefileConditionalBranch<TControlName extends string> {
  checkbox: TControlName;
  requiredText: readonly TControlName[];
  requiredCountry: readonly TControlName[];
  controls: readonly TControlName[];
}

@Component({ template: '' })
export abstract class CasesCreateCasefilePartyAliasConditionalFormComponent<
  TControlName extends string,
  TAliasRow extends Record<string, string | null>,
>
  extends AbstractFormAliasBaseComponent
  implements OnDestroy
{
  private readonly partyAliasConditionalDestroyed = new Subject<void>();

  protected abstract readonly conditionalBranches: readonly ICasesCreateCasefileConditionalBranch<TControlName>[];
  protected abstract readonly requiredTextValidator: ValidatorFn;

  protected get partyAliasConditionalDestroyed$(): Observable<void> {
    return this.partyAliasConditionalDestroyed;
  }

  private clearErrorEntries(matches: (fieldId: string) => boolean): void {
    this.formErrorSummaryMessage = this.formErrorSummaryMessage.filter((error) => !matches(error.fieldId));
    this.formErrors = (this.formErrors ?? []).filter((error) => !matches(error.fieldId));
  }

  private clearAliasErrors(controlNames?: readonly string[]): void {
    const matches = controlNames
      ? (fieldId: string) => controlNames.includes(fieldId)
      : (fieldId: string) => this.aliasFields.some((field) => fieldId.startsWith(`${field}_`));

    this.clearErrorEntries(matches);
  }

  private setupAliasErrorCleanupListener(): void {
    const aliasCheckbox = Object.entries(this.form.controls).find(([controlName]) =>
      controlName.endsWith('_add_aliases'),
    )?.[1];

    aliasCheckbox?.valueChanges.pipe(takeUntil(this.partyAliasConditionalDestroyed)).subscribe((selected) => {
      if (selected !== true) {
        this.clearAliasErrors();
      }
    });
  }

  private updateConditionalBranch(
    branch: ICasesCreateCasefileConditionalBranch<TControlName>,
    selected: boolean,
  ): void {
    updateCasesCreateCasefileConditionalControls(
      {
        controls: branch.controls.map((controlName) => this.form.controls[controlName]),
        requiredTextControls: new Set(branch.requiredText.map((controlName) => this.form.controls[controlName])),
        requiredCountryControls: new Set(branch.requiredCountry.map((controlName) => this.form.controls[controlName])),
        requiredTextValidator: this.requiredTextValidator,
      },
      selected,
    );

    if (!selected) {
      this.clearConditionalBranchErrors(branch.controls);
    }
  }

  private setupConditionalBranchListeners(): void {
    for (const branch of this.conditionalBranches) {
      this.form.controls[branch.checkbox].valueChanges
        .pipe(takeUntil(this.partyAliasConditionalDestroyed))
        .subscribe((selected) => this.updateConditionalBranch(branch, selected === true));
    }
  }

  protected clearConditionalBranchErrors(controlNames: readonly string[]): void {
    for (const controlName of controlNames) {
      this.formControlErrorMessages[controlName] = null;
    }
    this.clearErrorEntries((fieldId) => controlNames.includes(fieldId));
  }

  protected initialisePartyAliasConditionalBehaviour(): void {
    this.setupAliasErrorCleanupListener();
    this.setupConditionalBranchListeners();
  }

  protected applyInitialConditionalBranches(): void {
    for (const branch of this.conditionalBranches) {
      this.updateConditionalBranch(branch, this.form.controls[branch.checkbox].value === true);
    }
  }

  protected mapAliases(rows: readonly TAliasRow[]): ICasesCreateCasefilePartyAlias[] {
    const [firstNamesField, lastNameField] = this.aliasFields;

    return rows.map((row, index) => ({
      firstNames: row[`${firstNamesField}_${index}`]!,
      lastName: row[`${lastNameField}_${index}`]!,
    }));
  }

  protected normaliseCountryId(value: string | number | null): number | null {
    if (value === null || value === '') {
      return null;
    }
    return Number(value);
  }

  public override addAlias(index: number, formArrayName: string): void {
    if (this.aliasControls.length < 5) {
      this.form.markAsDirty();
      super.addAlias(index, formArrayName);
    }
  }

  public override removeAlias(index: number, formArrayName: string, event?: Event): void {
    const shouldFocusRemainingAlias = this.aliasControls.length === 2;
    const removedControlNames = this.aliasFields
      .map((field) => this.aliasControls[index]?.[field]?.controlName)
      .filter((controlName): controlName is string => controlName !== undefined);
    this.form.markAsDirty();
    super.removeAlias(index, formArrayName, event);
    this.clearAliasErrors(removedControlNames);
    if (shouldFocusRemainingAlias) {
      this.focusFirstAliasField();
    }
  }

  public override ngOnDestroy(): void {
    this.partyAliasConditionalDestroyed.next();
    this.partyAliasConditionalDestroyed.complete();
    super.ngOnDestroy();
  }
}
