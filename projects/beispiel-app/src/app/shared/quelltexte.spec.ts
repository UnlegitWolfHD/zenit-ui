import { ausschnitt, DATEI, quelltext } from './quelltexte';

/**
 * The region extraction is the one piece of logic between the real sources and
 * what the page shows, so it is tested on its own, and every region the
 * application displays is checked to exist.
 */
describe('ausschnitt', () => {
  const quelle = [
    'template: `',
    '  <!-- #region filterzeile -->',
    '  <div class="app-filter">',
    '    <input zInput />',
    '  </div>',
    '  <!-- #endregion -->',
    '`,',
  ].join('\n');

  it('schneidet die Region heraus und entfernt die Marken', () => {
    expect(ausschnitt(quelle, 'filterzeile')).toBe(
      '<div class="app-filter">\n  <input zInput />\n</div>',
    );
  });

  it('kennt auch andere Kommentarzeichen', () => {
    const ts = ['const a = 1;', '// #region aktionen', 'function b() {}', '// #endregion'].join(
      '\n',
    );
    expect(ausschnitt(ts, 'aktionen')).toBe('function b() {}');
  });

  it('behält eingeschachtelte Regionen und endet an der eigenen Marke', () => {
    const verschachtelt = [
      '// #region aussen',
      'eins',
      '// #region innen',
      'zwei',
      '// #endregion',
      'drei',
      '// #endregion',
      'vier',
    ].join('\n');
    expect(ausschnitt(verschachtelt, 'aussen')).toBe('eins\nzwei\ndrei');
    expect(ausschnitt(verschachtelt, 'innen')).toBe('zwei');
  });

  it('gibt für eine unbekannte Region nichts zurück', () => {
    expect(ausschnitt(quelle, 'gibtsnicht')).toBe('');
  });
});

describe('quelltext', () => {
  /** Every pair the two pages show. A typo here fails the suite, not the page. */
  const GEZEIGT: readonly [string, string | undefined][] = [
    [DATEI.seite, 'seitenkopf'],
    [DATEI.seite, 'filterzeile'],
    [DATEI.seite, 'liste'],
    [DATEI.seite, 'aktionen'],
    [DATEI.liste, 'zustaende'],
    [DATEI.liste, 'zeile'],
    [DATEI.liste, 'seitenwahl'],
    [DATEI.shell, 'kopfzeile'],
    [DATEI.shell, 'toastauslass'],
    [DATEI.styles, 'schriften'],
    [DATEI.themeControl, undefined],
    [DATEI.appConfig, undefined],
    [DATEI.index, undefined],
    [DATEI.tsconfig, undefined],
    [DATEI.angular, undefined],
  ];

  it.each(GEZEIGT)('liefert Code für %s / %s', (datei, region) => {
    const code = quelltext(datei, region);
    expect(code.length).toBeGreaterThan(20);
    expect(code).not.toContain('#region');
    expect(code).not.toContain('#endregion');
  });

  it('zeigt den echten Quelltext, nicht eine Kopie von Hand', () => {
    // Anchors from the real files: if the generator stops running, these fail.
    expect(quelltext(DATEI.appConfig)).toContain('provideZenitTheme');
    expect(quelltext(DATEI.angular)).toContain('dist/zenit-ui/styles/themes.css');
    expect(quelltext(DATEI.seite, 'seitenkopf')).toContain('z-page-header');
  });
});
