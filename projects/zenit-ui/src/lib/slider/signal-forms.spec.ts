import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, max, min, validate } from '@angular/forms/signals';
import { ZSlider } from './slider';

const START = { ram: 8, gesperrt: false, mitGrenzen: true };

@Component({
  imports: [ZSlider, FormField],
  template: `<z-slider [formField]="formular.ram" label="Arbeitsspeicher" unit="GB" [step]="2" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly modell = signal(START);
  readonly formular = form(this.modell, (pfad) => {
    min(pfad.ram, ({ valueOf }) => (valueOf(pfad.mitGrenzen) ? 2 : undefined));
    max(pfad.ram, ({ valueOf }) => (valueOf(pfad.mitGrenzen) ? 16 : undefined));
    disabled(pfad.ram, ({ valueOf }) => valueOf(pfad.gesperrt));
    validate(pfad.ram, ({ value }) =>
      value() === 6 ? { kind: 'nichtBuchbar', message: '6 GB sind nicht buchbar.' } : null,
    );
  });
}

describe('ZSlider with Signal Forms', () => {
  function erzeuge(start = START) {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.componentInstance.modell.set(start);
    fixture.detectChanges();
    const feld: HTMLInputElement = fixture.nativeElement.querySelector('input');
    return { fixture, feld, host: fixture.componentInstance };
  }

  function ziehe(feld: HTMLInputElement, wert: number): void {
    feld.value = String(wert);
    feld.dispatchEvent(new Event('input'));
  }

  it('shows the initial value and follows a programmatic set', async () => {
    const { fixture, feld, host } = erzeuge();

    expect(feld.valueAsNumber).toBe(8);

    host.formular.ram().value.set(12);
    await fixture.whenStable();

    expect(feld.valueAsNumber).toBe(12);
    expect(feld.getAttribute('aria-valuetext')).toBe('12\u{00a0}GB');
  });

  it('writes a drag into the field and marks it dirty', async () => {
    const { fixture, feld, host } = erzeuge();

    ziehe(feld, 4);
    await fixture.whenStable();

    expect(host.modell().ram).toBe(4);
    expect(host.formular.ram().dirty()).toBe(true);
  });

  it('takes min and max from the schema onto the native input', () => {
    const { feld } = erzeuge();

    expect(feld.min).toBe('2');
    expect(feld.max).toBe('16');
  });

  it('reports a value clamped to the schema scale back into the field', async () => {
    const { fixture, feld, host } = erzeuge({ ...START, ram: 50 });
    await fixture.whenStable();

    expect(feld.valueAsNumber).toBe(16);
    expect(host.modell().ram).toBe(16);
  });

  it('falls back to the default scale when a schema rule yields undefined', async () => {
    const { fixture, feld, host } = erzeuge();

    host.formular.mitGrenzen().value.set(false);
    await fixture.whenStable();

    expect(feld.min).toBe('0');
    expect(feld.max).toBe('100');
    expect(feld.valueAsNumber).toBe(8);
  });

  it('takes disabled from the field state onto the native input', async () => {
    const { fixture, feld, host } = erzeuge();

    host.formular.gesperrt().value.set(true);
    await fixture.whenStable();

    expect(feld.disabled).toBe(true);

    host.formular.gesperrt().value.set(false);
    await fixture.whenStable();

    expect(feld.disabled).toBe(false);
  });

  it('reports touched on blur', async () => {
    const { fixture, feld, host } = erzeuge();

    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(host.formular.ram().touched()).toBe(true);
  });

  it('sets aria-invalid only once the invalid field is touched', async () => {
    const { fixture, feld, host } = erzeuge();

    ziehe(feld, 6);
    await fixture.whenStable();

    expect(host.formular.ram().invalid()).toBe(true);
    expect(feld.hasAttribute('aria-invalid')).toBe(false);

    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(feld.getAttribute('aria-invalid')).toBe('true');
  });

  it('goes back to the given value, untouched and pristine, on reset', async () => {
    const { fixture, feld, host } = erzeuge();
    ziehe(feld, 4);
    feld.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    host.formular().reset(START);
    await fixture.whenStable();

    expect(feld.valueAsNumber).toBe(8);
    expect(host.formular.ram().touched()).toBe(false);
    expect(host.formular.ram().dirty()).toBe(false);
  });
});
