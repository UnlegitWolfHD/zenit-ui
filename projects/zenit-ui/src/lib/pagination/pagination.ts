import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  numberAttribute,
  untracked,
} from '@angular/core';
import { ZButton } from '../button';
import { ZIcon } from '../icon';

/**
 * Blaettert durch Listen mit mehr als `pageSize` Eintraegen und steht als
 * letzte Zeile im Panel. Passt alles auf eine Seite, rendert sie nichts.
 */
@Component({
  selector: 'z-pagination',
  imports: [ZButton, ZIcon],
  template: `
    @if (sichtbar()) {
      <div class="z-pager">
        <span>{{ von() }} bis {{ bis() }} von {{ total() }} {{ itemLabel() }}</span>
        <div class="z-pager__nav">
          <button
            zBtn="ghost"
            iconOnly
            size="sm"
            [attr.aria-label]="ariaLabelPrev()"
            [disabled]="seite() <= 1"
            (click)="zuSeite(seite() - 1)"
          >
            <z-icon name="chevron_left" />
          </button>
          <span class="z-mono">{{ seite() }} / {{ seiten() }}</span>
          <button
            zBtn="ghost"
            iconOnly
            size="sm"
            [attr.aria-label]="ariaLabelNext()"
            [disabled]="seite() >= seiten()"
            (click)="zuSeite(seite() + 1)"
          >
            <z-icon name="chevron_right" />
          </button>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPagination {
  /** 1-basiert. */
  readonly page = model(1);
  readonly pageSize = input(25, { transform: numberAttribute });
  readonly total = input(0, { transform: numberAttribute });
  /** Gegenstand der Liste, zum Beispiel "Rechnungen". */
  readonly itemLabel = input('');
  readonly ariaLabelPrev = input('Vorherige Seite');
  readonly ariaLabelNext = input('Nächste Seite');

  protected readonly seiten = computed(() =>
    Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))),
  );
  /** Die angezeigte Seite liegt immer im gueltigen Bereich. */
  protected readonly seite = computed(() =>
    Math.min(Math.max(1, Math.trunc(this.page())), this.seiten()),
  );
  protected readonly sichtbar = computed(() => this.total() > 0 && this.total() > this.pageSize());
  protected readonly von = computed(() => (this.seite() - 1) * this.pageSize() + 1);
  protected readonly bis = computed(() => Math.min(this.seite() * this.pageSize(), this.total()));

  constructor() {
    // Aendern sich total oder pageSize, wandert eine zu hohe Seite zurueck in
    // den gueltigen Bereich.
    effect(() => {
      const geklemmt = this.seite();
      if (untracked(this.page) !== geklemmt) {
        this.page.set(geklemmt);
      }
    });
  }

  protected zuSeite(ziel: number): void {
    this.page.set(Math.min(Math.max(1, ziel), this.seiten()));
  }
}
