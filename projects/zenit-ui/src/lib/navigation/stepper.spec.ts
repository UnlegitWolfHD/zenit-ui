import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZStepper } from './stepper';

@Component({
  imports: [ZStepper],
  template: `<z-stepper [steps]="schritte()" [current]="aktuell()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StepperHost {
  readonly schritte = signal(['Spiel', 'Tarif', 'Bezahlen']);
  readonly aktuell = signal(0);
}

function schritte(fixture: { nativeElement: HTMLElement }): HTMLLIElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('li'));
}

describe('ZStepper', () => {
  it('renders the steps as an ordered list with numbers', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.detectChanges();
    const liste = fixture.nativeElement.querySelector('ol.z-steps');

    expect(liste).not.toBeNull();
    expect(schritte(fixture).length).toBe(3);
    expect(schritte(fixture).map((li) => li.classList.contains('z-step'))).toEqual([
      true,
      true,
      true,
    ]);
    expect(
      schritte(fixture).map((li) => li.querySelector('.z-step__num')?.textContent?.trim()),
    ).toEqual(['1', '2', '3']);
    expect(schritte(fixture)[1].textContent?.trim()).toBe('2Tarif');
  });

  it('marks the step at current with aria-current="step"', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.componentInstance.aktuell.set(1);
    fixture.detectChanges();

    expect(schritte(fixture).map((li) => li.getAttribute('aria-current'))).toEqual([
      null,
      'step',
      null,
    ]);
  });

  it('gives every step before current the done class', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.componentInstance.aktuell.set(2);
    fixture.detectChanges();

    expect(schritte(fixture).map((li) => li.classList.contains('z-step--done'))).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('moves the current and the done steps when current changes', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.detectChanges();

    expect(schritte(fixture).map((li) => li.classList.contains('z-step--done'))).toEqual([
      false,
      false,
      false,
    ]);

    fixture.componentInstance.aktuell.set(1);
    fixture.detectChanges();

    expect(schritte(fixture).map((li) => li.classList.contains('z-step--done'))).toEqual([
      true,
      false,
      false,
    ]);
    expect(schritte(fixture)[1].getAttribute('aria-current')).toBe('step');
    expect(schritte(fixture)[0].hasAttribute('aria-current')).toBe(false);
  });

  it('renders nothing but the empty list without steps', () => {
    const fixture = TestBed.createComponent(StepperHost);
    fixture.componentInstance.schritte.set([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ol.z-steps')).not.toBeNull();
    expect(schritte(fixture).length).toBe(0);
  });
});
