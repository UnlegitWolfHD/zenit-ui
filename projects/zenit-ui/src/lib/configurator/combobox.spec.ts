import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ZField } from '../field';
import { ZCombobox, ZComboOption } from './combobox';

const VERSIONEN: readonly ZComboOption[] = [
  { value: 'neueste', label: 'Neueste', note: 'mindestens 4 GB', group: 'Aktuell' },
  { value: '1.21.4', label: '1.21.4', note: 'mindestens 4 GB', group: 'Aktuell' },
  { value: '1.20.1', label: '1.20.1', note: 'mindestens 2 GB', group: 'Ältere' },
  { value: '25w14a', label: '25w14a', note: 'nur Snapshots', group: 'Snapshots' },
];

@Component({
  imports: [ZCombobox, ZField],
  template: `<z-field label="Minecraft-Version" for="cb-test" [hint]="hinweis()">
    <z-combobox
      inputId="cb-test"
      [options]="versionen()"
      [(value)]="version"
      emptyText="Keine Version gefunden"
      [disabled]="gesperrt()"
    />
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly versionen = signal(VERSIONEN);
  readonly version = signal('1.21.4');
  readonly hinweis = signal('Leer lassen für die neueste Version.');
  readonly gesperrt = signal(false);
}

/** A field inside a scrolling container, which is what a dialog body is. */
@Component({
  imports: [ZCombobox],
  template: `<div class="roller" style="height: 80px; overflow: auto">
    <div style="height: 400px">
      <z-combobox ariaLabel="Version" [options]="versionen" [(value)]="version" />
    </div>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RollerHost {
  readonly versionen = VERSIONEN;
  readonly version = signal('1.21.4');
}

@Component({
  imports: [ZCombobox, ReactiveFormsModule],
  template: `<z-combobox ariaLabel="Version" [options]="versionen" [formControl]="steuerung" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly versionen = VERSIONEN;
  readonly steuerung = new FormControl('neueste');
}

@Component({
  imports: [ZCombobox, FormField],
  template: `<z-combobox
    ariaLabel="Version"
    [options]="versionen"
    [formField]="formular.version"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly versionen = VERSIONEN;
  readonly modell = signal({ version: 'neueste' });
  readonly formular = form(this.modell);
}

/** Example directory of the server search; the labels are not the values. */
const NUTZER: readonly ZComboOption[] = [
  { value: 'u-1', label: 'Beispiel-Nutzer 1', note: 'nutzer1@example.org' },
  { value: 'u-2', label: 'Beispiel-Nutzer 2', note: 'nutzer2@example.org' },
  { value: 'u-3', label: 'Beispiel-Nutzer 3', note: 'nutzer3@example.org' },
];

/** The server search: the caller filters, the component only shows and reports. */
@Component({
  imports: [ZCombobox],
  template: `<z-combobox
    ariaLabel="Nutzer"
    [options]="treffer()"
    [filterLocally]="false"
    [loading]="laedt()"
    [minQueryLength]="mindestens()"
    [selectedLabel]="etikett()"
    [(value)]="nutzer"
    (queryChange)="anfragen.push($event)"
    emptyText="Kein Nutzer gefunden"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SucheHost {
  readonly treffer = signal<readonly ZComboOption[]>(NUTZER);
  readonly laedt = signal(false);
  readonly mindestens = signal(0);
  readonly etikett = signal('');
  readonly nutzer = signal('');
  readonly anfragen: string[] = [];
}

/** Free text: the tags that exist, plus whatever is typed. */
@Component({
  imports: [ZCombobox],
  template: `<z-combobox ariaLabel="Tag" [options]="tags" [(value)]="tag" allowCustom />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigeneHost {
  readonly tags: readonly ZComboOption[] = [
    { value: 't-hw', label: 'hardware' },
    { value: 't-nw', label: 'netzwerk' },
  ];
  readonly tag = signal('');
}

/** Free text through a reactive form, starting on a value no entry carries. */
@Component({
  imports: [ZCombobox, ReactiveFormsModule],
  template: `<z-combobox ariaLabel="Tag" [options]="tags" allowCustom [formControl]="steuerung" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigeneFormControlHost {
  readonly tags: readonly ZComboOption[] = [{ value: 't-hw', label: 'hardware' }];
  readonly steuerung = new FormControl('eigenes');
}

/** Free text through Signal Forms. */
@Component({
  imports: [ZCombobox, FormField],
  template: `<z-combobox
    ariaLabel="Tag"
    [options]="tags"
    allowCustom
    [formField]="formular.tag"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigeneSignalFormsHost {
  readonly tags: readonly ZComboOption[] = [{ value: 't-hw', label: 'hardware' }];
  readonly modell = signal({ tag: '' });
  readonly formular = form(this.modell);
}

function feld(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input[role="combobox"]');
}

function panel(): HTMLElement | null {
  return document.querySelector('.z-listbox');
}

function zeilen(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.z-listbox__option'));
}

/** Types into the field the way the browser does: value first, then the event. */
function tippe(fixture: ComponentFixture<unknown>, text: string): void {
  const eingabe = feld(fixture);
  eingabe.value = text;
  eingabe.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

/** Names of the entries in the open panel, in display order. */
function namen(): (string | undefined)[] {
  return zeilen().map((zeile) => zeile.querySelector('.z-mono')?.textContent?.trim());
}

/** The whole text of every entry, which is what the own row has instead of a value. */
function texte(): string[] {
  return zeilen().map((zeile) => zeile.textContent?.trim() ?? '');
}

/** The locked rows: empty, loading and the minimum-length hint. */
function meldungen(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.z-listbox__empty'));
}

/** Dispatches a blur the way leaving the field does. */
function verlasse(fixture: ComponentFixture<unknown>): void {
  feld(fixture).dispatchEvent(new Event('blur'));
  fixture.detectChanges();
}

/** ListKeyManager of the CDK reads event.keyCode, which a synthetic event has to carry. */
const CODES: Record<string, number> = {
  Tab: 9,
  Enter: 13,
  Escape: 27,
  End: 35,
  Home: 36,
  ArrowUp: 38,
  ArrowDown: 40,
};

function taste(fixture: ComponentFixture<unknown>, key: string): void {
  feld(fixture).dispatchEvent(
    new KeyboardEvent('keydown', { key, keyCode: CODES[key], bubbles: true }),
  );
  fixture.detectChanges();
}

function oeffne(fixture: ComponentFixture<unknown>): void {
  feld(fixture).focus();
  taste(fixture, 'ArrowDown');
}

describe('ZCombobox', () => {
  it('carries the attributes of the ARIA combobox pattern', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const eingabe = feld(fixture);

    expect(eingabe.getAttribute('role')).toBe('combobox');
    expect(eingabe.getAttribute('aria-autocomplete')).toBe('list');
    expect(eingabe.getAttribute('aria-expanded')).toBe('false');
    // No aria-controls while there is no panel: it would point at nothing.
    expect(eingabe.hasAttribute('aria-controls')).toBe(false);
    expect(eingabe.hasAttribute('aria-activedescendant')).toBe(false);
    expect(eingabe.id).toBe('cb-test');
    // The label of the surrounding z-field names the field, its hint describes it.
    expect(fixture.nativeElement.querySelector('label.z-field__label').htmlFor).toBe('cb-test');
    expect(eingabe.getAttribute('aria-describedby')).toBe('cb-test-hint');
  });

  it('shows the label of the value, not the value', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();

    expect(feld(fixture).value).toBe('1.21.4');

    fixture.componentInstance.version.set('neueste');
    fixture.detectChanges();

    expect(feld(fixture).value).toBe('Neueste');
  });

  it('opens a listbox with every entry and marks the chosen one', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);

    expect(feld(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(panel()?.getAttribute('role')).toBe('listbox');
    expect(panel()?.id).toBe(feld(fixture).getAttribute('aria-controls'));
    expect(zeilen()).toHaveLength(4);
    expect(
      zeilen()
        .filter((zeile) => zeile.getAttribute('aria-selected') === 'true')
        .map((zeile) => zeile.querySelector('.z-mono')?.textContent?.trim()),
    ).toEqual(['1.21.4']);
  });

  it('renders every heading as a named role="group"', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);
    const gruppen = Array.from(document.querySelectorAll('.z-listbox [role="group"]'));

    expect(gruppen.map((gruppe) => gruppe.getAttribute('aria-label'))).toEqual([
      'Aktuell',
      'Ältere',
      'Snapshots',
    ]);
    expect(
      Array.from(document.querySelectorAll('.z-listbox__group')).map((k) => k.textContent?.trim()),
    ).toEqual(['Aktuell', 'Ältere', 'Snapshots']);
  });

  it('filters over label and note, whatever the case', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    tippe(fixture, '1.2');

    expect(namen()).toEqual(['1.21.4', '1.20.1']);

    tippe(fixture, 'MINDESTENS 2');

    expect(namen()).toEqual(['1.20.1']);
  });

  it('shows one row instead of an empty panel', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    tippe(fixture, 'gibt es nicht');

    expect(zeilen()).toHaveLength(0);
    const leer = document.querySelector('.z-listbox__empty') as HTMLElement;
    expect(leer.textContent?.trim()).toBe('Keine Version gefunden');
    expect(leer.getAttribute('role')).toBe('option');
    expect(leer.getAttribute('aria-disabled')).toBe('true');
  });

  it('moves the active entry with the arrows, Home and End, and keeps the focus in the field', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);
    const eingabe = feld(fixture);
    const id = eingabe.getAttribute('aria-controls');

    // Opening makes the chosen entry active, which is the second one.
    expect(eingabe.getAttribute('aria-activedescendant')).toBe(`${id}-1`);

    taste(fixture, 'ArrowDown');
    expect(eingabe.getAttribute('aria-activedescendant')).toBe(`${id}-2`);

    taste(fixture, 'ArrowUp');
    taste(fixture, 'ArrowUp');
    expect(eingabe.getAttribute('aria-activedescendant')).toBe(`${id}-0`);

    taste(fixture, 'End');
    expect(eingabe.getAttribute('aria-activedescendant')).toBe(`${id}-3`);
    expect(zeilen()[3].classList.contains('z-listbox__option--active')).toBe(true);

    taste(fixture, 'Home');
    expect(eingabe.getAttribute('aria-activedescendant')).toBe(`${id}-0`);
    expect(document.activeElement).toBe(eingabe);
  });

  it('takes the active entry on Enter and closes', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);
    taste(fixture, 'ArrowDown');
    taste(fixture, 'Enter');

    expect(fixture.componentInstance.version()).toBe('1.20.1');
    expect(feld(fixture).value).toBe('1.20.1');
    expect(panel()).toBeNull();
    expect(feld(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(feld(fixture));
  });

  it('keeps the focus in the field wherever the pointer lands in the panel', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);

    // Not only an entry: the scrollbar, a heading and the empty row are part of
    // the panel too, and each of them would otherwise blur the field.
    for (const ziel of [
      zeilen()[3],
      panel() as HTMLElement,
      document.querySelector('.z-listbox__group') as HTMLElement,
    ]) {
      const nieder = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      ziel.dispatchEvent(nieder);
      expect(nieder.defaultPrevented).toBe(true);
    }

    zeilen()[3].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.version()).toBe('25w14a');
    expect(document.activeElement).toBe(feld(fixture));
  });

  it('keeps Escape to itself while the panel is open', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const gesehen: string[] = [];
    const horcher = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        gesehen.push(e.key);
      }
    };
    document.addEventListener('keydown', horcher);
    oeffne(fixture);
    taste(fixture, 'Escape');

    // A dialog around the field listens further up; the key stops here.
    expect(gesehen).toEqual([]);

    taste(fixture, 'Escape');

    // Closed, the key belongs to whatever is around it again.
    expect(gesehen).toEqual(['Escape']);
    document.removeEventListener('keydown', horcher);
  });

  it('names the count of matches in a live region', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const region: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');

    expect(region.classList.contains('z-visually-hidden')).toBe(true);
    expect(region.textContent?.trim()).toBe('');

    oeffne(fixture);
    expect(region.textContent?.trim()).toBe('4 Treffer');

    tippe(fixture, '1.2');
    expect(region.textContent?.trim()).toBe('2 Treffer');

    tippe(fixture, 'gibt es nicht');
    expect(region.textContent?.trim()).toBe('Keine Version gefunden');
  });

  it('puts entries of the same group under one heading, wherever they stand', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.versionen.set([
      { value: 'a', label: 'a', group: 'Aktuell' },
      { value: 'b', label: 'b', group: 'Ältere' },
      { value: 'c', label: 'c', group: 'Aktuell' },
    ]);
    fixture.detectChanges();
    oeffne(fixture);

    expect(
      Array.from(document.querySelectorAll('.z-listbox__group')).map((k) => k.textContent?.trim()),
    ).toEqual(['Aktuell', 'Ältere']);
    expect(namen()).toEqual(['a', 'c', 'b']);

    // The arrow keys walk the rows in the order they are drawn, not in the
    // order of `options`: grouping moves rows, and the keyboard follows the eye.
    const id = feld(fixture).getAttribute('aria-controls');
    expect(zeilen().map((zeile) => zeile.id)).toEqual([`${id}-0`, `${id}-1`, `${id}-2`]);

    taste(fixture, 'Home');
    expect(feld(fixture).getAttribute('aria-activedescendant')).toBe(`${id}-0`);
    taste(fixture, 'ArrowDown');
    expect(zeilen()[1].classList.contains('z-listbox__option--active')).toBe(true);
    taste(fixture, 'Enter');

    expect(fixture.componentInstance.version()).toBe('c');
  });

  it('follows an overlay that is detached from outside', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);

    expect(panel()).not.toBeNull();

    // This is what the scroll strategy does once the field leaves the viewport.
    // Without the detachments() subscription the component would keep an open
    // state the document no longer has. (Whether the strategy really fires
    // needs layout, so e2e/konfigurator.spec.ts scrolls a real page.)
    (document.querySelector('.z-combo-pane') as HTMLElement).remove();
    feld(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(feld(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(feld(fixture).hasAttribute('aria-controls')).toBe(false);
  });

  it('closes on Escape without clearing, and a second Escape takes nothing away', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);
    taste(fixture, 'Escape');

    expect(panel()).toBeNull();
    expect(feld(fixture).value).toBe('1.21.4');

    taste(fixture, 'Escape');

    expect(feld(fixture).value).toBe('1.21.4');
    expect(fixture.componentInstance.version()).toBe('1.21.4');
    expect(document.activeElement).toBe(feld(fixture));
  });

  it('puts the chosen label back when the field is left with text that matches nothing', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    tippe(fixture, 'Unsinn');

    expect(feld(fixture).value).toBe('Unsinn');

    feld(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(feld(fixture).value).toBe('1.21.4');
    expect(fixture.componentInstance.version()).toBe('1.21.4');
    expect(panel()).toBeNull();
  });

  it('stays shut and unreachable while it is locked', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();

    expect(feld(fixture).disabled).toBe(true);

    oeffne(fixture);

    expect(panel()).toBeNull();
  });

  it('works with a reactive FormControl, in both directions', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    expect(feld(fixture).value).toBe('Neueste');

    oeffne(fixture);
    taste(fixture, 'ArrowDown');
    taste(fixture, 'Enter');

    expect(fixture.componentInstance.steuerung.value).toBe('1.21.4');

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld(fixture).disabled).toBe(true);
  });

  it('works with Signal Forms through [formField]', () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    oeffne(fixture);
    taste(fixture, 'End');
    taste(fixture, 'Enter');

    expect(fixture.componentInstance.modell().version).toBe('25w14a');
  });

  it('follows the field in a scrolling container and closes once it has left it', () => {
    const fixture = TestBed.createComponent(RollerHost);
    fixture.detectChanges();
    oeffne(fixture);
    const roller: HTMLElement = fixture.nativeElement.querySelector('.roller');
    const eingabe = feld(fixture);
    // jsdom has no layout, so the two boxes that decide this are given.
    const kasten = (oben: number, unten: number) => () =>
      ({ top: oben, bottom: unten, left: 0, right: 200 }) as DOMRect;
    roller.getBoundingClientRect = kasten(0, 80);
    eingabe.getBoundingClientRect = kasten(10, 40);

    // Scrolling inside the list moves no field: the panel stays either way.
    (panel() as HTMLElement).dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(panel()).not.toBeNull();

    // The container scrolls a little, the field is still in it: the panel
    // follows it instead of leaving the visitor without a list.
    roller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(panel()).not.toBeNull();

    // Now the field has left the container. The wrapper is neither the window
    // nor a cdkScrollable, so nothing but the capture listener hears it.
    eingabe.getBoundingClientRect = kasten(-60, -30);
    roller.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(eingabe.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes when the page has scrolled the field out of the viewport', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);
    const eingabe = feld(fixture);
    eingabe.getBoundingClientRect = () => ({ top: 20, bottom: 56, left: 0, right: 200 }) as DOMRect;

    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(panel()).not.toBeNull();

    eingabe.getBoundingClientRect = () =>
      ({ top: -80, bottom: -44, left: 0, right: 200 }) as DOMRect;
    document.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();

    expect(panel()).toBeNull();
    expect(eingabe.getAttribute('aria-expanded')).toBe('false');
  });

  it('takes its overlay with it when it is destroyed', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);

    expect(panel()).not.toBeNull();

    fixture.destroy();

    expect(panel()).toBeNull();
    expect(document.querySelector('.z-combo-pane')).toBeNull();
  });

  describe('search on the server', () => {
    it('reports the typed text and nothing the component writes itself', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;

      // A value set from outside rewrites the field, and that is not a query.
      host.nutzer.set('u-2');
      fixture.detectChanges();

      expect(feld(fixture).value).toBe('Beispiel-Nutzer 2');
      expect(host.anfragen).toEqual([]);

      tippe(fixture, 'Bei');
      tippe(fixture, 'Beispiel');

      expect(host.anfragen).toEqual(['Bei', 'Beispiel']);

      // Taking an entry puts its label in the field; that write is not a query.
      taste(fixture, 'ArrowDown');
      taste(fixture, 'Enter');

      expect(host.nutzer()).toBe('u-3');
      expect(feld(fixture).value).toBe('Beispiel-Nutzer 3');
      expect(host.anfragen).toEqual(['Bei', 'Beispiel']);

      tippe(fixture, '');

      expect(host.anfragen).toEqual(['Bei', 'Beispiel', '']);
    });

    it('shows exactly the options it is given, unfiltered', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.detectChanges();
      tippe(fixture, 'gibt es nicht');

      // Local filtering would have left nothing; the caller decides here.
      expect(namen()).toEqual(['Beispiel-Nutzer 1', 'Beispiel-Nutzer 2', 'Beispiel-Nutzer 3']);

      fixture.componentInstance.treffer.set([NUTZER[2]]);
      fixture.detectChanges();

      expect(namen()).toEqual(['Beispiel-Nutzer 3']);
    });

    it('keeps the active entry when the options are replaced under the open panel', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.detectChanges();
      oeffne(fixture);
      taste(fixture, 'ArrowDown');
      taste(fixture, 'ArrowDown');
      const id = feld(fixture).getAttribute('aria-controls');

      expect(feld(fixture).getAttribute('aria-activedescendant')).toBe(`${id}-2`);

      // The third entry is now the second one: the keyboard follows the entry,
      // not the position it used to sit at.
      fixture.componentInstance.treffer.set([NUTZER[0], NUTZER[2]]);
      fixture.detectChanges();

      expect(feld(fixture).getAttribute('aria-activedescendant')).toBe(`${id}-1`);
      expect(zeilen()[1].classList.contains('z-listbox__option--active')).toBe(true);
    });

    it('falls back to the first entry and never names a row that is gone', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.detectChanges();
      oeffne(fixture);
      taste(fixture, 'End');
      const id = feld(fixture).getAttribute('aria-controls');

      expect(feld(fixture).getAttribute('aria-activedescendant')).toBe(`${id}-2`);

      fixture.componentInstance.treffer.set([{ value: 'u-9', label: 'Beispiel-Nutzer 9' }]);
      fixture.detectChanges();

      const aktiv = feld(fixture).getAttribute('aria-activedescendant');
      expect(aktiv).toBe(`${id}-0`);
      expect(document.getElementById(aktiv as string)).not.toBeNull();

      // Nothing left at all: the reference goes rather than pointing nowhere.
      fixture.componentInstance.treffer.set([]);
      fixture.detectChanges();

      expect(feld(fixture).hasAttribute('aria-activedescendant')).toBe(false);
    });

    it('draws one waiting row, keeps the options above it and marks the list busy', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.detectChanges();
      oeffne(fixture);

      expect(panel()?.hasAttribute('aria-busy')).toBe(false);

      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();

      expect(panel()?.getAttribute('aria-busy')).toBe('true');
      // The options that are already there stay, so the list does not blank
      // under the hand that is typing.
      expect(zeilen()).toHaveLength(3);
      const laden = document.querySelector('.z-listbox__loading') as HTMLElement;
      expect(laden.textContent?.trim()).toBe('Lädt');
      expect(laden.querySelector('.z-spinner')).not.toBeNull();
      // It is a locked row and no entry: the keyboard cannot reach it.
      expect(laden.getAttribute('aria-disabled')).toBe('true');
      expect(laden.classList.contains('z-listbox__option')).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent?.trim()).toBe(
        'Lädt',
      );
    });

    it('shows no empty row while it is loading', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.componentInstance.treffer.set([]);
      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();
      oeffne(fixture);

      expect(meldungen().map((m) => m.textContent?.trim())).toEqual(['Lädt']);

      fixture.componentInstance.laedt.set(false);
      fixture.detectChanges();

      expect(meldungen().map((m) => m.textContent?.trim())).toEqual(['Kein Nutzer gefunden']);
    });

    it('holds the list back below minQueryLength and reports the query anyway', () => {
      const fixture = TestBed.createComponent(SucheHost);
      fixture.componentInstance.mindestens.set(2);
      fixture.detectChanges();
      oeffne(fixture);

      expect(zeilen()).toHaveLength(0);
      expect(meldungen().map((m) => m.textContent?.trim())).toEqual([
        'Mindestens 2 Zeichen eingeben',
      ]);
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent?.trim()).toBe(
        'Mindestens 2 Zeichen eingeben',
      );

      tippe(fixture, 'B');

      expect(zeilen()).toHaveLength(0);
      expect(fixture.componentInstance.anfragen).toEqual(['B']);

      tippe(fixture, 'Be');

      expect(zeilen()).toHaveLength(3);
      expect(meldungen()).toHaveLength(0);
    });

    it('names the chosen value through selectedLabel while no entry carries it', () => {
      const fixture = TestBed.createComponent(SucheHost);
      const host = fixture.componentInstance;
      host.nutzer.set('u-9');
      host.etikett.set('Beispiel-Nutzer 9');
      host.treffer.set([]);
      fixture.detectChanges();

      expect(feld(fixture).value).toBe('Beispiel-Nutzer 9');

      // An entry that is in the list again is the fresher name of the two.
      host.treffer.set([{ value: 'u-9', label: 'Beispiel-Nutzer neun' }]);
      fixture.detectChanges();

      expect(feld(fixture).value).toBe('Beispiel-Nutzer neun');
    });
  });

  describe('free text', () => {
    it('offers the typed text as the first row and takes it on Enter', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, 'neuer-tag');

      expect(texte()).toEqual(['„neuer-tag“ übernehmen']);
      expect(meldungen()).toHaveLength(0);

      taste(fixture, 'Enter');

      expect(fixture.componentInstance.tag()).toBe('neuer-tag');
      expect(feld(fixture).value).toBe('neuer-tag');
      expect(panel()).toBeNull();
    });

    it('puts the own row above the matches and lets the arrows walk past it', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, 'e');
      const id = feld(fixture).getAttribute('aria-controls');

      expect(texte()).toEqual(['„e“ übernehmen', 'hardware', 'netzwerk']);
      expect(feld(fixture).getAttribute('aria-activedescendant')).toBe(`${id}-0`);

      taste(fixture, 'ArrowDown');
      taste(fixture, 'Enter');

      expect(fixture.componentInstance.tag()).toBe('t-hw');
      expect(feld(fixture).value).toBe('hardware');
    });

    it('drops the own row where the text is already the label of an entry', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, 'hardware');

      expect(texte()).toEqual(['hardware']);

      // Leaving the field takes the entry's value, not its label: one row, one
      // value, however it was reached.
      verlasse(fixture);

      expect(fixture.componentInstance.tag()).toBe('t-hw');
    });

    it('takes the typed text when the field is left', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, '  wiki  ');
      verlasse(fixture);

      expect(fixture.componentInstance.tag()).toBe('wiki');
      expect(feld(fixture).value).toBe('wiki');
      expect(document.activeElement).not.toBe(feld(fixture));
    });

    it('takes the typed text on Tab, before the panel closes under it', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, 'per tab');
      taste(fixture, 'Tab');

      expect(fixture.componentInstance.tag()).toBe('per tab');
      expect(feld(fixture).value).toBe('per tab');
      expect(panel()).toBeNull();
    });

    it('gives the text up on Escape, as it always did', () => {
      const fixture = TestBed.createComponent(EigeneHost);
      fixture.detectChanges();
      tippe(fixture, 'verworfen');
      taste(fixture, 'Escape');

      expect(fixture.componentInstance.tag()).toBe('');
      expect(feld(fixture).value).toBe('');
    });

    it('shows a value that is in no entry, coming from a reactive form', () => {
      const fixture = TestBed.createComponent(EigeneFormControlHost);
      fixture.detectChanges();

      expect(feld(fixture).value).toBe('eigenes');

      tippe(fixture, 'noch eins');
      taste(fixture, 'Enter');

      expect(fixture.componentInstance.steuerung.value).toBe('noch eins');
      expect(feld(fixture).value).toBe('noch eins');
    });

    it('writes a value that is in no entry through Signal Forms', () => {
      const fixture = TestBed.createComponent(EigeneSignalFormsHost);
      fixture.detectChanges();
      tippe(fixture, 'eigener tag');
      verlasse(fixture);

      expect(fixture.componentInstance.modell().tag).toBe('eigener tag');
    });

    it('stays as it was without allowCustom', () => {
      const fixture = TestBed.createComponent(ModellHost);
      fixture.detectChanges();
      tippe(fixture, 'Unsinn');

      expect(texte()).toEqual([]);

      taste(fixture, 'Enter');

      expect(fixture.componentInstance.version()).toBe('1.21.4');
    });
  });
});
