import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ZField } from './field';
import { ZSelect } from './select';

@Component({
  imports: [ZSelect],
  template: `<z-select [size]="groesse()">
    <select>
      <option value="eu">Nuernberg</option>
    </select>
  </z-select>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SelectHost {
  readonly groesse = signal<'sm' | 'md'>('md');
}

@Component({
  imports: [ZSelect, ReactiveFormsModule],
  template: `<z-select>
    <select [formControl]="steuerung">
      <option value="eu">Nuernberg</option>
      <option value="us">Ashburn</option>
    </select>
  </z-select>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl('eu');
}

@Component({
  imports: [ZField, ZSelect],
  template: `<z-field label="Standort" for="standort" [hint]="hinweis()" [error]="fehler()">
    <z-select>
      <select id="standort">
        <option value="eu">Nuernberg</option>
      </select>
    </z-select>
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FeldHost {
  readonly hinweis = signal('Nur EU');
  readonly fehler = signal('');
}

@Component({
  imports: [ZField, ZSelect],
  template: `<z-field label="Standort" for="standort" hint="Nur EU">
    <z-select>
      @if (sichtbar()) {
        <select id="standort">
          <option value="eu">Nuernberg</option>
        </select>
      }
    </z-select>
  </z-field>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BedingtHost {
  readonly sichtbar = signal(false);
}

describe('ZSelect', () => {
  it('carries the classes of the wrapper', async () => {
    const fixture = TestBed.createComponent(SelectHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const huelle = fixture.nativeElement.querySelector('z-select');

    expect(huelle.classList.contains('z-select')).toBe(true);
    expect(huelle.classList.contains('z-select--sm')).toBe(false);

    fixture.componentInstance.groesse.set('sm');
    fixture.detectChanges();

    expect(huelle.classList.contains('z-select--sm')).toBe(true);
  });

  it('works with formControl in both directions', async () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const feld = fixture.nativeElement.querySelector('select');
    const steuerung = fixture.componentInstance.steuerung;

    expect(feld.value).toBe('eu');

    feld.value = 'us';
    feld.dispatchEvent(new Event('change'));

    expect(steuerung.value).toBe('us');

    steuerung.setValue('eu');
    fixture.detectChanges();

    expect(feld.value).toBe('eu');
  });

  it('is disabled through forms', async () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const feld = fixture.nativeElement.querySelector('select');

    expect(feld.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(feld.disabled).toBe(true);
  });

  it('sets aria-describedby on the inner select inside a z-field', async () => {
    const fixture = TestBed.createComponent(FeldHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const feld = fixture.nativeElement.querySelector('select');

    expect(feld.getAttribute('aria-describedby')).toBe('standort-hint');

    fixture.componentInstance.fehler.set('Der Standort ist ausgebucht.');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(feld.getAttribute('aria-describedby')).toBe('standort-error');
  });

  it('sets aria-describedby on a select that only appears later as well', async () => {
    const fixture = TestBed.createComponent(BedingtHost);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('select')).toBeNull();

    fixture.componentInstance.sichtbar.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('select').getAttribute('aria-describedby')).toBe(
      'standort-hint',
    );
  });
});
