import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { MojTicketPanelComponent } from '@hmcts/opal-frontend-common/components/moj/moj-ticket-panel';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { dateOfBirthValidator } from '@hmcts/opal-frontend-common/validators/date-of-birth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CasesCreateCasefileDateOfBirthAgeComponent } from './cases-create-casefile-date-of-birth-age.component';

describe('CasesCreateCasefileDateOfBirthAgeComponent', () => {
  let fixture: ComponentFixture<CasesCreateCasefileDateOfBirthAgeComponent>;
  let control: FormControl<string | null>;
  let dateService: Pick<DateService, 'isValidDate' | 'calculateAge'>;

  const render = (initialValue: string | null = null): void => {
    control = new FormControl(initialValue, dateOfBirthValidator());
    fixture = TestBed.createComponent(CasesCreateCasefileDateOfBirthAgeComponent);
    fixture.componentInstance.control = control;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    dateService = {
      isValidDate: vi.fn<DateService['isValidDate']>(),
      calculateAge: vi.fn<DateService['calculateAge']>(),
    };
    await TestBed.configureTestingModule({
      imports: [CasesCreateCasefileDateOfBirthAgeComponent],
      providers: [{ provide: DateService, useValue: dateService }],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the initial valid age in the blue alert ticket panel without an age group', () => {
    vi.mocked(dateService.isValidDate).mockReturnValue(true);
    vi.mocked(dateService.calculateAge).mockReturnValue(43);
    render('08/06/1982');

    const panel = fixture.debugElement.query(By.directive(MojTicketPanelComponent))
      .componentInstance as MojTicketPanelComponent;
    expect(panel.componentClasses).toBe('govuk-!-width-one-third');
    expect(panel.sectionClasses).toBe('moj-ticket-panel__content--blue');
    expect(panel.alert).toBe(true);
    expect(fixture.nativeElement.textContent.trim()).toBe('Age: 43');
    expect(fixture.nativeElement.textContent).not.toContain('Adult');
    expect(fixture.nativeElement.textContent).not.toContain('Youth');
  });

  it('hides invalid and empty values, then restores the panel after correction', () => {
    vi.mocked(dateService.isValidDate).mockImplementation((value) => value === '08/06/1982');
    vi.mocked(dateService.calculateAge).mockReturnValue(43);
    render();

    expect(fixture.debugElement.query(By.directive(MojTicketPanelComponent))).toBeNull();
    control.setValue('31/02/2020');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MojTicketPanelComponent))).toBeNull();
    control.setValue('08/06/1982');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('Age: 43');
    control.setValue('');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MojTicketPanelComponent))).toBeNull();
  });

  it.each([
    ['today', '04/09/2026', 0],
    ['a future date', '05/09/2026', -1],
  ])('hides the age when the date of birth is %s', (_description, dateOfBirth, calculatedAge) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 4, 12));
    vi.mocked(dateService.isValidDate).mockReturnValue(true);
    vi.mocked(dateService.calculateAge).mockReturnValue(calculatedAge);
    render(dateOfBirth);

    expect(control.hasError('invalidDateOfBirth')).toBe(true);
    expect(fixture.debugElement.query(By.directive(MojTicketPanelComponent))).toBeNull();
    expect(dateService.calculateAge).not.toHaveBeenCalled();
  });

  it('stops observing the control when destroyed', () => {
    vi.mocked(dateService.isValidDate).mockReturnValue(false);
    render();
    vi.mocked(dateService.isValidDate).mockClear();

    fixture.destroy();
    control.setValue('08/06/1982');

    expect(dateService.isValidDate).not.toHaveBeenCalled();
  });
});
