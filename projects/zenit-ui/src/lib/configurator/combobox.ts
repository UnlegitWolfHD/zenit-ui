import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { FormValueControl } from '@angular/forms/signals';
import { ZField } from '../field';
import { ZIcon } from '../icon';
import { injectZLabels } from '../labels';

/** One entry of a `z-combobox`. */
export interface ZComboOption {
  /** The value reported through `value`. Also the tracking key of the list. */
  value: string;
  /** What the entry reads as, and what stands in the field once it is chosen. */
  label: string;
  /**
   * Consequence of the entry, for example "mindestens 4 GB". Shown in a
   * `<small>` and searched along with the label, so a rule never surfaces for
   * the first time in the summary.
   */
  note?: string;
  /** Heading the entry belongs under, for example "Aktuell" or "Snapshots". */
  group?: string;
}

/** One row of the open panel: the key manager walks these. */
interface Eintrag extends Highlightable {
  readonly option: ZComboOption;
  readonly index: number;
}

/** A heading with the entries under it; an empty name means no heading. */
interface Gruppe {
  readonly name: string;
  readonly eintraege: readonly Eintrag[];
}

let zaehler = 0;

/**
 * Picks one value out of a long list by typing and filtering: Minecraft
 * version, modpack, Java version, a game from about fifteen on. Up to six
 * options it is a `z-option-group` instead.
 *
 * Renders a `<span class="z-combo">` with an `<input class="z-input">` and, in
 * a CDK overlay as wide as the field, a `<div class="z-listbox">` with one
 * `.z-listbox__option` per match, headings as `.z-listbox__group` and, when
 * nothing matches, a single `.z-listbox__empty` row instead of an empty panel.
 *
 * Accessibility: the editable combobox pattern of the ARIA practices. The
 * input carries `role="combobox"`, `aria-expanded`, `aria-controls`,
 * `aria-autocomplete="list"` and `aria-activedescendant`; the panel is the
 * `role="listbox"`, headings are `role="group"` with their name. The focus
 * never leaves the input: the arrow keys, Home and End move the active entry
 * through `ActiveDescendantKeyManager`, Enter takes it, Escape closes without
 * clearing the field, and a click on an entry keeps the focus because the
 * component cancels the `mousedown`. Leaving the field with text that matches
 * nothing puts the chosen label back, so the field never shows a value that is
 * not the value. The component has no visible label of its own; it takes the
 * label and the hint or error of the surrounding `z-field` through
 * {@link inputId}, or an accessible name through {@link ariaLabel} or
 * {@link ariaLabelledby}.
 *
 * Implements `ControlValueAccessor`, so `ngModel` and reactive forms work
 * alongside the two-way binding on {@link value}, and has the shape of a
 * Signal Forms `FormValueControl<string>`, so `[formField]` works and feeds
 * {@link disabled} from the field state.
 *
 * @example
 * ```html
 * <z-field label="Minecraft-Version" for="cb-version" hint="Leer lassen für die neueste Version.">
 *   <z-combobox
 *     inputId="cb-version"
 *     [options]="versionen"
 *     [(value)]="version"
 *     emptyText="Keine Version gefunden"
 *   />
 * </z-field>
 * ```
 */
@Component({
  selector: 'z-combobox',
  imports: [ZIcon],
  template: `
    <span class="z-combo">
      <input
        #feld
        class="z-input z-input--mono"
        type="text"
        role="combobox"
        autocomplete="off"
        [id]="inputId() || null"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-labelledby]="ariaLabelledby() || null"
        [attr.aria-describedby]="feldRahmen?.beschreibung() ?? null"
        [attr.aria-expanded]="offen()"
        [attr.aria-controls]="listenId"
        aria-autocomplete="list"
        [attr.aria-activedescendant]="aktiveId()"
        [placeholder]="placeholder()"
        [disabled]="gesperrt()"
        [value]="text()"
        (input)="aufEingabe($event)"
        (keydown)="aufTaste($event)"
        (mousedown)="oeffne()"
        (blur)="aufVerlassen()"
      />
    </span>

    <ng-template #panel>
      <div class="z-listbox" [id]="listenId" role="listbox" [attr.aria-label]="listenname()">
        @for (gruppe of gruppen(); track gruppe.name) {
          <!-- A heading is a role="group" with its name. Without one the wrapper
               is presentational, so the entries stay direct children of the listbox. -->
          <div
            [attr.role]="gruppe.name ? 'group' : 'presentation'"
            [attr.aria-label]="gruppe.name || null"
          >
            @if (gruppe.name) {
              <div class="z-listbox__group" role="presentation">{{ gruppe.name }}</div>
            }
            @for (eintrag of gruppe.eintraege; track eintrag.option.value) {
              <!-- In the activedescendant pattern the option is deliberately not
                   a tab stop and carries no key handler: the focus stays in the
                   input, which owns the whole keyboard (ARIA APG, combobox). -->
              <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
              <div
                class="z-listbox__option"
                role="option"
                [id]="listenId + '-' + eintrag.index"
                [class.z-listbox__option--active]="eintrag.index === aktiverIndex()"
                [attr.aria-selected]="eintrag.option.value === value()"
                (mousedown)="$event.preventDefault()"
                (click)="waehle(eintrag.option.value)"
              >
                <span class="z-mono">{{ eintrag.option.label }}</span>
                @if (eintrag.option.value === value()) {
                  <z-icon name="check" size="sm" />
                } @else if (eintrag.option.note) {
                  <small>{{ eintrag.option.note }}</small>
                }
              </div>
            }
          </div>
        }
        @if (!treffer().length) {
          <!-- One row instead of an empty panel. It is an option so the listbox
               keeps a valid child, and a locked one because there is nothing to
               take. -->
          <div
            class="z-listbox__empty"
            role="option"
            aria-selected="false"
            aria-disabled="true"
            [id]="listenId + '-0'"
          >
            {{ emptyText() || etiketten.comboboxEmpty }}
          </div>
        }
      </div>
    </ng-template>
  `,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ZCombobox), multi: true },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZCombobox implements ControlValueAccessor, FormValueControl<string> {
  /**
   * The entries in display order. Tracked by `value`, so those have to be
   * unique. Entries with the same `group` are shown under one heading, in the
   * order the groups first appear.
   *
   * @default []
   */
  readonly options = input<readonly ZComboOption[]>([]);

  /**
   * The chosen entry's `value`, two-way bindable. A value that matches no
   * entry leaves the field empty.
   *
   * @default ''
   */
  readonly value = model('');

  /**
   * Placeholder of the empty field. It is not a label: the label stands above
   * the field, in the surrounding `z-field`.
   *
   * @default ''
   */
  readonly placeholder = input('');

  /**
   * The one line the panel shows when nothing matches, for example "Keine
   * Version gefunden". Empty falls back to the `comboboxEmpty` label.
   *
   * @default ''
   */
  readonly emptyText = input('');

  /**
   * `id` of the input. This is what a surrounding `z-field` points its `for`
   * at, and it is the root of the option ids.
   *
   * @default ''
   */
  readonly inputId = input('');

  /**
   * Accessible name of the field where there is no `z-field` around it. An
   * empty string writes no attribute.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * `id` of the element that names the field, as an alternative to
   * {@link ariaLabel}.
   *
   * @default ''
   */
  readonly ariaLabelledby = input('');

  /**
   * Locks the field. Independent of the disabled state that forms set; either
   * one is enough. Boolean attribute.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly etiketten = injectZLabels();
  protected readonly listenId = `z-listbox-${++zaehler}`;
  protected readonly offen = signal(false);

  /** What the input shows. Follows {@link value} until the visitor types. */
  protected readonly text = signal('');

  /** The typed filter, or `null` while the list is unfiltered. */
  private readonly suche = signal<string | null>(null);

  protected readonly aktiverIndex = signal(-1);

  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  protected readonly feldRahmen = inject(ZField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly overlay = inject(Overlay);
  private readonly ansicht = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');
  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private overlayRef?: OverlayRef;

  private melde?: (wert: string) => void;
  private aufBeruehrt?: () => void;

  /** The label of the chosen value, or the empty string for an unknown value. */
  private readonly gewaehltesLabel = computed(
    () => this.options().find((o) => o.value === this.value())?.label ?? '',
  );

  /** Case-insensitive over label and note; no filter shows every entry. */
  protected readonly treffer = computed<readonly ZComboOption[]>(() => {
    const suche = this.suche()?.trim().toLowerCase();
    if (!suche) {
      return this.options();
    }
    return this.options().filter((o) => `${o.label} ${o.note ?? ''}`.toLowerCase().includes(suche));
  });

  private readonly eintraege = computed<Eintrag[]>(() =>
    this.treffer().map((option, index) => ({
      option,
      index,
      getLabel: () => option.label,
      // The active row is derived from aktiverIndex, so one signal carries the
      // whole state and the counterpart has nothing left to undo.
      setActiveStyles: () => this.aktiverIndex.set(index),
      setInactiveStyles: () => undefined,
    })),
  );

  protected readonly gruppen = computed<Gruppe[]>(() => {
    const gruppen: Gruppe[] = [];
    for (const eintrag of this.eintraege()) {
      const name = eintrag.option.group ?? '';
      const letzte = gruppen.at(-1);
      if (letzte?.name === name) {
        (letzte.eintraege as Eintrag[]).push(eintrag);
      } else {
        gruppen.push({ name, eintraege: [eintrag] });
      }
    }
    return gruppen;
  });

  protected readonly aktiveId = computed(() =>
    this.offen() && this.aktiverIndex() >= 0 ? `${this.listenId}-${this.aktiverIndex()}` : null,
  );

  /** Names the panel after the field, so the listbox is not an unnamed region. */
  protected readonly listenname = computed(
    () => this.ariaLabel() || this.feldRahmen?.label() || null,
  );

  private readonly tasten = new ActiveDescendantKeyManager(this.eintraege, this.injector)
    .withWrap()
    .withHomeAndEnd();

  constructor() {
    // The field shows the label of the value, never the raw value. A value set
    // from outside therefore rewrites the text, and so does a changed option
    // list. While the visitor types, the typed text stands instead.
    effect(() => {
      const label = this.gewaehltesLabel();
      if (untracked(this.suche) === null) {
        this.text.set(label);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.tasten.destroy();
      this.overlayRef?.dispose();
    });
  }

  protected oeffne(): void {
    if (this.gesperrt() || this.offen()) {
      return;
    }
    this.overlayRef ??= this.erzeugeOverlay();
    this.overlayRef.updateSize({ width: this.feld().nativeElement.offsetWidth });
    this.overlayRef.attach(new TemplatePortal(this.panel(), this.ansicht));
    this.offen.set(true);
    this.setzeAktiv();
  }

  protected schliesse(): void {
    if (!this.offen()) {
      return;
    }
    this.overlayRef?.detach();
    this.offen.set(false);
    this.aktiverIndex.set(-1);
    this.suche.set(null);
    this.text.set(this.gewaehltesLabel());
  }

  protected aufEingabe(ereignis: Event): void {
    const text = (ereignis.target as HTMLInputElement).value;
    this.text.set(text);
    this.suche.set(text);
    this.oeffne();
    this.setzeAktiv();
  }

  protected aufTaste(ereignis: KeyboardEvent): void {
    if (ereignis.key === 'Escape') {
      // Closes the panel and puts the chosen label back. It never empties the
      // field, so a second Escape has nothing left to take away.
      ereignis.preventDefault();
      this.schliesse();
      return;
    }
    if (ereignis.key === 'Enter') {
      const gewaehlt = this.eintraege()[this.aktiverIndex()];
      if (this.offen() && gewaehlt) {
        ereignis.preventDefault();
        this.waehle(gewaehlt.option.value);
      }
      return;
    }
    if (ereignis.key === 'Tab') {
      this.schliesse();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(ereignis.key)) {
      if (!this.offen()) {
        this.oeffne();
        return;
      }
      this.tasten.onKeydown(ereignis);
      this.rolleZumAktiven();
    }
  }

  protected waehle(wert: string): void {
    this.suche.set(null);
    if (wert !== this.value()) {
      this.value.set(wert);
      this.melde?.(wert);
    }
    this.text.set(this.gewaehltesLabel());
    this.schliesse();
    this.feld().nativeElement.focus();
  }

  /** Leaving the field is the moment a text that matches nothing is undone. */
  protected aufVerlassen(): void {
    this.schliesse();
    this.aufBeruehrt?.();
  }

  /** The chosen entry starts out active, otherwise the first one. */
  private setzeAktiv(): void {
    const alle = this.eintraege();
    const index = alle.findIndex((e) => e.option.value === this.value());
    this.tasten.setActiveItem(index >= 0 ? index : 0);
    this.aktiverIndex.set(alle.length ? Math.max(index, 0) : -1);
  }

  private rolleZumAktiven(): void {
    const zeile = this.overlayRef?.overlayElement.querySelector(
      `#${this.listenId}-${this.aktiverIndex()}`,
    );
    // Optional because a test environment without layout does not implement it.
    zeile?.scrollIntoView?.({ block: 'nearest' });
  }

  /** As wide as the field, below it, above it as the fallback position. */
  private erzeugeOverlay(): OverlayRef {
    const ref = this.overlay.create({
      panelClass: 'z-combo-pane',
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.feld())
        .withPositions([
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
          { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    // A pointer on the field itself is not "outside": it opens the panel and
    // would otherwise close it again within the same event.
    ref.outsidePointerEvents().subscribe((ereignis) => {
      if (!this.host.nativeElement.contains(ereignis.target as Node)) {
        this.schliesse();
      }
    });
    return ref;
  }

  /**
   * `ControlValueAccessor`: takes the value from the form. `null` and
   * `undefined` become the empty string, which selects nothing.
   */
  writeValue(wert: string): void {
    this.value.set(wert ?? '');
  }

  /**
   * `ControlValueAccessor`: registers the callback that reports a new value to
   * the form. It fires when an entry is taken, not on writes through
   * {@link value}.
   */
  registerOnChange(fn: (wert: string) => void): void {
    this.melde = fn;
  }

  /** `ControlValueAccessor`: registers the callback fired when the field loses focus. */
  registerOnTouched(fn: () => void): void {
    this.aufBeruehrt = fn;
  }

  /** `ControlValueAccessor`: locks or unlocks the field from the form side. */
  setDisabledState(gesperrt: boolean): void {
    this.formsGesperrt.set(gesperrt);
  }
}
