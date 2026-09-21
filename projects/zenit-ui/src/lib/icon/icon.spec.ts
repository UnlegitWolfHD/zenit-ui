import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZIcon } from './icon';

@Component({
  imports: [ZIcon],
  template: `<z-icon [name]="name()" [size]="groesse()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class IconHost {
  readonly name = signal('content_copy');
  readonly groesse = signal<'sm' | 'md'>('md');
}

describe('ZIcon', () => {
  function baue(): { icon: HTMLElement; host: IconHost; rendere: () => void } {
    const fixture = TestBed.createComponent(IconHost);
    fixture.detectChanges();
    return {
      icon: fixture.nativeElement.querySelector('z-icon'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('carries the font class and the own class', () => {
    const { icon } = baue();

    expect(icon.classList.contains('material-icons')).toBe(true);
    expect(icon.classList.contains('z-icon')).toBe(true);
    expect(icon.className).toBe('material-icons z-icon');
  });

  it('renders the name as the ligature text', () => {
    const { icon, host, rendere } = baue();

    expect(icon.textContent).toBe('content_copy');

    host.name.set('delete');
    rendere();

    expect(icon.textContent).toBe('delete');
  });

  it('is hidden from assistive technology', () => {
    const { icon } = baue();

    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('adds the small class only for size sm', () => {
    const { icon, host, rendere } = baue();

    expect(icon.classList.contains('z-icon--sm')).toBe(false);

    host.groesse.set('sm');
    rendere();

    expect(icon.classList.contains('z-icon--sm')).toBe(true);

    host.groesse.set('md');
    rendere();

    expect(icon.classList.contains('z-icon--sm')).toBe(false);
  });
});
