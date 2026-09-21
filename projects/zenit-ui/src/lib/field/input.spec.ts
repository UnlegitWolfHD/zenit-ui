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
  it('traegt die Klasse z-input', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').classList.contains('z-input')).toBe(true);
  });

  it('setzt bei size="sm" die Klasse und laesst kein natives size-Attribut stehen', () => {
    const fixture = TestBed.createComponent(KleinHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--sm')).toBe(true);
    expect(feld.hasAttribute('size')).toBe(false);
  });

  it('setzt bei mono die Klasse z-input--mono', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.classList.contains('z-input--mono')).toBe(false);

    fixture.componentInstance.mono.set(true);
    fixture.detectChanges();

    expect(feld.classList.contains('z-input--mono')).toBe(true);
  });

  // Fund: invalid setzt nur aria-invalid, eine eigene Fehlerklasse gibt es nicht.
  // Der Rahmen in danger haengt in _grundlage.css am Selektor
  // .z-input[aria-invalid="true"], deshalb prueft der Test das Attribut.
  it('meldet den Fehlerzustand als aria-invalid="true"', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    fixture.componentInstance.ungueltig.set(true);
    fixture.detectChanges();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('zeigt mit aria-describedby auf Hinweis und Fehler des umgebenden z-field', () => {
    const fixture = TestBed.createComponent(FeldHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-describedby')).toBe('name-hint');

    fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-describedby')).toBe('name-error');
  });

  it('findet das z-field auch durch eine z-input-group hindurch', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
      'suche-hint',
    );
  });

  it('rendert in der z-input-group das Icon', () => {
    const fixture = TestBed.createComponent(GruppeHost);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('z-input-group z-icon');

    expect(icon).not.toBeNull();
    expect(icon.textContent.trim()).toBe('search');
  });

  it('setzt ausserhalb eines z-field kein aria-describedby', () => {
    const fixture = TestBed.createComponent(InputHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('arbeitet mit ngModel in beide Richtungen', async () => {
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

  it('arbeitet mit formControl in beide Richtungen', () => {
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

  it('wird ueber die Forms deaktiviert', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(true);
  });

  it('gilt genauso fuer textarea[zInput]', () => {
    const fixture = TestBed.createComponent(TextareaHost);
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('textarea');

    expect(feld.classList.contains('z-input')).toBe(true);
    expect(feld.getAttribute('aria-describedby')).toBe('notiz-hint');
  });
});
