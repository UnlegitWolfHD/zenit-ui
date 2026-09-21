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
});
