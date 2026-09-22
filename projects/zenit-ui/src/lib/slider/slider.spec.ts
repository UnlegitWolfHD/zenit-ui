import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZSlider } from './slider';

@Component({
  imports: [ZSlider],
  template: `<z-slider
    [(value)]="menge"
    [label]="beschriftung()"
    [ariaLabel]="marke()"
    [min]="1"
    [max]="16"
    [step]="1"
    unit="GB"
    [ticks]="marken()"
    [hint]="hinweis()"
    [disabled]="gesperrt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ModellHost {
  readonly menge = signal(8);
  readonly beschriftung = signal('Arbeitsspeicher');
  readonly marke = signal('');
  readonly marken = signal<readonly (string | number)[]>([1, 4, 8, 16]);
  readonly hinweis = signal('Mehr als 8 GB braucht nur ein Modpack.');
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZSlider, FormsModule],
  template: `<z-slider
    [(ngModel)]="menge"
    label="Arbeitsspeicher"
    [min]="1"
    [max]="16"
    unit="GB"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NgModelHost {
  readonly menge = signal(4);
}

@Component({
  imports: [ZSlider, ReactiveFormsModule],
  template: `<z-slider
    [formControl]="steuerung"
    label="Arbeitsspeicher"
    [min]="1"
    [max]="16"
    unit="GB"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormControlHost {
  readonly steuerung = new FormControl(8);
}

/** Non-breaking space between value and unit, as a character instead of an escape. */
const NBSP = String.fromCharCode(0xa0);

/** Moves the track the way a user moves it. */
function schiebe(schiene: HTMLInputElement, auf: number): void {
  schiene.value = String(auf);
  schiene.dispatchEvent(new Event('input'));
}

@Component({
  imports: [ZSlider],
  template: `<z-slider [(value)]="menge" label="Speicher" [min]="200" [max]="800" [step]="100" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkalaHost {
  readonly menge = signal(500);
}

@Component({
  imports: [ZSlider],
  template: `<z-slider
    [(value)]="menge"
    [label]="beschriftung()"
    [ariaLabel]="marke()"
    [min]="untere()"
    [max]="obere()"
    [step]="schritt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GrenzenHost {
  readonly menge = signal(8);
  readonly untere = signal(2);
  readonly obere = signal(16);
  readonly schritt = signal(2);
  readonly beschriftung = signal('Arbeitsspeicher');
  readonly marke = signal('');
}

/** Plus and minus next to the track, the bare attribute the way a page writes it. */
@Component({
  imports: [ZSlider],
  template: `<z-slider
    [(value)]="menge"
    label="Aufbewahrung"
    unit="Tage"
    [min]="1"
    [max]="5"
    [step]="1"
    steppers
    [disabled]="gesperrt()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StepperHost {
  readonly menge = signal(3);
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZSlider, ReactiveFormsModule],
  template: `<z-slider
    [formControl]="steuerung"
    label="Aufbewahrung"
    [min]="1"
    [max]="5"
    [step]="1"
    steppers
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StepperFormHost {
  readonly steuerung = new FormControl(3);
}

/** 27 steps: above the twelve of spec/components/Slider/README.md. */
@Component({
  imports: [ZSlider],
  template: `<z-slider
    [(value)]="menge"
    label="Tickrate"
    unit="Hz"
    [min]="20"
    [max]="128"
    [step]="4"
    [steppers]="mitSteppern()"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StufenHost {
  readonly menge = signal(64);
  readonly mitSteppern = signal(false);
}

/** The minus and the plus button of a slider with steppers, in that order. */
function knoepfe(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

describe('ZSlider', () => {
  // The component sets min, max and step straight onto the element together
  // with the value. If they came as bindings, the browser would clamp the value
  // to the default scale 0 to 100 on the first build.
  it('keeps the value on a scale outside 0 to 100', () => {
    const fixture = TestBed.createComponent(SkalaHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('500');
    expect(fixture.componentInstance.menge()).toBe(500);
  });

  it('sets min, max and step on the native input[type=range]', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.type).toBe('range');
    expect(schiene.min).toBe('1');
    expect(schiene.max).toBe('16');
    expect(schiene.step).toBe('1');
    expect(fixture.nativeElement.querySelector('z-slider').classList.contains('z-range')).toBe(
      true,
    );
  });

  it('ties label and track together through for and id', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label.z-field__label');
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(label.textContent?.trim()).toBe('Arbeitsspeicher');
    expect(label.getAttribute('for')).toBe(schiene.id);
    expect(schiene.id).not.toBe('');
    expect(schiene.hasAttribute('aria-label')).toBe(false);
  });

  it('renders no <label> without label and takes ariaLabel instead', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.beschriftung.set('');
    fixture.componentInstance.marke.set('Arbeitsspeicher');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('label')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-label')).toBe(
      'Arbeitsspeicher',
    );
  });

  it('shows the value with unit and a non-breaking space, as aria-valuetext too', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const anzeige: HTMLElement = fixture.nativeElement.querySelector('.z-range__value');

    expect(anzeige.textContent).toBe(`8${NBSP}GB`);
    expect(fixture.nativeElement.querySelector('input').getAttribute('aria-valuetext')).toBe(
      `8${NBSP}GB`,
    );
  });

  it('renders ticks for the eye and the hint with aria-describedby', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const marken: HTMLElement = fixture.nativeElement.querySelector('.z-range__ticks');
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const hinweis: HTMLElement = fixture.nativeElement.querySelector('.z-field__hint');

    expect(marken.getAttribute('aria-hidden')).toBe('true');
    expect(Array.from(marken.querySelectorAll('span')).map((eins) => eins.textContent)).toEqual([
      '1',
      '4',
      '8',
      '16',
    ]);
    expect(hinweis.textContent?.trim()).toBe('Mehr als 8 GB braucht nur ein Modpack.');
    expect(schiene.getAttribute('aria-describedby')).toBe(hinweis.id);
  });

  it('leaves ticks and hint out when they are empty', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.marken.set([]);
    fixture.componentInstance.hinweis.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-range__ticks')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-field__hint')).toBeNull();
    expect(fixture.nativeElement.querySelector('input').hasAttribute('aria-describedby')).toBe(
      false,
    );
  });

  it('works with model() in both directions and delivers a number', async () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('8');

    schiebe(schiene, 12);
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(12);
    expect(typeof fixture.componentInstance.menge()).toBe('number');

    fixture.componentInstance.menge.set(4);
    await fixture.whenStable();

    expect(schiene.value).toBe('4');
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(`4${NBSP}GB`);
  });

  it('works with ngModel in both directions', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel sets the initial value only in a microtask.
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('4');

    schiebe(schiene, 10);
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(10);

    fixture.componentInstance.menge.set(2);
    await fixture.whenStable();

    expect(schiene.value).toBe('2');
  });

  it('works with formControl in both directions and delivers a number', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    expect(schiene.value).toBe('8');

    steuerung.setValue(12);
    fixture.detectChanges();

    expect(schiene.value).toBe('12');

    schiebe(schiene, 3);

    expect(steuerung.value).toBe(3);
    expect(typeof steuerung.value).toBe('number');
  });

  it('does not break on writeValue(null) and falls back to min', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(schiene.value).toBe('1');
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(`1${NBSP}GB`);
  });

  it('reports only the user input, not the write coming from forms', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    steuerung.setValue(12);
    fixture.detectChanges();

    expect(steuerung.pristine).toBe(true);

    schiebe(schiene, 3);

    expect(steuerung.dirty).toBe(true);
    expect(steuerung.value).toBe(3);
  });

  // The pointer input sets the value on the element itself. If a control
  // reverts it before a change detection has run, the track still has to follow
  // it.
  it('follows the control when setValue reverts the input right away', async () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const steuerung = fixture.componentInstance.steuerung;

    schiebe(schiene, 12);
    steuerung.setValue(8);
    await fixture.whenStable();

    expect(steuerung.value).toBe(8);
    expect(schiene.value).toBe('8');
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
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.disabled).toBe(false);

    fixture.componentInstance.steuerung.disable();
    fixture.detectChanges();

    expect(schiene.disabled).toBe(true);

    fixture.componentInstance.steuerung.enable();
    fixture.detectChanges();

    expect(schiene.disabled).toBe(false);
  });

  // The element keeps itself on the scale. Whatever it corrects has to reach
  // the model as well, otherwise thumb, display and value drift apart.
  it('takes the value above max back to max, in the model too', async () => {
    const fixture = TestBed.createComponent(GrenzenHost);
    fixture.componentInstance.menge.set(99);
    fixture.detectChanges();
    await fixture.whenStable();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('16');
    expect(fixture.componentInstance.menge()).toBe(16);
    expect(schiene.getAttribute('aria-valuetext')).toBe('16');
  });

  it('takes the value below min up to min, in the model too', async () => {
    const fixture = TestBed.createComponent(GrenzenHost);
    fixture.componentInstance.menge.set(-5);
    fixture.detectChanges();
    await fixture.whenStable();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('2');
    expect(fixture.componentInstance.menge()).toBe(2);
  });

  // The browsers round a range onto its step, jsdom does not. What holds in
  // both is the invariant the readback buys: whatever the element makes of the
  // value is what model, display and aria-valuetext show.
  it('keeps model, track and display on one value between two steps', async () => {
    const fixture = TestBed.createComponent(GrenzenHost);
    fixture.componentInstance.menge.set(7);
    fixture.detectChanges();
    await fixture.whenStable();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(fixture.componentInstance.menge()).toBe(schiene.valueAsNumber);
    expect(schiene.getAttribute('aria-valuetext')).toBe(schiene.value);
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(schiene.value);
  });

  // A max below min is written onto the element as min, so the scale collapses
  // onto min and the value is min.
  it('delivers min when min is greater than max', async () => {
    const fixture = TestBed.createComponent(GrenzenHost);
    fixture.componentInstance.untere.set(10);
    fixture.componentInstance.obere.set(4);
    fixture.componentInstance.schritt.set(1);
    fixture.detectChanges();
    await fixture.whenStable();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    expect(schiene.value).toBe('10');
    expect(fixture.componentInstance.menge()).toBe(10);
  });

  it('reports the corrected value to the form exactly once', async () => {
    const fixture = TestBed.createComponent(FormControlHost);
    const steuerung = fixture.componentInstance.steuerung;
    fixture.detectChanges();
    const gemeldet: (number | null)[] = [];
    steuerung.valueChanges.subscribe((wert) => gemeldet.push(wert));

    steuerung.setValue(99);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('input').value).toBe('16');
    expect(steuerung.value).toBe(16);
    expect(gemeldet).toEqual([99, 16]);
  });

  it('warns once when neither label nor ariaLabel names the slider', async () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(GrenzenHost);
    fixture.componentInstance.beschriftung.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(warnung).toHaveBeenCalledTimes(1);
    expect(warnung.mock.calls[0][0]).toContain('ZSlider');

    warnung.mockRestore();
  });

  it('stays quiet as soon as a name is there', async () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const mitLabel = TestBed.createComponent(GrenzenHost);
    mitLabel.detectChanges();
    await mitLabel.whenStable();

    const nurAria = TestBed.createComponent(GrenzenHost);
    nurAria.componentInstance.beschriftung.set('');
    nurAria.componentInstance.marke.set('Arbeitsspeicher');
    nurAria.detectChanges();
    await nurAria.whenStable();

    expect(warnung).not.toHaveBeenCalled();

    warnung.mockRestore();
  });

  it('renders no steppers and no row class by default', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.detectChanges();

    expect(knoepfe(fixture)).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.z-range__row')).toBeNull();
  });

  it('renders minus and plus with steppers, named from the label registry', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.detectChanges();
    const [weniger, mehr] = knoepfe(fixture);

    expect(fixture.nativeElement.querySelector('.z-range__row')).not.toBeNull();
    expect(weniger.getAttribute('aria-label')).toBe('Verringern');
    expect(mehr.getAttribute('aria-label')).toBe('Erhöhen');
    expect(weniger.type).toBe('button');
    expect(weniger.className).toBe('z-btn z-btn--ghost z-btn--icon z-btn--sm');
    expect(weniger.querySelector('z-icon')?.textContent?.trim()).toBe('remove');
    expect(mehr.querySelector('z-icon')?.textContent?.trim()).toBe('add');
    // The track stays between the two buttons, so the reading order is
    // minus, track, plus.
    expect(fixture.nativeElement.querySelector('.z-range__row')?.children).toHaveLength(3);
  });

  it('moves the value by one step in both directions', async () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.detectChanges();
    const [weniger, mehr] = knoepfe(fixture);
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    mehr.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(4);
    expect(schiene.value).toBe('4');

    weniger.click();
    weniger.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(2);
    expect(fixture.nativeElement.querySelector('.z-range__value').textContent).toBe(`2${NBSP}Tage`);
  });

  it('clamps at both ends and marks the button there aria-disabled', async () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.componentInstance.menge.set(5);
    fixture.detectChanges();
    await fixture.whenStable();
    const [weniger, mehr] = knoepfe(fixture);

    expect(mehr.getAttribute('aria-disabled')).toBe('true');
    expect(weniger.hasAttribute('aria-disabled')).toBe(false);
    // aria-disabled instead of the native one, so the button keeps the focus
    // it has just been given; the click is swallowed.
    expect(mehr.disabled).toBe(false);

    mehr.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(5);

    fixture.componentInstance.menge.set(1);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(weniger.getAttribute('aria-disabled')).toBe('true');
    expect(mehr.hasAttribute('aria-disabled')).toBe(false);

    weniger.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(1);
  });

  it('locks both buttons natively while the slider is locked', async () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const [weniger, mehr] = knoepfe(fixture);

    expect(weniger.disabled).toBe(true);
    expect(mehr.disabled).toBe(true);

    mehr.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.menge()).toBe(3);
  });

  it('writes a step through to the form exactly once', async () => {
    const fixture = TestBed.createComponent(StepperFormHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;
    const gemeldet: (number | null)[] = [];
    steuerung.valueChanges.subscribe((wert) => gemeldet.push(wert));

    knoepfe(fixture)[1].click();
    await fixture.whenStable();

    expect(steuerung.value).toBe(4);
    expect(steuerung.dirty).toBe(true);
    expect(gemeldet).toEqual([4]);
    expect(fixture.nativeElement.querySelector('input').value).toBe('4');
  });

  it('warns once about more than twelve steps without steppers', async () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(StufenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(warnung).toHaveBeenCalledTimes(1);
    expect(warnung.mock.calls[0][0]).toContain('27 Stufen');
    expect(warnung.mock.calls[0][0]).toContain('Bei mehr als 12 Stufen');

    warnung.mockRestore();
  });

  it('stays quiet about the steps as soon as steppers is set', async () => {
    const warnung = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(StufenHost);
    fixture.componentInstance.mitSteppern.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(warnung).not.toHaveBeenCalled();

    warnung.mockRestore();
  });

  it('locks through the disabled input', () => {
    const fixture = TestBed.createComponent(ModellHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    const schiene: HTMLInputElement = fixture.nativeElement.querySelector('input');

    // A locked track takes no pointer input, so the value stays.
    expect(schiene.disabled).toBe(true);

    schiene.click();
    fixture.detectChanges();

    expect(schiene.value).toBe('8');
    expect(fixture.componentInstance.menge()).toBe(8);
  });
});
