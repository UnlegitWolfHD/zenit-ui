import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { ZTokenAttribut } from '../a11y/host-attribute';
import { ZField } from './field';

/**
 * Wrapper around a native `<select>`. The select stays native because of
 * keyboard handling, screen readers and the system wheel on mobile devices;
 * the component only provides the surface with the classes `z-select` and
 * `z-select--sm`, which looks the same as an input.
 *
 * Accessibility: inside a `z-field` the projected `<select>` receives that
 * field's `aria-describedby` pointing at the hint or error. Use a select for a
 * short, fixed list; up to four options that are meant to be compared are a
 * segment, and from about 15 options on a search field is needed.
 *
 * @example
 * ```html
 * <z-field label="Status" for="sel-status">
 *   <z-select>
 *     <select id="sel-status">
 *       <option>Alle Status</option>
 *       <option>Online</option>
 *       <option>Gestoppt</option>
 *     </select>
 *   </z-select>
 * </z-field>
 * ```
 */
@Component({
  selector: 'z-select',
  template: `<ng-content />`,
  host: {
    class: 'z-select',
    '[class.z-select--sm]': `size() === 'sm'`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZSelect implements AfterContentChecked {
  /**
   * Height of the control: `md` for forms, `sm` for filter rows next to the
   * search field. Adds `z-select--sm` for `sm`.
   *
   * @default 'md'
   */
  readonly size = input<'sm' | 'md'>('md');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly feld = inject(ZField, { optional: true });
  private ziel?: HTMLSelectElement;
  private beschreibung?: ZTokenAttribut;

  constructor() {
    // The `<select>` belongs to the caller and may outlive the component, so
    // it keeps its own description and loses only the id of the field.
    inject(DestroyRef).onDestroy(() => this.beschreibung?.setze(null));
  }

  /**
   * Keeps the id of the hint or the error of the surrounding `z-field` in the
   * `aria-describedby` of the projected `<select>`.
   *
   * The `<select>` is projected content, so a host binding cannot reach it.
   * Content hooks run in the view that declares the content, so this hook
   * covers both cases: error or hint changing, and the `<select>` appearing
   * later behind an `@if`. No signal tracking needed, hence no race with the
   * change detection guard.
   *
   * The id is one token among whatever the caller wrote on the `<select>`, not
   * the whole attribute: writing the attribute as a whole used to delete a
   * `aria-describedby` of the caller's own.
   *
   * Angular lifecycle hook. Deliberately without the internal tag: `stripInternal` removed it from the
   * typings, and consumers with `skipLibCheck: false` got TS2420 (implements without the method).
   */
  ngAfterContentChecked(): void {
    const ziel = this.el.nativeElement.querySelector('select');
    if (!ziel) {
      return;
    }
    if (ziel !== this.ziel) {
      this.beschreibung?.setze(null);
      this.beschreibung = new ZTokenAttribut(ziel, 'aria-describedby', 'vorn');
      this.ziel = ziel;
    }
    this.beschreibung?.setze(this.feld?.beschreibung() ?? null);
  }
}
