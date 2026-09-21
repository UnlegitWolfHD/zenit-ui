import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Z_LABELS, Z_LABELS_EN } from '../labels';
import { ZWizard, ZWizardState, ZWizardStep } from './wizard';

@Component({
  imports: [ZWizard, ZWizardStep],
  template: `<z-wizard>
    <z-wizard-step
      title="Inhalt"
      summary="Vanilla, neueste Version"
      [state]="erster()"
      (edit)="geaendert.set('Inhalt')"
    />
    <z-wizard-step title="Größe" [state]="zweiter()">
      <p class="inhalt">Arbeitsspeicher</p>
      <div zWizardActions><button type="button">Weiter</button></div>
    </z-wizard-step>
    <z-wizard-step title="Bezahlen" summary="Name, Laufzeit" state="locked">
      <p class="gesperrter-inhalt">Bezahlmethode</p>
    </z-wizard-step>
  </z-wizard>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Host {
  readonly erster = signal<ZWizardState>('done');
  readonly zweiter = signal<ZWizardState>('current');
  readonly geaendert = signal('');
}

function schritte(fixture: ComponentFixture<Host>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('z-wizard-step'));
}

describe('ZWizard', () => {
  it('is a list of list items, and numbers its steps itself', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const liste: HTMLElement = fixture.nativeElement.querySelector('z-wizard');

    expect(liste.getAttribute('role')).toBe('list');
    expect(liste.classList.contains('z-wizard')).toBe(true);
    expect(schritte(fixture).map((s) => s.getAttribute('role'))).toEqual([
      'listitem',
      'listitem',
      'listitem',
    ]);
    expect(
      schritte(fixture).map((s) => s.querySelector('.z-step__num')?.textContent?.trim()),
    ).toEqual(['1', '2', '3']);
  });

  it('collapses a finished step to summary and the change button', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const erster = schritte(fixture)[0];

    expect(erster.classList.contains('z-wstep--done')).toBe(true);
    expect(erster.hasAttribute('aria-current')).toBe(false);
    expect(erster.querySelector('.z-wstep__summary')?.textContent?.trim()).toBe(
      'Vanilla, neueste Version',
    );
    expect(erster.querySelector('.z-wstep__body')).toBeNull();

    const knopf = erster.querySelector('.z-wstep__edit') as HTMLButtonElement;
    expect(knopf.textContent?.trim()).toBe('Ändern');
    // The accessible name carries the step, so several of them stay apart.
    expect(knopf.getAttribute('aria-label')).toBe('Inhalt ändern');

    knopf.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.geaendert()).toBe('Inhalt');
  });

  it('opens the current step with its content and its actions', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const zweiter = schritte(fixture)[1];

    expect(zweiter.getAttribute('aria-current')).toBe('step');
    expect(zweiter.querySelector('.z-wstep__body .inhalt')).not.toBeNull();
    expect(zweiter.querySelector('.z-wstep__actions button')?.textContent?.trim()).toBe('Weiter');
    expect(zweiter.querySelector('.z-wstep__edit')).toBeNull();
    // The title is a heading the caller can move the focus to.
    expect(zweiter.querySelector('h3.z-wstep__title')?.getAttribute('tabindex')).toBe('-1');
  });

  it('renders no body at all for a locked step, so it holds no tab stop', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dritter = schritte(fixture)[2];

    expect(dritter.classList.contains('z-wstep--locked')).toBe(true);
    expect(dritter.querySelector('.gesperrter-inhalt')).toBeNull();
    expect(dritter.querySelector('.z-wstep__body')).toBeNull();
    expect(dritter.querySelector('.z-wstep__summary')?.textContent?.trim()).toBe('Name, Laufzeit');
  });

  it('moves the states when the caller moves them', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    fixture.componentInstance.erster.set('current');
    fixture.componentInstance.zweiter.set('locked');
    fixture.detectChanges();

    expect(schritte(fixture)[0].getAttribute('aria-current')).toBe('step');
    expect(schritte(fixture)[1].classList.contains('z-wstep--locked')).toBe(true);
    expect(schritte(fixture)[1].querySelector('.inhalt')).toBeNull();
  });

  it('takes the caption of the change button from the label registry', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: Z_LABELS, useValue: Z_LABELS_EN }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const knopf = schritte(fixture)[0].querySelector('.z-wstep__edit') as HTMLElement;

    expect(knopf.textContent?.trim()).toBe('Change');
    expect(knopf.getAttribute('aria-label')).toBe('Change Inhalt');
  });
});
