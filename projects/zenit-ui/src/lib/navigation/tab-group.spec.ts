import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZTabGroup, ZTabPanel } from './tab-group';

interface Vorgabe {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  imports: [ZTabGroup, ZTabPanel],
  template: `<z-tab-group ariaLabel="Serveransichten" [(value)]="wert" [keepAlive]="keepAlive()">
    @for (vorgabe of vorgaben(); track vorgabe.value) {
      <z-tab-panel
        [value]="vorgabe.value"
        [label]="vorgabe.label"
        [disabled]="vorgabe.disabled ?? false"
      >
        <span class="inhalt">Inhalt {{ vorgabe.value }}</span>
      </z-tab-panel>
    }
  </z-tab-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabGroupHost {
  readonly wert = signal('');
  readonly keepAlive = signal(false);
  readonly vorgaben = signal<Vorgabe[]>([
    { value: 'uebersicht', label: 'Übersicht' },
    { value: 'apps', label: 'Apps' },
    { value: 'speicher', label: 'Speicher' },
    { value: 'pakete', label: 'Pakete', disabled: true },
    { value: 'einstellungen', label: 'Einstellungen' },
  ]);
}

@Component({
  imports: [ZTabGroup, ZTabPanel],
  template: `<div dir="rtl">
    <z-tab-group ariaLabel="Serveransichten" [(value)]="wert">
      <z-tab-panel value="eins" label="Eins">Eins</z-tab-panel>
      <z-tab-panel value="zwei" label="Zwei">Zwei</z-tab-panel>
      <z-tab-panel value="drei" label="Drei">Drei</z-tab-panel>
    </z-tab-group>
  </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class RtlHost {
  readonly wert = signal('zwei');
}

@Component({
  imports: [ZTabGroup, ZTabPanel],
  template: `<z-tab-group ariaLabel="Erste">
      <z-tab-panel value="a" label="A">A</z-tab-panel>
      <z-tab-panel value="b" label="B">B</z-tab-panel>
    </z-tab-group>
    <z-tab-group ariaLabel="Zweite">
      <z-tab-panel value="a" label="A">A</z-tab-panel>
      <z-tab-panel value="b" label="B">B</z-tab-panel>
    </z-tab-group>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ZweiGruppenHost {}

function tabs(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button.z-tab'));
}

function panels(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('z-tab-panel'));
}

/** The panel contents that really stand in the document. */
function inhalte(fixture: ComponentFixture<unknown>): string[] {
  return Array.from(fixture.nativeElement.querySelectorAll('span.inhalt')).map((el) =>
    (el as HTMLElement).textContent?.trim(),
  ) as string[];
}

function taste(ziel: HTMLElement, key: string): void {
  ziel.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function baue(): ComponentFixture<TabGroupHost> {
  const fixture = TestBed.createComponent(TabGroupHost);
  fixture.detectChanges();
  return fixture;
}

describe('ZTabGroup', () => {
  it('renders a named tablist with one tab button per panel', () => {
    const fixture = baue();
    const liste = fixture.nativeElement.querySelector('div.z-tabs');

    expect(liste.getAttribute('role')).toBe('tablist');
    expect(liste.getAttribute('aria-label')).toBe('Serveransichten');
    expect(tabs(fixture).map((tab) => tab.textContent?.trim())).toEqual([
      'Übersicht',
      'Apps',
      'Speicher',
      'Pakete',
      'Einstellungen',
    ]);
    expect(tabs(fixture).map((tab) => tab.getAttribute('role'))).toEqual([
      'tab',
      'tab',
      'tab',
      'tab',
      'tab',
    ]);
    expect(tabs(fixture).every((tab) => tab.type === 'button')).toBe(true);
  });

  it('wires every tab to its panel through ids in both directions', () => {
    const fixture = baue();
    const [ersterTab] = tabs(fixture);
    const [erstesPanel] = panels(fixture);

    expect(ersterTab.getAttribute('aria-controls')).toBe(erstesPanel.id);
    expect(erstesPanel.getAttribute('aria-labelledby')).toBe(ersterTab.id);
    expect(erstesPanel.getAttribute('role')).toBe('tabpanel');
    expect(erstesPanel.getAttribute('tabindex')).toBe('0');
  });

  it('points aria-controls only at a panel that stands in the document', () => {
    const fixture = baue();

    expect(tabs(fixture).map((tab) => tab.hasAttribute('aria-controls'))).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('starts on the first enabled panel and reports it back through value', () => {
    const fixture = baue();

    expect(fixture.componentInstance.wert()).toBe('uebersicht');
    expect(tabs(fixture).map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
    ]);
    expect(inhalte(fixture)).toEqual(['Inhalt uebersicht']);
  });

  it('skips a disabled first panel when it picks the default', () => {
    const fixture = TestBed.createComponent(TabGroupHost);
    fixture.componentInstance.vorgaben.update((liste) => [
      { ...liste[0], disabled: true },
      ...liste.slice(1),
    ]);
    fixture.detectChanges();

    expect(fixture.componentInstance.wert()).toBe('apps');
  });

  it('locks a disabled tab natively', () => {
    const fixture = baue();

    expect(tabs(fixture).map((tab) => tab.disabled)).toEqual([false, false, false, true, false]);
  });

  it('gives the active tab the only tab stop of the bar', () => {
    const fixture = baue();

    expect(tabs(fixture).map((tab) => tab.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
      '-1',
      '-1',
      '-1',
    ]);
  });

  it('switches on a click and moves the focus onto the clicked tab', () => {
    const fixture = baue();
    tabs(fixture)[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.wert()).toBe('speicher');
    expect(document.activeElement).toBe(tabs(fixture)[2]);
    expect(inhalte(fixture)).toEqual(['Inhalt speicher']);
  });

  it('follows a value written from the outside', () => {
    const fixture = baue();
    fixture.componentInstance.wert.set('einstellungen');
    fixture.detectChanges();

    expect(tabs(fixture).map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'true',
    ]);
    expect(inhalte(fixture)).toEqual(['Inhalt einstellungen']);
  });

  it('moves and activates with Arrow Right and Arrow Left', () => {
    const fixture = baue();

    taste(tabs(fixture)[0], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('apps');
    expect(document.activeElement).toBe(tabs(fixture)[1]);

    taste(tabs(fixture)[1], 'ArrowLeft');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('uebersicht');
  });

  it('wraps around at both ends', () => {
    const fixture = baue();

    taste(tabs(fixture)[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('einstellungen');

    taste(tabs(fixture)[4], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('uebersicht');
  });

  it('skips the disabled tab in both directions', () => {
    const fixture = baue();
    fixture.componentInstance.wert.set('speicher');
    fixture.detectChanges();

    taste(tabs(fixture)[2], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('einstellungen');

    taste(tabs(fixture)[4], 'ArrowLeft');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('speicher');
  });

  it('jumps to the first and the last enabled tab with Home and End', () => {
    const fixture = baue();
    fixture.componentInstance.wert.set('apps');
    fixture.detectChanges();

    taste(tabs(fixture)[1], 'End');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('einstellungen');

    taste(tabs(fixture)[4], 'Home');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('uebersicht');
  });

  it('leaves other keys alone', () => {
    const fixture = baue();

    taste(tabs(fixture)[0], 'ArrowDown');
    taste(tabs(fixture)[0], 'a');
    fixture.detectChanges();

    expect(fixture.componentInstance.wert()).toBe('uebersicht');
  });

  it('swaps the two arrows in a right-to-left context', () => {
    const fixture = TestBed.createComponent(RtlHost);
    fixture.detectChanges();

    taste(tabs(fixture)[1], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('eins');

    taste(tabs(fixture)[0], 'ArrowLeft');
    fixture.detectChanges();
    expect(fixture.componentInstance.wert()).toBe('zwei');
  });

  it('renders the active panel alone and hides the rest', () => {
    const fixture = baue();
    tabs(fixture)[1].click();
    fixture.detectChanges();

    expect(inhalte(fixture)).toEqual(['Inhalt apps']);
    expect(panels(fixture).map((panel) => panel.hasAttribute('hidden'))).toEqual([
      true,
      false,
      true,
      true,
      true,
    ]);
  });

  it('keeps every visited panel in the document with keepAlive', () => {
    const fixture = baue();
    fixture.componentInstance.keepAlive.set(true);
    fixture.detectChanges();

    tabs(fixture)[1].click();
    fixture.detectChanges();
    expect(inhalte(fixture)).toEqual(['Inhalt uebersicht', 'Inhalt apps']);

    tabs(fixture)[2].click();
    fixture.detectChanges();
    expect(inhalte(fixture)).toEqual(['Inhalt uebersicht', 'Inhalt apps', 'Inhalt speicher']);
    // Visited, but not active: in the document and out of the tree.
    expect(panels(fixture).map((panel) => panel.hasAttribute('hidden'))).toEqual([
      true,
      true,
      false,
      true,
      true,
    ]);
    expect(tabs(fixture).map((tab) => tab.hasAttribute('aria-controls'))).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('takes a panel added at runtime into the bar', () => {
    const fixture = baue();
    fixture.componentInstance.vorgaben.update((liste) => [
      ...liste,
      { value: 'protokoll', label: 'Protokoll' },
    ]);
    fixture.detectChanges();

    expect(tabs(fixture).length).toBe(6);
    expect(tabs(fixture)[5].textContent?.trim()).toBe('Protokoll');
    expect(fixture.componentInstance.wert()).toBe('uebersicht');
  });

  it('falls back to the first enabled panel when the active one is removed', () => {
    const fixture = baue();
    fixture.componentInstance.wert.set('speicher');
    fixture.detectChanges();

    fixture.componentInstance.vorgaben.update((liste) =>
      liste.filter((vorgabe) => vorgabe.value !== 'speicher'),
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.wert()).toBe('uebersicht');
    expect(inhalte(fixture)).toEqual(['Inhalt uebersicht']);
  });

  it('follows a label that changes at runtime', () => {
    const fixture = baue();
    fixture.componentInstance.vorgaben.update((liste) =>
      liste.map((vorgabe) =>
        vorgabe.value === 'apps' ? { ...vorgabe, label: 'Anwendungen' } : vorgabe,
      ),
    );
    fixture.detectChanges();

    expect(tabs(fixture)[1].textContent?.trim()).toBe('Anwendungen');
    expect(tabs(fixture)[1].id).toBe(panels(fixture)[1].getAttribute('aria-labelledby'));
  });

  it('gives two groups on one page ids of their own', () => {
    const fixture = TestBed.createComponent(ZweiGruppenHost);
    fixture.detectChanges();

    const ids = [
      ...tabs(fixture).map((tab) => tab.id),
      ...panels(fixture).map((panel) => panel.id),
    ];

    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
