import { Clipboard } from '@angular/cdk/clipboard';
import { Component, inject, input } from '@angular/core';
import { ZButton, ZIcon, ZToast } from 'zenit-ui';

/**
 * One block of source code with its file name and a copy button.
 *
 * No highlighting library: colour would have to come from tokens anyway, and a
 * dependency for it is not worth it. The block is plain text in the mono face
 * on `bg`, framed like a panel.
 *
 * The scroll container is the only thing on the page that may scroll sideways,
 * so a long line never widens the page (CLAUDE.md: no horizontal scrolling at
 * 360px). It is a labelled region with `tabindex="0"`, because a scrollable
 * area has to be reachable by keyboard.
 */
@Component({
  selector: 'app-code-block',
  imports: [ZButton, ZIcon],
  template: `
    <figure class="app-code">
      <figcaption class="app-code__kopf">
        <span class="app-code__datei mono-sm">{{ datei() }}</span>
        <span class="z-cluster">
          @if (sprache()) {
            <span class="caption z-subtle">{{ sprache() }}</span>
          }
          <button
            zBtn="ghost"
            size="sm"
            iconOnly
            type="button"
            [attr.aria-label]="datei() + ' kopieren'"
            (click)="kopieren()"
          >
            <z-icon name="content_copy" size="sm" />
          </button>
        </span>
      </figcaption>
      <div
        class="app-code__flaeche"
        tabindex="0"
        role="region"
        [attr.aria-label]="datei() + ', Code, seitlich scrollbar'"
      >
        <!-- The class sits on <code> as well: the browser default for that
             element is its own monospace family, which would be a fourth text
             font on the page. -->
        <pre class="app-code__text mono-sm"><code class="mono-sm">{{ code() }}</code></pre>
      </div>
    </figure>
  `,
})
export class CodeBlock {
  private readonly clipboard = inject(Clipboard);
  private readonly toast = inject(ZToast);

  /** The code itself, always the real source (see `shared/quelltexte.ts`). */
  readonly code = input.required<string>();

  /** File name or path, shown in mono as the caption. */
  readonly datei = input.required<string>();

  /** Optional language, for example `TypeScript`. Empty leaves the label out. */
  readonly sprache = input('');

  /**
   * Copies the block. `Clipboard` from the CDK falls back to a hidden textarea
   * and reports whether that worked; a locked clipboard therefore ends in an
   * error toast that names the cause and the next step, not in silence.
   */
  protected kopieren(): void {
    if (this.clipboard.copy(this.code())) {
      this.toast.success('Code kopiert');
      return;
    }
    this.toast.error(
      'Der Code ließ sich nicht kopieren. Der Browser hat die Zwischenablage gesperrt, markiere den Code und kopiere ihn mit Strg+C',
    );
  }
}
