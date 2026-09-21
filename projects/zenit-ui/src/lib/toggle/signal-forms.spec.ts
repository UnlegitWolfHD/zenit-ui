import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { ZToggle } from './toggle';

@Component({
  imports: [ZToggle, FormField],
  template: `<z-toggle
    [formField]="formular.agb"
    ariaLabel="Bedingungen"
    ariaDescribedby="agb-fehler"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly modell = signal({ agb: false, gesperrt: false });
  readonly formular = form(this.modell, (pfad) => {
    required(pfad.agb, { message: 'Bitte stimme den Bedingungen zu.' });
    disabled(pfad.agb, ({ valueOf }) => valueOf(pfad.gesperrt));
  });
}

describe('ZToggle with Signal Forms', () => {
  function erzeuge() {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, feld, host: fixture.componentInstance };
  }

  it('shows the initial value and follows a programmatic set', async () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.componentInstance.modell.set({ agb: true, gesperrt: false });
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(feld.checked).toBe(true);

    fixture.componentInstance.formular.agb().value.set(false);
    await fixture.whenStable();

    expect(feld.checked).toBe(false);
  });

  it('writes a click into the field and marks it dirty', async () => {
    const { fixture, feld, host } = erzeuge();

    feld.click();
    await fixture.whenStable();

    expect(host.modell().agb).toBe(true);
    expect(host.formular.agb().dirty()).toBe(true);
  });

  it('takes disabled from the field state onto the native input', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(feld.disabled).toBe(false);

    host.formular.gesperrt().value.set(true);
    await fixture.whenStable();

    expect(feld.disabled).toBe(true);

    host.formular.gesperrt().value.set(false);
    await fixture.whenStable();

    expect(feld.disabled).toBe(false);
  });

  it('reports touched on blur', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(host.formular.agb().touched()).toBe(false);

    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(host.formular.agb().touched()).toBe(true);
  });

  it('sets aria-invalid only once the invalid field is touched, and clears it when valid', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(host.formular.agb().invalid()).toBe(true);
    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(feld.getAttribute('aria-invalid')).toBe('true');

    feld.click();
    await fixture.whenStable();

    expect(feld.hasAttribute('aria-invalid')).toBe(false);
  });

  it('goes back to the model value, untouched and pristine, on reset', async () => {
    const { fixture, feld, host } = erzeuge();
    feld.click();
    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    host.formular().reset({ agb: false, gesperrt: false });
    await fixture.whenStable();

    expect(feld.checked).toBe(false);
    expect(host.formular.agb().touched()).toBe(false);
    expect(host.formular.agb().dirty()).toBe(false);
    expect(feld.hasAttribute('aria-invalid')).toBe(false);
  });

  it('puts ariaDescribedby onto the switch', () => {
    const { feld } = erzeuge();

    expect(feld.getAttribute('aria-describedby')).toBe('agb-fehler');
  });
});
