# HagsCanCook — Brand & Design Guide

**Last updated:** 2026-06-06

---

## Brand overview

**HagsCanCook** is a community recipe site for home cooks. The product should feel like a warm, well-used kitchen — approachable and practical, not precious or overly styled.

| Attribute | Direction |
|-----------|-----------|
| **Personality** | Warm, honest, community-minded |
| **Audience** | Home cooks who want to share and discover real recipes |
| **Positioning** | A place for recipes worth cooking — not influencer content or restaurant plating |
| **Formality** | Casual but clear; never cutesy or corporate |

**Tagline:** *Recipes worth cooking*

**One-liner:** *A community of home cooks sharing what they love to make.*

---

## Tone of voice

Write like a helpful neighbor who cooks a lot — direct, friendly, and specific.

### Do

- Use plain language: “Sign up free”, “Browse all recipes”, “Get started”
- Be encouraging without hype: “No recipes yet — be the first to add one!”
- Prefer short sentences and active voice
- Name things clearly (Prep time, Cook time, Servings)
- Acknowledge errors honestly: “Something went wrong” with a useful next step

### Don’t

- Use startup jargon (“unlock”, “supercharge”, “level up”)
- Over-promise (“the ultimate”, “life-changing”)
- Talk down to cooks or assume professional training
- Be overly cute with food puns in UI copy
- Use ALL CAPS for emphasis (reserve caps for small labels like cuisine tags)

### Naming conventions

| Context | Style | Example |
|---------|-------|---------|
| Site name (metadata, header) | **HagsCanCook** | Page title: “My recipes — HagsCanCook” |
| Homepage hero / marketing | **hags can cook** | Lowercase, conversational |
| Section headings | Sentence case | “Recently added”, “My recipes” |
| Labels & chips | Uppercase only for category tags | ITALIAN, EASY (0.75rem, letter-spaced) |

---

## Color palette

The palette is built around two anchor colors: a **warm cream** page background and a **rich warm brown** brand accent. All tints and text colors are derived from these hues — never generic grey-blues.

### Anchor colors

| Name | Hex | Role |
|------|-----|------|
| **Warm cream** | `#eae4e3` | Page background (light mode) |
| **Rich warm brown** | `#714b41` | Primary brand, buttons, focus accents |

### Light mode

#### Surfaces

| Name | Hex | Usage |
|------|-----|-------|
| Page background | `#eae4e3` | Behind cards and content areas |
| Surface | `#ffffff` | Cards, inputs, header, footer |
| Surface raised | `#f5ecea` | Chips, stats boxes, hover fills, placeholders |

#### Borders

| Name | Hex | Usage |
|------|-----|-------|
| Border | `#ddd4cf` | Card borders, input borders |
| Border subtle | `#ece6e4` | Table dividers, section separators |

#### Text scale

Four-step hierarchy, all warm-toned browns:

| Level | Hex | Usage |
|-------|-----|-------|
| Primary | `#2a1a16` | Headings, emphasis |
| Secondary | `#5a3d37` | Body copy, button labels |
| Tertiary | `#7a5a53` | Descriptions, footer links |
| Muted | `#a08880` | Placeholders, hints |

#### Brand accents

| Name | Hex | Usage |
|------|-----|-------|
| Brand | `#714b41` | Primary buttons, active pills, links |
| Brand hover | `#5c3c33` | Button hover state |
| Brand text | `#ffffff` | Text on brand-colored backgrounds |
| Brand tint | `#f0e5e2` | Light brand wash (difficulty chips, active states) |
| Focus ring | `rgba(113, 75, 65, 0.15)` | Input focus ring (3px spread) |

#### Semantic colors

| Role | Text / accent | Background | Border |
|------|---------------|------------|--------|
| **Error** | `#b91c1c` | `#fef2f2` | `#fecaca` |
| **Success** | `#15803d` | `#f0fdf4` | `#bbf7d0` |
| **Warning** | `#92400e` | `#fef9c3` | `#fde68a` |
| **Dietary** | `#059669` | `#ecfdf5` | `#a7f3d0` |

### Dark mode

Dark mode uses a **warm dark** palette — deep espresso browns, not neutral grey. Toggle by setting `data-theme="dark"` on the root element.

#### Surfaces & borders

| Name | Light | Dark |
|------|-------|------|
| Page background | `#eae4e3` | `#1a100e` |
| Surface | `#ffffff` | `#261a17` |
| Surface raised | `#f5ecea` | `#311f1b` |
| Border | `#ddd4cf` | `#4a2e27` |
| Border subtle | `#ece6e4` | `#3a2219` |

#### Text & brand

| Name | Light | Dark |
|------|-------|------|
| Primary text | `#2a1a16` | `#f0e8e5` |
| Secondary text | `#5a3d37` | `#d4b0a4` |
| Tertiary text | `#7a5a53` | `#a87a70` |
| Muted text | `#a08880` | `#7a5a53` |
| Brand | `#714b41` | `#d4a090` |
| Brand hover | `#5c3c33` | `#e0b0a0` |
| Brand text | `#ffffff` | `#1a100e` |
| Brand tint | `#f0e5e2` | `#3d2520` |
| Focus ring | `rgba(113, 75, 65, 0.15)` | `rgba(212, 160, 144, 0.2)` |

#### Semantic colors (dark)

| Role | Text / accent | Background | Border |
|------|---------------|------------|--------|
| **Error** | `#f87171` | `#2d1515` | `#7f1d1d` |
| **Success** | `#4ade80` | `#052e16` | `#166534` |
| **Warning** | `#fde047` | `#292900` | `#854d0e` |
| **Dietary** | `#34d399` | `#052e16` | `#166534` |

### Color usage rules

1. **Brand brown is for action** — primary CTAs, selected pills, focus rings, difficulty highlights.
2. **Surfaces stack for depth:** page background → white/card surface → raised surface for chips and hover.
3. **Text hierarchy:** secondary brown (`#5a3d37`) for most body copy; primary (`#2a1a16`) for headings.
4. **Semantic colors are functional** — reserve error, success, warning, and dietary colors for their meaning, not decoration.
5. **Stay warm** — if a neutral grey feels right, pick a brown-tinted alternative instead.

### Complete design tokens (CSS)

Copy-paste reference for implementing the palette:

```css
:root {
  /* Surfaces */
  --color-bg:             #eae4e3;
  --color-surface:        #ffffff;
  --color-surface-raised: #f5ecea;

  /* Borders */
  --color-border:         #ddd4cf;
  --color-border-subtle:  #ece6e4;

  /* Text */
  --color-text:           #2a1a16;
  --color-text-2:         #5a3d37;
  --color-text-3:         #7a5a53;
  --color-text-4:         #a08880;

  /* Brand */
  --color-brand:          #714b41;
  --color-brand-hover:    #5c3c33;
  --color-brand-text:     #ffffff;
  --color-brand-tint:     #f0e5e2;
  --color-focus-ring:     rgba(113, 75, 65, 0.15);

  /* Semantic */
  --color-error:          #b91c1c;
  --color-error-bg:       #fef2f2;
  --color-error-border:   #fecaca;
  --color-success:        #15803d;
  --color-success-bg:     #f0fdf4;
  --color-success-border: #bbf7d0;
  --color-warning-text:   #92400e;
  --color-warning-bg:     #fef9c3;
  --color-warning-border: #fde68a;
  --color-dietary:        #059669;
  --color-dietary-bg:     #ecfdf5;
  --color-dietary-border: #a7f3d0;

  /* Layout */
  --layout-px:      1rem;
  --layout-sidebar: 320px;
  --layout-max:     72rem;
}

[data-theme="dark"] {
  --color-bg:             #1a100e;
  --color-surface:        #261a17;
  --color-surface-raised: #311f1b;
  --color-border:         #4a2e27;
  --color-border-subtle:  #3a2219;
  --color-text:           #f0e8e5;
  --color-text-2:         #d4b0a4;
  --color-text-3:         #a87a70;
  --color-text-4:         #7a5a53;
  --color-brand:          #d4a090;
  --color-brand-hover:    #e0b0a0;
  --color-brand-text:     #1a100e;
  --color-brand-tint:     #3d2520;
  --color-focus-ring:     rgba(212, 160, 144, 0.2);
  --color-error:          #f87171;
  --color-error-bg:       #2d1515;
  --color-error-border:   #7f1d1d;
  --color-success:        #4ade80;
  --color-success-bg:     #052e16;
  --color-success-border: #166534;
  --color-warning-text:   #fde047;
  --color-warning-bg:     #292900;
  --color-warning-border: #854d0e;
  --color-dietary:        #34d399;
  --color-dietary-bg:     #052e16;
  --color-dietary-border: #166534;
}

/* Responsive layout */
@media (width >= 640px)  { :root { --layout-px: 1.5rem; } }
@media (width >= 960px)  { :root { --layout-px: 2rem; } }
@media (width >= 1440px) { :root { --layout-px: 2.5rem; --layout-sidebar: 360px; --layout-max: 90rem; } }
@media (width >= 1920px) { :root { --layout-px: 3rem; --layout-sidebar: 400px; --layout-max: 110rem; } }
```

---

## Typography

### Typeface

**Geist** — a clean sans-serif from Google Fonts. Applied site-wide with subpixel antialiasing. No secondary display font; hierarchy comes from weight and size alone.

Fallback stack: `Geist, system-ui, sans-serif`

### Type scale

| Role | Size | Weight | Letter-spacing | Example |
|------|------|--------|----------------|---------|
| **Hero title** | `clamp(2rem, 5vw, 3.25rem)` | 800 | `-0.03em` | “Recipes worth cooking” |
| **Page title** | `1.75rem` | 800 | `-0.02em` | “My recipes”, “Profile” |
| **Recipe title** | `clamp(1.75rem, 4vw, 2.5rem)` | 800 | `-0.025em` | Recipe detail heading |
| **Section title** | `1.375rem` | 700 | — | “Recently added” |
| **Body large** | `1.0625rem–1.125rem` | 400 | — | Hero subtitle, recipe description |
| **Body** | `0.9375rem–1rem` | 400–500 | — | Navigation, form inputs, card titles |
| **Body small** | `0.875rem` | 400–500 | — | Descriptions, footer, toasts |
| **Caption / meta** | `0.8125rem` | 500 | — | Card meta pills, author name |
| **Label / tag** | `0.75rem` | 600 | `0.04–0.06em` | Cuisine, difficulty (uppercase) |

### Line height

- **Headings:** `1.1–1.15` (tight)
- **Body copy:** `1.5–1.65` (comfortable reading)
- **UI labels:** `1` (single-line pills and chips)

### Typography rules

1. **Negative letter-spacing on large headings** — keeps display type crisp, not loose.
2. **Positive letter-spacing on uppercase labels** — improves legibility at small sizes.
3. **Responsive heroes use clamp()** — avoid fixed breakpoints for headline sizing.
4. **Truncate long text** — card titles and descriptions should clamp to 2 lines.

---

## Layout & spacing

### Container widths

| Breakpoint | Horizontal padding | Max content width | Sidebar width |
|------------|-------------------|-------------------|---------------|
| Default (< 640px) | `1rem` | `72rem` | `320px` |
| ≥ 640px | `1.5rem` | `72rem` | `320px` |
| ≥ 960px | `2rem` | `72rem` | `320px` |
| ≥ 1440px | `2.5rem` | `90rem` | `360px` |
| ≥ 1920px | `3rem` | `110rem` | `400px` |

### Content max-widths

| Context | Max width |
|---------|-----------|
| Site shell (header, footer, homepage) | `72rem` (scales to `90rem` / `110rem` on large screens) |
| Recipe detail page | `48rem` |
| Toast notifications | `20rem` |

### Spacing rhythm

Based on a **4px grid** (0.25rem increments):

| Value | Usage |
|-------|-------|
| `0.375rem` (6px) | Tight gaps — meta pills, tag rows |
| `0.5–0.75rem` (8–12px) | Button padding, nav link padding |
| `1–1.5rem` (16–24px) | Card padding, grid gaps |
| `2–5rem` (32–80px) | Section vertical padding |

### Grid

Recipe cards: auto-fill grid with a minimum column width of `18rem` and `1.5rem` gap between items.

---

## Components & patterns

### Buttons

**Primary**

| Property | Value |
|----------|-------|
| Background | `#714b41` → hover `#5c3c33` |
| Text | `#ffffff` |
| Padding | `0.625rem 1.5rem` |
| Border radius | `0.5rem` (8px) |
| Font weight | 600 |
| Transition | `background-color 0.15s ease` |

**Secondary**

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Border | `1px solid #ddd4cf` |
| Text | `#5a3d37` |
| Hover | background `#f5ecea`, border `#a08880` |
| Border radius | `0.5rem` |
| Font weight | 500 |

**Ghost / navigation**

| Property | Value |
|----------|-------|
| Background | transparent → hover `#f5ecea` |
| Text | `#5a3d37` → hover `#2a1a16` |
| Border radius | `0.375rem` (6px) |
| Font weight | 500 |

### Cards

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Border | `1px solid #ddd4cf` |
| Border radius | `0.75rem` (12px) |
| Hover | lift 2px + shadow `0 4px 20px rgba(0, 0, 0, 0.08)` |
| Image aspect ratio | 16:9 (grid cards), 16:7 (recipe cover) |
| Transition | `0.15s ease` |

### Pills & chips

| Variant | Background | Text | Use |
|---------|------------|------|-----|
| **Meta pill** | `#f5ecea` | `#7a5a53` | Prep time, servings |
| **Brand pill** | `#f0e5e2` | `#714b41` | Difficulty, highlighted tags |
| **Active pill** | `#714b41` | `#ffffff` | Selected filter/tag |
| **Cuisine label** | `#f5ecea` | `#7a5a53` | Uppercase, letter-spaced |

All pills use fully rounded ends (`border-radius: 9999px`).

### Form inputs

| Property | Value |
|----------|-------|
| Min height | `2.5rem` (40px) |
| Background | `#ffffff` |
| Border | `1px solid #ddd4cf` |
| Border radius | `0.5rem` |
| Text | `#2a1a16` |
| Placeholder | `#a08880` |
| Focus border | `#714b41` |
| Focus ring | `0 0 0 3px rgba(113, 75, 65, 0.15)` |

### Toasts

| Property | Value |
|----------|-------|
| Width | `20rem` |
| Position | Bottom-right, stacking upward |
| Background | `#ffffff` |
| Accent | 3px left border in error (`#b91c1c`) or success (`#15803d`) color |
| Border radius | `0.5rem` |
| Shadow | `0 4px 12px rgba(0, 0, 0, 0.12)` |
| Title | `0.875rem`, weight 700, semantic color |
| Message | `0.875rem`, `#5a3d37` |
| Enter/exit | Slide up 0.25s ease; opacity-only fade when reduced motion is preferred |

### Header & footer

**Header**

| Property | Value |
|----------|-------|
| Position | Sticky top |
| Height | `4rem` (64px) |
| Background | `#ffffff` |
| Border | `1px solid #ddd4cf` bottom |

**Footer**

| Property | Value |
|----------|-------|
| Background | `#ffffff` |
| Border | `1px solid #ddd4cf` top |
| Link color | `#7a5a53` → hover `#2a1a16` |
| Font size | `0.875rem` |

---

## Logo

Two logo formats:

| Format | Usage |
|--------|-------|
| **PNG** (transparent background) | Header — displayed at 200×50px, contained (no stretch) |
| **SVG** | Marketing materials, social sharing, large-format use |

**Light mode:** PNG displayed as-is on white or cream backgrounds.

**Dark mode:** PNG shape used as a mask, filled with the brand accent color (`#d4a090` in dark mode). Requires a transparent background in the source artwork.

**Rules:** Do not stretch, recolor arbitrarily, or place on busy photo backgrounds without sufficient contrast.

---

## Motion & interaction

| Pattern | Duration | Easing |
|---------|----------|--------|
| Color / background transitions | `0.15s` | `ease` |
| Card hover (lift + shadow) | `0.15s` | `ease` |
| Toast enter/exit | `0.25s` | `ease` |
| Logo theme swap | `0.2s` | `ease` |
| Loading spinner | continuous | rotate 360° |

**Reduced motion:** When the user prefers reduced motion, toast animations should use opacity fades only — no vertical movement.

**Philosophy:** Feedback should be immediate and subtle — a slight lift on cards, a warm focus ring on inputs. Never bouncy or playful.

---

## Imagery

- **Recipe photos:** Cover-fit cropping, 16:9 (cards) or 16:7 (detail cover) aspect ratios
- **Placeholder:** Diagonal gradient from `#f5ecea` to `#ddd4cf`
- **Tone:** Real home-cooked food; natural light preferred over studio styling
- **Empty states:** Dashed border (`#ddd4cf`) on `#f5ecea` background — inviting, not alarming

---

## Accessibility

- **Focus rings:** Always visible — `0 0 0 3px rgba(113, 75, 65, 0.15)` on light backgrounds. Never remove focus outlines without a replacement.
- **Contrast:** Primary text `#2a1a16` on `#eae4e3` and `#ffffff` meets WCAG AA.
- **Dark mode:** Full color parity — every light-mode token has a dark-mode equivalent.
- **Structure:** Use semantic headings, lists, and landmarks (main, header, footer).
- **Language:** English (`lang="en"`).

---

## Design checklist

When creating new UI for HagsCanCook:

- [ ] Use colors from the token tables above — no ad-hoc greys or blues
- [ ] Match the border-radius scale: `0.375rem`, `0.5rem`, `0.75rem`, or fully rounded pills
- [ ] Follow the four-step text color hierarchy
- [ ] Test in both light and dark mode
- [ ] Use Geist at the appropriate weight and size from the type scale
- [ ] Keep transitions at 0.15s unless animating toasts (0.25s)
- [ ] Provide a reduced-motion fallback for any new animation
