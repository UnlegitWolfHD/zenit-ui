import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZMetric, ZMetrics } from './metric';

@Component({
  imports: [ZMetric, ZMetrics],
  template: `<z-metrics>
    <z-metric
      [label]="beschriftung()"
      [value]="wert()"
      [unit]="einheit()"
      [sub]="unterzeile()"
      [percent]="anteil()"
    />
  </z-metrics>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MetricHost {
  readonly beschriftung = signal('Arbeitsspeicher');
  readonly wert = signal('3,2');
  readonly einheit = signal('GB');
  readonly unterzeile = signal('von 4 GB belegt');
  readonly anteil = signal<number | null>(null);
}

function meter(fixture: { nativeElement: HTMLElement }): HTMLElement | null {
  return fixture.nativeElement.querySelector('.z-meter');
}

/** Non-breaking space U+00A0, as a name instead of an invisible character. */
const NBSP = String.fromCharCode(160);

describe('ZMetric', () => {
  it('renders label, value and sub', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.detectChanges();
    const kennzahl = fixture.nativeElement.querySelector('z-metric');

    expect(fixture.nativeElement.querySelector('z-metrics').classList).toContain('z-metrics');
    expect(kennzahl.classList).toContain('z-metric');
    expect(kennzahl.querySelector('.z-metric__label').textContent.trim()).toBe('Arbeitsspeicher');
    expect(kennzahl.querySelector('.z-metric__value').textContent).toContain('3,2');
    expect(kennzahl.querySelector('.z-metric__sub').textContent.trim()).toBe('von 4 GB belegt');
  });

  it('separates value and unit with a non-breaking space', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-metric__value small').textContent).toBe(
      `${NBSP}GB`,
    );
    expect(fixture.nativeElement.querySelector('.z-metric__value').textContent).toBe(
      `3,2${NBSP}GB`,
    );
  });

  it('leaves out the small element without unit and the sub without sub', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.einheit.set('');
    fixture.componentInstance.unterzeile.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-metric__value small')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-metric__value').textContent).toBe('3,2');
    expect(fixture.nativeElement.querySelector('.z-metric__sub')).toBeNull();
  });

  it('renders no meter when percent is not set', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.detectChanges();

    expect(meter(fixture)).toBeNull();
  });

  it('sets the meter width and the aria values from percent', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.anteil.set(42);
    fixture.detectChanges();
    const balken = meter(fixture)!;

    expect(balken.getAttribute('role')).toBe('meter');
    expect(balken.getAttribute('aria-valuemin')).toBe('0');
    expect(balken.getAttribute('aria-valuemax')).toBe('100');
    expect(balken.getAttribute('aria-valuenow')).toBe('42');
    expect(balken.getAttribute('aria-label')).toBe('Arbeitsspeicher');
    expect(balken.querySelector<HTMLElement>('.z-meter__fill')!.style.width).toBe('42%');
  });

  it('keeps 79 percent normal', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.anteil.set(79);
    fixture.detectChanges();

    expect(meter(fixture)!.classList.contains('z-meter--warning')).toBe(false);
    expect(meter(fixture)!.classList.contains('z-meter--danger')).toBe(false);
  });

  it('warns from 80 percent up to 94 percent', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.anteil.set(80);
    fixture.detectChanges();

    expect(meter(fixture)!.classList.contains('z-meter--warning')).toBe(true);
    expect(meter(fixture)!.classList.contains('z-meter--danger')).toBe(false);

    fixture.componentInstance.anteil.set(94);
    fixture.detectChanges();

    expect(meter(fixture)!.classList.contains('z-meter--warning')).toBe(true);
    expect(meter(fixture)!.classList.contains('z-meter--danger')).toBe(false);
  });

  it('reports an error from 95 percent', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.anteil.set(95);
    fixture.detectChanges();

    expect(meter(fixture)!.classList.contains('z-meter--danger')).toBe(true);
    expect(meter(fixture)!.classList.contains('z-meter--warning')).toBe(false);
  });

  it('clamps percent into 0 to 100', () => {
    const fixture = TestBed.createComponent(MetricHost);
    fixture.componentInstance.anteil.set(140);
    fixture.detectChanges();

    expect(meter(fixture)!.getAttribute('aria-valuenow')).toBe('100');

    fixture.componentInstance.anteil.set(-20);
    fixture.detectChanges();

    expect(meter(fixture)!.getAttribute('aria-valuenow')).toBe('0');
  });
});
