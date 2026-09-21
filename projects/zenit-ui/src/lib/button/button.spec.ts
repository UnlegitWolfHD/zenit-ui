import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZButton, ZButtonVariant } from './button';

@Component({
  imports: [ZButton],
  template: `<button zBtn>Neustart</button><button zBtn="">Stoppen</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StandardHost {}

@Component({
  imports: [ZButton],
  template: `<button
    [zBtn]="variante()"
    [size]="groesse()"
    [block]="block()"
    [iconOnly]="nurIcon()"
    [loading]="laedt()"
    [disabled]="gesperrt()"
  >
    Wird gestartet
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ButtonHost {
  readonly variante = signal<ZButtonVariant>('secondary');
  readonly groesse = signal<'sm' | 'md' | 'lg'>('md');
  readonly block = signal(false);
  readonly nurIcon = signal(false);
  readonly laedt = signal(false);
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZButton],
  template: `<a zBtn href="#start" [disabled]="gesperrt()">Starten</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class LinkHost {
  readonly gesperrt = signal(false);
}

@Component({
  imports: [ZButton],
  template: `<button zBtn aria-disabled="true">Stoppen</button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AriaHost {}

describe('ZButton', () => {
  it('is secondary without a value and with an empty zBtn', () => {
    const fixture = TestBed.createComponent(StandardHost);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    for (const button of buttons) {
      expect(button.classList.contains('z-btn')).toBe(true);
      expect(button.classList.contains('z-btn--secondary')).toBe(true);
      expect(button.classList.contains('z-btn--primary')).toBe(false);
    }
  });

  it('sets its own class for every variant', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    const varianten: ZButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
    for (const variante of varianten) {
      fixture.componentInstance.variante.set(variante);
      fixture.detectChanges();

      expect(button.classList.contains(`z-btn--${variante}`)).toBe(true);
      const andere = varianten.filter((eine) => eine !== variante);
      for (const eine of andere) {
        expect(button.classList.contains(`z-btn--${eine}`)).toBe(false);
      }
    }
  });

  it('sets the size class only for sm and lg', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.classList.contains('z-btn--sm')).toBe(false);
    expect(button.classList.contains('z-btn--lg')).toBe(false);

    fixture.componentInstance.groesse.set('sm');
    fixture.detectChanges();
    expect(button.classList.contains('z-btn--sm')).toBe(true);

    fixture.componentInstance.groesse.set('lg');
    fixture.detectChanges();
    expect(button.classList.contains('z-btn--sm')).toBe(false);
    expect(button.classList.contains('z-btn--lg')).toBe(true);
  });

  it('sets block and iconOnly as classes', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.classList.contains('z-btn--block')).toBe(false);
    expect(button.classList.contains('z-btn--icon')).toBe(false);

    fixture.componentInstance.block.set(true);
    fixture.componentInstance.nurIcon.set(true);
    fixture.detectChanges();

    expect(button.classList.contains('z-btn--block')).toBe(true);
    expect(button.classList.contains('z-btn--icon')).toBe(true);
  });

  it('shows the spinner in front of the content while loading, locks and reports aria-busy', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.querySelector('z-spinner')).toBeNull();
    expect(button.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.laedt.set(true);
    fixture.detectChanges();

    expect(button.querySelector('z-spinner')).not.toBeNull();
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');

    const knoten = Array.from(button.childNodes) as Node[];
    const spinner = knoten.findIndex((eins) => eins.nodeName.toLowerCase() === 'z-spinner');
    const text = knoten.findIndex((eins) => eins.textContent?.includes('Wird gestartet'));
    expect(spinner).toBeGreaterThanOrEqual(0);
    expect(spinner).toBeLessThan(text);
  });

  it('locks the button through disabled', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.hasAttribute('disabled')).toBe(false);

    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();

    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('locks an a[zBtn] through aria-disabled and tabindex and swallows the click', () => {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a');

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.hasAttribute('disabled')).toBe(false);

    const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(klick);
    expect(klick.defaultPrevented).toBe(true);
  });

  it('lets an open a[zBtn] be clicked normally', () => {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a');

    expect(link.hasAttribute('aria-disabled')).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);

    const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(klick);
    expect(klick.defaultPrevented).toBe(false);
  });

  it('keeps a static aria-disabled on the button and leaves it focusable', () => {
    const fixture = TestBed.createComponent(AriaHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-disabled')).toBe('true');
    // No real disabled and no tabindex: the button stays reachable so its
    // tooltip can show the reason.
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.hasAttribute('tabindex')).toBe(false);
  });

  it('swallows the click on a button with aria-disabled', () => {
    const fixture = TestBed.createComponent(AriaHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    let gesehen = 0;
    button.addEventListener('click', () => gesehen++);

    const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
    button.dispatchEvent(klick);

    expect(klick.defaultPrevented).toBe(true);
    expect(gesehen).toBe(0);
  });
});
