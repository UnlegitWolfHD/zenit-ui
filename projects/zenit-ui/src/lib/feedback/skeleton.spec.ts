import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSkeleton } from './skeleton';

@Component({
  imports: [ZSkeleton],
  template: `<z-skeleton [width]="breite()" [thumb]="thumb()" [tile]="kachel()" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkeletonHost {
  readonly breite = signal('');
  readonly thumb = signal(false);
  readonly kachel = signal(false);
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

  it('renders cover, title line and price line only with tile', () => {
    const { skel, host, rendere } = baue();

    expect(skel.children.length).toBe(0);

    host.kachel.set(true);
    rendere();

    expect(skel.classList.contains('z-skel--tile')).toBe(true);
    expect(Array.from(skel.children, (kind) => kind.className)).toEqual([
      'z-skel__cover',
      'z-skel__line z-skel__line--title',
      'z-skel__line z-skel__line--price',
    ]);
    expect(skel.getAttribute('aria-hidden')).toBe('true');

    host.kachel.set(false);
    rendere();

    expect(skel.classList.contains('z-skel--tile')).toBe(false);
    expect(skel.children.length).toBe(0);
  });
});
