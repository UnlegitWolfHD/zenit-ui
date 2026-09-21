import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * The tooltip panel: renders its text on a host with the class `z-tooltip`,
 * `role="tooltip"` and the id the trigger points its `aria-describedby` at.
 * It hangs in the CDK overlay on the body, not in the page flow, and is only
 * created by the `zTooltip` directive.
 *
 * @internal Exported for the directive only; not part of the public API and not
 * re-exported from the entry point.
 */
@Component({
  selector: 'z-tooltip',
  template: `{{ text() }}`,
  host: {
    class: 'z-tooltip',
    role: 'tooltip',
    '[attr.id]': `id()`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTooltipPanel {
  /** Text of the tooltip, set by the directive when the panel is attached. */
  readonly text = signal('');

  /** id the trigger refers to through `aria-describedby`. */
  readonly id = signal('');
}
