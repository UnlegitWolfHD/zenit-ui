/**
 * Static tables of the `migrate-material` schematic. The schematic has no type
 * information, so everything here works on selector names as they are written
 * in a template.
 */

/** Rules that can be switched with `--rules`. */
export const RULES = ['icon', 'button', 'tooltip', 'spinner', 'chip', 'imports'] as const;
export type RuleName = (typeof RULES)[number];

/** A tag or attribute name that belongs to Angular Material: `mat-icon`, `matTooltip`. */
export const MATERIAL_NAME = /^mat(-|[A-Z])/;

/** What each button attribute of Material becomes; `null` has no counterpart. */
export const BUTTON_VARIANTS: Record<string, { variant: string; iconOnly?: boolean } | null> = {
  'mat-button': { variant: 'ghost' },
  'mat-stroked-button': { variant: '' },
  'mat-flat-button': { variant: 'primary' },
  'mat-raised-button': { variant: 'primary' },
  'mat-icon-button': { variant: 'ghost', iconOnly: true },
  'mat-fab': null,
  'mat-mini-fab': null,
  // The attribute API of Angular Material 20 and later is reported, not guessed.
  matButton: null,
  matIconButton: null,
  matFab: null,
  matMiniFab: null,
};

/** Inputs of `matTooltip` that `zTooltip` does not have. */
export const TOOLTIP_OPTIONS = [
  'matTooltipPosition',
  'matTooltipPositionAtOrigin',
  'matTooltipShowDelay',
  'matTooltipHideDelay',
  'matTooltipClass',
  'matTooltipTouchGestures',
];

/**
 * Which template names keep a Material symbol in `imports` alive. A symbol is
 * removed only when none of the names left in the template matches.
 */
const ANY_BUTTON = /^(mat-(button|stroked-button|flat-button|raised-button)|matButton)$/;
const ICON_BUTTON = /^(mat-icon-button|matIconButton)$/;
const FAB = /^(mat-(mini-)?fab|mat(Mini)?Fab)$/;
const SPINNER = /^mat-(progress-)?spinner$/;
export const MATERIAL_SYMBOLS: Record<string, RegExp> = {
  MatIconModule: /^mat-icon$/,
  MatIcon: /^mat-icon$/,
  MatButtonModule: new RegExp(`${ANY_BUTTON.source}|${ICON_BUTTON.source}|${FAB.source}`),
  MatButton: ANY_BUTTON,
  MatAnchor: ANY_BUTTON,
  MatIconButton: ICON_BUTTON,
  MatIconAnchor: ICON_BUTTON,
  MatFabButton: FAB,
  MatFabAnchor: FAB,
  MatMiniFabButton: FAB,
  MatMiniFabAnchor: FAB,
  MatTooltipModule: /^matTooltip/,
  MatTooltip: /^matTooltip/,
  MatProgressSpinnerModule: SPINNER,
  MatProgressSpinner: SPINNER,
  MatSpinner: SPINNER,
  MatChipsModule: /^(mat-(basic-)?chip|matChip)/,
  MatChip: /^mat-(basic-)?chip$/,
  MatChipSet: /^mat-chip-set$/,
  MatChipListbox: /^mat-chip-listbox$/,
};

/** The zenit-ui symbol a template needs for a tag or an attribute it uses. */
export const ZENIT_SYMBOLS: Record<string, string> = {
  'z-icon': 'ZIcon',
  zBtn: 'ZButton',
  zTooltip: 'ZTooltip',
  'z-spinner': 'ZSpinner',
  'z-badge': 'ZBadge',
};

/**
 * The replacement named in the report for everything that stays. Mirrors the
 * mapping table of `docs/migration-from-material.md`; the first match wins.
 */
const REPLACEMENTS: [RegExp, string][] = [
  [/^mat-toolbar/, 'z-app-header (3.1)'],
  [/^mat-icon$/, 'z-icon (3.2)'],
  [/^(mat-(mini-)?fab|mat(Mini)?Fab)$/, 'no counterpart: a button[zBtn] in the page flow (3.3)'],
  [
    /^(mat-(stroked-|flat-|raised-|icon-)?button|mat(Icon)?Button)$/,
    'button[zBtn] / a[zBtn] (3.3)',
  ],
  [/^mat-button-toggle/, 'z-segment (3.9)'],
  [
    /^(mat-form-field|mat-label|mat-hint|mat-error|matInput|matPrefix|matSuffix|matTextPrefix|matTextSuffix|matIconPrefix|matIconSuffix)$/,
    'z-field with input[zInput]; icons in fields through z-input-group (3.4)',
  ],
  [
    /^(mat-select|mat-option|mat-optgroup|mat-select-trigger)$/,
    'z-select around a native <select> (3.5)',
  ],
  [/^mat-checkbox$/, 'z-checkbox (3.6)'],
  [/^mat-slide-toggle$/, 'z-toggle, in a z-setting row (3.6)'],
  [/^(mat-slider|matSliderThumb|matSliderStartThumb|matSliderEndThumb)$/, 'z-slider (3.7)'],
  [/^(mat-tab(-|$)|matTab[A-Z])/, 'nav[zTabs] with a[zTab], one route per tab (3.8)'],
  [/^mat-card/, 'z-panel (3.10)'],
  [
    /^(mat-(basic-)?chip|matChip)/,
    'z-badge for a static chip; an interactive chip has no counterpart (3.11)',
  ],
  [
    /^(mat-table|mat-header|mat-footer|mat-row|mat-cell|mat-sort|mat-text-column|mat-no-data-row|matColumnDef|matHeaderCellDef|matCellDef|matFooterCellDef|matHeaderRowDef|matRowDef|matFooterRowDef|matSort|matNoDataRow)/,
    'z-table-container with table[zTable], cdk-table where a data source is needed (3.12)',
  ],
  [/^mat-paginator$/, 'z-pagination, 1-based (3.13)'],
  [/^(mat-dialog|matDialog)/, 'z-dialog with [zDialogActions], opened through ZDialog (3.14)'],
  [/^(mat-menu|matMenu)/, 'z-menu with button[zMenuItem] and [cdkMenuTriggerFor] (3.15)'],
  [/^mat-divider$/, 'a 1px border in `border`, z-menu-separator inside a menu (never edited)'],
  [/^matTooltip/, 'zTooltip (3.17)'],
  [/^mat-(progress-)?spinner$/, 'z-spinner, or [loading] on the button (3.18)'],
  [/^mat-progress-bar$/, 'z-metric with percent, or z-skeleton rows (3.18)'],
  [/^(mat-expansion|mat-accordion)/, 'z-faq (3.19)'],
  [
    /^(mat-stepper|mat-step|mat-horizontal-stepper|mat-vertical-stepper|matStep)/,
    'z-stepper, display only (3.20)',
  ],
];

export function replacementFor(name: string): string {
  return (
    REPLACEMENTS.find(([pattern]) => pattern.test(name))?.[1] ??
    'no counterpart in zenit-ui: decide per case (section 10 of docs/migration-from-material.md)'
  );
}

/** Counted in stylesheets, never edited. The keys are the column names of the report. */
export const STYLE_DEBT: Record<string, RegExp> = {
  'mat-* element selectors': /(^|[\s,>+~(])mat-[a-z][a-z-]*(?=[\s,.:{[>+~)]|$)/gm,
  '.mat-* / .mdc-* classes': /\.(mat|mdc)-[a-z]/g,
  '--mat-* / --mdc-* properties': /--(mat|mdc)-[a-z]/g,
  '::ng-deep': /::ng-deep|\/deep\/|>>>/g,
  "@use '@angular/material'": /@(use|import)\s+['"]~?@angular\/material/g,
};
