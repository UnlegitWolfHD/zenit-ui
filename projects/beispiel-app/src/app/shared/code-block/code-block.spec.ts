import { Clipboard } from '@angular/cdk/clipboard';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZToast } from 'zenit-ui';
import { CodeBlock } from './code-block';

/** Clipboard of the CDK, switchable between working and blocked. */
class ZwischenablageDouble {
  erfolg = true;
  kopiert = '';

  copy(text: string): boolean {
    this.kopiert = text;
    return this.erfolg;
  }
}

describe('CodeBlock', () => {
  let fixture: ComponentFixture<CodeBlock>;
  let ablage: ZwischenablageDouble;
  let toast: ZToast;

  beforeEach(async () => {
    ablage = new ZwischenablageDouble();
    await TestBed.configureTestingModule({
      imports: [CodeBlock],
      providers: [{ provide: Clipboard, useValue: ablage }],
    }).compileComponents();

    toast = TestBed.inject(ZToast);
    fixture = TestBed.createComponent(CodeBlock);
    fixture.componentRef.setInput('code', 'const a = 1;');
    fixture.componentRef.setInput('datei', 'app.config.ts');
    fixture.componentRef.setInput('sprache', 'TypeScript');
    await fixture.whenStable();
  });

  afterEach(() => toast.dismiss());

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('zeigt Code, Dateinamen und Sprache', () => {
    expect(element().querySelector('pre code')?.textContent).toBe('const a = 1;');
    expect(element().querySelector('.app-code__datei')?.textContent).toContain('app.config.ts');
    expect(element().textContent).toContain('TypeScript');
  });

  it('macht die Scrollfläche zur benannten Region mit Tastaturzugang', () => {
    const flaeche = element().querySelector('.app-code__flaeche');
    expect(flaeche?.getAttribute('role')).toBe('region');
    expect(flaeche?.getAttribute('tabindex')).toBe('0');
    expect(flaeche?.getAttribute('aria-label')).toContain('app.config.ts');
  });

  it('kopiert und meldet den Erfolg als Toast', async () => {
    element().querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();

    expect(ablage.kopiert).toBe('const a = 1;');
    expect(toast.toasts()[0].text).toBe('Code kopiert');
    expect(toast.toasts()[0].status).toBe('success');
  });

  it('nennt bei gesperrter Zwischenablage Ursache und nächsten Schritt', async () => {
    ablage.erfolg = false;

    element().querySelector<HTMLButtonElement>('button')?.click();
    await fixture.whenStable();

    const meldung = toast.toasts()[0];
    expect(meldung.status).toBe('danger');
    expect(meldung.text).toContain('Zwischenablage gesperrt');
    expect(meldung.text).toContain('Strg+C');
  });
});
