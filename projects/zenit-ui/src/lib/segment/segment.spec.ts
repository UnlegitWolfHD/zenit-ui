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

function knoepfe(fixture: { nativeElement: HTMLElement }): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button'));
}

describe('ZSegment', () => {
  it('rendert je Option einen button[type=button] mit aria-pressed, genau einer gedrueckt', () => {
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

  it('traegt am Host role="group" mit aria-label', () => {
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

  it('arbeitet mit model() in beide Richtungen', async () => {
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

  it('arbeitet mit ngModel in beide Richtungen', async () => {
    const fixture = TestBed.createComponent(NgModelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    // ngModel setzt den Startwert erst in einem Microtask.
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

  it('arbeitet mit formControl in beide Richtungen', () => {
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

  it('bricht bei writeValue(null) nicht und laesst dann keine Sicht gedrueckt', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();

    fixture.componentInstance.steuerung.setValue(null);
    fixture.detectChanges();

    expect(
      knoepfe(fixture).filter((einer) => einer.getAttribute('aria-pressed') === 'true'),
    ).toEqual([]);
  });

  it('meldet nur die Nutzereingabe, nicht das Schreiben aus den Forms', () => {
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

  // Der Baustein bricht in waehle() ab, wenn der Wert schon steht. Ein Klick auf
  // die gewaehlte Sicht meldet deshalb nichts zurueck, die Steuerung bleibt
  // pristine.
  it('meldet den Klick auf die schon gewaehlte Sicht nicht erneut', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    knoepfe(fixture)[0].click();

    expect(steuerung.value).toBe('liste');
    expect(steuerung.pristine).toBe(true);
  });

  it('meldet touched nach dem blur', () => {
    const fixture = TestBed.createComponent(FormControlHost);
    fixture.detectChanges();
    const steuerung = fixture.componentInstance.steuerung;

    expect(steuerung.touched).toBe(false);

    knoepfe(fixture)[0].dispatchEvent(new FocusEvent('blur'));

    expect(steuerung.touched).toBe(true);
  });

  it('wird ueber die Forms gesperrt und wieder freigegeben', () => {
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

  it('sperrt ueber den Input disabled alle Knoepfe und laesst den Klick wirkungslos', () => {
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
