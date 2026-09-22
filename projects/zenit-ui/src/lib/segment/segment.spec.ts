import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZSegment, ZSegmentOption } from './segment';

const SICHTEN: readonly ZSegmentOption[] = [
  { value: 'liste', label: 'Liste' },
  { value: 'raster', label: 'Raster' },
  { value: 'karte', label: 'Karte' },
];

@Component({
  imports: [ZSegment],
  template: `<z-segment
    [options]="sichten"
    [(value)]="sicht"
    [ariaLabel]="marke()"
    [disabled]="gesperrt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly sichten = SICHTEN;
  readonly sicht = signal('liste');
  readonly marke = signal('Ansicht');
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZSegment, FormsModule],
  template: `<z-segment [options]="sichten" [(ngModel)]="sicht" ariaLabel="Ansicht" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly sichten = SICHTEN;
  readonly sicht = signal('raster');
}

@Component({
  imports: [ZSegment, ReactiveFormsModule],
  template: `<z-segment [options]="sichten" [formControl]="steuerung" ariaLabel="Ansicht" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly sichten = SICHTEN;
  readonly steuerung = new FormControl('liste');
}

/** The caller names the group with the plain attribute instead of the input. */
@Component({
  imports: [ZSegment],
  template: `<z-segment
    [options]="sichten"
    aria-label="Ansicht"
    aria-labelledby="ueberschrift"
    [ariaLabel]="marke()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenesLabelHost {
  readonly sichten = SICHTEN;
  readonly marke = signal('');
}

function knoepfe(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

describe('ZSegment', () => {
  it('renders one button[type=button] with aria-pressed per option, exactly one pressed', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const alle = knoepfe(fixture);

    expect(alle.map((einer) => einer.textContent?.trim())).toEqual(['Liste', 'Raster', 'Karte']);
    for (const einer of alle) {
      expect(einer.type).toBe('button');
      expect(einer.hasAttribute('aria-pressed')).toBe(true);
    }
    expect(alle.filter((einer) => einer.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
    expect(alle[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('carries role="group" with aria-label on the host', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const gruppe: HTMLElement = fixture.nativeElement.querySelector('z-segment');

    expect(gruppe.getAttribute('role')).toBe('group');
    expect(gruppe.getAttribute('aria-label')).toBe('Ansicht');
    expect(gruppe.classList.contains('z-segment')).toBe(true);

    fixture.componentInstance.marke.set('');
    fixture.detectChanges();

    expect(gruppe.hasAttribute('aria-label')).toBe(false);
  });

  // The host binding used to write null whenever ariaLabel was empty, which
  // left <z-segment aria-label="Ansicht"> as a role="group" without any name.
  it('keeps an aria-label of the caller, and the input wins while it is set', () => {
    const fixture = TestBed.createComponent(EigenesLabelHost);
    fixture.detectChanges();
    const gruppe: HTMLElement = fixture.nativeElement.querySelector('z-segment');

    expect(gruppe.getAttribute('aria-label')).toBe('Ansicht');
    expect(gruppe.getAttribute('aria-labelledby')).toBe('ueberschrift');

    fixture.componentInstance.marke.set('Zeitraum');
    fixture.detectChanges();

    expect(gruppe.getAttribute('aria-label')).toBe('Zeitraum');

    fixture.componentInstance.marke.set('');
    fixture.detectChanges();

    expect(gruppe.getAttribute('aria-label')).toBe('Ansicht');
  });

  it('works with model() in both directions', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const alle = knoepfe(fixture);

    alle[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sicht()).toBe('raster');
    expect(alle[1].getAttribute('aria-pressed')).toBe('true');
    expect(alle[0].getAttribute('aria-pressed')).toBe('false');

    fixture.componentInstance.sicht.set('karte');
    await fixture.whenStable();

    expect(alle[2].getAttribute('aria-pressed')).toBe('true');
    expect(alle.filter((einer) => einer.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
  });

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel sets the initial value only in a microtask.
    fixture.detectChanges();
    const alle = knoepfe(fixture);

    expect(alle[1].getAttribute('aria-pressed')).toBe('true');

    alle[2].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.sicht()).toBe('karte');

    fixture.componentInstance.sicht.set('liste');
    await fixture.whenStable();

    expect(alle[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('works with formControl in both directions', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const alle = knoepfe(fixture);
    const steuerung = fixture.componentInstance.steuerung;

    expect(alle[0].getAttribute('aria-pressed')).toBe('true');

    steuerung.setValue('karte');
    fixture.detectChanges();

    expect(alle[2].getAttribute('aria-pressed')).toBe('true');

    alle[1].click();

    expect(steuerung.value).toBe('raster');
  });

  it('does not break on writeValue(null) and then leaves no view pressed', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(
      knoepfe(fixture).filter((einer) => einer.getAttribute('aria-pressed') === 'true'),
    ).toEqual([]);
  });

  it('reports only the user input, not the write coming from forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    steuerung.setValue('karte');
    fixture.detectChanges();

    expect(steuerung.pristine).toBe(true);

    knoepfe(fixture)[1].click();

    expect(steuerung.dirty).toBe(true);
    expect(steuerung.value).toBe('raster');
  });

  // The component bails out in waehle() when the value is already set. A click
  // on the chosen view therefore reports nothing back and the control stays
  // pristine.
  it('does not report the click on the already chosen view again', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    knoepfe(fixture)[0].click();

    expect(steuerung.value).toBe('liste');
    expect(steuerung.pristine).toBe(true);
  });

  it('reports touched after the blur', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    expect(steuerung.touched).toBe(false);

    knoepfe(fixture)[0].dispatchEvent(new FocusEvent('blur'));

    expect(steuerung.touched).toBe(true);
  });

  it('is locked and released again through forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    expect(knoepfe(fixture).every((einer) => einer.disabled)).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(knoepfe(fixture).every((einer) => einer.disabled)).toBe(true);

    fixture.componentInstance.steuerung.enable();
    fixture.detectChanges();

    expect(knoepfe(fixture).some((einer) => einer.disabled)).toBe(false);
  });

  it('locks every button through the disabled input and leaves the click without effect', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    const alle = knoepfe(fixture);

    expect(alle.every((einer) => einer.disabled)).toBe(true);

    alle[1].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.sicht()).toBe('liste');
    expect(alle[0].getAttribute('aria-pressed')).toBe('true');
  });
});
