import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form, FormField, max, min } from '@angular/forms/signals';
import { ZButton } from './button';
import { ZCostChart } from './cost-chart';
import { ZStickyBar } from './configurator';
import { ZDialogActions, ZDialogLayout } from './dialog';
import { ZField } from './field/field';
import { ZInput } from './field/input';
import { Z_MENU } from './menu';
import { ZAppHeader, ZBrand, ZHeaderLink } from './navigation/app-header';
import { ZSidebar, ZSidebarGroup, ZSidebarItem } from './navigation/sidebar';
import { ZSlider } from './slider';
import { ZSpinner } from './spinner';
import { ZNum, ZTable, ZTableContainer } from './table';
import { ZTooltip } from './tooltip';

/*
 * `MutationObserver`, `ResizeObserver` and `IntersectionObserver` are browser
 * globals. A component that constructs one where the server can reach it —
 * in a constructor, a field initialiser, an effect of the first change
 * detection, `ngOnInit` — throws a `ReferenceError` during server rendering
 * and takes the whole page down with it: `<a zBtn disabled>` once cost every
 * page carrying a `z-app-header`, because its burger is a `button zBtn`.
 *
 * This is not SSR: jsdom is not a server, and `afterNextRender` runs here
 * while it never runs there, so this file is stricter than the server, not
 * laxer. What it does reproduce is exactly the failing line: with the three
 * globals gone, every component of the library has to be constructible and
 * survive its first change detection, and the attributes it owns have to
 * stand in the resulting HTML without any observer ever running.
 *
 * The real gate is `npm run check:ssr`, which prerenders both applications in
 * plain Node; this file is the cheap companion that names the failing line.
 *
 * A missing global is not the only thing a server withholds. Its elements have
 * no layout and parse no values: `getBoundingClientRect` and `valueAsNumber`
 * are `undefined` there, and its window has no `requestAnimationFrame`. jsdom
 * answers all three, so a case about them stubs away exactly the one it is
 * about, and says so.
 *
 * **Every new observer in the library gets a case here, and so does every DOM
 * read on a path the server reaches: a constructor, an `effect`, a destroy.**
 * `afterNextRender` and `afterRenderEffect` never run there and need none.
 */

/** Renders `host` with the three observer globals gone, and hands back the fixture. */
function ohneBeobachter<T>(host: Type<T>): ComponentFixture<T> {
  for (const name of ['MutationObserver', 'ResizeObserver', 'IntersectionObserver']) {
    vi.stubGlobal(name, undefined);
    // The guard in the library asks `typeof X === 'undefined'`, which is what a
    // server answers for a global that was never defined. `vi.stubGlobal` with
    // `undefined` gives the same answer, and `vi.unstubAllGlobals` puts jsdom's
    // own back for every other spec in the run.
    expect(typeof globalThis[name as 'MutationObserver']).toBe('undefined');
  }
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  return fixture;
}

@Component({
  imports: [ZButton],
  template: `<a zBtn href="#start" [disabled]="gesperrt()">Starten</a>
    <button zBtn="primary" [loading]="laedt()">Server erstellen</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonHost {
  readonly gesperrt = signal(true);
  readonly laedt = signal(true);
}

@Component({
  imports: [ZSpinner],
  template: `<z-spinner label="Wird geladen" /><z-spinner />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpinnerHost {}

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Servername" for="name" hint="Steht später in der Adresse."
    ><input zInput id="name"
  /></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FieldHost {}

@Component({
  imports: [ZDialogActions, ZDialogLayout],
  template: `<z-dialog title="Server löschen?">
    <span>Welt, Konfiguration und alle 3 Backups werden sofort gelöscht.</span>
    <ng-container zDialogActions><button type="button">Abbrechen</button></ng-container>
  </z-dialog>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogHost {}

@Component({
  imports: [Z_MENU],
  template: `<z-menu>
    <button zMenuItem icon="content_copy">Adresse kopieren</button>
    <z-menu-separator />
    <button zMenuItem icon="delete" danger>Server löschen</button>
  </z-menu>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MenuHost {}

@Component({
  imports: [ZSidebar, ZSidebarGroup, ZSidebarItem],
  template: `<z-sidebar ariaLabel="Serverbereiche">
    <z-sidebar-group>
      <button type="button" zSidebarItem icon="dashboard" active>Übersicht</button>
      <button type="button" zSidebarItem icon="terminal">Konsole</button>
    </z-sidebar-group>
  </z-sidebar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SidebarHost {}

@Component({
  imports: [ZStickyBar],
  template: `<z-sticky-bar price="7,74 €" summary="Minecraft, 4 GB, alle 30 Tage">
    <button type="button">Weiter</button>
  </z-sticky-bar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StickyBarHost {}

@Component({
  imports: [ZStickyBar],
  template: `<z-sticky-bar price="7,74 €"><button type="button">Weiter</button></z-sticky-bar>
    <z-sticky-bar price="9,99 €" mobileOnly>
      <button type="button">Kostenpflichtig bestellen</button>
    </z-sticky-bar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZweiStickyBarsHost {}

@Component({
  imports: [FormField, ZSlider],
  template: `<z-slider
    label="Steckplätze"
    unit="Spieler"
    [step]="2"
    [formField]="bestellung.steckplaetze"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SliderFormFieldHost {
  readonly modell = signal({ steckplaetze: 10 });
  readonly bestellung = form(this.modell, (pfad) => {
    min(pfad.steckplaetze, 2);
    max(pfad.steckplaetze, 20);
  });
}

@Component({
  imports: [ZCostChart],
  template: `<z-cost-chart
    [base]="1.5"
    [rate]="0.088"
    [cap]="10.3"
    [maxHours]="150"
    caption="Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class CostChartHost {}

@Component({
  imports: [ZNum, ZTable, ZTableContainer],
  template: `<z-table-container>
    <table zTable>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col" zNum>Größe</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>server.properties</td>
          <td zNum>1,2 kB</td>
        </tr>
      </tbody>
    </table>
  </z-table-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TableHost {}

@Component({
  imports: [ZTooltip],
  template: `<button zTooltip="Server neu starten" aria-describedby="hinweis">Aktualisieren</button>
    <p id="hinweis">Der Name steht später in der Adresse.</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TooltipHost {}

@Component({
  imports: [ZAppHeader, ZBrand, ZHeaderLink],
  template: `<z-app-header navLabel="Hauptnavigation">
    <span zBrand>Zenit</span>
    <a zHeaderLink href="#server" active>Server</a>
  </z-app-header>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppHeaderHost {}

describe('rendering without the observer globals', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('locks a link and writes tabindex="-1" into the HTML', () => {
    // The regression: `new MutationObserver` stood unguarded in the constructor
    // of ZButton, so every page with a `zBtn` failed to render on the server.
    // The lock is not optional, it is the accessible state of a locked link and
    // has to be in the server HTML; only the re-assertion against a caller
    // rewriting `tabindex` waits for the browser.
    const fixture = ohneBeobachter(ButtonHost);
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.getAttribute('aria-disabled')).toBe('true');
    const knopf: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(knopf.getAttribute('aria-busy')).toBe('true');
    // aria-disabled is borrowed through leiheAttribut, whose observer is
    // missing here; the value itself has to be in the HTML all the same.
    expect(knopf.getAttribute('aria-disabled')).toBe('true');
    expect(knopf.hasAttribute('disabled')).toBe(false);
    expect(fixture.nativeElement.querySelector('z-spinner')).not.toBeNull();
  });

  it('gives the spinner its role and hides the unnamed one', () => {
    const fixture = ohneBeobachter(SpinnerHost);
    const [benannt, stumm]: HTMLElement[] = fixture.nativeElement.querySelectorAll('z-spinner');

    expect(benannt.getAttribute('role')).toBe('status');
    expect(benannt.getAttribute('aria-label')).toBe('Wird geladen');
    expect(stumm.getAttribute('aria-hidden')).toBe('true');
  });

  it('links the hint of a field to its control', () => {
    const fixture = ohneBeobachter(FieldHost);
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const hinweis: HTMLElement = fixture.nativeElement.querySelector('.z-field__hint');

    expect(hinweis.id).toBeTruthy();
    expect(feld.getAttribute('aria-describedby')?.split(/\s+/)).toContain(hinweis.id);
  });

  it('renders the dialog layout with its title', () => {
    const fixture = ohneBeobachter(DialogHost);
    const dialog: HTMLElement = fixture.nativeElement.querySelector('z-dialog');

    expect(dialog.textContent).toContain('Server löschen?');
  });

  it('renders the menu and its entries', () => {
    const fixture = ohneBeobachter(MenuHost);
    const eintraege = fixture.nativeElement.querySelectorAll('.z-menu__item');

    expect(eintraege).toHaveLength(2);
  });

  it('renders the sidebar with its entries', () => {
    const fixture = ohneBeobachter(SidebarHost);

    expect(fixture.nativeElement.querySelectorAll('[zSidebarItem]')).toHaveLength(2);
  });

  it('renders the sticky bar with its price', () => {
    const fixture = ohneBeobachter(StickyBarHost);

    expect(fixture.nativeElement.querySelector('.z-stickybar__price')?.textContent).toContain(
      '7,74 €',
    );
  });

  it('destroys two sticky bars without measuring one of them', () => {
    // The regression: `onDestroy` measured every bar that was still alive, so
    // the first of two read the box of the second. On the server that box does
    // not exist — `getBoundingClientRect` is `undefined` on its elements — and
    // the application is destroyed right after rendering, so every page with
    // two bars died with `bar.getBoundingClientRect is not a function`. One bar
    // alone never hit it, because it had removed itself from the set first,
    // which is why the case above passed while `/konfigurator` failed.
    const fixture = ohneBeobachter(ZweiStickyBarsHost);
    const bars: HTMLElement[] = [...fixture.nativeElement.querySelectorAll('z-sticky-bar')];
    expect(bars).toHaveLength(2);

    // From here on the environment is the server's: no box, and no frame to
    // postpone the measurement to either.
    vi.stubGlobal('requestAnimationFrame', undefined);
    for (const bar of bars) {
      Object.defineProperty(bar, 'getBoundingClientRect', { value: undefined, configurable: true });
    }

    expect(() => fixture.destroy()).not.toThrow();
    // The last bar takes the room it kept clear with it, without measuring.
    expect(document.documentElement.style.getPropertyValue('--z-stickybar')).toBe('');
  });

  it('keeps the form value of a slider whose element parses nothing', () => {
    // The regression: the slider reads its value back off the element, because
    // the element clamps to the scale and snaps to the step. The server parses
    // no value, so `valueAsNumber` is `undefined` there — and
    // `Number.isNaN(undefined)` is `false`, so the guard let it through and the
    // slider reported `undefined` to the form. That dropped the key out of the
    // model, and the next binding of `[formField]` found no field any more:
    // `ERROR TypeError: this.field(...) is not a function` on every server page
    // with a slider in a Signal Form.
    vi.spyOn(HTMLInputElement.prototype, 'valueAsNumber', 'get').mockReturnValue(
      undefined as unknown as number,
    );
    const fixture = ohneBeobachter(SliderFormFieldHost);

    expect(fixture.componentInstance.modell()).toEqual({ steckplaetze: 10 });
    expect(fixture.componentInstance.bestellung.steckplaetze().value()).toBe(10);
    expect(fixture.nativeElement.querySelector('.z-range__value')?.textContent).toContain('10');
  });

  it('renders the cost chart at the width of its reference', () => {
    const fixture = ohneBeobachter(CostChartHost);

    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
  });

  it('renders the table container', () => {
    const fixture = ohneBeobachter(TableHost);

    expect(fixture.nativeElement.querySelector('table.z-table')).not.toBeNull();
  });

  it('leaves the description of a tooltip trigger alone', () => {
    const fixture = ohneBeobachter(TooltipHost);
    const knopf: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    // No panel stands on the server, so the trigger keeps exactly what the
    // caller wrote; the token is added when the tooltip opens in the browser.
    expect(knopf.getAttribute('aria-describedby')).toBe('hinweis');
  });

  it('renders the app header, whose burger is the button that broke SSR', () => {
    const fixture = ohneBeobachter(AppHeaderHost);
    const kopf: HTMLElement = fixture.nativeElement.querySelector('z-app-header');

    expect(kopf.querySelector('nav')).not.toBeNull();
    expect(kopf.querySelector('.z-btn')).not.toBeNull();
  });
});
