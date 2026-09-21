import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField } from '@angular/forms/signals';
import { ZSegment, ZSegmentOption } from './segment';

const START = { zeitraum: '1', gesperrt: false };

@Component({
  imports: [ZSegment, FormField],
  template: `<z-segment
    [formField]="formular.zeitraum"
    [options]="optionen"
    ariaLabel="Zeitraum"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly optionen: ZSegmentOption[] = [
    { value: '1', label: '1 Monat' },
    { value: '12', label: '12 Monate' },
  ];
  readonly modell = signal(START);
  readonly formular = form(this.modell, (pfad) => {
    disabled(pfad.zeitraum, ({ valueOf }) => valueOf(pfad.gesperrt));
  });
}

describe('ZSegment with Signal Forms', () => {
  function erzeuge() {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    const knoepfe: HTMLButtonElement[] = [...fixture.nativeElement.querySelectorAll('button')];
    return { fixture, knoepfe, host: fixture.componentInstance };
  }

  const gedrueckt = (knoepfe: HTMLButtonElement[]) =>
    knoepfe.map((knopf) => knopf.getAttribute('aria-pressed'));

  it('shows the initial value and follows a programmatic set', async () => {
    const { fixture, knoepfe, host } = erzeuge();

    expect(gedrueckt(knoepfe)).toEqual(['true', 'false']);

    host.formular.zeitraum().value.set('12');
    await fixture.whenStable();

    expect(gedrueckt(knoepfe)).toEqual(['false', 'true']);
  });

  it('writes a click into the field and marks it dirty', async () => {
    const { fixture, knoepfe, host } = erzeuge();

    knoepfe[1].click();
    await fixture.whenStable();

    expect(host.modell().zeitraum).toBe('12');
    expect(host.formular.zeitraum().dirty()).toBe(true);
    expect(gedrueckt(knoepfe)).toEqual(['false', 'true']);
  });

  it('takes disabled from the field state onto every button', async () => {
    const { fixture, knoepfe, host } = erzeuge();

    host.formular.gesperrt().value.set(true);
    await fixture.whenStable();

    expect(knoepfe.every((knopf) => knopf.disabled)).toBe(true);

    host.formular.gesperrt().value.set(false);
    await fixture.whenStable();

    expect(knoepfe.some((knopf) => knopf.disabled)).toBe(false);
  });

  it('reports touched when a button loses focus', async () => {
    const { fixture, knoepfe, host } = erzeuge();

    knoepfe[0].dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(host.formular.zeitraum().touched()).toBe(true);
  });

  it('goes back to the given value, untouched and pristine, on reset', async () => {
    const { fixture, knoepfe, host } = erzeuge();
    knoepfe[1].click();
    knoepfe[1].dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    host.formular().reset(START);
    await fixture.whenStable();

    expect(gedrueckt(knoepfe)).toEqual(['true', 'false']);
    expect(host.formular.zeitraum().touched()).toBe(false);
    expect(host.formular.zeitraum().dirty()).toBe(false);
  });
});
