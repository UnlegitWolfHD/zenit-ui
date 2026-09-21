import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZCheckbox } from './checkbox';

@Component({
  imports: [ZCheckbox],
  template: `<z-checkbox [(checked)]="gewaehlt" [disabled]="gesperrt()" [ariaLabel]="marke()"
    >Backups behalten</z-checkbox
  >`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly gewaehlt = signal(false);
  readonly gesperrt = signal(false);
  readonly marke = signal('');
}

@Component({
  imports: [ZCheckbox, FormsModule],
  template: `<z-checkbox [(ngModel)]="gewaehlt">Backups behalten</z-checkbox>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly gewaehlt = signal(true);
}

@Component({
  imports: [ZCheckbox, ReactiveFormsModule],
  template: `<z-checkbox [formControl]="steuerung">Backups behalten</z-checkbox>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl(false);
}

describe('ZCheckbox', () => {
  it('rendert ein natives input[type=checkbox] im label.z-check und den Text im span', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label.z-check');

    expect(label).not.toBeNull();
    expect(label.querySelector('input')?.type).toBe('checkbox');
    expect(label.querySelector('span')?.textContent?.trim()).toBe('Backups behalten');
  });

  it('traegt ariaLabel als aria-label und laesst das Attribut sonst weg', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.marke.set('Backups behalten');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-label')).toBe('Backups behalten');
  });

  it('arbeitet mit model() in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(false);

    feld.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.gewaehlt()).toBe(true);

    fixture.componentInstance.gewaehlt.set(false);
    await fixture.whenStable();

    expect(feld.checked).toBe(false);
  });

  it('arbeitet mit ngModel in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel setzt den Startwert erst in einem Microtask, das Feld braucht
    // danach noch einen Durchlauf.
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(true);

    feld.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.gewaehlt()).toBe(false);

    fixture.componentInstance.gewaehlt.set(true);
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

  // Der Aufruf von registerOnChange hinterlaesst genau eine Spur an der
  // Steuerung: sie wird dirty. Bleibt sie nach setValue pristine, hat der
  // Baustein nichts zurueckgemeldet.
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

  // Der Klick setzt die Checkedness am Element selbst. Nimmt eine Steuerung
  // die Eingabe zurueck, bevor eine Change Detection gelaufen ist, muss der
  // Haken ihr trotzdem folgen: der Baustein schreibt den Haken direkt auf das
  // Element und nicht ueber eine Bindung [checked].
  it('folgt der Steuerung, wenn setValue die Eingabe sofort zuruecknimmt', async () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    feld.click();
    steuerung.setValue(false);
    await fixture.whenStable();

    expect(steuerung.value).toBe(false);
    expect(feld.checked).toBe(false);
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
    expect(fixture.componentInstance.gewaehlt()).toBe(false);
  });
});
