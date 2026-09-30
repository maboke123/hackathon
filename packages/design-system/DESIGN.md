# Design system

One visual language for the demo app, the slide decks and the promo videos. It is derived from the SD Worx logo and the public SD Worx web styling (2026 brand).

## Principles

1. **Calm and precise.** White space, a strict grid and clear hierarchy. The product is about payroll and HR, so it should feel trustworthy, not flashy.
2. **Blue leads, red and yellow punctuate.** Blue is the only interactive colour. Red and yellow appear in the logo mark, in data visualisation and in small accents, never as large fills or button colours.
3. **Flat surfaces.** Separate things with borders and background tints. Shadows are reserved for elements that float (menus, dialogs).
4. **Left aligned.** Text and layouts start from the left edge. Centre only short standalone items such as an outro logo.
5. **Real content.** Use realistic HR and payroll examples in demos instead of lorem ipsum.

## Colour

Source of truth: `src/tokens.css`. `src/tokens.ts` mirrors the raw palette for JavaScript contexts such as Remotion.

| Role         | Token              | Value     | Use                                           |
| ------------ | ------------------ | --------- | --------------------------------------------- |
| Brand blue   | `--ds-blue-600`    | `#006DD8` | Primary actions, links, focus, key highlights |
| Brand red    | `--ds-red-500`     | `#F1002F` | Logo mark, chart series, small accents        |
| Brand yellow | `--ds-yellow-400`  | `#FFBE00` | Logo mark, chart series, eyebrow text on dark |
| Navy         | `--ds-blue-900`    | `#001C52` | Headings                                      |
| Deep navy    | `--ds-blue-950`    | `#000D3A` | Dark surfaces (cover slides, video intros)    |
| Ink          | `--ds-neutral-900` | `#212223` | Body text                                     |
| Muted text   | `--ds-neutral-600` | `#5A5B5C` | Secondary text                                |
| Border       | `--ds-neutral-300` | `#D9DBDD` | Dividers, input borders                       |
| Tint         | `--ds-blue-50`     | `#EFFAFF` | Secondary surfaces, highlighted rows          |

Always use semantic tokens in components (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-inverse`). Raw palette steps (`blue-700`, `brand-red`) are for illustrations, charts and hover states.

Contrast rules:

- Never put white text on yellow or yellow text on white. Yellow carries navy or ink text.
- Red text uses `--ds-red-600` (`text-destructive`), not the brand red.
- Status colours: `success` green, `warning` yellow, `destructive` red. They communicate state, not brand.

Dark mode is available through the `.dark` class. The default is light.

## Typography

| Role                    | Family         | Weight                | Notes                                                   |
| ----------------------- | -------------- | --------------------- | ------------------------------------------------------- |
| Headings                | Hanken Grotesk | 600                   | Letter spacing -0.02em, tight line height (1.05 to 1.2) |
| Body                    | Inter          | 400, 500 for emphasis | Line height 1.5, max 75 characters per line             |
| Code, numbers in tables | JetBrains Mono | 400                   |                                                         |

SD Worx uses a proprietary display typeface for headings. It is not licensed to us, so Hanken Grotesk is the open substitute. Fonts are self hosted through Fontsource, so everything works offline.

Eyebrow labels (the small line above a heading) are 14px, uppercase, letter spacing 0.08em, in primary blue.

Use sentence case everywhere, including headings and buttons.

## Shape and depth

- Radius: 4px for small controls, 8px for buttons, inputs and cards, 12px at most for large containers. No pill shaped buttons.
- Borders: 1px, `border-border`.
- Shadows: `shadow-raised` for subtle lift, `shadow-overlay` for popovers and dialogs. Both are neutral navy at low opacity. No coloured shadows and no glows.

## Motion

- Duration 120ms to 200ms in the app, easing `cubic-bezier(0.2, 0, 0, 1)`.
- Hover changes the background or border colour only. No scaling, lifting or shadow growth on hover.
- In videos, elements fade up 24px with a damped spring and do not bounce.

## Logo

Assets are in `assets/`:

| File                    | Use                                                   |
| ----------------------- | ----------------------------------------------------- |
| `sdworx-logo.svg`       | Full logo on light backgrounds                        |
| `sdworx-logo-white.svg` | Full logo on dark backgrounds                         |
| `sdworx-mark.svg`       | Three bars without text, on light or dark backgrounds |
| `sdworx-mark-white.svg` | Single colour mark for busy or coloured backgrounds   |

Do not recolour, rotate, stretch or add effects to the logo. Keep clear space around it of at least the width of the mark. The logo is a trademark of SD Worx and is used here only for the hackathon.

The slanted bar (16 degrees) is reused as the bullet marker in slides. Do not invent other decorative shapes.

## Do not

- Em dashes in any copy. Use a comma, a full stop or parentheses.
- Gradients on backgrounds, text or buttons.
- Coloured or glowing drop shadows, especially on hover.
- Glassmorphism and blurred translucent cards.
- Emoji as icons or bullets. Icons come from `lucide-react`, 1.5px stroke.
- Purple or violet accents.
- Everything centred, everything in rounded cards, cards nested in cards.
- Sparkle icons or "AI powered" badges as decoration.
- Filler copy ("Unlock the power of", "Seamlessly", "Supercharge").

## Where it is wired up

| Surface | Entry point                                                                                                         |
| ------- | ------------------------------------------------------------------------------------------------------------------- |
| Web app | `apps/web/src/app/globals.css` imports `@repo/design-system/tailwind.css`. Live reference at `/design-system`.      |
| Slides  | `slides/styles/index.css` imports the tokens, layouts in `slides/layouts`.                                          |
| Videos  | `videos/src/index.css` imports `@repo/design-system/tailwind.css`, colours in JS from `@repo/design-system/tokens`. |
