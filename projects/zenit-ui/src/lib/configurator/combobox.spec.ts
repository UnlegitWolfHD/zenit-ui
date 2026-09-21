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

  it('takes its overlay with it when it is destroyed', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    oeffne(fixture);

    expect(panel()).not.toBeNull();

    fixture.destroy();

    expect(panel()).toBeNull();
    expect(document.querySelector('.z-combo-pane')).toBeNull();
  });
});
