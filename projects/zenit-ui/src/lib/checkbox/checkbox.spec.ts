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
