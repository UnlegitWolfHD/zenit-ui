import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZField } from './field';
import { ZInput } from './input';
import { ZInputGroup } from './input-group';

@Component({
  imports: [ZInput],
  template: `<input zInput [mono]="mono()" [invalid]="ungueltig()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class InputHost {
  readonly mono = signal(false);
  readonly ungueltig = signal(false);
}

@Component({
  imports: [ZInput],
  template: `<input zInput size="sm" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class KleinHost {}

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Servername" for="name" [hint]="hinweis()" [error]="fehler()"
    ><input zInput id="name"
  /></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FeldHost {
  readonly hinweis = signal('Nur Buchstaben und Ziffern');
  readonly fehler = signal('');
}

@Component({
  imports: [ZField, ZInputGroup, ZInput],
  template: `<z-field label="Suche" for="suche" hint="Name oder IP">
    <z-input-group icon="search"><input zInput id="suche" /></z-input-group>
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GruppeHost {}

@Component({
  imports: [ZField, ZInput],
  template: `<z-field label="Notiz" for="notiz" hint="Optional"
    ><textarea zInput id="notiz"></textarea
  ></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TextareaHost {}

@Component({
  imports: [ZInput, FormsModule],
  template: `<input zInput [(ngModel)]="wert" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly wert = signal('Beispiel-Server');
}

@Component({
  imports: [ZInput, ReactiveFormsModule],
  template: `<input zInput [formControl]="steuerung" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl('Beispiel-Server');
}

describe('ZInput', () => {
  it('carries the class z-input', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').classList.contains('z-input')).toBe(true);
  });

  it('sets the class for size="sm" and keeps no native size attribute', () => {
    const fixture = TestBed.createComponent(KleinHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--sm')).toBe(true);
    expect(feld.hasAttribute('size')).toBe(false);
  });

  it('sets the class z-input--mono for mono', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--mono')).toBe(false);

    fixture.componentInstance.mono.set(true);
    fixture.detectChanges();

    expect(feld.classList.contains('z-input--mono')).toBe(true);
  });

  // Finding: invalid only sets aria-invalid, there is no error class of its own.
  // The border in danger hangs off the selector .z-input[aria-invalid="true"]
  // in _grundlage.css, which is why this test checks the attribute.
  it('reports the error state as aria-invalid="true"', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.ungueltig.set(true);
    fixture.detectChanges();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('points with aria-describedby at hint and error of the surrounding z-field', () => {
    const fixture = TestBed.createComponent(FeldHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-describedby')).toBe('name-hint');

    fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-describedby')).toBe('name-error');
  });

  it('finds the z-field through a z-input-group as well', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
      'suche-hint',
    );
  });

  it('renders the icon inside the z-input-group', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('z-input-group z-icon');

    expect(icon).not.toBeNull();
    expect(icon.textContent.trim()).toBe('search');
  });

  it('sets no aria-describedby outside a z-field', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.value).toBe('Beispiel-Server');

    feld.value = 'Test';
    feld.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.wert()).toBe('Test');

    fixture.componentInstance.wert.set('Beispiel-Zwei');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(feld.value).toBe('Beispiel-Zwei');
  });

  it('works with formControl in both directions', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    expect(feld.value).toBe('Beispiel-Server');

    feld.value = 'Test';
    feld.dispatchEvent(new Event('input'));

    expect(steuerung.value).toBe('Test');

    steuerung.setValue('Beispiel-Zwei');
    fixture.detectChanges();

    expect(feld.value).toBe('Beispiel-Zwei');
  });

  it('is disabled through forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(true);
  });

  it('applies to textarea[zInput] in the same way', () => {
    const fixture = TestBed.createComponent(TextareaHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('textarea');

    expect(feld.classList.contains('z-input')).toBe(true);
    expect(feld.getAttribute('aria-describedby')).toBe('notiz-hint');
  });
});
