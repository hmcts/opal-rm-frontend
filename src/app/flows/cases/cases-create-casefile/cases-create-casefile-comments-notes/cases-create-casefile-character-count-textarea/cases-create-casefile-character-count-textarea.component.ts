import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cases-create-casefile-character-count-textarea',
  imports: [ReactiveFormsModule],
  templateUrl: './cases-create-casefile-character-count-textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileCharacterCountTextareaComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly controlValue = signal('');
  private readonly maxCharacterLimitValue = signal(0);
  private controlSubscription?: Subscription;
  private formControl!: FormControl<string | null>;

  @Input({ required: true }) public labelText!: string;
  @Input({ required: true }) public hintText!: string;
  @Input({ required: true }) public inputId!: string;
  @Input({ required: true }) public inputName!: string;
  @Input({ required: true }) public rows!: number;
  @Input({ required: true })
  public set maxCharacterLimit(maxCharacterLimit: number) {
    this.maxCharacterLimitValue.set(maxCharacterLimit);
  }

  public get maxCharacterLimit(): number {
    return this.maxCharacterLimitValue();
  }

  @Input() public errors: string | null = null;

  @Input({ required: true })
  public set control(control: FormControl<string | null>) {
    this.controlSubscription?.unsubscribe();
    this.formControl = control;
    this.controlValue.set(control.value ?? '');
    this.controlSubscription = control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.controlValue.set(value ?? ''));
  }

  public get control(): FormControl<string | null> {
    return this.formControl;
  }

  public readonly remainingCharacterCount = computed(() => this.maxCharacterLimitValue() - this.controlValue().length);

  public get describedBy(): string {
    return [
      `${this.inputId}-hint`,
      `${this.inputId}-with-hint-info`,
      ...(this.errors ? [`${this.inputId}-error-message`] : []),
    ].join(' ');
  }
}
