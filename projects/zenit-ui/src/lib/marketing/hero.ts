import { ChangeDetectionStrategy, Component, Directive, input } from '@angular/core';

/**
 * Marks the at most two buttons of the hero, one `primary` in size `lg` and
 * optionally one `secondary`. Adds the class `z-hero__actions` and renders
 * nothing itself. `z-hero` places it between the lead and the note.
 *
 * @example
 * ```html
 * <div zHeroActions>
 *   <button zBtn="primary" size="lg">Server erstellen</button>
 *   <button zBtn="secondary" size="lg">Preis berechnen</button>
 * </div>
 * ```
 */
@Directive({
  selector: '[zHeroActions]',
  host: { class: 'z-hero__actions' },
})
export class ZHeroActions {}

/**
 * Marks the right-hand column of the hero: a price list, the configurator or a
 * screenshot of the panel, never an illustration. Pure slot marker, it adds no
 * class and no markup. Sub-pages often leave it out.
 *
 * @example
 * ```html
 * <z-panel zHeroAside title="Günstigste Spiele" flush>…</z-panel>
 * ```
 */
@Directive({ selector: '[zHeroAside]' })
export class ZHeroAside {}

/**
 * Head of a public page: one statement, one sentence, at most two buttons and a
 * real piece of the product on the right.
 *
 * Renders the left column as `<h1 class="z-hero__title">`, the optional
 * `<p class="z-hero__lead">`, the `[zHeroActions]` slot and the optional
 * `<p class="z-hero__note">`, followed by the `[zHeroAside]` slot as the right
 * column. The host carries `z-hero` and its native `title` attribute is
 * cleared, so the {@link title} input never becomes a browser tooltip.
 *
 * Two columns in a 7 to 5 ratio, single column below 900px. The size of the
 * heading lives in `z-hero__title` and drops from `display-xl` to `display-lg`
 * below 640px, whatever {@link headingLevel} says. On a public page the heading
 * is the `<h1>`, so there is exactly one hero per page.
 *
 * @example
 * ```html
 * <z-hero
 *   title="Gameserver aus Nürnberg. In etwa 60 Sekunden online."
 *   lead="Spiel wählen, RAM einstellen, starten. Ab 1,98&nbsp;€ im Monat, monatlich kündbar."
 *   note="Keine Kreditkarte nötig · DDoS-Schutz inklusive"
 * >
 *   <div zHeroActions>
 *     <button zBtn="primary" size="lg">Server erstellen</button>
 *   </div>
 *   <z-panel zHeroAside title="Günstigste Spiele" flush>…</z-panel>
 * </z-hero>
 * ```
 */
@Component({
  selector: 'z-hero',
  template: `
    <div>
      @switch (headingLevel()) {
        @case (2) {
          <h2 class="z-hero__title">{{ title() }}</h2>
        }
        @case (3) {
          <h3 class="z-hero__title">{{ title() }}</h3>
        }
        @default {
          <h1 class="z-hero__title">{{ title() }}</h1>
        }
      }
      @if (lead()) {
        <p class="z-hero__lead">{{ lead() }}</p>
      }
      <ng-content select="[zHeroActions]" />
      @if (note()) {
        <p class="z-hero__note">{{ note() }}</p>
      }
    </div>
    <ng-content select="[zHeroAside]" />
  `,
  host: {
    class: 'z-hero',
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZHero {
  /**
   * The heading of the page: what there is and where it comes from. One colour
   * throughout, the second line is never tinted.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Tag of the heading: `1`, `2` or `3`. The design system prescribes `1` for
   * public pages, where the hero is the page heading. Lower it only where the
   * page already owns its `<h1>`, for example on a component page that shows a
   * hero as an example. The visual size never changes with it.
   *
   * @default 1
   */
  readonly headingLevel = input<1 | 2 | 3, 1 | 2 | 3 | '1' | '2' | '3'>(1, {
    transform: (wert) => Number(wert) as 1 | 2 | 3,
  });

  /**
   * One sentence with the three strongest facts (process, hardware, price).
   * Empty leaves the paragraph out.
   *
   * @default ''
   */
  readonly lead = input('');

  /**
   * One line with at most three promises, separated by middle dots. Empty
   * leaves the line out.
   *
   * @default ''
   */
  readonly note = input('');
}
