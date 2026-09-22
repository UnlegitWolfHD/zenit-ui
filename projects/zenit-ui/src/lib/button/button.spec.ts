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

/** A caller that listens itself, inside a form, next to a text field. */
@Component({
  imports: [ZButton],
  template: `<form (submit)="$event.preventDefault(); gesendet = gesendet + 1">
    <input aria-label="Servername" />
    <button
      zBtn
      type="submit"
      [loading]="laedt()"
      [disabled]="gesperrt()"
      (click)="geklickt = geklickt + 1"
    >
      Speichern
    </button>
  </form>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormularHost {
  readonly laedt = signal(false);
  readonly gesperrt = signal(false);
  geklickt = 0;
  gesendet = 0;
}

/** An aria-disabled the caller binds, next to the lock of the library. */
@Component({
  imports: [ZButton],
  template: `<button zBtn [attr.aria-disabled]="aria()" [loading]="laedt()">Stoppen</button>
    <a zBtn href="#start" [attr.aria-disabled]="aria()" [disabled]="laedt()">Starten</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AriaBindungHost {
  readonly aria = signal<string | null>('true');
  readonly laedt = signal(false);
}

/** A tabindex the caller wrote: static on the button, bound on the link. */
@Component({
  imports: [ZButton],
  template: `<button zBtn iconOnly tabindex="-1" aria-label="Leeren">x</button>
    <a zBtn href="#start" [attr.tabindex]="stopp()" [disabled]="gesperrt()">Starten</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabindexHost {
  readonly gesperrt = signal(false);
  readonly stopp = signal<string | null>('-1');
}

/** The property binding instead of the attribute binding. */
@Component({
  imports: [ZButton],
  template: `<a zBtn href="#start" [tabIndex]="stopp()" [disabled]="gesperrt()">Starten</a>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TabIndexPropertyHost {
  readonly gesperrt = signal(false);
  readonly stopp = signal(5);
}

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
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
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

  // spec/guidelines/15-zustaende.md, "Lädt": the button that triggered the
  // action shows the spinner, so it has to keep the focus. A native disabled
  // would drop it to body.
  describe('loading without the native disabled', () => {
    function geladen(): {
      fixture: ReturnType<typeof TestBed.createComponent<FormularHost>>;
      button: HTMLButtonElement;
    } {
      const fixture = TestBed.createComponent(FormularHost);
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      return { fixture, button: fixture.nativeElement.querySelector('button') };
    }

    it('keeps the focus on the button when loading turns on', () => {
      const { fixture, button } = geladen();
      button.focus();
      expect(document.activeElement).toBe(button);

      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();

      expect(document.activeElement).toBe(button);
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.hasAttribute('tabindex')).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('aria-busy')).toBe('true');
      fixture.nativeElement.remove();
    });

    it('swallows the click before the (click) of the caller and the form see it', () => {
      const { fixture, button } = geladen();
      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();

      const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(klick);

      expect(klick.defaultPrevented).toBe(true);
      expect(fixture.componentInstance.geklickt).toBe(0);
      expect(fixture.componentInstance.gesendet).toBe(0);
      fixture.nativeElement.remove();
    });

    it('swallows Enter and Space, and lets other keys through', () => {
      const { fixture, button } = geladen();
      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();

      for (const key of ['Enter', ' ']) {
        const taste = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        button.dispatchEvent(taste);
        expect(taste.defaultPrevented, key).toBe(true);
      }
      const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      button.dispatchEvent(tab);
      expect(tab.defaultPrevented).toBe(false);
      fixture.nativeElement.remove();
    });

    it('lets the click through again once loading is off', () => {
      const { fixture, button } = geladen();
      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();
      fixture.componentInstance.laedt.set(false);
      fixture.detectChanges();

      button.click();

      expect(button.hasAttribute('aria-disabled')).toBe(false);
      expect(button.hasAttribute('aria-busy')).toBe(false);
      expect(fixture.componentInstance.geklickt).toBe(1);
      expect(fixture.componentInstance.gesendet).toBe(1);
      fixture.nativeElement.remove();
    });

    it('keeps the native disabled for disabled alone and when both are set', () => {
      const { fixture, button } = geladen();
      fixture.componentInstance.gesperrt.set(true);
      fixture.detectChanges();

      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.hasAttribute('aria-disabled')).toBe(false);

      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();

      expect(button.hasAttribute('disabled')).toBe(true);
      expect(button.hasAttribute('aria-disabled')).toBe(false);
      expect(button.getAttribute('aria-busy')).toBe('true');
      fixture.nativeElement.remove();
    });
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

  // A host binding that writes null deletes what the author wrote. The button
  // only touches `tabindex` where it has to: on a locked link.
  describe('tabindex of the caller', () => {
    it('keeps a static tabindex on an open button', () => {
      const fixture = TestBed.createComponent(TabindexHost);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('button').getAttribute('tabindex')).toBe('-1');
    });

    it('keeps a bound tabindex on an open link and follows it', () => {
      const fixture = TestBed.createComponent(TabindexHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');

      expect(link.getAttribute('tabindex')).toBe('-1');

      fixture.componentInstance.stopp.set(null);
      fixture.detectChanges();

      expect(link.hasAttribute('tabindex')).toBe(false);
    });

    it('takes a locked link out of the tab order and gives the value back', () => {
      const fixture = TestBed.createComponent(TabindexHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');
      fixture.componentInstance.stopp.set('0');
      fixture.detectChanges();

      expect(link.getAttribute('tabindex')).toBe('0');

      fixture.componentInstance.gesperrt.set(true);
      fixture.detectChanges();

      expect(link.getAttribute('tabindex')).toBe('-1');
      expect(link.getAttribute('aria-disabled')).toBe('true');

      fixture.componentInstance.gesperrt.set(false);
      fixture.detectChanges();

      // The value the binding last wrote is back, not a deleted attribute.
      expect(link.getAttribute('tabindex')).toBe('0');
    });

    // A binding keeps writing while the lock stands: every value it writes
    // would put the locked link back into the tab order.
    it('holds the lock against a bound tabindex that changes meanwhile', async () => {
      const fixture = TestBed.createComponent(TabindexHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');
      fixture.componentInstance.stopp.set('5');
      fixture.detectChanges();
      fixture.componentInstance.gesperrt.set(true);
      fixture.detectChanges();

      expect(link.getAttribute('tabindex')).toBe('-1');

      fixture.componentInstance.stopp.set('7');
      fixture.detectChanges();
      // The MutationObserver answers in a microtask.
      await Promise.resolve();

      expect(link.getAttribute('tabindex'), 'der gesperrte Link bleibt heraußen').toBe('-1');

      fixture.componentInstance.gesperrt.set(false);
      fixture.detectChanges();

      // The value the caller last wanted, not the one from before the lock.
      expect(link.getAttribute('tabindex')).toBe('7');
    });

    it('does the same for a bound tabIndex property', async () => {
      const fixture = TestBed.createComponent(TabIndexPropertyHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');

      expect(link.getAttribute('tabindex')).toBe('5');

      fixture.componentInstance.gesperrt.set(true);
      fixture.detectChanges();
      fixture.componentInstance.stopp.set(7);
      fixture.detectChanges();
      await Promise.resolve();

      expect(link.getAttribute('tabindex')).toBe('-1');

      fixture.componentInstance.gesperrt.set(false);
      fixture.detectChanges();

      expect(link.getAttribute('tabindex')).toBe('7');
    });

    it('leaves a link without a tabindex of its own without one', () => {
      const fixture = TestBed.createComponent(LinkHost);
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('a');

      expect(link.hasAttribute('tabindex')).toBe(false);

      fixture.componentInstance.gesperrt.set(true);
      fixture.detectChanges();

      expect(link.getAttribute('tabindex')).toBe('-1');

      fixture.componentInstance.gesperrt.set(false);
      fixture.detectChanges();

      expect(link.hasAttribute('tabindex')).toBe(false);
    });
  });

  // The library borrows aria-disabled instead of binding it: a host binding
  // deleted a bound value of the caller on every change detection run.
  describe('aria-disabled of the caller', () => {
    it('keeps a static aria-disabled through loading and back', () => {
      @Component({
        imports: [ZButton],
        template: `<button zBtn aria-disabled="true" [loading]="laedt()">Stoppen</button>`,
        changeDetection: ChangeDetectionStrategy.OnPush,
      })
      class StatischHost {
        readonly laedt = signal(false);
      }
      const fixture = TestBed.createComponent(StatischHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');

      expect(button.getAttribute('aria-disabled')).toBe('true');
      fixture.componentInstance.laedt.set(true);
      fixture.detectChanges();
      expect(button.getAttribute('aria-disabled')).toBe('true');
      fixture.componentInstance.laedt.set(false);
      fixture.detectChanges();
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });

    it('keeps a bound aria-disabled and swallows the click while it says true', () => {
      const fixture = TestBed.createComponent(AriaBindungHost);
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('button');

      expect(button.getAttribute('aria-disabled')).toBe('true');
      const klick = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(klick);
      expect(klick.defaultPrevented).toBe(true);

      fixture.componentInstance.aria.set('false');
      fixture.detectChanges();
      expect(button.getAttribute('aria-disabled')).toBe('false');
      const frei = new MouseEvent('click', { bubbles: true, cancelable: true });
      button.dispatchEvent(frei);
      expect(frei.defaultPrevented).toBe(false);
    });

    for (const [was, auswahl] of [
      ['a loading button', 'button'],
      ['a locked link', 'a'],
    ] as const) {
      it(`holds "true" on ${was} while the binding changes, and gives back the latest value`, async () => {
        const fixture = TestBed.createComponent(AriaBindungHost);
        fixture.componentInstance.aria.set('false');
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector(auswahl);

        fixture.componentInstance.laedt.set(true);
        fixture.detectChanges();
        expect(element.getAttribute('aria-disabled')).toBe('true');

        // The binding writes while the library holds the attribute.
        fixture.componentInstance.aria.set('mixed');
        fixture.detectChanges();
        await Promise.resolve();
        expect(element.getAttribute('aria-disabled')).toBe('true');

        fixture.componentInstance.laedt.set(false);
        fixture.detectChanges();
        expect(element.getAttribute('aria-disabled')).toBe('mixed');
      });

      it(`removes the attribute from ${was} when the caller cleared it meanwhile`, async () => {
        const fixture = TestBed.createComponent(AriaBindungHost);
        fixture.componentInstance.aria.set('false');
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector(auswahl);

        fixture.componentInstance.laedt.set(true);
        fixture.detectChanges();
        fixture.componentInstance.aria.set(null);
        fixture.detectChanges();
        await Promise.resolve();
        expect(element.getAttribute('aria-disabled')).toBe('true');

        fixture.componentInstance.laedt.set(false);
        fixture.detectChanges();
        expect(element.hasAttribute('aria-disabled')).toBe(false);
      });
    }
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
