import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZCostChart } from './cost-chart';
import {
  Z_CHART_AREA,
  zCostArea,
  zCostGeometry,
  zCostHourAt,
  zCostHourStep,
  zCostStep,
  zCostTableHours,
  zCostTicks,
} from './cost-chart-math';
import { zCostAt, zCostCapHour } from './cost-chart-rules';

/*
 * The numbers are the ones from CostChart/preview.html: 1,50 € base, 0,088 €
 * per hour, capped at 10,30 €, axis to 150 hours.
 */
const BASE = 1.5;
const RATE = 0.088;
const CAP = 10.3;
const MAX = 150;

@Component({
  imports: [ZCostChart],
  template: `<z-cost-chart
    [base]="1.5"
    [rate]="0.088"
    [cap]="10.3"
    [maxHours]="150"
    caption="Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde."
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {}

@Component({
  imports: [ZCostChart],
  template: `<z-cost-chart [base]="1.5" [rate]="0.088" [cap]="99" [maxHours]="40" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class OhneDeckelHost {}

@Component({
  imports: [ZCostChart],
  template: `<z-cost-chart
    [base]="nichts"
    [rate]="nichts"
    [cap]="unendlich"
    [maxHours]="nichts"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class UnsinnHost {
  readonly nichts = Number.NaN;
  readonly unendlich = Number.POSITIVE_INFINITY;
}

@Component({
  imports: [ZCostChart],
  template: `<z-cost-chart [base]="1.5" [rate]="0.088" [cap]="10.3" [maxHours]="grenze()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BeweglichHost {
  readonly grenze = signal(150);
}

function plot(fixture: ComponentFixture<Host>): HTMLElement {
  return fixture.nativeElement.querySelector('.z-chart__plot');
}

function taste(fixture: ComponentFixture<Host>, key: string): void {
  plot(fixture).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  fixture.detectChanges();
}

describe('zCostCapHour', () => {
  it('hits the 100 hours of the README with the unrounded price', () => {
    expect(zCostCapHour(BASE, RATE, CAP)).toBeCloseTo(100, 10);
  });

  it('would land on 98 hours with the price rounded to the cent', () => {
    // This is exactly the mistake the README warns about, written down.
    expect(Math.round(zCostCapHour(BASE, 0.09, CAP) as number)).toBe(98);
  });

  it('never reaches the cap without an hourly price', () => {
    expect(zCostCapHour(BASE, 0, CAP)).toBeNull();
    expect(zCostCapHour(BASE, -1, CAP)).toBeNull();
  });

  it('caps from hour 0 when the cap is at or below the base amount', () => {
    expect(zCostCapHour(5, RATE, 5)).toBe(0);
    expect(zCostCapHour(5, RATE, 2)).toBe(0);
  });

  it('has no cap hour without a cap', () => {
    expect(zCostCapHour(BASE, RATE, 0)).toBeNull();
    expect(zCostCapHour(BASE, RATE, Number.NaN)).toBeNull();
  });

  it('survives values that are not finite', () => {
    expect(zCostCapHour(Number.NaN, RATE, CAP)).toBeCloseTo(CAP / RATE, 4);
    expect(zCostCapHour(BASE, Number.POSITIVE_INFINITY, CAP)).toBeNull();
  });

  it('lands on a whole hour where the arithmetic means one', () => {
    // 8,8 / 0,088 is 100.00000000000001 in binary floating point, and a chart
    // that rounds up would print 101.
    expect(Math.ceil(zCostCapHour(BASE, RATE, CAP) as number)).toBe(100);
  });
});

describe('zCostAt', () => {
  it('follows base plus rate until the cap takes over', () => {
    expect(zCostAt(BASE, RATE, CAP, 0)).toBeCloseTo(1.5, 10);
    expect(zCostAt(BASE, RATE, CAP, 25)).toBeCloseTo(3.7, 10);
    expect(zCostAt(BASE, RATE, CAP, 50)).toBeCloseTo(5.9, 10);
    expect(zCostAt(BASE, RATE, CAP, 100)).toBeCloseTo(10.3, 10);
    expect(zCostAt(BASE, RATE, CAP, 150)).toBeCloseTo(10.3, 10);
  });

  it('counts a negative hour as zero and never goes below the base', () => {
    expect(zCostAt(BASE, RATE, CAP, -20)).toBeCloseTo(1.5, 10);
    expect(zCostAt(BASE, RATE, CAP, Number.NaN)).toBeCloseTo(1.5, 10);
  });
});

describe('zCostStep and zCostTicks', () => {
  it('picks round steps', () => {
    expect(zCostStep(5.15)).toBe(5);
    expect(zCostStep(50)).toBe(50);
    expect(zCostStep(3)).toBe(2.5);
    expect(zCostStep(0)).toBe(1);
  });

  it('reaches the ticks of the preview', () => {
    expect(zCostTicks(10.3, 5)).toEqual([0, 5, 10]);
    expect(zCostTicks(150, 50)).toEqual([0, 50, 100, 150]);
  });

  it('adds no tick past the span and stops at twelve', () => {
    expect(zCostTicks(4, 5)).toEqual([0]);
    expect(zCostTicks(1000, 1).length).toBe(12);
  });
});

describe('zCostGeometry', () => {
  it('draws the line as base, cap point, end', () => {
    const geo = zCostGeometry(BASE, RATE, CAP, MAX);
    const punkte = geo.line.split(' ').map((paar) => paar.split(',').map(Number));

    expect(punkte).toHaveLength(3);
    expect(punkte[0][0]).toBeCloseTo(Z_CHART_AREA.x0, 6);
    expect(punkte[2][0]).toBeCloseTo(Z_CHART_AREA.x1, 6);
    expect(geo.capHour).toBeCloseTo(100, 10);
    // Two thirds of the way across the axis, because 100 of 150 hours.
    expect(geo.capX).toBeCloseTo(
      Z_CHART_AREA.x0 + (2 / 3) * (Z_CHART_AREA.x1 - Z_CHART_AREA.x0),
      6,
    );
    expect(geo.capY).toBeLessThan(geo.baseY);
    expect(geo.valueTicks.map((t) => t.value)).toEqual([0, 5, 10]);
    expect(geo.hourTicks.map((t) => t.value)).toEqual([0, 50, 100, 150]);
  });

  it('leaves room above the highest point for the direct label', () => {
    const geo = zCostGeometry(BASE, RATE, CAP, MAX);

    expect(geo.maxValue).toBeGreaterThan(CAP);
    expect(geo.capY).toBeGreaterThan(Z_CHART_AREA.y1);
  });

  it('draws no cap point when the cap lies past the axis', () => {
    const geo = zCostGeometry(BASE, RATE, CAP, 40);

    expect(geo.capHour).toBeNull();
    expect(geo.capX).toBeNull();
    expect(geo.line.split(' ')).toHaveLength(2);
  });

  it('runs flat without an hourly price', () => {
    const geo = zCostGeometry(BASE, 0, CAP, MAX);
    const [start, ende] = geo.line.split(' ').map((paar) => Number(paar.split(',')[1]));

    expect(geo.capHour).toBeNull();
    expect(start).toBeCloseTo(ende, 6);
  });

  it('runs flat at the cap when the cap is at or below the base amount', () => {
    const geo = zCostGeometry(5, RATE, 5, MAX);

    expect(geo.capHour).toBe(0);
    expect(geo.capX).toBeCloseTo(Z_CHART_AREA.x0, 6);
  });

  it('turns an axis of zero hours into one', () => {
    for (const grenze of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      const geo = zCostGeometry(BASE, RATE, CAP, grenze);

      expect(geo.maxHours).toBe(1);
      expect(geo.line).not.toContain('NaN');
      expect(geo.maxValue).toBeGreaterThan(0);
    }
  });

  it('draws nothing that is not a number, whatever it is handed', () => {
    const geo = zCostGeometry(Number.NaN, Number.NaN, Number.NaN, Number.NaN);

    expect(geo.line).not.toContain('NaN');
    expect(geo.valueTicks.every((tick) => Number.isFinite(tick.pos))).toBe(true);
  });
});

describe('zCostArea and zCostHourStep', () => {
  it('makes one viewBox unit one pixel of the measured width', () => {
    const area = zCostArea(360);

    expect(area.width).toBe(360);
    expect(area.x1).toBe(348);
    expect(area.height).toBe(Z_CHART_AREA.height);
  });

  it('keeps a floor, so the type never has to shrink', () => {
    expect(zCostArea(80).width).toBe(240);
    expect(zCostArea(Number.NaN).width).toBe(Z_CHART_AREA.width);
  });

  it('thins the time axis out as the plot gets narrower', () => {
    const breit = zCostHourStep(MAX, 460);
    const schmal = zCostHourStep(MAX, 180);

    expect(zCostTicks(MAX, breit)).toEqual([0, 50, 100, 150]);
    expect(schmal).toBeGreaterThanOrEqual(breit);
    expect(zCostTicks(MAX, schmal).length).toBeLessThanOrEqual(3);
  });
});

describe('zCostTableHours', () => {
  it('reaches the support points of the preview', () => {
    expect(zCostTableHours(100, MAX)).toEqual([0, 25, 50, 100]);
  });

  it('rounds the cap hour up, because the cap holds from the hour it is reached', () => {
    expect(zCostTableHours(2.2, MAX).at(-1)).toBe(3);
  });

  it('falls back to the axis without a cap hour, and drops duplicates', () => {
    expect(zCostTableHours(null, 40)).toEqual([0, 10, 20, 40]);
    expect(zCostTableHours(1, 150)).toEqual([0, 1]);
  });
});

describe('zCostHourAt', () => {
  it('turns a position across the plot into a whole hour', () => {
    expect(zCostHourAt(0, MAX)).toBe(0);
    expect(zCostHourAt(0.5, MAX)).toBe(75);
    expect(zCostHourAt(1, MAX)).toBe(150);
  });

  it('stays on the axis, whatever it is handed', () => {
    expect(zCostHourAt(-3, MAX)).toBe(0);
    expect(zCostHourAt(9, MAX)).toBe(150);
    expect(zCostHourAt(Number.NaN, MAX)).toBe(0);
  });
});

describe('ZCostChart', () => {
  it('names the svg through title and desc and keeps it out of the tab order', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    const [titelId, descId] = (svg.getAttribute('aria-labelledby') ?? '').split(' ');

    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.querySelector('title')?.id).toBe(titelId);
    expect(svg.querySelector('title')?.textContent).toBe(
      'Monatliche Kosten nach gespielten Stunden',
    );
    expect(svg.querySelector('desc')?.id).toBe(descId);
    expect(svg.querySelector('desc')?.textContent).toContain('ab 100 Stunden gedeckelt');
  });

  it('is a slider over the hours, which is the keyboard it really offers', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(plot(fixture).getAttribute('role')).toBe('slider');
    expect(plot(fixture).getAttribute('tabindex')).toBe('0');
    expect(plot(fixture).getAttribute('aria-valuemin')).toBe('0');
    expect(plot(fixture).getAttribute('aria-valuemax')).toBe('150');
    expect(plot(fixture).getAttribute('aria-valuenow')).toBe('0');
  });

  it('moves the reading with the arrows, Home and End', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    taste(fixture, 'End');
    expect(plot(fixture).getAttribute('aria-valuenow')).toBe('150');
    expect(plot(fixture).getAttribute('aria-valuetext')).toBe('150\u00a0h gespielt: 10,30\u00a0€');

    taste(fixture, 'Home');
    expect(plot(fixture).getAttribute('aria-valuenow')).toBe('0');

    // Thirty presses cross the whole axis, so one press is five hours here.
    taste(fixture, 'ArrowRight');
    expect(plot(fixture).getAttribute('aria-valuenow')).toBe('5');

    taste(fixture, 'ArrowLeft');
    taste(fixture, 'ArrowLeft');
    expect(plot(fixture).getAttribute('aria-valuenow')).toBe('0');
  });

  it('shows cross, dot and tooltip while the plot has the focus', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-chart__tip')).toBeNull();

    plot(fixture).dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-chart__cross')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.z-chart__tip')?.textContent).toContain(
      '0\u00a0h gespielt',
    );

    plot(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-chart__tip')).toBeNull();
  });

  it('says no cap in the description when none lies on the axis', () => {
    const fixture = TestBed.createComponent(OhneDeckelHost);
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('desc') as SVGElement;

    expect(desc.textContent).toContain('ohne Deckel');
    expect(desc.textContent).not.toContain('gedeckelt bei');
  });

  it('never writes NaN into a label, whatever it is handed', () => {
    const fixture = TestBed.createComponent(UnsinnHost);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).not.toContain('NaN');
    expect(text).not.toContain('Infinity');
  });

  it('keeps the hour on the axis when the axis shrinks', () => {
    const fixture = TestBed.createComponent(BeweglichHost);
    fixture.detectChanges();
    const flaeche = fixture.nativeElement.querySelector('.z-chart__plot') as HTMLElement;

    flaeche.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(flaeche.getAttribute('aria-valuenow')).toBe('150');

    fixture.componentInstance.grenze.set(50);
    fixture.detectChanges();

    expect(flaeche.getAttribute('aria-valuemax')).toBe('50');
    expect(flaeche.getAttribute('aria-valuenow')).toBe('50');
  });

  it('is a horizontal slider, which is what the arrow keys do', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(plot(fixture).getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('carries the two figures and the caption', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const zahlen = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('.z-chart__figure'),
    );

    expect(zahlen.map((zahl) => zahl.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Pro Stunde0,09\u00a0€'.replace(/\s+/g, ' '),
      'Höchstens im Monat10,30\u00a0€'.replace(/\s+/g, ' '),
    ]);
    expect(fixture.nativeElement.querySelector('.z-chart__caption')?.textContent?.trim()).toBe(
      'Normal mit 4 GB: 1,50 € Grundbetrag plus 0,09 € je Stunde.',
    );
  });

  it('repeats every number as a real table, the cap row last', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const zeilen = Array.from<HTMLElement>(
      fixture.nativeElement.querySelectorAll('table.z-table tbody tr'),
    );

    expect(
      zeilen.map((zeile) =>
        Array.from(zeile.querySelectorAll('td')).map((z) => z.textContent?.trim()),
      ),
    ).toEqual([
      ['0', '1,50\u00a0€'],
      ['25', '3,70\u00a0€'],
      ['50', '5,90\u00a0€'],
      ['100 und mehr', '10,30\u00a0€'],
    ]);
  });
});
