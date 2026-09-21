import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  untracked,
  viewChildren,
} from '@angular/core';

/** Counts up once per panel, so two groups on one page never share an id. */
let panelZaehler = 0;

/**
 * One view of a `z-tab-group`: its caption in the tab bar and its content below
 * it. The caption is the {@link label} input, the content is projected.
 *
 * Renders the host as `role="tabpanel"` with `tabindex="0"` and
 * `aria-labelledby` pointing at its own tab. While the panel is not the active
 * one the host carries the `hidden` attribute, so it is out of the layout and
 * out of the accessibility tree.
 *
 * The content is wrapped in an `ng-template` and rendered through
 * `ngTemplateOutlet`, so only the active panel's content stands in the
 * document. What that does and does not save is written out in
 * `docs/components/tabs.md`, "Lazy panels": the elements are removed from the
 * document, the component instances behind them are not destroyed, because
 * Angular creates projected nodes together with the view that declares them.
 * Set {@link ZTabGroup.keepAlive} when the elements themselves have to survive
 * a tab change, for example a scroll position, a playing `<video>` or an
 * `<iframe>` that must not reload.
 *
 * @example
 * ```html
 * <z-tab-panel value="speicher" label="Speicher" disabled>
 *   <p>12,4 GB von 40 GB belegt.</p>
 * </z-tab-panel>
 * ```
 */
@Component({
  selector: 'z-tab-panel',
  imports: [NgTemplateOutlet],
  template: `<ng-template #inhalt><ng-content /></ng-template>
    @if (sichtbar()) {
      <ng-container [ngTemplateOutlet]="inhalt" />
    }`,
  host: {
    role: 'tabpanel',
    // Always a tab stop instead of checking after every render whether the
    // panel holds something focusable: the content is whatever the caller
    // projects, so such a check would have to run again on every change of it
    // and would still be wrong in between. An extra tab stop is what the
    // WAI-ARIA Tabs pattern asks for when the panel has no focusable element,
    // and it is harmless when it has one.
    tabindex: '0',
    '[id]': 'panelId',
    '[attr.aria-labelledby]': 'tabId',
    '[attr.hidden]': `aktiv() ? null : ''`,
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTabPanel {
  /**
   * Identifies the panel. This is what `z-tab-group` reports through its
   * `value` model and what the caller binds against, instead of an index that
   * moves as soon as a panel is added. Unique within one group.
   */
  readonly value = input.required<string>();

  /**
   * Caption of the tab, a short noun without an icon. The text comes from the
   * caller; the library holds no German strings.
   */
  readonly label = input.required<string>();

  /**
   * Locks the tab: it is a natively `disabled` button, so it cannot be clicked
   * and the arrow keys skip it. Name the reason next to the group, as
   * `spec/guidelines/15-zustaende.md` asks. Boolean attribute, so `disabled`
   * alone counts as `true`.
   *
   * @default false
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Id of the tab that opens this panel, rendered by the group.
   *
   * @internal Wiring between `z-tab-group` and its panels.
   */
  readonly tabId = `z-tab-${++panelZaehler}`;

  /**
   * Id of this panel, pointed at by `aria-controls` of its tab.
   *
   * @internal Wiring between `z-tab-group` and its panels.
   */
  readonly panelId = `z-tabpanel-${panelZaehler}`;

  private readonly gruppe = inject(ZTabGroup, { optional: true });

  /**
   * Whether this is the panel the group currently shows.
   *
   * An empty `value` on the group means "the first enabled panel", and that
   * question is answered here from `disabled` alone. The panel deliberately
   * never reads the `value` of its siblings: a `@for` creates every panel
   * before it binds the inputs of any of them, and the first panel renders
   * while the last one still has no `value`, which would throw NG0950. The one
   * case that does need all values, a `value` that matches no panel, is
   * corrected by `ZTabGroup` after the render.
   *
   * @internal Read by `z-tab-group` for `aria-selected` and the roving tabindex.
   */
  readonly aktiv = computed(() => {
    const gruppe = this.gruppe;
    if (!gruppe) {
      return true;
    }
    const wert = gruppe.value();
    return wert ? wert === this.value() : gruppe.erstesOffenes() === this;
  });

  /** Stays `true` once the panel has been active, which is what `keepAlive` keeps. */
  private readonly besucht = linkedSignal<boolean, boolean>({
    source: this.aktiv,
    computation: (aktiv, vorher) => aktiv || (vorher?.value ?? false),
  });

  /**
   * Whether the panel's content stands in the document.
   *
   * @internal Read by `z-tab-group`, which points `aria-controls` only at a
   * panel that is really there.
   */
  readonly sichtbar = computed(() => {
    // Read first and not behind the `||`: a linkedSignal only remembers what it
    // has been evaluated for, and behind the short circuit it would first be
    // read once the panel is already inactive, which is a panel that counts as
    // never visited.
    const besucht = this.besucht();
    return this.aktiv() || (this.gruppe?.keepAlive() === true && besucht);
  });
}

/**
 * Tabs for views that have no address of their own: the WAI-ARIA Tabs pattern
 * as `role="tablist"` with `role="tab"` buttons and one `role="tabpanel"` per
 * view. This is the variant `spec/components/Tabs/preview.html` shows.
 *
 * Use `ZTabs` with `a[zTab]` instead whenever each view can have its own URL.
 * Links are the better tabs: they can be bookmarked, opened in a new tab and
 * the back button works on them. Reach for `z-tab-group` only where adding a
 * route is not possible or not wanted, for example a dialog with two forms or
 * a panel section that must not appear in the history.
 *
 * Renders `div.z-tabs[role="tablist"]` with one `button.z-tab[role="tab"]` per
 * projected `z-tab-panel`, and below it the panels themselves. The active tab
 * carries `aria-selected="true"`, which is what the stylesheet draws the 2px
 * underline from.
 *
 * Accessibility: automatic activation, so an arrow key moves the focus and
 * switches the view in one step. Arrow Left and Right step through the tabs and
 * wrap around, Home and End jump to the first and the last one, disabled tabs
 * are skipped, and in a right-to-left context the two arrows swap. Only the
 * active tab is a tab stop (roving `tabindex`), so Tab leads from the bar into
 * the panel. Name the bar with {@link ariaLabel} or {@link ariaLabelledby}.
 *
 * @example
 * ```html
 * <z-tab-group ariaLabel="Serveransichten" [(value)]="ansicht">
 *   <z-tab-panel value="uebersicht" label="Übersicht">
 *     <p>2 von 20 Spielern online.</p>
 *   </z-tab-panel>
 *   <z-tab-panel value="speicher" label="Speicher">
 *     <p>12,4 GB von 40 GB belegt.</p>
 *   </z-tab-panel>
 * </z-tab-group>
 * ```
 */
@Component({
  selector: 'z-tab-group',
  template: `<div
      class="z-tabs"
      role="tablist"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-labelledby]="ariaLabelledby() || null"
    >
      @for (panel of panels(); track panel) {
        <button
          #knopf
          class="z-tab"
          type="button"
          role="tab"
          [id]="panel.tabId"
          [disabled]="panel.disabled()"
          [attr.aria-selected]="panel.aktiv()"
          [attr.aria-controls]="panel.sichtbar() ? panel.panelId : null"
          [attr.tabindex]="panel.aktiv() ? 0 : -1"
          (click)="waehle(panel)"
          (keydown)="aufTaste($event)"
        >
          {{ panel.label() }}
        </button>
      }
    </div>
    <ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZTabGroup {
  /**
   * Accessible name of the tab bar, for example "Serveransichten". Empty
   * writes no `aria-label`; use {@link ariaLabelledby} instead when a visible
   * heading already names the group.
   *
   * @default ''
   */
  readonly ariaLabel = input('');

  /**
   * Id of the element that names the tab bar, usually the heading above it.
   * Empty writes no `aria-labelledby`.
   *
   * @default ''
   */
  readonly ariaLabelledby = input('');

  /**
   * The active panel's {@link ZTabPanel.value}, two-way bindable. Empty or a
   * value that matches no enabled panel falls back to the first enabled one,
   * and that fallback is written back, so the caller never holds a value the
   * group does not show. With no panel at all the value is left alone.
   *
   * @default ''
   */
  readonly value = model('');

  /**
   * Keeps every panel that has been active in the document and hides the
   * inactive ones with the `hidden` attribute, instead of rendering the active
   * one alone. Turn it on when the elements of a panel have to survive a tab
   * change: a scroll position, a playing `<video>`, an `<iframe>` that must not
   * reload. Boolean attribute.
   *
   * @default false
   */
  readonly keepAlive = input(false, { transform: booleanAttribute });

  protected readonly panels = contentChildren(ZTabPanel);
  private readonly knoepfe = viewChildren<ElementRef<HTMLButtonElement>>('knopf');
  private readonly wirt = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The panels an arrow key may land on. */
  private readonly bedienbar = computed(() => this.panels().filter((p) => !p.disabled()));

  /**
   * The panel an empty {@link value} means. Reads `disabled` only, never a
   * `value`, so a panel may ask for it while its siblings are still unbound.
   *
   * @internal Read by `z-tab-panel`.
   */
  readonly erstesOffenes = computed(() => this.bedienbar()[0]);

  /**
   * The value actually shown: {@link value} when an enabled panel carries it,
   * otherwise the first enabled panel. Reads the `value` of every panel and is
   * therefore only read after the render and from event handlers, never while
   * the panels are being created.
   */
  private readonly aktiverWert = computed(() => {
    const offen = this.bedienbar();
    const gewaehlt = offen.find((panel) => panel.value() === this.value());
    return (gewaehlt ?? offen[0])?.value() ?? '';
  });

  constructor() {
    // Writes the fallback back into the model of the parent, the same case as
    // the clamped page of ZPagination (docs/signals.md, "Effects", case 3): a
    // computed cannot write. It runs when the group starts without a value and
    // when the active panel disappears. Without any panel nothing is written,
    // so a value set before the panels arrive survives.
    // After the render and not in a plain effect(): a plain effect runs while
    // the content query already holds a panel that a `@for` has just created
    // whose required `value` is still unbound, and reading it throws NG0950.
    // After the render every panel is bound.
    afterRenderEffect(() => {
      const wert = this.aktiverWert();
      if (this.bedienbar().length && untracked(this.value) !== wert) {
        this.value.set(wert);
      }
    });
  }

  /** Activates a panel, moves the focus onto its tab and scrolls it into view. */
  protected waehle(panel: ZTabPanel): void {
    this.value.set(panel.value());
    const knopf = this.knoepfe()[this.panels().indexOf(panel)]?.nativeElement;
    knopf?.focus();
    // Optional because a test environment without layout does not implement it.
    knopf?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  protected aufTaste(ereignis: KeyboardEvent): void {
    const offen = this.bedienbar();
    if (!offen.length) {
      return;
    }
    // The dir attribute, the same source the CDK's Directionality reads, and
    // the one a document has to set anyway for the text to run the right way.
    const rtl = this.wirt.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const jetzt = Math.max(
      0,
      offen.findIndex((panel) => panel.value() === this.aktiverWert()),
    );
    const ziel: Record<string, number> = {
      ArrowRight: jetzt + (rtl ? -1 : 1),
      ArrowLeft: jetzt + (rtl ? 1 : -1),
      Home: 0,
      End: offen.length - 1,
    };
    if (!(ereignis.key in ziel)) {
      return;
    }
    ereignis.preventDefault();
    this.waehle(offen[(ziel[ereignis.key] + offen.length) % offen.length]);
  }
}
