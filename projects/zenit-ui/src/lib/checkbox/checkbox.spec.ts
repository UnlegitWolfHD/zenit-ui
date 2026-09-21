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
  it('renders a native input[type=checkbox] in the label.z-check and the text in the span', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label.z-check');

    expect(label).not.toBeNull();
    expect(label.querySelector('input')?.type).toBe('checkbox');
    expect(label.querySelector('span')?.textContent?.trim()).toBe('Backups behalten');
  });

  it('puts ariaLabel on as aria-label and leaves the attribute out otherwise', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.hasAttribute('aria-label')).toBe(false);

    fixture.componentInstance.marke.set('Backups behalten');
    fixture.detectChanges();

    expect(feld.getAttribute('aria-label')).toBe('Backups behalten');
  });

  it('works with model() in both directions', async () => {
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

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel sets the initial value only in a microtask, and the field needs
    // one more run after that.
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

  it('works with formControl in both directions', () => {
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

  it('does not break on writeValue(null)', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(feld.checked).toBe(false);
  });

  // Calling registerOnChange leaves exactly one trace on the control: it turns
  // dirty. If it stays pristine after setValue, the component reported nothing
  // back.
  it('reports only the user input, not the write coming from forms', () => {
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

  it('reports touched after the blur', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    expect(steuerung.touched).toBe(false);

    fixture.nativeElement.querySelector('input').dispatchEvent(new FocusEvent('blur'));

    expect(steuerung.touched).toBe(true);
  });

  it('is locked and released again through forms', () => {
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

  // The click sets the checkedness on the element itself. If a control reverts
  // the input before a change detection has run, the check mark still has to
  // follow it: the component writes the check mark straight onto the element
  // and not through a [checked] binding.
  it('follows the control when setValue reverts the input right away', async () => {
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

  it('locks through the disabled input and then leaves the click without effect', () => {
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

@Component({
  imports: [ZCheckbox],
  template: `<z-checkbox
    [(checked)]="alle"
    [(indeterminate)]="teilweise"
    [invalid]="fehlerhaft()"
    [ariaDescribedby]="beschreibung()"
    ariaLabel="Alle auswählen"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AlleAuswaehlenHost {
  readonly alle = signal(false);
  readonly teilweise = signal(true);
  readonly fehlerhaft = signal(false);
  readonly beschreibung = signal('');
}

describe('ZCheckbox indeterminate, invalid and ariaDescribedby', () => {
  function erzeuge() {
    const fixture = TestBed.createComponent(AlleAuswaehlenHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, feld, host: fixture.componentInstance };
  }

  it('mirrors indeterminate onto the native property, which reads as mixed', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(feld.indeterminate).toBe(true);
    expect(feld.matches(':indeterminate')).toBe(true);
    expect(feld.hasAttribute('aria-checked')).toBe(false);

    host.teilweise.set(false);
    await fixture.whenStable();

    expect(feld.indeterminate).toBe(false);
  });

  it('clears indeterminate on a user interaction and reports the new checked state', async () => {
    const { fixture, feld, host } = erzeuge();

    feld.click();
    await fixture.whenStable();

    expect(host.teilweise()).toBe(false);
    expect(feld.indeterminate).toBe(false);
    expect(host.alle()).toBe(true);
    expect(feld.checked).toBe(true);
  });

  it('keeps indeterminate apart from checked: setting one leaves the other', async () => {
    const { fixture, feld, host } = erzeuge();

    host.alle.set(true);
    await fixture.whenStable();

    expect(feld.checked).toBe(true);
    expect(feld.indeterminate).toBe(true);
  });

  it('writes aria-invalid only while invalid, without Signal Forms touched defaults to true', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    host.fehlerhaft.set(true);
    await fixture.whenStable();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('writes ariaDescribedby as aria-describedby and leaves the attribute out when empty', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(feld.hasAttribute('aria-describedby')).toBe(false);

    host.beschreibung.set('agb-fehler agb-hinweis');
    await fixture.whenStable();

    expect(feld.getAttribute('aria-describedby')).toBe('agb-fehler agb-hinweis');
  });
});
