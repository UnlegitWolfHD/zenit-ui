import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZInputAction } from './input-action';

@Component({
  imports: [ZInputAction],
  template: `<z-input-action
    label="Gutscheincode (optional)"
    actionLabel="Einlösen"
    [(value)]="code"
    [loading]="laeuft()"
    [success]="erfolg()"
    [error]="fehler()"
    [disabled]="gesperrt()"
    (action)="gerufen.set($event)"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly code = signal('ZENIT10');
  readonly laeuft = signal(false);
  readonly erfolg = signal('');
  readonly fehler = signal('');
  readonly gesperrt = signal(false);
  readonly gerufen = signal<string | null>(null);
}

@Component({
  imports: [ZInputAction],
  template: `<z-input-action ariaLabel="Gutscheincode" actionLabel="Einlösen" value="X" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NameHost {}

function feld(fixture: ComponentFixture<Host>): HTMLInputElement {
  return fixture.nativeElement.querySelector('.z-input-action .z-input');
}

function knopf(fixture: ComponentFixture<Host>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.z-input-action button');
}

function enter(fixture: ComponentFixture<Host>): void {
  feld(fixture).dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }),
  );
  fixture.detectChanges();
}

describe('ZInputAction', () => {
  it('renders a labelled field with a secondary button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const beschriftung: HTMLLabelElement =
      fixture.nativeElement.querySelector('label.z-field__label');

    expect(beschriftung.textContent?.trim()).toBe('Gutscheincode (optional)');
    expect(beschriftung.htmlFor).toBe(feld(fixture).id);
    expect(knopf(fixture).textContent?.trim()).toBe('Einlösen');
    expect(knopf(fixture).classList.contains('z-btn--secondary')).toBe(true);
  });

  it('fires the action with the current value, on the button and on Enter', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    knopf(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.gerufen()).toBe('ZENIT10');

    fixture.componentInstance.gerufen.set(null);
    fixture.componentInstance.code.set('SOMMER');
    fixture.detectChanges();
    enter(fixture);

    expect(fixture.componentInstance.gerufen()).toBe('SOMMER');
  });

  it('reports what was typed through the two-way binding', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const eingabe = feld(fixture);
    eingabe.value = 'WINTER';
    eingabe.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.code()).toBe('WINTER');
  });

  it('fires nothing on an empty field', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.code.set('   ');
    fixture.detectChanges();

    knopf(fixture).click();
    enter(fixture);

    expect(fixture.componentInstance.gerufen()).toBeNull();
  });

  it('locks the button with a spinner while it is loading, and fires nothing', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.laeuft.set(true);
    fixture.detectChanges();

    expect(knopf(fixture).disabled).toBe(true);
    expect(knopf(fixture).querySelector('z-spinner')).not.toBeNull();

    enter(fixture);

    expect(fixture.componentInstance.gerufen()).toBeNull();
  });

  it('holds both live regions before their sentence and ties them to the field', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const erfolg: HTMLElement = fixture.nativeElement.querySelector('.z-field__success');
    const fehler: HTMLElement = fixture.nativeElement.querySelector('.z-field__error');

    // Both exist while they are empty; that is what makes a later sentence announce.
    // Both polite: the answer belongs to an action the visitor just took, so it
    // waits its turn instead of interrupting (role="alert" would not).
    expect(erfolg.getAttribute('role')).toBe('status');
    expect(fehler.getAttribute('role')).toBe('status');
    expect(erfolg.textContent).toBe('');
    expect(feld(fixture).getAttribute('aria-describedby')).toBe(`${erfolg.id} ${fehler.id}`);
    expect(feld(fixture).hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.erfolg.set('ZENIT10 eingelöst: 10 % auf die erste Laufzeit.');
    fixture.detectChanges();

    expect(erfolg.textContent).toBe('ZENIT10 eingelöst: 10 % auf die erste Laufzeit.');

    fixture.componentInstance.fehler.set('Dieser Code ist am 31.08.2026 abgelaufen.');
    fixture.detectChanges();

    expect(fehler.textContent).toBe('Dieser Code ist am 31.08.2026 abgelaufen.');
    expect(feld(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('hands out the trimmed value, which is the one it checked', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.code.set('  ZENIT10  ');
    fixture.detectChanges();

    knopf(fixture).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.gerufen()).toBe('ZENIT10');
  });

  it('takes an accessible name where there is no visible label', () => {
    const fixture = TestBed.createComponent(NameHost);
    fixture.detectChanges();
    const eingabe: HTMLInputElement = fixture.nativeElement.querySelector('.z-input');

    expect(fixture.nativeElement.querySelector('label.z-field__label')).toBeNull();
    expect(eingabe.getAttribute('aria-label')).toBe('Gutscheincode');
  });

  it('locks field and button while it is disabled', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();

    expect(feld(fixture).disabled).toBe(true);
    expect(knopf(fixture).disabled).toBe(true);

    enter(fixture);

    expect(fixture.componentInstance.gerufen()).toBeNull();
  });
});
