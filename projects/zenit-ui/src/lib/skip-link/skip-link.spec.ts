import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZSkipLink } from './skip-link';

@Component({
  imports: [ZSkipLink],
  template: `<a zSkipLink [href]="ziel()">Zum Hauptinhalt springen</a>
    @if (mitZiel()) {
      <main id="inhalt" [attr.tabindex]="fokussierbar() ? '-1' : null">Inhalt</main>
    }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SkipHost {
  readonly ziel = signal('#inhalt');
  readonly mitZiel = signal(true);
  readonly fokussierbar = signal(true);
}

describe('ZSkipLink', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function baue(): { link: HTMLAnchorElement; host: SkipHost; warnungen: string[] } {
    const warnungen: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((text: string) => {
      warnungen.push(text);
    });
    const fixture = TestBed.createComponent(SkipHost);
    fixture.detectChanges();
    return {
      link: fixture.nativeElement.querySelector('a'),
      host: fixture.componentInstance,
      warnungen,
    };
  }

  it('carries the class the stylesheet needs and adds no markup', () => {
    const { link } = baue();

    expect(link.className).toBe('z-skip-link');
    expect(link.textContent?.trim()).toBe('Zum Hauptinhalt springen');
    expect(link.children.length).toBe(0);
  });

  it('stays silent for a target that can take focus', () => {
    const { link, warnungen } = baue();

    link.dispatchEvent(new FocusEvent('focus'));

    expect(warnungen).toEqual([]);
  });

  it('warns once when the target is not in the document', () => {
    const { link, host, warnungen } = baue();
    host.mitZiel.set(false);
    TestBed.tick();

    link.dispatchEvent(new FocusEvent('focus'));
    link.dispatchEvent(new FocusEvent('focus'));

    expect(warnungen.length).toBe(1);
    expect(warnungen[0]).toContain('#inhalt');
    expect(warnungen[0]).toContain('not in the document');
  });

  it('warns when the target cannot take focus', () => {
    const { link, host, warnungen } = baue();
    host.fokussierbar.set(false);
    TestBed.tick();

    link.dispatchEvent(new FocusEvent('focus'));

    expect(warnungen.length).toBe(1);
    expect(warnungen[0]).toContain('tabindex="-1"');
  });

  it('warns instead of throwing on a fragment that cannot be decoded', () => {
    const { link, host, warnungen } = baue();
    host.ziel.set('#%');
    TestBed.tick();

    expect(() => link.dispatchEvent(new FocusEvent('focus'))).not.toThrow();
    expect(warnungen.length).toBe(1);
    expect(warnungen[0]).toContain('not in the document');
  });

  it('warns when the href carries no fragment at all', () => {
    const { link, host, warnungen } = baue();
    host.ziel.set('/inhalt');
    TestBed.tick();

    link.dispatchEvent(new FocusEvent('focus'));

    expect(warnungen.length).toBe(1);
    expect(warnungen[0]).toContain('without a target fragment');
  });
});
