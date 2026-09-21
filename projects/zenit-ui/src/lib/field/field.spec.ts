import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZField } from './field';
import { ZInput } from './input';

@Component({
  imports: [ZField, ZInput],
  template: `<z-field
    [label]="beschriftung()"
    [for]="fuer()"
    [hint]="hinweis()"
    [error]="fehler()"
  ><input zInput [attr.id]="fuer() || null" /></z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FieldHost {
  readonly beschriftung = signal('Servername');
  readonly fuer = signal('name');
  readonly hinweis = signal('');
  readonly fehler = signal('');
}

describe('ZField', () => {
  it('verbindet Label und Feld ueber for und id', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label.z-field__label');
    const feld = fixture.nativeElement.querySelector('input');

    expect(label.textContent.trim()).toBe('Servername');
    expect(label.getAttribute('for')).toBe('name');
    expect(feld.getAttribute('id')).toBe('name');
  });

  it('zeigt ohne hint und error keinen Begleittext', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-field__hint')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-field__error')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('vergibt ohne for weder for-Attribut noch ids', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.componentInstance.fuer.set('');
    fixture.componentInstance.hinweis.set('Nur Buchstaben und Ziffern');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label.z-field__label');
    const hinweis = fixture.nativeElement.querySelector('.z-field__hint');

    expect(label.hasAttribute('for')).toBe(false);
    expect(hinweis.hasAttribute('id')).toBe(false);
    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('rendert den Hinweis mit der id <for>-hint', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.componentInstance.hinweis.set('Nur Buchstaben und Ziffern');
    fixture.detectChanges();

    const hinweis = fixture.nativeElement.querySelector('.z-field__hint');

    expect(hinweis.textContent.trim()).toBe('Nur Buchstaben und Ziffern');
    expect(hinweis.getAttribute('id')).toBe('name-hint');
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
      'name-hint',
    );
  });

  it('verdraengt den Hinweis durch den Fehler mit der id <for>-error', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.componentInstance.hinweis.set('Nur Buchstaben und Ziffern');
    fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
    fixture.detectChanges();

    const fehler = fixture.nativeElement.querySelector('.z-field__error');

    expect(fixture.nativeElement.querySelector('.z-field__hint')).toBeNull();
    expect(fehler.textContent.trim()).toBe('Der Name ist schon vergeben.');
    expect(fehler.getAttribute('id')).toBe('name-error');
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-describedby')).toBe(
      'name-error',
    );
  });

  it('wechselt Text und Verknuepfung, wenn error zur Laufzeit kommt und geht', () => {
    const fixture = TestBed.createComponent(FieldHost);
    fixture.componentInstance.hinweis.set('Nur Buchstaben und Ziffern');
    fixture.detectChanges();
    const feld = fixture.nativeElement.querySelector('input');

    expect(feld.getAttribute('aria-describedby')).toBe('name-hint');

    fixture.componentInstance.fehler.set('Der Name ist schon vergeben.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-field__error').textContent.trim()).toBe(
      'Der Name ist schon vergeben.',
    );
    expect(feld.getAttribute('aria-describedby')).toBe('name-error');

    fixture.componentInstance.fehler.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-field__error')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-field__hint').textContent.trim()).toBe(
      'Nur Buchstaben und Ziffern',
    );
    expect(feld.getAttribute('aria-describedby')).toBe('name-hint');
  });
});
