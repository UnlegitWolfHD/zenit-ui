import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { injectZLabels } from '../labels';

/** State of one step of a `z-wizard`. */
export type ZWizardState = 'done' | 'current' | 'locked';

/**
 * The steps of an order, one below the other, with the summary next to it in a
 * `z-config`. Two to four steps, a noun as the title of each.
 *
 * Renders the class `z-wizard` on the host and projects the steps. The wizard
 * itself is the progress of the order, so there is no separate progress list
 * next to it, and it numbers its steps itself.
 *
 * Accessibility: the host is a `role="list"` and every `z-wizard-step` a
 * `role="listitem"`, which is what the `<ol>` and `<li>` of the reference
 * stand for. The current step carries `aria-current="step"`.
 *
 * @example
 * ```html
 * <z-wizard>
 *   <z-wizard-step title="Inhalt" summary="Vanilla, neueste Version" state="done" />
 *   <z-wizard-step title="Größe" state="current">…</z-wizard-step>
 *   <z-wizard-step title="Bezahlen" summary="Name, Laufzeit" state="locked" />
 * </z-wizard>
 * ```
 */
@Component({
  selector: 'z-wizard',
  template: `<ng-content />`,
  host: { class: 'z-wizard', role: 'list' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZWizard {
  /**
   * The projected steps in document order.
   *
   * @internal Wiring between `z-wizard` and its steps, not meant to be read by
   * applications.
   */
  readonly schritte = contentChildren(ZWizardStep);
}

/**
 * One step of a `z-wizard`: head with number and title, and the fields as
 * projected content while it is the current one.
 *
 * Renders the class `z-wstep` on the host, plus `z-wstep--done` or
 * `z-wstep--locked`. The head holds `.z-step__num`, the title as a heading,
 * the summary and, on a finished step, the "Ändern" button. The body is only
 * rendered while the step is current, with every projected
 * `[zWizardActions]` element as the last row in `.z-wstep__actions`, which is
 * the flex row that puts "Zurück" left and "Weiter" right.
 *
 * Accessibility: `role="listitem"`, and `aria-current="step"` while it is the
 * current one. A locked step renders no body at all, so nothing in it can be
 * reached by Tab. The title carries `tabindex="-1"`, so the caller can move
 * the focus onto it after "Weiter" or "Ändern". The "Ändern" buttons of a
 * wizard read differently, because the accessible name carries the title of
 * the step ("Inhalt ändern"); the visible caption stays the short word.
 *
 * @example
 * ```html
 * <z-wizard-step title="Größe" state="current">
 *   <z-option-group legend="Arbeitsspeicher" [options]="stufen" [(value)]="ram" compact />
 *   <button zWizardActions zBtn="ghost" type="button">Zurück</button>
 *   <button zWizardActions zBtn="secondary" type="button">Weiter zu Bezahlen</button>
 * </z-wizard-step>
 * ```
 */
@Component({
  selector: 'z-wizard-step',
  template: `
    <div class="z-wstep__head">
      <span class="z-step__num">{{ nummer() }}</span>
      @switch (headingLevel()) {
        @case (2) {
          <h2 class="z-wstep__title" tabindex="-1">{{ title() }}</h2>
        }
        @case (4) {
          <h4 class="z-wstep__title" tabindex="-1">{{ title() }}</h4>
        }
        @default {
          <h3 class="z-wstep__title" tabindex="-1">{{ title() }}</h3>
        }
      }
      @if (summary()) {
        <span class="z-wstep__summary">{{ summary() }}</span>
      }
      @if (state() === 'done') {
        <button
          class="z-wstep__edit"
          type="button"
          [attr.aria-label]="etiketten.wizardEditFor(title())"
          (click)="edit.emit()"
        >
          {{ editLabel() || etiketten.wizardEdit }}
        </button>
      }
    </div>
    @if (state() === 'current') {
      <div class="z-wstep__body">
        <ng-content />
        <div class="z-wstep__actions"><ng-content select="[zWizardActions]" /></div>
      </div>
    }
  `,
  host: {
    class: 'z-wstep',
    role: 'listitem',
    '[class.z-wstep--done]': `state() === 'done'`,
    '[class.z-wstep--locked]': `state() === 'locked'`,
    '[attr.aria-current]': `state() === 'current' ? 'step' : null`,
    // Otherwise the browser hangs its own tooltip on the whole step because of
    // the static attribute title="…".
    '[attr.title]': `null`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZWizardStep {
  /**
   * Title of the step, one noun. Also the accessible name of the "Ändern"
   * button, which is how several of them stay distinguishable.
   *
   * @default ''
   */
  readonly title = input('');

  /**
   * What the step has decided, for example "Vanilla, neueste Version". A
   * finished step shows it in place of its fields, a locked one shows what is
   * still to come. Empty renders nothing.
   *
   * @default ''
   */
  readonly summary = input('');

  /**
   * Where the step stands: `done` is collapsed with the summary and "Ändern",
   * `current` is open, `locked` renders no body and holds no tab stop.
   *
   * @default 'locked'
   */
  readonly state = input<ZWizardState>('locked');

  /**
   * Tag of the title: `2`, `3` or `4`. The reference uses `3`, which fits under
   * the `<h2>` of a section below the page's `<h1>`. The visual size never
   * changes with it.
   *
   * @default 3
   */
  readonly headingLevel = input<2 | 3 | 4, 2 | 3 | 4 | '2' | '3' | '4'>(3, {
    transform: (wert) => Number(wert) as 2 | 3 | 4,
  });

  /**
   * Caption of the button on a finished step. Empty falls back to the
   * `wizardEdit` label of the registry.
   *
   * @default ''
   */
  readonly editLabel = input('');

  /**
   * Fires when "Ändern" is pressed. The caller decides what follows: it usually
   * makes this step the current one again and moves the focus to its title.
   */
  readonly edit = output<void>();

  protected readonly etiketten = injectZLabels();
  private readonly wizard = inject(ZWizard, { optional: true });

  /**
   * Position in the wizard, 1-based. It is read from the parent instead of
   * being an input: two sources for the same fact drift apart as soon as a
   * step is added. Outside a wizard the step is number 1.
   */
  protected readonly nummer = computed(() => {
    const alle = this.wizard?.schritte() ?? [];
    return Math.max(alle.indexOf(this), 0) + 1;
  });
}
