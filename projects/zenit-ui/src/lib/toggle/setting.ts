import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One row of a settings list: title, configuration key and effect on the left,
 * the control itself on the right as projected content.
 *
 * Renders the class `z-setting` on the host and inside it a
 * `div.z-setting__text` with `span.z-setting__title`, optionally the key in
 * `span.z-subtle.z-mono.caption` and the description in `span.z-muted`. The
 * projected control follows that block. Key and description only appear when
 * they are not empty.
 *
 * Accessibility: {@link titleId} puts an `id` on the title so the control in
 * the row can point at it, which is how `z-toggle` gets its name through
 * `ariaLabelledby`. The native `title` attribute is suppressed on the host, so
 * the browser does not hang its own tooltip on the whole row because of the
 * {@link title} input.
 *
 * @example
 * ```html
 * <z-setting
 *   title="PvP"
 *   key="pvp"
 *   description="Spieler können sich gegenseitig angreifen."
 *   titleId="pvp-titel"
 * >
 *   <z-toggle [(checked)]="pvp" ariaLabelledby="pvp-titel" />
 * </z-setting>
 * ```
 */
@Component({
  selector: 'z-setting',
  template: `
    <div class="z-setting__text">
      <span class="z-setting__title" [attr.id]="titleId() || null">{{ title() }}</span>
      @if (key()) {
        <span class="z-subtle z-mono caption">{{ key() }}</span>
      }
      @if (description()) {
        <span class="z-muted">{{ description() }}</span>
      }
    </div>
    <ng-content />
  `,
  host: {
    class: 'z-setting',
    // Otherwise the browser hangs its own tooltip on the whole row because of
    // the static attribute title="…".
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSetting {
  /**
   * Name of the setting in normal capitalization, without an icon.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Configuration key belonging to the setting, for example `pvp`. Shown in the
   * mono face below the title; empty renders nothing.
   *
   * @default ''
   */
  readonly key = input('');

  /**
   * One sentence on what the setting does. If the change only takes effect
   * after a restart, that belongs here. Empty renders nothing.
   *
   * @default ''
   */
  readonly description = input('');

  /**
   * `id` written onto the title, so the control in the row can name itself
   * through `aria-labelledby`. Empty writes no attribute.
   *
   * @default ''
   */
  readonly titleId = input('');
}
