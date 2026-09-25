import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { patchState, WritableStateSource } from '@ngrx/signals';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from './constants/cases-create-casefile-case-types.constant';
import type { ICasesCreateCasefileState } from './interfaces/cases-create-casefile-state.interface';
import { CasesCreateCasefileStore } from './stores/cases-create-casefile.store';
import { CasesCreateCasefileComponent } from './cases-create-casefile.component';

describe('CasesCreateCasefileComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileComponent>;
  let component: CasesCreateCasefileComponent;
  let store: InstanceType<typeof CasesCreateCasefileStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CasesCreateCasefileComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(CasesCreateCasefileStore);
    store.resetStore();
    fixture.detectChanges();
  });

  it('allows unload when there are no changes', () => {
    expect(component.handleBeforeUnload()).toBe(true);
    expect(component.canDeactivate()).toBe(true);
  });

  it('blocks unload for unsaved form edits', () => {
    store.setUnsavedChanges(true);
    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);
  });

  it('prevents the browser beforeunload event when changes exist', () => {
    store.setUnsavedChanges(true);
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('blocks external departure after valid journey state is saved', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);
  });

  it('blocks departure and unload for a populated creditor draft until it is cleared', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      stateChanges: false,
      unsavedChanges: false,
      creditorDraft: {
        termId: 1,
        branch: 'add-new',
        details: {
          identity: { type: 'organisation', organisationName: 'Example creditor' },
          address: {
            addressLine1: '1 Test Street',
            addressLine2: null,
            addressLine3: null,
            addressLine4: null,
            addressLine5: null,
            postalOrZipCode: null,
            countryId: 826,
          },
          bank: { type: 'none' },
        },
        countryName: 'United Kingdom',
      },
    });

    expect(component.handleBeforeUnload()).toBe(false);
    expect(component.canDeactivate()).toBe(false);

    store.clearCreditorDraft();
    expect(component.handleBeforeUnload()).toBe(true);
    expect(component.canDeactivate()).toBe(true);
  });

  it('clears a populated creditor draft when the shell is destroyed', () => {
    patchState(store as unknown as WritableStateSource<ICasesCreateCasefileState>, {
      creditorDraft: { termId: 1, branch: 'add-new', countryName: 'United Kingdom' },
    });

    component.ngOnDestroy();

    expect(store.creditorDraft()).toBeNull();
  });

  it('resets journey state on shell destruction', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    component.ngOnDestroy();
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.stateChanges()).toBe(false);
  });
});
