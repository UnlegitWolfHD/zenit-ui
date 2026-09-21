import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZBadge, ZBadgeStatus } from './badge';

@Component({
  imports: [ZBadge],
  template: `<z-badge [status]="status()" [dot]="punkt()">Online</z-badge>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BadgeHost {
  readonly status = signal<ZBadgeStatus>('neutral');
  readonly punkt = signal(false);
}

describe('ZBadge', () => {
  function baue(): { badge: HTMLElement; host: BadgeHost; rendere: () => void } {
    const fixture = TestBed.createComponent(BadgeHost);
    fixture.detectChanges();
    return {
      badge: fixture.nativeElement.querySelector('z-badge'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('carries only the base class for the neutral status', () => {
    const { badge } = baue();

    expect(badge.className).toBe('z-badge');
  });

  it('sets one modifier class per status and never a second one', () => {
    const { badge, host, rendere } = baue();
    const stati: ZBadgeStatus[] = ['success', 'warning', 'danger', 'info'];

    for (const status of stati) {
      host.status.set(status);
      rendere();

      expect(badge.classList.contains(`z-badge--${status}`)).toBe(true);
      for (const andere of stati.filter((eine) => eine !== status)) {
        expect(badge.classList.contains(`z-badge--${andere}`)).toBe(false);
      }
    }

    host.status.set('neutral');
    rendere();

    expect(badge.className).toBe('z-badge');
  });

  it('renders no dot element by default', () => {
    const { badge } = baue();

    expect(badge.querySelector('.z-badge__dot')).toBeNull();
    expect(badge.textContent?.trim()).toBe('Online');
  });

  it('renders the dot element before the text', () => {
    const { badge, host, rendere } = baue();
    host.punkt.set(true);
    rendere();

    expect(badge.firstElementChild?.className).toBe('z-badge__dot');
    expect(badge.firstElementChild?.textContent).toBe('');
    expect(badge.textContent?.trim()).toBe('Online');
  });
});
