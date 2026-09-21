import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Raster der Spielkacheln: auto-fill ab 128px Breite. */
@Component({
  selector: 'z-game-grid',
  template: `<ng-content />`,
  host: { 'class': 'z-games' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZGameGrid {}

/**
 * Wählbare Spielkachel. Gewählt heißt `aria-pressed="true"` und eine 2px-Linie
 * in `accent-text`. Ohne `cover` steht der Titel als Text auf der Fläche.
 */
@Component({
  // Die API-Tabelle schreibt button[zGameTile] vor: eine Komponente mit
  // Attribut-Selektor wie Button.
  selector: 'button[zGameTile]',
  template: `<span class="z-game__cover">
      @if (cover()) {
        <img [src]="cover()" alt="" />
      } @else {
        {{ title() }}
      }
    </span>
    <span class="z-game__title">{{ title() }}</span>
    <span class="z-game__price">{{ price() }}</span>`,
  host: {
    'class': 'z-game',
    '[attr.aria-pressed]': `selected() ? "true" : "false"`,
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZGameTile {
  readonly title = input('');
  readonly price = input('');
  readonly cover = input('');
  readonly selected = input(false, { transform: booleanAttribute });
}
