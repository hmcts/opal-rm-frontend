import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CanDeactivateTypes } from '@hmcts/opal-frontend-common/guards/can-deactivate/types';
import { CasesCreateCasefileStore } from './stores/cases-create-casefile.store';

@Component({
  selector: 'app-cases-create-casefile',
  imports: [RouterOutlet],
  templateUrl: './cases-create-casefile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesCreateCasefileComponent implements OnDestroy {
  private readonly store = inject(CasesCreateCasefileStore);

  @HostListener('window:beforeunload')
  public handleBeforeUnload(): boolean {
    return !this.store.unsavedChanges() && !this.store.stateChanges();
  }

  public canDeactivate(): CanDeactivateTypes {
    return !this.store.unsavedChanges() && !this.store.stateChanges();
  }

  public ngOnDestroy(): void {
    this.store.resetStore();
  }
}
