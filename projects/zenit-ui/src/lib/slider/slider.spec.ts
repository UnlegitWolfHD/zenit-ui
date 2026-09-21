import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZSlider } from './slider';

@Component({
  imports: [ZSlider],
  template: `<z-slider
    [(value)]="menge"
    [label]="beschriftung()"
    [ariaLabel]="marke()"
    [min]="1"
    [max]="16"
    [step]="1"
    unit="GB"
    [ticks]="marken()"
    [hint]="hinweis()"
    [disabled]="gesperrt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly menge = signal(8);
  readonly beschriftung = signal('Arbeitsspeicher');
  readonly marke = signal('');
  readonly marken = signal<readonly (string | number)[]>([1, 4, 8, 16]);
  readonly hinweis = signal('Mehr als 8 GB braucht nur ein Modpack.');
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZSlider, FormsModule],
  template: `<z-slider
    [(ngModel)]="menge"
    label="Arbeitsspeicher"
    [min]="1"
    [max]="16"
    unit="GB"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly menge = signal(4);
}

@Component({
  imports: [ZSlider, ReactiveFormsModule],
  template: `<z-slider
    [formControl]="steuerung"
    label="Arbeitsspeicher"
    [min]="1"
    [max]="16"
    unit="GB"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl(8);
}

/** Geschuetztes Leerzeichen zwischen Wert und Einheit, als Zeichen statt als Escape. */
const NBSP = String.fromCharCode(0xa0);

/** Bewegt die Schiene so, wie ein Nutzer sie bewegt. */
function schiebe(schiene: HTMLInputElement, auf: number): void {
  schiene.value = String(auf);
  schiene.dispatchEvent(new Event('input'));
}

describe('ZSlider', () => {
  it('setzt min, max und step am nativen input[type=range]', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.type).toBe('range');
    expect(schiene.min).toBe('1');
    expect(schiene.max).toBe('16');
    expect(schiene.step).toBe('1');
    expect(fixture.nativeElement.querySelector('z-slider').classList.contains('z-range')).toBe(
      true,
    );
  });

  it('verbindet Label und Schiene ueber for und id', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label.z-field__label');
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(label.textContent?.trim()).toBe('Arbeitsspeicher');
    expect(label.getAttribute('for')).toBe(schiene.id);
    expect(schiene.id).not.toBe('');
    expect(schiene.hasAttribute('aria-label')).toBe(false);
  });

  it('rendert ohne label kein <label> und nimmt stattdessen ariaLabel', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.beschriftung.set('');
    fixture.componentInstance.marke.set('Arbeitsspeicher');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-label')).toBe(
      'Arbeitsspeicher',
    );
  });

  it('zeigt den Wert mit Einheit und geschuetztem Leerzeichen, auch als aria-valuetext', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const anzeige: HTMLElement = fixture.nativeElement.querySelector('.z-range__value');

    expect(anzeige.textContent).toBe(`8${NBSP}GB`);
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-valuetext')).toBe(
      `8${NBSP}GB`,
    );
  });

  it('rendert ticks fuer das Auge und den hint mit aria-describedby', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const marken: HTMLElement = fixture.nativeElement.querySelector('.z-range__ticks');
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const hinweis: HTMLElement = fixture.nativeElement.querySelector('.z-field__hint');

    expect(marken.getAttribute('aria-hidden')).toBe('true');
    expect(Array.from(marken.querySelectorAll('span')).map((eins) => eins.textContent)).toEqual([
      '1',
      '4',
      '8',
      '16',
    ]);
    expect(hinweis.textContent?.trim()).toBe('Mehr als 8 GB braucht nur ein Modpack.');
    expect(schiene.getAttribute('aria-describedby')).toBe(hinweis.id);
  });

  it('laesst ticks und hint weg, wenn sie leer sind', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.marken.set([]);
    fixture.componentInstance.hinweis.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-range__ticks')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-field__hint')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('arbeitet mit model() in beide Richtungen und liefert eine Zahl', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('8');

    schiebe(schiene, 12);
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(12);
    expect(typeof fixture.componentInstance.menge()).toBe('number');

    fixture.componentInstance.menge.set(4);
    await fixture.whenStable();

    expect(schiene.value).toBe('4');
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(`4${NBSP}GB`);
  });

  it('arbeitet mit ngModel in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel setzt den Startwert erst in einem Microtask.
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('4');

    schiebe(schiene, 10);
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(10);

    fixture.componentInstance.menge.set(2);
    await fixture.whenStable();

    expect(schiene.value).toBe('2');
  });

  it('arbeitet mit formControl in beide Richtungen und liefert eine Zahl', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    expect(schiene.value).toBe('8');

    steuerung.setValue(12);
    fixture.detectChanges();

    expect(schiene.value).toBe('12');

    schiebe(schiene, 3);

    expect(steuerung.value).toBe(3);
    expect(typeof steuerung.value).toBe('number');
  });

  it('bricht bei writeValue(null) nicht und faellt auf min zurueck', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(schiene.value).toBe('1');
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(`1${NBSP}GB`);
  });

  it('meldet nur die Nutzereingabe, nicht das Schreiben aus den Forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    steuerung.setValue(12);
    fixture.detectChanges();

    expect(steuerung.pristine).toBe(true);

    schiebe(schiene, 3);

    expect(steuerung.dirty).toBe(true);
    expect(steuerung.value).toBe(3);
  });

  it('meldet touched nach dem blur', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    expect(steuerung.touched).toBe(false);

    fixture.nativeElement.querySelector('input').dispatchEvent(new FocusEvent('blur'));

    expect(steuerung.touched).toBe(true);
  });

  it('wird ueber die Forms gesperrt und wieder freigegeben', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(schiene.disabled).toBe(true);

    fixture.componentInstance.steuerung.enable();
    fixture.detectChanges();

    expect(schiene.disabled).toBe(false);
  });

  it('sperrt ueber den Input disabled', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    // Eine gesperrte Schiene nimmt keine Zeigereingabe an, der Wert bleibt.
    expect(schiene.disabled).toBe(true);

    schiene.click();
    fixture.detectChanges();

    expect(schiene.value).toBe('8');
    expect(fixture.componentInstance.menge()).toBe(8);
  });
});
