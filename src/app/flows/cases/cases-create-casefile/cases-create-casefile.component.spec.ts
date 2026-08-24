import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CASES_CREATE_CASEFILE_CASE_TYPES } from './constants/cases-create-casefile-case-types.constant';
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

  it('resets journey state on shell destruction', () => {
    store.setCaseTypeSelection({ caseType: CASES_CREATE_CASEFILE_CASE_TYPES.REMO_OUT });
    component.ngOnDestroy();
    expect(store.caseTypeSelection()).toBeNull();
    expect(store.stateChanges()).toBe(false);
  });
});
