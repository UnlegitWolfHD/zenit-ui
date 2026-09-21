import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Material Icons ligature. The icon is always decorative: the host carries a
 * fixed `aria-hidden="true"`, so the meaning has to come from the visible text
 * next to it or from an `aria-label` on the surrounding control.
 *
 * Renders the ligature name as the host's text content, with the classes
 * `material-icons z-icon` and `z-icon--sm` for the small size. An icon belongs
 * only where it helps to find something again: sidebar, toolbars, buttons with
 * an action. Not in front of headings, panel titles or facts.
 *
 * @example
 * ```html
 * <button zBtn="primary"><z-icon name="add" />Server erstellen</button>
 * <z-badge status="success" dot>Online</z-badge>
 * <z-icon name="dns" size="sm" />
 * ```
 */
@Component({
  selector: 'z-icon',
  template: `{{ name() }}`,
  host: {
    class: 'material-icons z-icon',
    '[class.z-icon--sm]': `size() === 'sm'`,
    'aria-hidden': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZIcon {
  /**
   * Name of the Material Icons ligature, for example `dns`, `restart_alt` or
   * `more_vert`. Required.
   */
  readonly name = input.required<string>();

  /**
   * Rendered size: `md` is the regular 20px icon, `sm` the 16px variant used
   * inside badges and small buttons. Adds `z-icon--sm` for `sm`.
   *
   * @default 'md'
   */
  readonly size = input<'sm' | 'md'>('md');
}
