import {
  booleanAttribute,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { leiheAttribut, ZTokenAttribut } from '../a11y/host-attribute';
import { ZField } from './field';

/**
 * Native `<input>` or `<textarea>` in Zenit style. The element stays native,
 * the directive only adds classes and accessibility state.
 *
 * Adds the class `z-input`, plus `z-input--sm` for the small size and
 * `z-input--mono` for monospace values. The error state is expressed as
 * `aria-invalid="true"`, and the danger border hooks onto that attribute.
 * Inside a `z-field` the `aria-describedby` attribute points at that field's
 * hint or error. The native `size` attribute is removed from the host, because
 * the input `size` carries `sm`/`md` here, which would be invalid HTML.
 *
 * Both attributes belong to the caller as much as to the library, so neither
 * is a host binding. The id of the field is one token in front of whatever the
 * caller wrote in `aria-describedby`, and it is removed again when hint and
 * error are gone; a `zTooltip` on the same element adds its own token at the
 * back, so caller, field and tooltip write the same attribute without deleting
 * one another. `aria-invalid` is borrowed the same way: while {@link invalid}
 * holds, the library value stands, and afterwards the caller's own value comes
 * back.
 *
 * @example
 * ```html
 * <z-field label="Adresse" for="in-addr" hint="IP und Port deines Servers.">
 *   <input zInput mono id="in-addr" value="203.0.113.10:25565" readonly />
 * </z-field>
 *
 * <z-field label="Notiz" for="in-note">
 *   <textarea zInput id="in-note" placeholder="Was hast du zuletzt geändert?"></textarea>
 * </z-field>
 * ```
 */
@Directive({
  selector: 'input[zInput], textarea[zInput]',
  host: {
    class: 'z-input',
    '[class.z-input--sm]': `size() === 'sm'`,
    '[class.z-input--mono]': `mono()`,
    // size is the name from the API table, but as a native attribute on the
    // <input> the value "sm" would be invalid HTML.
    '[attr.size]': `null`,
  },
})
export class ZInput {
  /**
   * Height of the control: `md` for forms, `sm` for fields in toolbars and
   * filter rows. Adds `z-input--sm` for `sm`.
   *
   * @default 'md'
   */
  readonly size = input<'sm' | 'md'>('md');

  /**
   * Sets the monospace font with tabular figures. For numbers, ports, IP
   * addresses, file names and configuration values. Boolean attribute.
   *
   * @default false
   */
  readonly mono = input(false, { transform: booleanAttribute });

  /**
   * Marks the value as invalid: sets `aria-invalid="true"` and with it the
   * danger border, while {@link touched} holds too. Goes together with `error`
   * on the surrounding `z-field`. The Signal Forms `[formField]` on the same
   * element sets it from the field state, and Angular then rejects an own
   * `[invalid]` binding. Boolean attribute.
   *
   * @default false
   */
  readonly invalid = input(false, { transform: booleanAttribute });

  /**
   * Whether the user has left the field, which gates {@link invalid}, so an
   * empty required field does not start out with a danger border. Set by
   * `[formField]`; outside Signal Forms it stays `true` and {@link invalid}
   * alone decides. Boolean attribute.
   *
   * @default true
   */
  readonly touched = input(true, { transform: booleanAttribute });

  private readonly feld = inject(ZField, { optional: true });

  constructor() {
    leiheAttribut('aria-invalid', () => (this.invalid() && this.touched() ? 'true' : null));
    const beschreibung = new ZTokenAttribut(
      inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
      'aria-describedby',
      'vorn',
    );
    effect(() => beschreibung.setze(this.feld?.beschreibung() ?? null));
    // The element may outlive the directive, so it keeps every token the
    // caller and a tooltip put there and loses only the one of the field.
    inject(DestroyRef).onDestroy(() => beschreibung.setze(null));
  }
}
