import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One question of the FAQ. The answer is the projected content.
 *
 * Renders a native `<details class="z-faq">` with the question in the
 * `<summary>` and the answer in `<p class="z-faq__body">`. Because it is the
 * native element, opening and closing work without JavaScript, the disclosure
 * is reachable by keyboard and announced with its expanded state; the component
 * adds no keyboard handling of its own.
 *
 * Put several of them under one another, the first one open. Answers run two to
 * three sentences with concrete numbers.
 *
 * @example
 * ```html
 * <z-faq question="Wie schnell ist mein Server online?" open>
 *   Nach der Bestellung dauert die Einrichtung in der Regel etwa 60 Sekunden.
 * </z-faq>
 * <z-faq question="Kann ich später mehr RAM buchen?">
 *   Ja, im Panel unter Upgrade. Der neue Preis gilt ab der nächsten Stunde.
 * </z-faq>
 * ```
 */
@Component({
  selector: 'z-faq',
  template: `<details class="z-faq" [open]="open()">
    <summary>{{ question() }}</summary>
    <p class="z-faq__body"><ng-content /></p>
  </details>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZFaq {
  /**
   * The question, shown in the `<summary>`. A real question from support, not a
   * headline.
   *
   * @default ''
   */
  readonly question = input('');

  /**
   * Whether the answer starts out visible; the spec asks for the first question
   * to be open. Written as a bare attribute (`open`) it counts as `true`. It is
   * a one-way binding on the native `open` property, so the visitor can toggle
   * freely afterwards and a new value from the caller wins again.
   *
   * @default false
   */
  readonly open = input(false, { transform: booleanAttribute });
}
