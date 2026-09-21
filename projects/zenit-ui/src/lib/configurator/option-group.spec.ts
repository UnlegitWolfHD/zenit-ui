import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { ZOption, ZOptionGroup } from './option-group';

const STUFEN: readonly ZOption[] = [
  {
    value: '2',
    title: '2 GB',
    description: 'etwa 5 Spieler',
    disabled: true,
    disabledReason: 'zu wenig für 1.21',
  },
  { value: '4', title: '4 GB', description: 'etwa 10 Spieler', badge: 'Empfohlen' },
  { value: '6', title: '6 GB', description: 'etwa 15 Spieler', price: '11,74 €' },
];

@Component({
  imports: [ZOptionGroup],
  template: `<z-option-group
    legend="Arbeitsspeicher"
    [hint]="hinweis()"
    [options]="stufen"
    [(value)]="ram"
    [compact]="kompakt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly stufen = STUFEN;
  readonly ram = signal('4');
  readonly hinweis = signal('Spielerzahlen sind Richtwerte');
  readonly kompakt = signal(false);
}

@Component({
  imports: [ZOptionGroup, ReactiveFormsModule],
  template: `<z-option-group
    legend="Arbeitsspeicher"
    [options]="stufen"
    [formControl]="steuerung"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly stufen = STUFEN;
  readonly steuerung = new FormControl('6');
}

@Component({
  imports: [ZOptionGroup, FormField],
  template: `<z-option-group
    legend="Arbeitsspeicher"
    [options]="stufen"
    [formField]="formular.ram"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SignalFormsHost {
  readonly stufen = STUFEN;
  readonly modell = signal({ ram: '4' });
  readonly formular = form(this.modell);
}

function radios(fixture: { nativeElement: HTMLElement }): HTMLInputElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"]'));
}

describe('ZOptionGroup', () => {
  it('renders a fieldset with a legend and one label per option', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLElement = fixture.nativeElement.querySelector('fieldset.z-options');
    const karten = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('label.z-option'),
    );

    expect(feld.querySelector('legend.z-options__legend')?.textContent).toContain(
      'Arbeitsspeicher',
    );
    expect(feld.querySelector('.z-options__legend small')?.textContent?.trim()).toBe(
      'Spielerzahlen sind Richtwerte',
    );
    expect(karten).toHaveLength(3);
    expect(
      karten.map((karte) => karte.querySelector('.z-option__title')?.textContent?.trim()),
    ).toEqual(['2 GB', '4 GB', '6 GB']);
  });

  it('is one radio group: same name, exactly one checked', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const alle = radios(fixture);

    expect(new Set(alle.map((einer) => einer.name)).size).toBe(1);
    expect(alle.filter((einer) => einer.checked).map((einer) => einer.value)).toEqual(['4']);
  });

  it('moves the value with the arrow keys, which the native radios do themselves', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const alle = radios(fixture);

    // The browser checks the next enabled radio of the group and fires change;
    // that path is what the component listens to.
    alle[2].checked = true;
    alle[2].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.ram()).toBe('6');
    expect(
      radios(fixture)
        .filter((einer) => einer.checked)
        .map((e) => e.value),
    ).toEqual(['6']);
  });

  it('follows a value written from outside', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();

    fixture.componentInstance.ram.set('6');
    fixture.detectChanges();

    expect(radios(fixture)[2].checked).toBe(true);
  });

  it('locks a single option and ties its reason to the radio', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const erste = radios(fixture)[0];
    const karte = fixture.nativeElement.querySelectorAll('label.z-option')[0] as HTMLElement;
    const grund = karte.querySelector('.z-option__desc') as HTMLElement;

    expect(erste.disabled).toBe(true);
    // The reason replaces the description, the way the reference card shows it.
    expect(grund.textContent?.trim()).toBe('zu wenig für 1.21');
    expect(erste.getAttribute('aria-describedby')).toBe(grund.id);
    expect(radios(fixture)[1].disabled).toBe(false);
  });

  it('shows badge and price the way the options ask for', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const karten = fixture.nativeElement.querySelectorAll('label.z-option');
    const badge = karten[1].querySelector('z-badge') as HTMLElement;

    expect(badge.textContent?.trim()).toBe('Empfohlen');
    expect(badge.classList.contains('z-badge--info')).toBe(true);
    expect(badge.classList.contains('z-option__badge')).toBe(true);
    expect(karten[2].querySelector('.z-option__price')?.textContent?.trim()).toBe('11,74 €');
    expect(karten[0].querySelector('z-badge')).toBeNull();
  });

  it('adds z-options--compact only while compact holds', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const feld: HTMLElement = fixture.nativeElement.querySelector('fieldset.z-options');

    expect(feld.classList.contains('z-options--compact')).toBe(false);

    fixture.componentInstance.kompakt.set(true);
    fixture.detectChanges();

    expect(feld.classList.contains('z-options--compact')).toBe(true);
  });

  it('leaves the legend addition out without a hint', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();

    fixture.componentInstance.hinweis.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-options__legend small')).toBeNull();
  });

  it('works with a reactive FormControl, in both directions', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    expect(radios(fixture)[2].checked).toBe(true);

    const zweite = radios(fixture)[1];
    zweite.checked = true;
    zweite.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.steuerung.value).toBe('4');
  });

  it('locks the whole group through the form', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(radios(fixture).every((einer) => einer.disabled)).toBe(true);
  });

  it('works with Signal Forms through [formField]', () => {
    const fixture = TestBed.createComponent(SignalFormsHost);
    fixture.detectChanges();

    expect(radios(fixture)[1].checked).toBe(true);

    const dritte = radios(fixture)[2];
    dritte.checked = true;
    dritte.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.componentInstance.modell().ram).toBe('6');
  });
});
