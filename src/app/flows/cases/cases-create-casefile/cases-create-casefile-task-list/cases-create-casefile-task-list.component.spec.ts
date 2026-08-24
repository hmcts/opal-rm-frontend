import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CasesCreateCasefileTaskListComponent } from './cases-create-casefile-task-list.component';

describe('CasesCreateCasefileTaskListComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileTaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CasesCreateCasefileTaskListComponent] }).compileComponents();
    fixture = TestBed.createComponent(CasesCreateCasefileTaskListComponent);
  });

  it('renders the Task List heading', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent.trim()).toBe('Task List');
  });
});
