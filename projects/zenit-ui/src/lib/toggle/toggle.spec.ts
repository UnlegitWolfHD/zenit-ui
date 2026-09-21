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
  it('renders a native input[type=checkbox] with role="switch"', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.type).toBe('checkbox');
    expect(feld.getAttribute('role')).toBe('switch');
    expect(feld.classList.contains('z-toggle')).toBe(true);
  });

  // A native input[type=checkbox] with role="switch" reports its state through
  // its own checkedness. An additional aria-checked would be a second source
  // that can drift apart, which is why it is not there.
  it('carries the switch state through native checked, not through aria-checked', async () => {
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

  it('puts ariaLabel and ariaLabelledby on and leaves both out otherwise', () => {
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

  it('works with model() in both directions', async () => {
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

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel sets the initial value only in a microtask.
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

  // The click sets the checkedness on the element itself. If a control reverts
  // the input before a change detection has run, the switch still has to follow
  // it.
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

  it('locks through the disabled input and then leaves the click without effect', () => {
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
