import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSkeleton } from './skeleton';

@Component({
  imports: [ZSkeleton],
  template: `<z-skeleton [width]="breite()" [thumb]="thumb()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkeletonHost {
  readonly breite = signal('');
  readonly thumb = signal(false);
}

describe('ZSkeleton', () => {
  function baue(): { skel: HTMLElement; host: SkeletonHost; rendere: () => void } {
    const fixture = TestBed.createComponent(SkeletonHost);
    fixture.detectChanges();
    return {
      skel: fixture.nativeElement.querySelector('z-skeleton'),
      host: fixture.componentInstance,
      rendere: () => fixture.detectChanges(),
    };
  }

  it('carries the class z-skel and no width without one', () => {
    const { skel } = baue();

    expect(skel.className).toBe('z-skel');
    expect(skel.style.width).toBe('');
  });

  it('is hidden from assistive technology', () => {
    const { skel } = baue();

    expect(skel.getAttribute('aria-hidden')).toBe('true');
  });

  it('writes width as an inline style', () => {
    const { skel, host, rendere } = baue();
    host.breite.set('40%');
    rendere();

    expect(skel.style.width).toBe('40%');

    host.breite.set('64px');
    rendere();

    expect(skel.style.width).toBe('64px');
  });

  it('adds the thumb class only with thumb', () => {
    const { skel, host, rendere } = baue();

    expect(skel.classList.contains('z-skel--thumb')).toBe(false);

    host.thumb.set(true);
    rendere();

    expect(skel.classList.contains('z-skel--thumb')).toBe(true);
  });
});
