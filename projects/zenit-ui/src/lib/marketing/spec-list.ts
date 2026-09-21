import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Ein Begriff-Wert-Paar. `mono` setzt den Wert in die Monoschrift. */
export interface ZSpecItem {
  term: string;
  value: string;
  note?: string;
  mono?: boolean;
}

/** Fakten als Begriff-Wert-Paare. Unter 480px steht der Wert unter dem Begriff. */
@Component({
  selector: 'z-spec-list',
  template: `<dl class="z-spec">
    @for (eintrag of items(); track $index) {
      <dt>{{ eintrag.term }}</dt>
      <dd>
        @if (eintrag.mono) {
          <span class="z-mono">{{ eintrag.value }}</span>
        } @else {
          {{ eintrag.value }}
        }
        @if (eintrag.note) {
          <small>{{ eintrag.note }}</small>
        }
      </dd>
    }
  </dl>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSpecList {
  readonly items = input<ZSpecItem[]>([]);
}
