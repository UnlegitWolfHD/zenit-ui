import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { ZField } from './field';
import { ZInput } from './input';
import { ZSelect } from './select';

const START = { name: '', notiz: '', region: 'nbg', gesperrt: false };

@Component({
  imports: [ZField, ZInput, ZSelect, FormField],
  template: `
    <z-field label="Servername" for="name" [error]="fehler()">
      <input zInput id="name" [formField]="formular.name" />
    </z-field>
    <z-field label="Notiz" for="notiz" hint="Nur für dich sichtbar.">
      <textarea zInput id="notiz" [formField]="formular.notiz"></textarea>
    </z-field>
    <z-field label="Standort" for="region" hint="Rechenzentrum des Servers.">
      <z-select>
        <select id="region" [formField]="formular.region">
          <option value="nbg">Nürnberg</option>
          <option value="fsn">Falkenstein</option>
        </select>
      </z-select>
    </z-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly modell = signal(START);
  readonly formular = form(this.modell, (pfad) => {
    required(pfad.name, { message: 'Gib dem Server einen Namen.' });
    disabled(pfad.name, ({ valueOf }) => valueOf(pfad.gesperrt));
    disabled(pfad.region, ({ valueOf }) => valueOf(pfad.gesperrt));
  });
  /** The pattern from docs/forms.md: the first error, once the field is touched. */
  readonly fehler = () => {
    const feld = this.formular.name();
    return feld.touched() ? (feld.errors()[0]?.message ?? '') : '';
  };
}

describe('zInput and z-select with Signal Forms', () => {
  function erzeuge() {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    return {
      fixture,
      host: fixture.componentInstance,
      name: el.querySelector<HTMLInputElement>('#name')!,
      notiz: el.querySelector<HTMLTextAreaElement>('#notiz')!,
      region: el.querySelector<HTMLSelectElement>('#region')!,
    };
  }

  function tippe(feld: HTMLInputElement | HTMLTextAreaElement, text: string): void {
    feld.value = text;
    feld.dispatchEvent(new Event('input'));
  }

  it('binds input[zInput] in both directions and keeps the z-input class', async () => {
    const { fixture, host, name } = erzeuge();

    expect(name.classList.contains('z-input')).toBe(true);

    tippe(name, 'Survival');
    await fixture.whenStable();

    expect(host.modell().name).toBe('Survival');

    host.formular.name().value.set('Creative');
    await fixture.whenStable();

    expect(name.value).toBe('Creative');
  });

  it('binds textarea[zInput] in both directions and keeps the hint wired', async () => {
    const { fixture, host, notiz } = erzeuge();

    tippe(notiz, 'Whitelist an');
    await fixture.whenStable();

    expect(host.modell().notiz).toBe('Whitelist an');
    expect(notiz.getAttribute('aria-describedby')).toBe('notiz-hint');
  });

  it('takes required and disabled from the field state onto the native input', async () => {
    const { fixture, host, name } = erzeuge();

    expect(name.required).toBe(true);
    expect(name.disabled).toBe(false);

    host.formular.gesperrt().value.set(true);
    await fixture.whenStable();

    expect(name.disabled).toBe(true);
  });

  it('follows the invalid state of the field, but only once it is touched', async () => {
    const { fixture, host, name } = erzeuge();

    expect(host.formular.name().invalid()).toBe(true);
    expect(name.hasAttribute('aria-invalid')).toBe(false);

    name.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(name.getAttribute('aria-invalid')).toBe('true');

    tippe(name, 'Survival');
    await fixture.whenStable();

    expect(name.hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows the error of the field in z-field and points aria-describedby at it', async () => {
    const { fixture, name } = erzeuge();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.z-field__error')).toBeNull();

    name.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(el.querySelector('#name-error')?.textContent).toBe('Gib dem Server einen Namen.');
    expect(name.getAttribute('aria-describedby')).toBe('name-error');
  });

  it('clears aria-invalid and the error again on reset', async () => {
    const { fixture, host, name } = erzeuge();
    name.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    host.formular().reset(START);
    await fixture.whenStable();

    expect(name.hasAttribute('aria-invalid')).toBe(false);
    expect(name.hasAttribute('aria-describedby')).toBe(false);
  });

  it('binds the native select inside z-select and keeps aria-describedby wired', async () => {
    const { fixture, host, region } = erzeuge();

    expect(region.value).toBe('nbg');
    expect(region.getAttribute('aria-describedby')).toBe('region-hint');

    region.value = 'fsn';
    region.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(host.modell().region).toBe('fsn');

    host.formular.gesperrt().value.set(true);
    await fixture.whenStable();

    expect(region.disabled).toBe(true);
  });
});
