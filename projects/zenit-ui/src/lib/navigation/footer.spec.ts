import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZFooter, ZFooterBase, ZFooterCol } from './footer';

@Component({
  imports: [ZFooter, ZFooterBase, ZFooterCol],
  template: `<z-footer>
    <z-footer-col heading="Produkt">
      <li>Minecraft</li>
      <li>Rust</li>
    </z-footer-col>
    <z-footer-col>
      <li>Status</li>
    </z-footer-col>
    <p zFooterBase>© 2026 Zenit-Hosting</p>
  </z-footer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FooterHost {}

@Component({
  imports: [ZFooter, ZFooterBase],
  template: `<z-footer><p zFooterBase>© 2026 Zenit-Hosting</p></z-footer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class NurBasisHost {}

describe('ZFooter', () => {
  it('renders a column with its heading and its list', () => {
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();
    const spalten = fixture.nativeElement.querySelectorAll('.z-footer__cols z-footer-col');

    expect(spalten.length).toBe(2);
    expect(spalten[0].querySelector('h2.z-footer__head').textContent.trim()).toBe('Produkt');
    expect(spalten[0].querySelectorAll('ul.z-footer__list > li').length).toBe(2);
  });

  it('leaves out the h2 for a column without heading', () => {
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();
    const zweite = fixture.nativeElement.querySelectorAll('z-footer-col')[1];

    expect(zweite.querySelector('h2')).toBeNull();
    expect(zweite.querySelector('ul.z-footer__list > li').textContent.trim()).toBe('Status');
  });

  it('projects [zFooterBase] into the base row', () => {
    const fixture = TestBed.createComponent(FooterHost);
    fixture.detectChanges();
    const basis = fixture.nativeElement.querySelector('.z-footer__base');

    expect(basis.querySelector('[zFooterBase]').textContent.trim()).toBe('© 2026 Zenit-Hosting');
    expect(fixture.nativeElement.querySelector('z-footer').classList).toContain('z-footer');
  });

  it('renders only the base row for a footer without columns', () => {
    const fixture = TestBed.createComponent(NurBasisHost);
    fixture.detectChanges();
    const spalten = fixture.nativeElement.querySelector('.z-footer__cols');

    expect(spalten.children.length).toBe(0);
    expect(
      fixture.nativeElement.querySelector('.z-footer__base [zFooterBase]').textContent.trim(),
    ).toBe('© 2026 Zenit-Hosting');
  });
});
