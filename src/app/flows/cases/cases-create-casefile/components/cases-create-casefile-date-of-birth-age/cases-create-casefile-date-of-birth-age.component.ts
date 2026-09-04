import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { MojTicketPanelComponent } from '@hmcts/opal-frontend-common/components/moj/moj-ticket-panel';
import { DateService } from '@hmcts/opal-frontend-common/services/date-service';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-cases-create-casefile-date-of-birth-age',
  imports: [MojTicketPanelComponent],
  templateUrl: './cases-create-casefile-date-of-birth-age.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileDateOfBirthAgeComponent implements OnInit {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly dateService = inject(DateService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) public control!: FormControl<string | null>;
  public age: number | null = null;

  public ngOnInit(): void {
    this.control.valueChanges
      .pipe(startWith(this.control.value), takeUntilDestroyed(this.destroyRef))
      .subscribe((dateOfBirth) => {
        this.age =
          dateOfBirth !== null && this.dateService.isValidDate(dateOfBirth)
            ? this.dateService.calculateAge(dateOfBirth)
            : null;
        this.changeDetectorRef.markForCheck();
      });
  }
}
