# Design Brief

## Direction

Scholar's Margin — a warm editorial academic workspace where AI feedback reads like a thoughtful teacher's margin notes on paper.

## Tone

Refined editorial/academic: warm paper surfaces, deep indigo ink, amber highlighter accents — intellectual and calm, never corporate or playful.

## Differentiation

Real highlighter-pen evidence spans in the student's own text, color-matched to concept status, paired with a margin-note feedback panel — the page reads like a marked-up essay.

## Color Palette

| Token      | OKLCH         | Role                              |
| ---------- | ------------- | --------------------------------- |
| background | 0.975 0.008 85 | warm off-white paper surface      |
| foreground | 0.235 0.03 275 | deep indigo ink text              |
| card       | 0.995 0.004 85 | raised paper cards                |
| primary    | 0.42 0.155 268 | deep indigo — CTAs, active states |
| accent     | 0.82 0.155 82  | amber highlighter for emphasis    |
| muted      | 0.945 0.012 85 | quiet paper fills, secondary text |
| success    | 0.6 0.145 152  | "covered" status green            |
| warning    | 0.75 0.15 78   | "partial" status amber            |
| destructive| 0.575 0.2 22   | "misconception" rose              |

## Typography

- Display: Fraunces — page titles, section headings, the Marginalia wordmark
- Body: Inter — UI labels, paragraphs, buttons; fallback Figtree
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-semibold`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base leading-relaxed`

## Elevation & Depth

Flat warm paper base with layered cards; depth comes from `shadow-subtle` at rest and `shadow-card`/`shadow-elevated` on interactive and floating surfaces (dialogs, toasts, popovers).

## Structural Zones

| Zone    | Background            | Border     | Notes                                       |
| ------- | --------------------- | ---------- | ------------------------------------------- |
| Header  | `bg-card`             | `border-b` | sticky, cream bar with wordmark + avatar    |
| Content | `bg-background`       | —          | alternate `bg-muted/30` section bands       |
| Panels  | `bg-card` + `shadow-card` | `border` | answer editor and feedback panel cards   |
| Footer  | `bg-muted/40`         | `border-t` | quiet closing band                          |

## Spacing & Rhythm

Spacious academic rhythm: `gap-6`/`gap-8` between major zones, `p-6` card padding, `gap-3` inside concept lists, `space-y-4` for stacked feedback blocks.

## Component Patterns

- Buttons: `rounded-full` pills; primary = deep indigo `bg-primary`, hover darkens + `shadow-elevated`; secondary = `bg-secondary`; ghost for overrides
- Cards: `rounded-2xl`, `bg-card`, `border`, `shadow-card`, `transition-smooth`
- Badges: `rounded-full` status pills — covered green, partial amber, missing slate, misconception rose; outline variant for confidence
- Highlight spans: inline `highlight-*` utilities painting a translucent highlighter band under exact `evidence_quote` substrings

## Motion

- Entrance: `animate-fade-in-up` 0.4s staggered across cards on mount
- Hover: `transition-smooth` (0.3s cubic-bezier) on buttons, cards, chips
- Decorative: `animate-shimmer` skeleton loaders, `animate-pulse-soft` on pending-approval badge

## Constraints

- Light mode primary; dark mode ("warm ink") provided as a tuned companion, not an inversion
- All colors via semantic OKLCH tokens — no hex, rgb, or arbitrary color classes in components
- Status color is the single source of truth across chips, highlights, meter, and chart
- No letter grades anywhere — coverage percentage and growth framing only
- Fully responsive: single column on mobile, two-column answer/feedback split at `lg`

## Signature Detail

Highlighter-pen evidence spans painted directly into the student's text with a translucent amber/green/rose band — turns the answer editor into a visibly annotated page.
