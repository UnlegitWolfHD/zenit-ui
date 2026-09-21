import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZToggle } from './toggle';

@Component({
  imports: [ZToggle],
  template: `<z-toggle
    [(checked)]="an"
    [disabled]="gesperrt()"
    [ariaLabel]="marke()"
    [ariaLabelledby]="beschriftetVon()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly an = signal(false);
  readonly gesperrt = signal(false);
  readonly marke = signal('');
  readonly beschriftetVon = signal('');
}

@Component({
  imports: [ZToggle, FormsModule],
  template: `<z-toggle [(ngModel)]="an" ariaLabel="Automatischer Neustart" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly an = signal(true);
}

@Component({
  imports: [ZToggle, ReactiveFormsModule],
  template: `<z-toggle [formControl]="steuerung" ariaLabel="Automatischer Neustart" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl(false);
}

describe('ZToggle', () => {
  it('rendert ein natives input[type=checkbox] mit role="switch"', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.type).toBe('checkbox');
    expect(feld.getAttribute('role')).toBe('switch');
    expect(feld.classList.contains('z-toggle')).toBe(true);
  });

  // Ein natives input[type=checkbox] mit role="switch" meldet seinen Zustand
  // ueber die eigene Checkedness. Ein zusaetzliches aria-checked waere eine
  // zweite Quelle, die auseinanderlaufen kann, und steht deshalb nicht da.
  it('fuehrt den Schaltzustand ueber natives checked, nicht ueber aria-checked', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(false);
    expect(feld.hasAttribute('aria-checked')).toBe(false);

    fixture.componentInstance.an.set(true);
    await fixture.whenStable();

    expect(feld.checked).toBe(true);
    expect(feld.hasAttribute('aria-checked')).toBe(false);
  });

  it('traegt ariaLabel und ariaLabelledby und laesst beide sonst weg', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-label')).toBe(false);
    expect(feld.hasAttribute('aria-labelledby')).toBe(false);

    fixture.componentInstance.marke.set('Automatischer Neustart');
    fixture.componentInstance.beschriftetVon.set('neustart-titel');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-label')).toBe('Automatischer Neustart');
    expect(feld.getAttribute('aria-labelledby')).toBe('neustart-titel');
  });

  it('arbeitet mit model() in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(false);

    feld.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.an()).toBe(true);

    fixture.componentInstance.an.set(false);
    await fixture.whenStable();

    expect(feld.checked).toBe(false);
  });

  it('arbeitet mit ngModel in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel setzt den Startwert erst in einem Microtask.
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(true);

    feld.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.an()).toBe(false);

    fixture.componentInstance.an.set(true);
    await fixture.whenStable();

    expect(feld.checked).toBe(true);
  });

  it('arbeitet mit formControl in beide Richtungen', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    expect(feld.checked).toBe(false);

    steuerung.setValue(true);
    fixture.detectChanges();

    expect(feld.checked).toBe(true);

    feld.click();

    expect(steuerung.value).toBe(false);
  });

  it('bricht bei writeValue(null) nicht', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(feld.checked).toBe(false);
  });

  it('meldet nur die Nutzereingabe, nicht das Schreiben aus den Forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    steuerung.setValue(true);
    fixture.detectChanges();

    expect(steuerung.pristine).toBe(true);

    feld.click();

    expect(steuerung.dirty).toBe(true);
    expect(steuerung.value).toBe(false);
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
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(true);

    fixture.componentInstance.steuerung.enable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(false);
  });

  it('sperrt ueber den Input disabled und laesst den Klick dann wirkungslos', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.disabled).toBe(true);

    feld.click();
    fixture.detectChanges();

    expect(feld.checked).toBe(false);
    expect(fixture.componentInstance.an()).toBe(false);
  });
});
