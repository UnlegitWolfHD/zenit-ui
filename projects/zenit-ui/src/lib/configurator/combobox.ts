import { ActiveDescendantKeyManager, Highlightable } from '@angular/cdk/a11y';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  model,
  numberAttribute,
  output,
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
import { ZSpinner } from '../spinner';

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
  /** True for the row that commits the typed text; see `allowCustom`. */
  readonly eigen: boolean;
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
 * The panel hangs in a CDK overlay as wide as the field and belongs to it: it
 * follows the field when anything around it scrolls, the page as well as an
 * inner container such as the body of a scrolling dialog, and closes once the
 * field has left that container. Scrolling inside the list itself does not
 * move the field and changes nothing.
 *
 * Implements `ControlValueAccessor`, so `ngModel` and reactive forms work
 * alongside the two-way binding on {@link value}, and has the shape of a
 * Signal Forms `FormValueControl<string>`, so `[formField]` works and feeds
 * {@link disabled} from the field state.
 *
 * Three modes, all of them the same element:
 *
 * - **Local**, the default: the component filters {@link options} itself.
 * - **On the server**: {@link filterLocally} `false` shows exactly the options
 *   it is given, {@link queryChange} reports every keystroke, {@link loading}
 *   draws the waiting row and {@link selectedLabel} names a chosen value whose
 *   option is no longer in the list. {@link minQueryLength} holds the list back
 *   until the query is long enough to be worth a request.
 * - **Free text**: {@link allowCustom} lets Enter and leaving the field commit
 *   what was typed, so the value may be a string that is in no option.
 *
 * @example
 * ```html
 * <z-field label="Minecraft-Version" for="cb-version" hint="Tippen filtert die Liste.">
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
  imports: [ZIcon, ZSpinner],
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
        [attr.aria-controls]="offen() ? listenId : null"
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
    <!-- How many entries the filter left, or the sentence of the empty row.
         The region is always in the markup and only its text changes, which is
         the one way a screen reader hears the count of a list it cannot see. -->
    <span class="z-visually-hidden" role="status">{{ ansage() }}</span>

    <ng-template #panel>
      <!-- Cancelling mousedown on the whole panel, not just on an entry, is what
           keeps the focus in the field when the pointer lands on the scrollbar,
           a heading or the empty row. -->
      <div
        class="z-listbox"
        [id]="listenId"
        role="listbox"
        [attr.aria-label]="listenname()"
        [attr.aria-labelledby]="ariaLabelledby() || null"
        [attr.aria-busy]="loading() ? 'true' : null"
        (mousedown)="$event.preventDefault()"
      >
        @if (zuKurz()) {
          <!-- Below minQueryLength the list is held back and this row says why.
               A locked option, like the empty row, so the listbox keeps a valid
               child and there is nothing to take. -->
          <div class="z-listbox__empty" role="option" aria-selected="false" aria-disabled="true">
            {{ etiketten.comboboxMinQuery(minQueryLength()) }}
          </div>
        } @else {
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
                  (click)="waehle(eintrag.option.value)"
                >
                  @if (eintrag.eigen) {
                    <!-- Prose, not a value, so it carries no mono face. -->
                    <span>{{ etiketten.comboboxUseCustom(eintrag.option.label) }}</span>
                  } @else {
                    <span class="z-mono">{{ eintrag.option.label }}</span>
                    @if (eintrag.option.value === value()) {
                      <z-icon name="check" size="sm" />
                    } @else if (eintrag.option.note) {
                      <small>{{ eintrag.option.note }}</small>
                    }
                  }
                </div>
              }
            </div>
          }
          @if (loading()) {
            <!-- While the caller is searching, the stale options stay above this
                 row: replacing them with a single line and putting them back a
                 moment later is a flicker under the hand that is typing. There
                 is no empty row here, because nothing is known yet. -->
            <div
              class="z-listbox__empty z-listbox__loading"
              role="option"
              aria-selected="false"
              aria-disabled="true"
            >
              <z-spinner />
              <span>{{ etiketten.comboboxLoading }}</span>
            </div>
          } @else if (!eintraege().length) {
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

  /**
   * Whether the component filters {@link options} itself. `false` hands the
   * filtering to the caller: the panel shows exactly the options it is given,
   * which is what a search on the server needs. {@link queryChange} is what
   * feeds that search. Boolean attribute.
   *
   * @default true
   */
  readonly filterLocally = input(true, { transform: booleanAttribute });

  /**
   * Whether the caller is fetching options right now. While the panel is open
   * it draws one waiting row and sets `aria-busy` on the listbox; options that
   * are already there stay above that row, so a running search does not blank
   * the list under the hand that is typing. No empty row while this is set.
   * Boolean attribute.
   *
   * @default false
   */
  readonly loading = input(false, { transform: booleanAttribute });

  /**
   * Whether text that matches no entry may become the value. Enter without an
   * active row and leaving the field both commit the typed text, trimmed, and
   * a row at the top of the panel offers the same thing with the pointer and
   * the arrow keys. Boolean attribute.
   *
   * @default false
   */
  readonly allowCustom = input(false, { transform: booleanAttribute });

  /**
   * Least number of characters before the panel shows entries at all. Below
   * it a single row says so instead, and {@link queryChange} still fires, so
   * the caller decides whether a shorter query is worth a request.
   *
   * @default 0
   */
  readonly minQueryLength = input(0, { transform: numberAttribute });

  /**
   * What the field shows for the current {@link value} while no entry of
   * {@link options} carries it. A search on the server holds the matches of
   * the last query, not the entry that was chosen three queries ago, and the
   * caller knows the label that belongs to the id it stores. An entry that is
   * in the list still wins over this.
   *
   * @default ''
   */
  readonly selectedLabel = input('');

  /**
   * The text the visitor typed, on every change of it, and the empty string
   * once the field is cleared. It does not fire when the component writes the
   * label of the value back into the field, and not on a write to
   * {@link value}, so it never answers itself.
   *
   * There is no debounce in here: the timing belongs to whoever runs the
   * search. `docs/components/combobox.md` has a `resource()` recipe and an
   * RxJS one.
   */
  readonly queryChange = output<string>();

  protected readonly etiketten = injectZLabels();
  protected readonly listenId = `z-listbox-${++zaehler}`;
  protected readonly offen = signal(false);

  /** What the input shows. Follows {@link value} until the visitor types. */
  protected readonly text = signal('');

  /** The typed filter, or `null` while the list is unfiltered. */
  private readonly suche = signal<string | null>(null);

  protected readonly aktiverIndex = signal(-1);

  /**
   * `value` of the active row, so it can be found again after the list was
   * replaced under the open panel. The index alone would move with the list.
   */
  private readonly aktiverWert = signal('');

  private readonly formsGesperrt = signal(false);
  protected readonly gesperrt = computed(() => this.disabled() || this.formsGesperrt());

  protected readonly feldRahmen = inject(ZField, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dokument = inject(DOCUMENT);
  private readonly overlay = inject(Overlay);
  private readonly ansicht = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly feld = viewChild.required<ElementRef<HTMLInputElement>>('feld');
  private readonly panel = viewChild.required<TemplateRef<unknown>>('panel');
  private overlayRef?: OverlayRef;
  /** Lives exactly as long as the open panel; see {@link horcheAufScrollen}. */
  private scrollHorcher?: AbortController;

  private melde?: (wert: string) => void;
  private aufBeruehrt?: () => void;

  /**
   * The label of the chosen value: the entry that carries it, else the
   * {@link selectedLabel} the caller supplied, else the value itself where
   * {@link allowCustom} makes a value that is in no entry a legal one. The
   * empty string for an unknown value in the plain case, which is what leaves
   * the field empty.
   */
  private readonly gewaehltesLabel = computed(() => {
    const wert = this.value();
    const eintrag = this.options().find((o) => o.value === wert);
    if (eintrag) {
      return eintrag.label;
    }
    if (!wert) {
      return '';
    }
    return this.selectedLabel() || (this.allowCustom() ? wert : '');
  });

  /** The typed text, trimmed; the empty string while nothing has been typed. */
  private readonly anfrage = computed(() => this.suche()?.trim() ?? '');

  /** True while the typed text is shorter than {@link minQueryLength}. */
  protected readonly zuKurz = computed(() => this.anfrage().length < this.minQueryLength());

  /**
   * Case-insensitive over label and note; no filter shows every entry. With
   * {@link filterLocally} `false` the caller has filtered already, so the
   * options are passed through as they are. Below {@link minQueryLength} there
   * is nothing to show at all.
   */
  protected readonly treffer = computed<readonly ZComboOption[]>(() => {
    if (this.zuKurz()) {
      return [];
    }
    const suche = this.filterLocally() ? this.anfrage().toLowerCase() : '';
    if (!suche) {
      return this.options();
    }
    return this.options().filter((o) => `${o.label} ${o.note ?? ''}`.toLowerCase().includes(suche));
  });

  /** The entry whose label is exactly the typed text, if the list holds one. */
  private readonly genauePassung = computed(() => {
    const text = this.anfrage().toLowerCase();
    return text ? (this.treffer().find((o) => o.label.toLowerCase() === text) ?? null) : null;
  });

  /**
   * The value that committing the typed text would write, or the empty string
   * where there is nothing to commit. Typing the exact label of an entry
   * commits that entry's value, not the label, so the two ways to the same row
   * do not end in two different values.
   */
  private readonly eigenerWert = computed(() => {
    if (!this.allowCustom() || this.zuKurz() || !this.anfrage()) {
      return '';
    }
    return this.genauePassung()?.value ?? this.anfrage();
  });

  /**
   * The row that commits the typed text, or `null`. It stands only where the
   * text is not already the label of an entry: a second way to a row that is
   * right there would be a second value for the same thing.
   */
  private readonly eigeneOption = computed<ZComboOption | null>(() => {
    const text = this.anfrage();
    if (!this.allowCustom() || this.zuKurz() || !text || this.genauePassung()) {
      return null;
    }
    return { value: text, label: text };
  });

  /**
   * Grouped by name, in the order the names first appear. Entries of the same
   * group that stand apart in `options` land under one heading, so a name never
   * shows up twice and the tracking key of the list stays unique.
   */
  protected readonly gruppen = computed<Gruppe[]>(() => {
    const eigene = this.eigeneOption();
    const nach = new Map<string, ZComboOption[]>();
    // The own row goes first, and therefore into the group without a heading:
    // it belongs to the text in the field, not to any of the headings.
    if (eigene) {
      nach.set('', [eigene]);
    }
    for (const option of this.treffer()) {
      const name = option.group ?? '';
      const vorhanden = nach.get(name);
      if (vorhanden) {
        vorhanden.push(option);
      } else {
        nach.set(name, [option]);
      }
    }
    // Numbered in the order the rows are drawn, not in the order of `options`:
    // grouping moves rows, and the arrow keys have to follow the eye.
    let index = 0;
    return [...nach].map(([name, optionen]) => ({
      name,
      eintraege: optionen.map((option) => this.zuEintrag(option, index++, option === eigene)),
    }));
  });

  /** Every row of every group, in the order they are drawn. */
  protected readonly eintraege = computed<Eintrag[]>(() =>
    this.gruppen().flatMap((gruppe) => gruppe.eintraege as Eintrag[]),
  );

  private zuEintrag(option: ZComboOption, index: number, eigen: boolean): Eintrag {
    return {
      option,
      index,
      eigen,
      getLabel: () => option.label,
      // The active row is derived from aktiverIndex, so one signal carries the
      // whole state and the counterpart has nothing left to undo. The value
      // travels along so the row can be found again in a replaced list.
      setActiveStyles: () => {
        this.aktiverIndex.set(index);
        this.aktiverWert.set(option.value);
      },
      setInactiveStyles: () => undefined,
    };
  }

  /**
   * What the live region says while the panel is open: how many entries the
   * filter left, or the sentence of the empty row. Closed it says nothing, so
   * nothing is announced twice.
   */
  protected readonly ansage = computed(() => {
    if (!this.offen()) {
      return '';
    }
    if (this.zuKurz()) {
      return this.etiketten.comboboxMinQuery(this.minQueryLength());
    }
    if (this.loading()) {
      return this.etiketten.comboboxLoading;
    }
    const anzahl = this.eintraege().length;
    return anzahl
      ? this.etiketten.comboboxResults(anzahl)
      : this.emptyText() || this.etiketten.comboboxEmpty;
  });

  /**
   * The id of the active row. Bounded by the list itself, not only by the
   * index: options can be replaced under an open panel, and a reference to a
   * row that is gone is worse than none.
   */
  protected readonly aktiveId = computed(() => {
    const index = this.aktiverIndex();
    return this.offen() && index >= 0 && index < this.eintraege().length
      ? `${this.listenId}-${index}`
      : null;
  });

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

    // A search on the server replaces `options` while the panel stands open.
    // The row the keyboard is on keeps its place when it is still in the list,
    // otherwise the first one takes over; without this the active index would
    // point into a list that has moved under it.
    effect(() => {
      const alle = this.eintraege();
      if (!untracked(this.offen)) {
        return;
      }
      const index = alle.findIndex((e) => e.option.value === untracked(this.aktiverWert));
      this.aktiviere(index >= 0 ? index : 0);
    });

    const abbruch = new AbortController();
    this.dokument.defaultView?.addEventListener('resize', () => this.aufGroessenwechsel(), {
      signal: abbruch.signal,
    });

    inject(DestroyRef).onDestroy(() => {
      abbruch.abort();
      this.scrollHorcher?.abort();
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
    this.horcheAufScrollen();
  }

  protected schliesse(): void {
    if (!this.offen()) {
      return;
    }
    this.scrollHorcher?.abort();
    this.scrollHorcher = undefined;
    this.overlayRef?.detach();
    this.offen.set(false);
    this.aktiverIndex.set(-1);
    this.aktiverWert.set('');
    this.suche.set(null);
    this.text.set(this.gewaehltesLabel());
  }

  /**
   * While the panel is open, every scroller around the field is listened to.
   * The listener hangs on the document in the CAPTURE phase, because a scroll
   * event on an inner element does not bubble: `ScrollDispatcher` of the CDK
   * listens without capture and therefore only ever hears the page and the
   * containers a caller marked `cdkScrollable`. No container of this library is
   * marked and `.z-dialog` scrolls, so a combobox in a dialog used to keep a
   * panel hanging where the field no longer was. Capture hears every scroller
   * without asking any caller to annotate its container.
   */
  private horcheAufScrollen(): void {
    this.scrollHorcher = new AbortController();
    this.dokument.addEventListener('scroll', (ereignis) => this.aufScrollen(ereignis), {
      capture: true,
      passive: true,
      signal: this.scrollHorcher.signal,
    });
  }

  /**
   * The panel belongs to the field: it follows the field as long as the field
   * can be seen in the container that moved, and goes once the field has left
   * it. Following instead of closing at the first pixel is what the package
   * already did for the page, and it is what a scroll that is still running
   * needs: a panel opened while the browser is still scrolling a field into
   * view would otherwise close under the hand that opened it. A scroll inside
   * the list is not a scroll of the field and changes nothing.
   */
  private aufScrollen(ereignis: Event): void {
    const ziel = ereignis.target as Node | null;
    if (!this.overlayRef || (ziel && this.overlayRef.overlayElement.contains(ziel))) {
      return;
    }
    this.overlayRef.updatePosition();
    const feld = this.feld().nativeElement.getBoundingClientRect();
    const rolle = this.kasten(ziel);
    if (
      feld.bottom <= rolle.top ||
      feld.top >= rolle.bottom ||
      feld.right <= rolle.left ||
      feld.left >= rolle.right
    ) {
      this.schliesse();
    }
  }

  /**
   * The visible box of the scroller the event came from. The page reports its
   * scroll on the document, and in some engines on the root element or the
   * body; all three mean the viewport.
   */
  private kasten(ziel: Node | null): { top: number; bottom: number; left: number; right: number } {
    const seite =
      !ziel ||
      ziel === this.dokument ||
      ziel === this.dokument.documentElement ||
      ziel === this.dokument.body;
    if (!seite && ziel instanceof Element) {
      return ziel.getBoundingClientRect();
    }
    const fenster = this.dokument.defaultView;
    return {
      top: 0,
      left: 0,
      bottom: fenster?.innerHeight ?? 0,
      right: fenster?.innerWidth ?? 0,
    };
  }

  protected aufEingabe(ereignis: Event): void {
    const text = (ereignis.target as HTMLInputElement).value;
    this.text.set(text);
    this.suche.set(text);
    this.oeffne();
    this.setzeAktiv();
    // Only here, so the output carries what the visitor typed and never what
    // the component wrote back into the field.
    this.queryChange.emit(text);
  }

  protected aufTaste(ereignis: KeyboardEvent): void {
    if (ereignis.key === 'Escape') {
      // Closes the panel and puts the chosen label back. It never empties the
      // field, so a second Escape has nothing left to take away. While the
      // panel is open the key belongs to the panel: it stops here, or a dialog
      // around the field would close along with it.
      if (this.offen()) {
        ereignis.preventDefault();
        ereignis.stopPropagation();
        this.schliesse();
      }
      return;
    }
    if (ereignis.key === 'Enter') {
      const gewaehlt = this.eintraege()[this.aktiverIndex()];
      if (this.offen() && gewaehlt) {
        ereignis.preventDefault();
        this.waehle(gewaehlt.option.value);
      } else if (this.eigenerWert()) {
        // No row under the keyboard, but text in the field and allowCustom:
        // Enter takes that text instead of doing nothing.
        ereignis.preventDefault();
        this.waehle(this.eigenerWert());
      }
      return;
    }
    if (ereignis.key === 'Tab') {
      // Tab is a way of leaving the field, so it commits what leaving commits.
      // It has to happen here: the panel closes before the focus moves, and by
      // the time the blur arrives the typed text is gone.
      this.uebernimmEigenes();
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
    this.uebernimm(wert);
    this.feld().nativeElement.focus();
  }

  /**
   * Writes a value, reports it to the form and closes the panel. Separate from
   * {@link waehle} because leaving the field also commits, and pulling the
   * focus back there would be the one thing a blur must not do.
   */
  private uebernimm(wert: string): void {
    this.suche.set(null);
    if (wert !== this.value()) {
      this.value.set(wert);
      this.melde?.(wert);
    }
    this.text.set(this.gewaehltesLabel());
    this.schliesse();
  }

  /**
   * Leaving the field is the moment a text that matches nothing is undone —
   * or, with {@link allowCustom}, the moment it becomes the value.
   */
  protected aufVerlassen(): void {
    this.uebernimmEigenes();
    this.schliesse();
    this.aufBeruehrt?.();
  }

  /** Takes the typed text where {@link allowCustom} lets it become the value. */
  private uebernimmEigenes(): void {
    const wert = this.eigenerWert();
    if (wert) {
      this.uebernimm(wert);
    }
  }

  /** The chosen entry starts out active, otherwise the first one. */
  private setzeAktiv(): void {
    const index = this.eintraege().findIndex((e) => e.option.value === this.value());
    this.aktiviere(index >= 0 ? index : 0);
  }

  /** Makes one row active, or none at all where the list is empty. */
  private aktiviere(index: number): void {
    const alle = this.eintraege();
    const ziel = alle.length ? Math.min(Math.max(index, 0), alle.length - 1) : -1;
    this.tasten.setActiveItem(ziel);
    this.aktiverIndex.set(ziel);
    this.aktiverWert.set(ziel >= 0 ? alle[ziel].option.value : '');
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
    const position = this.overlay.position().flexibleConnectedTo(this.feld());
    const ref = this.overlay.create({
      panelClass: 'z-combo-pane',
      positionStrategy: position
        .withPositions([
          { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
          { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
        ])
        // Without this the strategy pushes the panel back into the viewport
        // when the field leaves it: the list would stand in the page far from
        // the field it belongs to.
        .withPush(false),
      // Scrolling is answered in one place, by the capture listener of
      // horcheAufScrollen(): every CDK strategy runs on ScrollDispatcher, which
      // does not hear an unannotated inner scroller at all.
      scrollStrategy: this.overlay.scrollStrategies.noop(),
    });
    // A pointer on the field itself is not "outside": it opens the panel and
    // would otherwise close it again within the same event.
    ref.outsidePointerEvents().subscribe((ereignis) => {
      if (!this.host.nativeElement.contains(ereignis.target as Node)) {
        this.schliesse();
      }
    });
    // An overlay can be detached from outside (dispose on destroy), so the
    // component learns of it here instead of keeping a state the DOM no longer
    // has.
    ref.detachments().subscribe(() => {
      this.scrollHorcher?.abort();
      this.scrollHorcher = undefined;
      if (this.offen()) {
        this.offen.set(false);
        this.aktiverIndex.set(-1);
        this.aktiverWert.set('');
        this.suche.set(null);
        this.text.set(this.gewaehltesLabel());
      }
    });
    return ref;
  }

  /** A resized window changes the width of the field, and with it the panel. */
  private aufGroessenwechsel(): void {
    if (!this.offen() || !this.overlayRef) {
      return;
    }
    this.overlayRef.updateSize({ width: this.feld().nativeElement.offsetWidth });
    this.overlayRef.updatePosition();
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
