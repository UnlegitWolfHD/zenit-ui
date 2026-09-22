import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSpinner } from './spinner';

@Component({
  imports: [ZSpinner],
  template: `<z-spinner [label]="label()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SpinnerHost {
  readonly label = signal('');
}

/** The caller announces the spinner itself instead of using `label`. */
@Component({
  imports: [ZSpinner],
  template: `<z-spinner role="status" aria-label="Wird geladen" [label]="label()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EigenerNameHost {
  readonly label = signal('');
}

/** The caller binds the name instead of writing it as a static attribute. */
@Component({
  imports: [ZSpinner],
  template: `<z-spinner [attr.aria-label]="eigen()" [label]="label()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class GebundenerNameHost {
  readonly label = signal('');
  readonly eigen = signal<string | null>('Wird geladen');
}

describe('ZSpinner', () => {
  function baue(): { spinner: HTMLElement; host: SpinnerHost; rendere: () => void } {
    const fixture = TestBed.createComponent(SpinnerHost);
    fixture.detectChanges();
    return {
      spinner: fixture.nativeElement.querySelector('z-spinner'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('is decorative without a label', () => {
    const { spinner } = baue();

    expect(spinner.classList.contains('z-spinner')).toBe(true);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.hasAttribute('role')).toBe(false);
    expect(spinner.hasAttribute('aria-label')).toBe(false);
  });

  it('becomes a status message with a label', () => {
    const { spinner, host, rendere } = baue();
    host.label.set('Wird gestartet');
    rendere();

    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.getAttribute('aria-label')).toBe('Wird gestartet');
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);
  });

  it('falls back to decorative when the label is removed again', () => {
    const { spinner, host, rendere } = baue();
    host.label.set('Wird gestartet');
    rendere();
    host.label.set('');
    rendere();

    expect(spinner.hasAttribute('role')).toBe(false);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
  });

  it('keeps the role and the aria-label the caller wrote and hides nothing', () => {
    const fixture = TestBed.createComponent(EigenerNameHost);
    fixture.detectChanges();
    const spinner: HTMLElement = fixture.nativeElement.querySelector('z-spinner');

    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.getAttribute('aria-label')).toBe('Wird geladen');
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);

    // The input wins while it holds a value, and gives the attributes back.
    fixture.componentInstance.label.set('Wird gestartet');
    fixture.detectChanges();

    expect(spinner.getAttribute('aria-label')).toBe('Wird gestartet');

    fixture.componentInstance.label.set('');
    fixture.detectChanges();

    expect(spinner.getAttribute('role')).toBe('status');
    expect(spinner.getAttribute('aria-label')).toBe('Wird geladen');
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);
  });

  // A name read once at construction is not there yet when the caller binds it,
  // so the spinner used to hide a name the caller had written.
  it('is not decorative when the caller binds the name, and follows that binding', async () => {
    const fixture = TestBed.createComponent(GebundenerNameHost);
    fixture.detectChanges();
    const spinner: HTMLElement = fixture.nativeElement.querySelector('z-spinner');

    expect(spinner.getAttribute('aria-label')).toBe('Wird geladen');
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);

    // The caller takes its name back: without one the spinner is decorative.
    fixture.componentInstance.eigen.set(null);
    fixture.detectChanges();
    await Promise.resolve();

    expect(spinner.getAttribute('aria-hidden')).toBe('true');
  });

  it('holds the label against a caller binding and gives back its latest value', async () => {
    const fixture = TestBed.createComponent(GebundenerNameHost);
    fixture.componentInstance.label.set('Wird gestartet');
    fixture.detectChanges();
    const spinner: HTMLElement = fixture.nativeElement.querySelector('z-spinner');

    expect(spinner.getAttribute('aria-label')).toBe('Wird gestartet');

    fixture.componentInstance.eigen.set('Lädt weiter');
    fixture.detectChanges();
    await Promise.resolve();

    expect(spinner.getAttribute('aria-label'), 'die Eingabe hält').toBe('Wird gestartet');

    fixture.componentInstance.label.set('');
    fixture.detectChanges();

    expect(spinner.getAttribute('aria-label'), 'der letzte Wert des Aufrufers').toBe('Lädt weiter');
    expect(spinner.hasAttribute('aria-hidden')).toBe(false);
  });
});
