/**
 * The template half of `migrate-material`: parses one Angular template with
 * `@angular/compiler`, plans every conversion as a group of edits against the
 * original text and reports what it left alone.
 *
 * Nothing here writes a file. `migrateTemplate()` returns edits by source span,
 * so the caller applies them in one pass, to an `.html` file or to the inside of
 * an inline template.
 */
import {
  Interpolation,
  TmplAstBoundAttribute,
  TmplAstBoundEvent,
  TmplAstBoundText,
  TmplAstElement,
  TmplAstIfBlockBranch,
  TmplAstNode,
  TmplAstRecursiveVisitor,
  TmplAstReference,
  TmplAstTemplate,
  TmplAstText,
  TmplAstTextAttribute,
  parseTemplate,
  tmplAstVisitAll,
} from '@angular/compiler';
import { Edit } from '../ng-add/html';
import { BUTTON_VARIANTS, MATERIAL_NAME, RuleName, TOOLTIP_OPTIONS, ZENIT_SYMBOLS } from './tables';

export type TemplateRule = Exclude<RuleName, 'imports'>;

/**
 * `manual`: the spot was not converted and needs a human. `review`: converted,
 * but something changed that a human should look at. `info`: converted, and
 * what was dropped has no effect in zenit-ui.
 */
export type FindingKind = 'manual' | 'review' | 'info';

export interface Finding {
  /** Offset into the text the finding was computed against. */
  offset: number;
  rule: string;
  kind: FindingKind;
  /** Stable identifier of the case, for filtering the JSON report. */
  code: string;
  reason: string;
  fix: string;
}

export interface TemplateOptions {
  rules: ReadonlySet<RuleName>;
  /** Quote for new attributes. An inline template in a "..." string takes `'`. */
  quote?: '"' | "'";
  /** The template sits in a plain TypeScript string, so only `quote` may be written. */
  plainString?: boolean;
}

export interface TemplateResult {
  edits: Edit[];
  findings: Finding[];
  /** Converted spots per rule. */
  converted: Record<TemplateRule, number>;
  /** Material tag and attribute names still in the template after the edits. */
  remaining: Record<string, number>;
  /** zenit-ui symbols the template needs after the edits, sorted. */
  zenit: string[];
  /** Set when the template could not be parsed; then there are no edits. */
  error?: string;
}

/** One attribute of an element, whatever list of the AST it came from. */
interface Attr {
  /** The name as written, without binding syntax: `matTooltip`, `attr.aria-label`, `class.x`. */
  key: string;
  kind: 'text' | 'input' | 'output' | 'ref';
  /** Source of the value, undecoded. `undefined` for an attribute without one. */
  value: string | undefined;
  start: number;
  end: number;
  keyStart: number;
  keyEnd: number;
  /** A `{{ }}` interpolation in the value. */
  interpolated: boolean;
}

/**
 * All edits of one converted spot. A group is applied completely or not at all,
 * so an element is never left half converted.
 */
export class Group {
  readonly edits: Edit[] = [];
  readonly findings: Finding[] = [];
  /** Material names this conversion removes from the element. */
  readonly consumed: string[] = [];
  unsafe = '';
  primary = false;
  /** `false` for an edit that belongs to other spots, like the wrapper of chips. */
  counted = true;

  constructor(
    readonly rule: TemplateRule,
    readonly offset: number,
    private readonly source: string,
  ) {}

  /** `expect` is what the span must hold in the original text, otherwise the group is unsafe. */
  replace(start: number, end: number, text: string, expect?: string): void {
    if (expect !== undefined && this.source.slice(start, end) !== expect) {
      this.unsafe = `expected "${expect}" at offset ${start}`;
    }
    this.edits.push({ start, end, text });
  }

  /** Removes an attribute together with the whitespace in front of it. */
  drop(attr: Attr): void {
    let start = attr.start;
    while (start > 0 && /\s/.test(this.source[start - 1])) {
      start -= 1;
    }
    this.replace(start, attr.end, '');
    this.consumed.push(attr.key);
  }

  note(kind: FindingKind, code: string, reason: string, fix: string, offset = this.offset): void {
    this.findings.push({ offset, rule: this.rule, kind, code, reason, fix });
  }
}

/**
 * Keeps the groups whose edits are in bounds, match the text they expect and do
 * not overlap an edit that was accepted before. A rejected group becomes a
 * `manual` finding, the others are still applied.
 */
export function acceptGroups(
  groups: Group[],
  length: number,
): { accepted: Group[]; rejected: Finding[] } {
  const accepted: Group[] = [];
  const rejected: Finding[] = [];
  const taken: Edit[] = [];

  for (const group of groups) {
    const broken =
      group.unsafe ||
      (group.edits.some(({ start, end }) => start < 0 || end < start || end > length) &&
        'an edit lies outside the text') ||
      (group.edits.some((edit) => taken.some((other) => overlaps(edit, other))) &&
        'an edit overlaps another conversion');
    if (broken) {
      rejected.push({
        offset: group.offset,
        rule: group.rule,
        kind: 'manual',
        code: 'unsafe-edit',
        reason: `The conversion could not be applied safely (${broken}) and was skipped.`,
        fix: 'Convert this element by hand.',
      });
      continue;
    }
    taken.push(...group.edits);
    accepted.push(group);
  }

  return { accepted, rejected };
}

/** Two insertions at the same offset do not overlap, nor does an insertion at the edge of a span. */
function overlaps(a: Edit, b: Edit): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Sorted so that an insertion comes before a replacement that starts at the same offset. */
export function sortEdits(edits: Edit[]): Edit[] {
  return [...edits].sort((a, b) => a.start - b.start || a.end - b.end);
}

const LIGATURE = /^[a-z0-9_]+$/;
const COLOUR_FIX =
  'Colour comes from the context in zenit-ui (text-muted; coloured only in the active sidebar ' +
  'entry and in an alert). Remove the emphasis or express it with a z-badge/z-alert status.';
const FIELD_SLOTS = /^mat(Icon|Text)?(Prefix|Suffix)$/;
const LABELS = ['aria-label', 'attr.aria-label', 'aria-labelledby', 'attr.aria-labelledby'];

export function migrateTemplate(source: string, options: TemplateOptions): TemplateResult {
  const result: TemplateResult = {
    edits: [],
    findings: [],
    converted: { icon: 0, button: 0, tooltip: 0, spinner: 0, chip: 0 },
    remaining: {},
    zenit: [],
  };

  let nodes: TmplAstNode[];
  try {
    // The parser has no switch that skips i18n; these keep it from touching text or spans.
    const parsed = parseTemplate(source, 'template.html', {
      preserveWhitespaces: true,
      preserveLineEndings: true,
      leadingTriviaChars: [],
      enableI18nLegacyMessageIdFormat: false,
      i18nNormalizeLineEndingsInICUs: false,
    });
    if (parsed.errors?.length) {
      const first = parsed.errors[0];
      result.error = `${first.msg.split('\n')[0]} (line ${first.span.start.line + 1})`;

      return result;
    }
    nodes = parsed.nodes;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);

    return result;
  }

  const planner = new Planner(source, options);
  tmplAstVisitAll(planner, nodes);
  const { accepted, rejected } = acceptGroups(planner.groups, source.length);

  const consumed = new Set<string>();
  const zenit = new Set<string>();
  const needs: Record<TemplateRule, string> = {
    icon: 'ZIcon',
    button: 'ZButton',
    tooltip: 'ZTooltip',
    spinner: 'ZSpinner',
    chip: 'ZBadge',
  };
  for (const group of accepted) {
    result.edits.push(...group.edits);
    result.findings.push(...group.findings);
    result.converted[group.rule] += group.counted ? 1 : 0;
    zenit.add(needs[group.rule]);
    group.consumed.forEach((name) => consumed.add(`${group.offset}:${name}`));
  }
  result.findings.push(...planner.findings, ...rejected);

  // "At most one primary button per screen height" is an acceptance rule of the design system.
  const primaries = [
    ...accepted.filter((group) => group.primary).map((group) => group.offset),
    ...planner.primaries,
  ].sort((a, b) => a - b);
  if (primaries.length > 1 && accepted.some((group) => group.primary)) {
    result.findings.push({
      offset: primaries[1],
      rule: 'button',
      kind: 'review',
      code: 'several-primaries',
      reason:
        `This template now has ${primaries.length} buttons with zBtn="primary". The design ` +
        'system allows at most one primary per screen height.',
      fix: 'Keep the one action the screen exists for as primary and make the others zBtn (secondary) or zBtn="ghost".',
    });
  }

  const usage = new Usage(consumed, source);
  tmplAstVisitAll(usage, nodes);
  result.remaining = usage.material;
  usage.zenit.forEach((symbol) => zenit.add(symbol));
  result.zenit = [...zenit].sort();
  result.edits = sortEdits(result.edits);
  result.findings.sort((a, b) => a.offset - b.offset || a.code.localeCompare(b.code));

  return result;
}

/** Plans the conversions. Reads the AST only, the edits refer to the original text. */
class Planner extends TmplAstRecursiveVisitor {
  readonly groups: Group[] = [];
  readonly findings: Finding[] = [];
  /** Offsets of buttons that already carry a static `zBtn="primary"`. */
  readonly primaries: number[] = [];

  private readonly elements: TmplAstElement[] = [];
  /** `*ngIf` and `@if` conditions around the current node; `null` marks an element. */
  private readonly conditions: (string | null)[] = [];
  private readonly rules: ReadonlySet<RuleName>;
  private readonly quote: string;
  private readonly plainString: boolean;
  /** Memo of the wrappers whose chips all become badges. */
  private readonly wrappers = new Map<TmplAstElement, boolean>();

  constructor(
    private readonly source: string,
    options: TemplateOptions,
  ) {
    super();
    this.rules = options.rules;
    this.quote = options.quote ?? '"';
    this.plainString = options.plainString ?? false;
  }

  override visitElement(element: TmplAstElement): void {
    const attrs = this.attrsOf(element);
    if (this.rules.has('tooltip')) {
      this.tooltip(element, attrs);
    }
    if (this.rules.has('icon') && element.name === 'mat-icon') {
      this.icon(element, attrs);
    }
    if (this.rules.has('button') && (element.name === 'button' || element.name === 'a')) {
      this.button(element, attrs);
    }
    if (
      this.rules.has('spinner') &&
      (element.name === 'mat-spinner' || element.name === 'mat-progress-spinner')
    ) {
      this.spinner(element, attrs);
    }
    if (this.rules.has('chip')) {
      if (element.name === 'mat-chip') {
        this.chip(element, attrs);
      } else if (element.name === 'mat-chip-set' || element.name === 'mat-chip-listbox') {
        this.chipWrapper(element, attrs);
      }
    }
    if (attrs.some((attr) => attr.key === 'zBtn' && attr.value === 'primary')) {
      this.primaries.push(offsetOf(element));
    }

    this.elements.push(element);
    this.conditions.push(null);
    super.visitElement(element);
    this.conditions.pop();
    this.elements.pop();
  }

  override visitTemplate(template: TmplAstTemplate): void {
    const condition = template.templateAttrs.find((attr) => attr.name === 'ngIf');
    this.conditions.push(
      condition?.valueSpan
        ? this.source.slice(condition.valueSpan.start.offset, condition.valueSpan.end.offset)
        : null,
    );
    super.visitTemplate(template);
    this.conditions.pop();
  }

  override visitIfBlockBranch(branch: TmplAstIfBlockBranch): void {
    const expression = branch.expression as { source?: string | null } | null;
    this.conditions.push(expression?.source?.trim() || null);
    super.visitIfBlockBranch(branch);
    this.conditions.pop();
  }

  // ------------------------------------------------------------------------
  // icon
  // ------------------------------------------------------------------------

  private icon(element: TmplAstElement, attrs: Attr[]): void {
    const group = this.groupFor('icon', element);
    const blockers: [code: string, reason: string, fix: string][] = [];
    let fontIcon: Attr | undefined;

    for (const attr of attrs) {
      const { key } = attr;
      if (key.startsWith('matTooltip')) {
        continue; // the tooltip rule owns these
      }
      if (key === 'color') {
        this.dropColour(group, attr, 'icon');
      } else if (key === 'inline') {
        group.drop(attr);
        group.note(
          'review',
          'icon-inline',
          'The "inline" attribute was dropped: the icon took its size from the surrounding text, z-icon is 20px.',
          'Use size="sm" (16px) where the icon sits in small text, otherwise keep the default.',
        );
      } else if (key === 'aria-hidden' || key === 'attr.aria-hidden') {
        if (/^'?true'?$/.test(attr.value?.trim() ?? '') && !attr.interpolated) {
          group.drop(attr);
          group.note(
            'info',
            'icon-aria-hidden',
            'aria-hidden was dropped, z-icon sets it itself.',
            'Nothing to do.',
          );
        } else {
          blockers.push([
            'icon-exposed',
            `The icon is exposed to assistive technology (${this.text(attr)}), z-icon is always aria-hidden.`,
            'Give the surrounding control an aria-label or put the meaning into visible text, then use <z-icon name="…" />.',
          ]);
        }
      } else if (LABELS.includes(key) || key === 'role' || key === 'attr.role') {
        blockers.push([
          'icon-labelled',
          `The icon carries ${this.text(attr)}, z-icon is decorative by design and always aria-hidden.`,
          'Move the text to an aria-label of the surrounding control or to visible text, then use <z-icon name="…" />.',
        ]);
      } else if (key === 'svgIcon' || key === 'fontSet') {
        blockers.push([
          'icon-registry',
          `${this.text(attr)}: z-icon only renders Material Icons ligatures.`,
          'Find a ligature with the same meaning, or keep the SVG as an inline <svg aria-hidden="true">.',
        ]);
      } else if (key === 'fontIcon' && this.translated(element, key)) {
        blockers.push(this.translatedBlocker(key));
      } else if (key === 'fontIcon') {
        fontIcon = attr;
      } else if (FIELD_SLOTS.test(key)) {
        blockers.push([
          'icon-in-field',
          `The icon is projected into a mat-form-field through ${key}.`,
          'Migrate the field to z-field and use the icon of z-input-group.',
        ]);
      } else if (MATERIAL_NAME.test(key) || key === 'iconPositionEnd') {
        blockers.push([
          'icon-slot',
          `${key} places the icon in a slot of its Material parent.`,
          'Migrate the parent first, then use <z-icon name="…" /> where the new component takes an icon.',
        ]);
      } else if (attr.kind === 'ref' && attr.value) {
        blockers.push([
          'icon-reference',
          `${this.text(attr)} reads the MatIcon instance.`,
          'Remove the template reference and what uses it, then use <z-icon name="…" />.',
        ]);
      } else if (key === 'style' || key.startsWith('style.') || key === 'ngStyle') {
        group.note(
          'review',
          'icon-style',
          `The inline style was kept (${this.text(attr)}). Sizes and colours of an icon come from the tokens.`,
          'Remove it; use size="sm" for the 16px icon.',
        );
      } else if (key === 'class' && /\bmaterial-(icons|symbols)-/.test(attr.value ?? '')) {
        group.note(
          'review',
          'icon-font-class',
          `${this.text(attr)} selects another icon font. It was kept, next to the "material-icons" class z-icon sets itself.`,
          'zenit-ui ships the filled Material Icons only: remove the class, or load that font and check which one wins.',
        );
      } else if (attr.kind === 'output' && key === 'click') {
        group.note(
          'review',
          'icon-clickable',
          'A clickable icon has no role, no focus and no keyboard handling.',
          'Wrap it: <button zBtn="ghost" iconOnly type="button" aria-label="…" (click)="…"><z-icon name="…" /></button>.',
        );
      }
    }

    const content = this.iconContent(element);
    let nameAttr = '';
    if (typeof content === 'object') {
      blockers.push(content.blocker);
    } else if (content && fontIcon) {
      blockers.push([
        'icon-content',
        'The icon has both fontIcon and content.',
        'Decide which one names the ligature and write <z-icon name="…" /> by hand.',
      ]);
    } else if (content) {
      nameAttr = content;
    } else if (!fontIcon && blockers.length === 0) {
      // (with svgIcon or fontSet the missing name is expected and already reported)
      blockers.push([
        'icon-content',
        'The icon has no ligature name.',
        'Write <z-icon name="…" /> by hand or remove the element.',
      ]);
    }

    if (blockers.length > 0) {
      for (const [code, reason, fix] of blockers) {
        this.manual('icon', element, code, reason, fix);
      }

      return;
    }

    const parent = this.elements.at(-1);
    if (parent && this.attrsOf(parent).some((attr) => attr.key === 'mat-menu-item')) {
      group.note(
        'review',
        'icon-in-menu-item',
        'The icon sits in a mat-menu-item, which projects <mat-icon> into its own slot.',
        'When the menu is migrated the icon becomes the "icon" input of button[zMenuItem].',
      );
    }

    if (fontIcon) {
      group.replace(fontIcon.keyStart, fontIcon.keyEnd, 'name', 'fontIcon');
      group.consumed.push('fontIcon');
    } else {
      const at = offsetOf(element) + '<mat-icon'.length;
      group.replace(at, at, nameAttr);
    }
    this.renameVoid(group, element, 'z-icon');
    this.groups.push(group);
  }

  /** The ` name="…"` attribute for the content, `''` for no content, or the reason it cannot be converted. */
  private iconContent(element: TmplAstElement): string | { blocker: [string, string, string] } {
    const inner = this.inner(element).trim();
    const children = element.children;
    if (children.length === 0 && inner === '') {
      return '';
    }

    const only = children.length === 1 ? children[0] : undefined;
    if (only instanceof TmplAstText && only.value.trim() === inner && LIGATURE.test(inner)) {
      return ` name=${this.quote}${inner}${this.quote}`;
    }

    const bound = only instanceof TmplAstBoundText ? only.value : undefined;
    const ast = bound && 'ast' in bound ? (bound as { ast: unknown }).ast : undefined;
    const match = /^\{\{([\s\S]+)\}\}$/.exec(inner);
    if (
      ast instanceof Interpolation &&
      ast.expressions.length === 1 &&
      ast.strings.every((part) => part.trim() === '') &&
      match
    ) {
      const quote = this.quoteFor(match[1]);
      if (quote) {
        return ` [name]=${quote}${match[1].trim()}${quote}`;
      }
    }

    return {
      blocker: [
        'icon-content',
        `The content is not a single ligature name or a single interpolation: ${short(inner)}`,
        'Write <z-icon name="…" /> or <z-icon [name]="…" /> by hand; text next to the icon belongs outside of it.',
      ],
    };
  }

  // ------------------------------------------------------------------------
  // button
  // ------------------------------------------------------------------------

  private button(element: TmplAstElement, attrs: Attr[]): void {
    const variants = attrs.filter((attr) => Object.hasOwn(BUTTON_VARIANTS, attr.key));
    if (variants.length === 0) {
      return;
    }

    const [attr] = variants;
    const target = BUTTON_VARIANTS[attr.key];
    const reason =
      variants.length > 1
        ? `The element carries several Material button attributes (${variants.map((v) => v.key).join(', ')}).`
        : attr.kind !== 'text'
          ? `${this.text(attr)} is a binding.`
          : attrs.some((other) => other.key === 'zBtn')
            ? 'The element already carries zBtn.'
            : /fab/i.test(attr.key)
              ? `${attr.key}: a floating action button has no counterpart in zenit-ui.`
              : !target
                ? `${attr.key} is the attribute API of Angular Material 20, its appearance value is not mapped.`
                : '';
    if (reason || !target) {
      this.manual(
        'button',
        element,
        /fab/i.test(attr.key) ? 'button-fab' : 'button-unmapped',
        reason,
        /fab/i.test(attr.key)
          ? 'Place the action in the page flow as button[zBtn], usually in the PageHeader or the panel actions.'
          : 'Write zBtn="primary", zBtn (secondary), zBtn="ghost" or zBtn="danger" by hand.',
      );

      return;
    }

    const group = this.groupFor('button', element);
    const q = this.quote;
    group.replace(
      attr.start,
      attr.end,
      (target.variant ? `zBtn=${q}${target.variant}${q}` : 'zBtn') +
        (target.iconOnly ? ' iconOnly' : ''),
    );
    group.consumed.push(attr.key);
    group.primary = target.variant === 'primary';

    for (const other of attrs) {
      if (other.key === 'color') {
        this.dropColour(group, other, 'button');
      } else if (other.key === 'disableRipple') {
        group.drop(other);
        group.note(
          'info',
          'button-ripple',
          'disableRipple was dropped, zBtn has no ripple.',
          'Nothing to do.',
        );
      } else if (other.key === 'disabledInteractive') {
        group.drop(other);
        group.note(
          'review',
          'button-disabled-interactive',
          `${this.text(other)} was dropped: zBtn has no such input.`,
          'A disabled button that must stay focusable (for a tooltip) takes a static aria-disabled="true" instead of disabled.',
        );
      }
    }

    if (
      element.name === 'button' &&
      !attrs.some((a) => a.key === 'type' || a.key === 'attr.type')
    ) {
      group.note(
        'review',
        'button-type',
        'The button has no type attribute, so inside a <form> it submits. It was not added, because that would change what the button does.',
        'Add type="button", or type="submit" where the button is meant to submit.',
      );
    }
    if (target.iconOnly && !attrs.some((a) => LABELS.includes(a.key))) {
      const tooltip = attrs.find((a) => a.key === 'matTooltip');
      group.note(
        'review',
        'button-no-name',
        'The icon-only button has no accessible name: z-icon is aria-hidden and a tooltip is a description, not a label.',
        tooltip?.value
          ? `Add an aria-label, usually the tooltip text: ${tooltip.kind === 'text' ? `aria-label="${tooltip.value}"` : `[attr.aria-label]="${tooltip.value}"`}.`
          : 'Add aria-label="…" that names the action.',
      );
    }

    this.groups.push(group);
  }

  // ------------------------------------------------------------------------
  // tooltip
  // ------------------------------------------------------------------------

  private tooltip(element: TmplAstElement, attrs: Attr[]): void {
    const tip = attrs.find((attr) => attr.key === 'matTooltip');
    if (!tip) {
      return;
    }

    const exported = attrs.find((attr) => attr.kind === 'ref' && attr.value === 'matTooltip');
    const reason = attrs.some((attr) => attr.key === 'zTooltip')
      ? 'The element already carries zTooltip.'
      : this.translated(element, 'matTooltip')
        ? 'The tooltip is translated through i18n-matTooltip, which the template AST does not expose.'
        : exported
          ? `${this.text(exported)} reads the MatTooltip instance (show(), hide(), toggle()).`
          : tip.kind !== 'text' && tip.kind !== 'input'
            ? `${this.text(tip)} is not a plain attribute or property binding.`
            : '';
    if (reason) {
      this.manual(
        'tooltip',
        element,
        'tooltip-unmapped',
        reason,
        'Rename matTooltip to zTooltip by hand (and i18n-matTooltip to i18n-zTooltip). zTooltip opens on hover and focus only, it has no programmatic API.',
      );

      return;
    }

    const group = this.groupFor('tooltip', element);
    const disabled = attrs.find((attr) => attr.key === 'matTooltipDisabled');
    if (disabled) {
      const merged = this.mergeDisabled(tip, disabled);
      if (!merged) {
        this.manual(
          'tooltip',
          element,
          'tooltip-disabled',
          `${this.text(disabled)} could not be merged into the tooltip text mechanically.`,
          'zTooltip shows nothing for an empty text: write [zTooltip]="condition ? \'\' : text" by hand and remove matTooltipDisabled.',
        );

        return;
      }
      group.replace(tip.start, tip.end, merged);
      group.drop(disabled);
      group.note(
        'review',
        'tooltip-disabled-merged',
        `${this.text(disabled)} was merged into the text: an empty zTooltip shows nothing.`,
        'Check the expression.',
      );
    } else {
      group.replace(tip.keyStart, tip.keyEnd, 'zTooltip', 'matTooltip');
    }
    group.consumed.push('matTooltip');

    for (const option of attrs.filter((attr) => TOOLTIP_OPTIONS.includes(attr.key))) {
      group.drop(option);
      group.note(
        'info',
        'tooltip-option',
        `${this.text(option)} was dropped: zTooltip has no position, delay, class or touch options, the overlay places it above the trigger with below as fallback.`,
        'Nothing to do, unless the page relied on the option.',
      );
    }

    this.groups.push(group);
  }

  /** `[zTooltip]="cond ? '' : (text)"`, or `undefined` when that cannot be written safely. */
  private mergeDisabled(tip: Attr, disabled: Attr): string | undefined {
    const condition = disabled.value?.trim();
    if (
      this.plainString ||
      disabled.kind !== 'input' ||
      disabled.interpolated ||
      tip.interpolated ||
      !condition ||
      tip.value === undefined ||
      /["\r\n]|(^|[^|])\|([^|]|$)/.test(condition)
    ) {
      return undefined;
    }

    let text: string;
    if (tip.kind === 'text') {
      // The value is still HTML-encoded here; an encoded apostrophe would end the literal.
      if (/[\r\n]|&(#0*39|#x0*27|apos);/i.test(tip.value)) {
        return undefined;
      }
      text = `'${tip.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;')}'`;
    } else {
      if (/["\r\n]/.test(tip.value)) {
        return undefined;
      }
      text = `(${tip.value.trim()})`;
    }

    const simple = /^!?[\w$.]+(\(\))?$/.test(condition);
    const merged = `[zTooltip]="${simple ? condition : `(${condition})`} ? '' : ${text}"`;
    // The expression is new text, so it has to survive the real parser.
    const check = parseTemplate(`<i ${merged}></i>`, 'check.html');

    return check.errors?.length ? undefined : merged;
  }

  // ------------------------------------------------------------------------
  // spinner
  // ------------------------------------------------------------------------

  private spinner(element: TmplAstElement, attrs: Attr[]): void {
    const button = this.elements.find((parent) => parent.name === 'button' || parent.name === 'a');
    if (button) {
      const condition = this.conditions.at(-1);
      this.manual(
        'spinner',
        element,
        'spinner-in-button',
        `The spinner sits inside a <${button.name}> and was left alone: zBtn shows its own spinner.`,
        `Replace it with [loading] on the button${condition ? `: [loading]="${condition}"` : ''}, and remove the spinner and the label swap around it. loading also disables the button.`,
      );

      return;
    }

    const mode = attrs.find((attr) => attr.key === 'mode');
    const determinate =
      attrs.some((attr) => attr.key === 'value') ||
      (element.name === 'mat-progress-spinner' &&
        !(mode?.kind === 'text' && mode.value === 'indeterminate'));
    const blocker = determinate
      ? 'The spinner is determinate (mat-progress-spinner without mode="indeterminate", or with a value); z-spinner has no progress.'
      : this.inner(element).trim() !== ''
        ? 'The spinner has content.'
        : attrs.find(
              (attr) =>
                (attr.kind === 'ref' && attr.value) ||
                (attr.key.endsWith('aria-label') && this.translated(element, 'aria-label')) ||
                (MATERIAL_NAME.test(attr.key) && !attr.key.startsWith('matTooltip')) ||
                attr.key.endsWith('aria-labelledby'),
            )
          ? 'The spinner carries an attribute that z-spinner cannot take (template reference to the instance, Material directive, aria-labelledby or a translated i18n-* attribute).'
          : '';
    if (blocker) {
      this.manual(
        'spinner',
        element,
        determinate ? 'spinner-determinate' : 'spinner-unmapped',
        blocker,
        determinate
          ? 'Show progress as z-metric with [percent], and the value as a word next to it.'
          : 'Write <z-spinner label="…" /> by hand.',
      );

      return;
    }

    const group = this.groupFor('spinner', element);
    let labelled = false;
    for (const attr of attrs) {
      if (['diameter', 'strokeWidth', 'mode'].includes(attr.key)) {
        group.drop(attr);
        group.note(
          'info',
          'spinner-option',
          `${this.text(attr)} was dropped: z-spinner has one size and one stroke, set by the tokens.`,
          'Nothing to do.',
        );
      } else if (attr.key === 'color') {
        this.dropColour(group, attr, 'spinner');
      } else if (attr.key === 'aria-label' || attr.key === 'attr.aria-label') {
        // Left as aria-label the host binding of z-spinner would remove it.
        group.replace(attr.keyStart, attr.keyEnd, 'label', attr.key);
        labelled = true;
      } else if (attr.key === 'style' || attr.key.startsWith('style.') || attr.key === 'ngStyle') {
        group.note(
          'review',
          'spinner-style',
          `The inline style was kept (${this.text(attr)}). The size of z-spinner comes from the tokens.`,
          'Remove it.',
        );
      }
    }
    if (!labelled) {
      group.note(
        'review',
        'spinner-no-label',
        'The spinner has no accessible label; without one z-spinner is decorative and aria-hidden.',
        'Add label="Wird geladen" (or what is loading) for a standalone loading state; leave it out only where text next to it says the same. A list that loads shows z-skeleton rows instead of a spinner.',
      );
    }

    this.renameVoid(group, element, 'z-spinner');
    this.groups.push(group);
  }

  // ------------------------------------------------------------------------
  // chip
  // ------------------------------------------------------------------------

  private chip(element: TmplAstElement, attrs: Attr[]): void {
    const wrapper = [...this.elements]
      .reverse()
      .find((parent) => parent.name.startsWith('mat-chip-'));
    const reason =
      this.chipBlocker(element, attrs) ||
      (wrapper?.name === 'mat-chip-grid' &&
        'The chip sits in a mat-chip-grid, which is an input for chips.') ||
      (wrapper?.name === 'mat-chip-listbox' &&
        !this.wrapperConverts(wrapper) &&
        'The chip sits in a mat-chip-listbox that stays (selection, bindings or other content), and a badge is not an option of a listbox.') ||
      '';
    if (reason) {
      this.manual(
        'chip',
        element,
        'chip-interactive',
        reason,
        'A z-badge is never interactive. A removable or selectable chip has no counterpart: use z-checkbox or z-segment for a choice, a row with a ghost button for a removable entry.',
      );

      return;
    }

    const group = this.groupFor('chip', element);
    const start = offsetOf(element);
    group.replace(start + 1, start + 1 + 'mat-chip'.length, 'z-badge', 'mat-chip');
    const end = element.endSourceSpan!.start.offset;
    group.replace(end + 2, end + 2 + 'mat-chip'.length, 'z-badge', 'mat-chip');
    group.consumed.push('mat-chip');
    for (const attr of attrs) {
      if (attr.key === 'color') {
        this.dropColour(group, attr, 'chip');
      } else if (attr.key === 'disableRipple') {
        group.drop(attr);
        group.note(
          'info',
          'chip-ripple',
          'disableRipple was dropped, z-badge has no ripple.',
          'Nothing to do.',
        );
      }
    }
    group.note(
      'review',
      'chip-status',
      'The chip became a neutral z-badge.',
      'Where it shows a state, set status="success|warning|danger|info" and dot, and keep the state as a word.',
    );
    this.groups.push(group);
  }

  /** Why a chip cannot become a badge, looking at the chip alone. */
  private chipBlocker(element: TmplAstElement, attrs: Attr[]): string {
    const allowed =
      /^(class(\..+)?|ngClass|style(\..+)?|ngStyle|id|title|color|disableRipple|data-.+|matTooltip.*)$/;
    const bad = attrs.find((attr) => attr.kind === 'output' || !allowed.test(attr.key));
    if (bad) {
      return `${this.text(bad)} makes the chip interactive or stateful.`;
    }
    if (!element.endSourceSpan || element.endSourceSpan.start.offset === offsetOf(element)) {
      return 'The chip is self-closing and has no label.';
    }
    const inside = new Collector(true);
    tmplAstVisitAll(inside, element.children);
    const slot = inside.elements
      .flatMap((child) => this.attrsOf(child))
      .find((attr) => /^matChip/.test(attr.key));

    return slot ? `The chip contains ${slot.key}.` : '';
  }

  private wrapperConverts(wrapper: TmplAstElement): boolean {
    let converts = this.wrappers.get(wrapper);
    if (converts === undefined) {
      const attrs = this.attrsOf(wrapper);
      const content = new Collector(false);
      tmplAstVisitAll(content, wrapper.children);
      converts =
        attrs.every((attr) => attr.key === 'class' && attr.kind === 'text') &&
        !content.text &&
        content.elements.length > 0 &&
        !!wrapper.endSourceSpan &&
        content.elements.every(
          (child) =>
            child.name === 'z-badge' ||
            (child.name === 'mat-chip' && !this.chipBlocker(child, this.attrsOf(child))),
        );
      this.wrappers.set(wrapper, converts);
    }

    return converts;
  }

  private chipWrapper(element: TmplAstElement, attrs: Attr[]): void {
    if (!this.wrapperConverts(element)) {
      this.manual(
        'chip',
        element,
        'chip-wrapper',
        `<${element.name}> was left alone: it has bindings or ARIA of its own, or content other than static chips.`,
        'Static badges sit in <span class="z-cluster">. Give a group that needs a name a visible heading.',
      );

      return;
    }

    const group = this.groupFor('chip', element);
    group.counted = false;
    const start = offsetOf(element);
    const name = element.name;
    const classAttr = attrs.find((attr) => attr.key === 'class');
    group.consumed.push(name);
    if (classAttr?.value !== undefined) {
      group.replace(start + 1, start + 1 + name.length, 'span', name);
      const at =
        classAttr.start +
        this.text(classAttr).lastIndexOf(classAttr.value) +
        classAttr.value.length;
      group.replace(at, at, `${/\S$/.test(classAttr.value) ? ' ' : ''}z-cluster`);
    } else if (classAttr) {
      // `class` without a value: replace it as a whole.
      group.replace(start + 1, start + 1 + name.length, 'span', name);
      group.replace(classAttr.start, classAttr.end, `class=${this.quote}z-cluster${this.quote}`);
    } else {
      group.replace(
        start + 1,
        start + 1 + name.length,
        `span class=${this.quote}z-cluster${this.quote}`,
        name,
      );
    }
    const end = element.endSourceSpan!.start.offset;
    group.replace(end + 2, end + 2 + name.length, 'span', name);
    this.groups.push(group);
  }

  // ------------------------------------------------------------------------
  // shared
  // ------------------------------------------------------------------------

  private groupFor(rule: TemplateRule, element: TmplAstElement): Group {
    return new Group(rule, offsetOf(element), this.source);
  }

  private manual(
    rule: TemplateRule,
    element: TmplAstElement,
    code: string,
    reason: string,
    fix: string,
  ): void {
    this.findings.push({ offset: offsetOf(element), rule, kind: 'manual', code, reason, fix });
  }

  private dropColour(group: Group, attr: Attr, what: string): void {
    group.drop(attr);
    const harmless = attr.kind === 'text' && /^(primary|accent|)$/.test(attr.value ?? '');
    const danger = what === 'button' && attr.kind === 'text' && attr.value === 'warn';
    group.note(
      harmless ? 'info' : 'review',
      danger ? 'button-warn' : `${what}-colour`,
      `${this.text(attr)} was dropped: zenit-ui has no colour input, colour must come from the context.`,
      danger
        ? 'Candidate for zBtn="danger": use it only where the action destroys something, and confirm it with a dialog.'
        : COLOUR_FIX,
    );
  }

  /**
   * `i18n-<key>` on the element. The i18n pass of the parser removes these
   * attributes from the AST, so a renamed attribute would silently lose its
   * translation; the start tag is read as text instead.
   */
  private translated(element: TmplAstElement, key: string): boolean {
    const startTag = this.source.slice(offsetOf(element), element.startSourceSpan.end.offset);

    return startTag.includes(`i18n-${key}`);
  }

  private translatedBlocker(key: string): [string, string, string] {
    return [
      'icon-translated',
      `The attribute is translated through i18n-${key}, which the template AST does not expose.`,
      `Rename ${key} and i18n-${key} together by hand.`,
    ];
  }

  /** Renames an element that has no content in zenit-ui and writes it self-closing. */
  private renameVoid(group: Group, element: TmplAstElement, to: string): void {
    const start = offsetOf(element);
    const open = element.startSourceSpan.end.offset;
    group.replace(start + 1, start + 1 + element.name.length, to, element.name);
    group.consumed.push(element.name);
    if (element.endSourceSpan && element.endSourceSpan.start.offset !== start) {
      const gap = /\s/.test(this.source[open - 2]) ? '' : ' ';
      group.replace(open - 1, element.sourceSpan.end.offset, `${gap}/>`);
      if (this.source[open - 1] !== '>') {
        group.unsafe = 'the start tag does not end in ">"';
      }
    }
  }

  /** The source between the start and the end tag. */
  private inner(element: TmplAstElement): string {
    const end = element.endSourceSpan?.start.offset;

    return end === undefined || end === offsetOf(element)
      ? ''
      : this.source.slice(element.startSourceSpan.end.offset, end);
  }

  private text(attr: Attr): string {
    return short(this.source.slice(attr.start, attr.end));
  }

  /** The quote an expression can be wrapped in, `undefined` when neither is possible. */
  private quoteFor(expression: string): string | undefined {
    const other = this.quote === '"' ? "'" : '"';
    if (!expression.includes(this.quote)) {
      return this.quote;
    }

    return !this.plainString && !expression.includes(other) ? other : undefined;
  }

  private attrsOf(element: TmplAstElement): Attr[] {
    return attributesOf(element, this.source);
  }
}

/** Counts what is left after the accepted conversions. */
class Usage extends TmplAstRecursiveVisitor {
  readonly material: Record<string, number> = {};
  readonly zenit = new Set<string>();

  constructor(
    private readonly consumed: ReadonlySet<string>,
    private readonly source: string,
  ) {
    super();
  }

  override visitElement(element: TmplAstElement): void {
    const offset = offsetOf(element);
    const names = [element.name, ...attributesOf(element, this.source).map((attr) => attr.key)];
    const classes = attributesOf(element, this.source).find(
      (attr) => attr.key === 'class' && attr.kind === 'text',
    );
    for (const token of classes?.value?.split(/\s+/) ?? []) {
      if (/^(mat|mdc)-/.test(token)) {
        names.push(`.${token}`);
      }
    }
    for (const name of new Set(names)) {
      if (this.consumed.has(`${offset}:${name}`)) {
        continue;
      }
      if (MATERIAL_NAME.test(name) || name.startsWith('.')) {
        this.material[name] = (this.material[name] ?? 0) + 1;
      } else if (Object.hasOwn(ZENIT_SYMBOLS, name)) {
        this.zenit.add(ZENIT_SYMBOLS[name]);
      }
    }
    super.visitElement(element);
  }

  override visitTemplate(template: TmplAstTemplate): void {
    // On `<div *matCellDef>` the other attributes belong to the element and are counted there.
    const own =
      template.tagName === 'ng-template'
        ? attributesOf(template, this.source).map((attr) => attr.key)
        : [];
    // Of `*matRowDef="let row; columns: c"` only the first name is a directive, the rest is microsyntax.
    for (const name of new Set([
      ...own,
      ...template.templateAttrs.slice(0, 1).map((attr) => attr.name),
    ])) {
      if (MATERIAL_NAME.test(name)) {
        this.material[name] = (this.material[name] ?? 0) + 1;
      }
    }
    super.visitTemplate(template);
  }
}

/** Elements below a node: all of them (`deep`), or only the first level through blocks and templates. */
class Collector extends TmplAstRecursiveVisitor {
  readonly elements: TmplAstElement[] = [];
  /** Text or an interpolation on the first level. */
  text = false;

  constructor(private readonly deep: boolean) {
    super();
  }

  override visitElement(element: TmplAstElement): void {
    this.elements.push(element);
    if (this.deep) {
      super.visitElement(element);
    }
  }

  override visitText(text: TmplAstText): void {
    this.text ||= text.value.trim() !== '';
  }

  override visitBoundText(): void {
    this.text = true;
  }
}

function offsetOf(element: TmplAstElement): number {
  return element.startSourceSpan.start.offset;
}

function attributesOf(element: TmplAstElement | TmplAstTemplate, source: string): Attr[] {
  type Node = TmplAstTextAttribute | TmplAstBoundAttribute | TmplAstBoundEvent | TmplAstReference;
  const make = (node: Node, kind: Attr['kind']): Attr => {
    const start = node.sourceSpan.start.offset;
    const end = node.sourceSpan.end.offset;
    const keyStart = node.keySpan?.start.offset ?? start;
    const keyEnd = node.keySpan?.end.offset ?? end;
    const value =
      'valueSpan' in node && node.valueSpan
        ? source.slice(node.valueSpan.start.offset, node.valueSpan.end.offset)
        : undefined;
    const ast =
      node instanceof TmplAstBoundAttribute && 'ast' in node.value
        ? (node.value as { ast: unknown }).ast
        : undefined;

    return {
      key: source.slice(keyStart, keyEnd),
      kind,
      value,
      start,
      end,
      keyStart,
      keyEnd,
      interpolated: ast instanceof Interpolation,
    };
  };

  return [
    ...element.attributes.map((node) => make(node, 'text')),
    ...element.inputs.map((node) => make(node, 'input')),
    ...element.outputs.map((node) => make(node, 'output')),
    ...element.references.map((node) => make(node, 'ref')),
  ].sort((a, b) => a.start - b.start);
}

function short(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();

  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat;
}
