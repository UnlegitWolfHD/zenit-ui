import { booleanAttribute, ChangeDetectionStrategy, Component, model, input } from '@angular/core';

/**
 * Folds away settings most visitors do not need: build, Java version, start
 * script. Everything inside has a working default, so nobody has to open it in
 * order to order.
 *
 * Renders a native `<details class="z-disclosure">` with the title in the
 * `<summary>`, the short line in a `<small>` next to it, plus and minus in the
 * mono face, and the projected fields in `.z-disclosure__body`. Unlike `z-faq`
 * it carries a border, because it holds controls.
 *
 * Accessibility: because it is the native element, opening and closing work
 * without JavaScript and the state is announced; the component adds no
 * keyboard handling of its own. The `title` input is kept off the host, so the
 * browser hangs no tooltip of its own on the whole block.
 *
 * Not for required fields, and not to make a long form look shorter. Once
 * something inside is changed, the caller updates {@link summary} so the
 * closed row says so ("Java 21, eigene Startparameter").
 *
 * @example
 * ```html
 * <z-disclosure title="Expertenmodus" summary="Build, Java-Version, Startscript" [(open)]="expert">
 *   <z-field label="Java-Version" for="d-java">…</z-field>
 * </z-disclosure>
 * ```
 */
@Component({
  selector: 'z-disclosure',
  template: `<details class="z-disclosure" [open]="open()" (toggle)="aufUmschalten($event)">
    <summary>
      @if (titleMono()) {
        <span class="z-mono">{{ title() }}</span>
      } @else {
        {{ title() }}
      }
      @if (summary()) {
        <small>{{ summary() }}</small>
      }
    </summary>
    <div class="z-disclosure__body"><ng-content /></div>
  </details>`,
  host: {
    // Otherwise the browser hangs its own tooltip on the whole block because
    // of the static attribute title="…".
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZDisclosure {
  /**
   * Name of the section in the `<summary>`, for example "Expertenmodus".
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * Sets the title in the mono face, for a section named by a technical value
   * such as an endpoint (`GET /api/v1/gameservers`). The title then stands in a
   * `span.z-mono` inside the `<summary>`, which keeps it as the accessible name
   * of the disclosure. Boolean attribute.
   *
   * @default false
   */
  readonly titleMono = input(false, { transform: booleanAttribute });

  /**
   * What is inside, in keywords, for example "Build, Java-Version,
   * Startscript". Once the visitor changes something in there, the caller
   * writes what that was. Empty renders nothing.
   *
   * @default ''
   */
  readonly summary = input('');

  /**
   * Whether the section is open, two-way bindable in both directions: a write
   * opens or closes it, and the visitor's own click reports back through the
   * native `toggle` event.
   *
   * @default false
   */
  readonly open = model(false);

  protected aufUmschalten(ereignis: Event): void {
    this.open.set((ereignis.target as HTMLDetailsElement).open);
  }
}
