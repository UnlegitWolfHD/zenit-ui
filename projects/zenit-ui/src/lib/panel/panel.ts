import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  Directive,
  input,
} from '@angular/core';

/** Aktion im Panel-Kopf. */
@Directive({ selector: '[zPanelActions]' })
export class ZPanelActions {}

/** Der einzige Container mit Rahmen. Fasst Daten oder ein Werkzeug zusammen. */
@Component({
  selector: 'z-panel',
  template: `
    @if (title() || aktionen()) {
      <div class="z-panel__header">
        @if (title()) {
          <h3 class="z-panel__title">{{ title() }}</h3>
        }
        <ng-content select="[zPanelActions]" />
      </div>
    }
    <div class="z-panel__body" [class.z-panel__body--flush]="flush()">
      <ng-content />
    </div>
    <ng-content select="z-pagination" />
  `,
  host: {
    'class': 'z-panel',
    '[attr.title]': `null`,
    '[attr.aria-busy]': `busy() ? "true" : null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZPanel {
  readonly title = input('');
  readonly flush = input(false, { transform: booleanAttribute });
  readonly busy = input(false, { transform: booleanAttribute });

  protected readonly aktionen = contentChild(ZPanelActions);
}
