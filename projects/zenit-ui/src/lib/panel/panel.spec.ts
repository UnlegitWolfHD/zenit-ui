import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ZPanel, ZPanelActions } from './panel';

@Component({
  imports: [ZPanel],
  template: `<z-panel [title]="titel()" [flush]="flush()" [busy]="laeuft()">
    <p>Zeile</p>
  </z-panel>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PanelHost {
  readonly titel = signal('Server-Konsole');
  readonly flush = signal(false);
  readonly laeuft = signal(false);
}

@Component({
  imports: [ZPanel],
  template: `<z-panel [title]="titel()" [headingLevel]="stufe()"><p>Zeile</p></z-panel>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StufenHost {
  readonly titel = signal('Meine Server');
  readonly stufe = signal<2 | 3 | 4>(2);
}

@Component({
  imports: [ZPanel, ZPanelActions],
  template: `<z-panel>
    <button type="button" zPanelActions>Neustart</button>
    <p>Zeile</p>
  </z-panel>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AktionenHost {}

@Component({
  imports: [ZPanel],
  template: `<z-panel title="Dateien">
    <p>Zeile</p>
    <z-pagination></z-pagination>
  </z-panel>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
class PaginationHost {}

describe('ZPanel', () => {
  it('renders the title as h3.z-panel__title and no native title attribute', () => {
    const fixture = TestBed.createComponent(PanelHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('z-panel');
    const titel = panel.querySelector('.z-panel__header h3.z-panel__title');

    expect(titel.textContent.trim()).toBe('Server-Konsole');
    expect(panel.hasAttribute('title')).toBe(false);
  });

  it('renders the title in the tag headingLevel names, with the same class', () => {
    const fixture = TestBed.createComponent(StufenHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('z-panel');

    expect(panel.querySelector('.z-panel__title').tagName.toLowerCase()).toBe('h2');
    expect(panel.querySelector('h3')).toBeNull();

    fixture.componentInstance.stufe.set(4);
    fixture.detectChanges();

    const titel = panel.querySelector('.z-panel__title');
    expect(titel.tagName.toLowerCase()).toBe('h4');
    expect(titel.textContent.trim()).toBe('Meine Server');
  });

  it('shows the header without an empty h3 when there are actions but no title', () => {
    const fixture = TestBed.createComponent(AktionenHost);
    fixture.detectChanges();
    const kopf = fixture.nativeElement.querySelector('.z-panel__header');

    expect(kopf).not.toBeNull();
    expect(kopf.querySelector('h3')).toBeNull();
    expect(kopf.querySelector('button[zPanelActions]')).not.toBeNull();
  });

  it('leaves the header out entirely without title and without actions', () => {
    const fixture = TestBed.createComponent(PanelHost);
    fixture.componentInstance.titel.set('');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.z-panel__header')).toBeNull();
    expect(fixture.nativeElement.querySelector('.z-panel__body')).not.toBeNull();
  });

  it('sets the class on the body for flush', () => {
    const fixture = TestBed.createComponent(PanelHost);
    fixture.detectChanges();
    const body = fixture.nativeElement.querySelector('.z-panel__body');

    expect(body.classList.contains('z-panel__body--flush')).toBe(false);

    fixture.componentInstance.flush.set(true);
    fixture.detectChanges();

    expect(body.classList.contains('z-panel__body--flush')).toBe(true);
  });

  it('reports busy as aria-busy="true"', () => {
    const fixture = TestBed.createComponent(PanelHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('z-panel');

    expect(panel.hasAttribute('aria-busy')).toBe(false);

    fixture.componentInstance.laeuft.set(true);
    fixture.detectChanges();

    expect(panel.getAttribute('aria-busy')).toBe('true');
  });

  it('puts a projected z-pagination after the body at the end', () => {
    const fixture = TestBed.createComponent(PaginationHost);
    fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('z-panel');
    const body = panel.querySelector('.z-panel__body');

    expect(body.querySelector('z-pagination')).toBeNull();
    expect(body.querySelector('p').textContent.trim()).toBe('Zeile');
    expect(panel.lastElementChild.tagName.toLowerCase()).toBe('z-pagination');

    const stellung = body.compareDocumentPosition(panel.querySelector('z-pagination'));
    expect(stellung & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
