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
  >Wird gestartet</button>`,
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

describe('ZButton', () => {
  it('ist ohne Wert und mit leerem zBtn secondary', () => {
    const fixture = TestBed.createComponent(StandardHost);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    for (const button of buttons) {
      expect(button.classList.contains('z-btn')).toBe(true);
      expect(button.classList.contains('z-btn--secondary')).toBe(true);
      expect(button.classList.contains('z-btn--primary')).toBe(false);
    }
  });

  it('setzt fuer jede Variante die eigene Klasse', () => {
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

  it('setzt die Groessenklasse nur fuer sm und lg', () => {
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

  it('setzt block und iconOnly als Klassen', () => {
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

  it('zeigt im Ladezustand den Spinner vor dem Inhalt, sperrt und meldet aria-busy', () => {
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

  it('sperrt den Button ueber disabled', () => {
    const fixture = TestBed.createComponent(ButtonHost);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');

    expect(button.hasAttribute('disabled')).toBe(false);

    fixture.componentInstance.gesperrt.set(true);
    fixture.detectChanges();

    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-busy')).toBeNull();
  });

  it('sperrt ein a[zBtn] ueber aria-disabled und tabindex und faengt den Klick ab', () => {
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

  it('laesst ein offenes a[zBtn] normal klicken', () => {
    const fixture = TestBed.createComponent(LinkHost);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a');

    expect(link.hasAttribute('aria-disabled')).toBe(false);
    expect(link.hasAttribute('tabindex')).toBe(false);

    const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(klick);
    expect(klick.defaultPrevented).toBe(false);
  });
});
