# Midnight Brand Specification

> A crypto and AI news app delivering bite-sized, swipeable content.
> This document defines the visual identity for use across pitch decks, marketing materials, and product design.

---

## 1. Brand Overview

**Name:** Midnight
**Tagline idea:** Crypto & AI news, one swipe at a time.
**App identifier:** `com.midnight.app`
**Platform:** Mobile-first (iOS & Android)

**Personality:** Bold, minimal, data-driven. The brand leans into high-contrast, dark-first aesthetics with sharp typographic hierarchy. It feels like a Bloomberg terminal meets a modern content feed.

---

## 2. Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Midnight Blue** | `#4C8BD0` | 76, 139, 208 | Primary accent, CTAs, active states, branding |
| **Midnight Mint** | `#00D4AA` | 0, 212, 170 | Secondary accent, prediction markets, positive data |

### Dark Theme (Default)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#030303` | App background, splash screen |
| Card | `#111111` | Card surfaces, elevated containers |
| Card Border | `#222222` | Subtle card borders |
| Border | `#333333` | Dividers, separators |
| Text Primary | `#f0f0f0` | Headlines, body text |
| Text Secondary | `#cccccc` | Subheadings, captions |
| Text Muted | `#888888` | Timestamps, metadata |
| Text Faint | `#444444` | Disabled text, subtle labels |
| Overlay | `rgba(0, 0, 0, 0.6)` | Image overlays, modals |
| Track | `#1a1a1a` | Progress bar backgrounds |

### Light Theme

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#f5f5f5` | App background |
| Card | `#ffffff` | Card surfaces |
| Card Border | `#e0e0e0` | Card borders |
| Border | `#dddddd` | Dividers |
| Text Primary | `#111111` | Headlines, body text |
| Text Secondary | `#555555` | Subheadings, captions |
| Text Muted | `#999999` | Timestamps, metadata |
| Text Faint | `#bbbbbb` | Disabled text |
| Accent Blue | `#3A7BC8` | Slightly darker for light backgrounds |
| Accent Mint | `#009977` | Slightly darker for light backgrounds |

### Semantic Colors

| Name | Dark | Light | Usage |
|------|------|-------|-------|
| Positive | `#00ff66` | `#00cc55` | Price up, gains, success |
| Negative | `#E60000` | `#cc0000` | Price down, losses, errors |

### Gradient Pattern

Image overlays use a vertical linear gradient:
```
transparent (top) -> rgba(background, 0.6) (70%) -> background (bottom)
```
This creates a smooth content fade over images, ensuring text readability.

---

## 3. Typography

### Font Stack

| Role | Typeface | Weights | Source |
|------|----------|---------|--------|
| **Display** | Anton | 400 (Regular) | Google Fonts |
| **Body** | Inter | 300 (Light), 400 (Regular), 600 (SemiBold), 700 (Bold) | Google Fonts |
| **Mono** | JetBrains Mono | 400 (Regular), 700 (Bold) | Google Fonts |
| **Brand** | BlauerNue | Regular, Bold, ExtraBold | Local TTF |

### Type Scale

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| Hero | 80px | 72px | Splash, onboarding hero |
| XXXL | 32px | 40px | Section headers |
| XXL | 28px | 34px | Page titles |
| XL | 24px | 30px | Card headlines |
| LG | 18px | 26px | Subheadings |
| Base | 14px | 20px | Body text |
| SM | 11px | 16px | Captions |
| XS | 10px | 14px | Labels, badges |
| XXS | 9px | 12px | Micro labels |

### Letter Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Tight | -0.5px | Headlines (Anton) |
| Normal | 0px | Body text |
| Wide | 1px | Badges, labels, tab bar |
| Wider | 2px | Uppercase headings |

### Typographic Rules

- **Headlines** use Anton in ALL CAPS or title case with `tight` letter spacing
- **Body** uses Inter Regular at `base` (14px) with `normal` spacing
- **Labels & badges** use JetBrains Mono Bold, UPPERCASE, `wide` spacing (1px), at `xs` (10px) or `xxs` (9px)
- **Data/numbers** (prices, percentages) use JetBrains Mono for tabular alignment
- **Brand/logo** text uses BlauerNue ExtraBold (onboarding title, splash)

---

## 4. Spacing System

### Base Grid

The spacing system follows a loose 4px grid:

| Value | Usage |
|-------|-------|
| 2px | Minimal gaps (badge padding vertical) |
| 4px | Extra-small gaps |
| 6px | Small gaps between badges, inline elements |
| 8px | Small padding, inter-element spacing |
| 12px | Card internal padding, medium spacing |
| 16px | Standard padding, section spacing |
| 20px | Medium-large gaps |
| 24px | Screen horizontal padding, large spacing |
| 32px | Section separators |
| 40px | Onboarding page padding |

---

## 5. Shape & Corners

| Context | Radius | Notes |
|---------|--------|-------|
| Small badges, pills | 4-6px | Subtle rounding |
| Cards, containers | 8-12px | Primary surface rounding |
| Buttons, inputs | 12-14px | Interactive element rounding |
| Icon containers | 24px | Circular/capsule shapes |

All corners use **continuous (superellipse) curvature** rather than standard circular rounding, giving a smoother, more iOS-native feel.

### Borders

- Cards: `0.5px` solid (very subtle, barely visible)
- Buttons & badges: `1px` solid
- Decorative containers: `2px` solid
- Empty/placeholder states: `1px` dashed

---

## 6. Component Patterns

### Cards
```
Background:  card color (#111111 dark / #ffffff light)
Border:      0.5px solid cardBorder
Radius:      10-14px continuous
Padding:     12-16px
Shadow:      none (borders only)
```

### Accent Lines (Decorative Dividers)
```
Width:   32-40px
Height:  3px
Radius:  2px
Color:   accent blue (#4C8BD0)
```
Used above section titles and as visual anchors within content.

### Badges / Pills
```
Background:  color + 20% opacity (e.g., #4C8BD020)
Border:      1px solid at 30% opacity
Radius:      4-6px continuous
Padding:     6-8px horizontal, 2-3px vertical
Font:        JetBrains Mono Bold, 9-10px, UPPERCASE
Spacing:     1px letter-spacing
```

### Progress / Sentiment Bars
```
Height:      4px
Radius:      2px
Track:       #1a1a1a (dark) / #e0e0e0 (light)
Fill:        semantic color (positive/negative)
Segments:    1px gap between
```

---

## 7. Iconography

- **Icon set:** Ionicons (via `@expo/vector-icons`)
- **Sizes:** 12px (inline), 16-18px (UI elements), 28px (navigation), 48px (feature icons)
- **Style:** Outline by default, filled for active/selected states
- **Color:** Follows theme tokens — `accent` for active, `textMuted` for inactive

---

## 8. Motion & Interaction

### Animation Timing

| Element | Animation | Delay | Duration |
|---------|-----------|-------|----------|
| Icon containers | Fade In | 200ms | 600ms |
| Titles | Fade In + Slide Up | 400ms | 500ms |
| Accent lines | Fade In | 500ms | 400ms |
| Subtitles | Fade In + Slide Down | 600ms | 500ms |
| Images | Crossfade | 0ms | 300ms |

### Interactive States

- **Press feedback:** Opacity reduces to `0.7` on press
- **Haptic feedback:** Light impact on swipe page changes
- **Image loading:** Blurhash placeholder -> crossfade to loaded image (300ms)

---

## 9. Layout Principles

- **Orientation:** Portrait only
- **Content padding:** 24px horizontal (main content areas)
- **Card-to-card spacing:** 8-16px vertical
- **Full-bleed images:** Edge-to-edge with gradient overlay for text
- **Image aspect ratio:** ~28% of screen height in the swipe feed

### Tab Bar

```
Background:    transparent
Top border:    1px solid border color
Label font:    JetBrains Mono, 10px, UPPERCASE
Spacing:       1px letter-spacing
Active color:  accent (#4C8BD0)
Inactive:      textMuted (#888888)
```

---

## 10. Brand Assets

| Asset | Location | Notes |
|-------|----------|-------|
| App Icon | `apps/mobile/assets/icon.png` | Primary app icon |
| Splash BG | `#030303` | Solid dark background |
| Adaptive Icon BG | `#030303` | Android adaptive icon background |

---

## 11. Usage Guidelines for Designers

### Do

- Use the dark theme as the primary representation in pitch decks
- Pair Anton (headlines) with Inter (body) — never reverse them
- Use BlauerNue ExtraBold only for brand/logo text (e.g. "MIDNIGHT" on onboarding)
- Use the blue accent sparingly for emphasis and CTAs
- Use the mint accent for data-positive states and prediction market features
- Maintain high contrast — the brand is about clarity and readability
- Use JetBrains Mono for anything that looks "technical" — labels, data, status badges

### Don't

- Don't use colors outside the defined palette
- Don't use rounded corners larger than 24px (except full circles)
- Don't use light theme as the default brand presentation — dark is the primary identity
- Don't add drop shadows — the design system uses borders only
- Don't use gradients as background fills — gradients are only for image overlays

### Color Pairing Quick Reference

| Combination | When to use |
|-------------|-------------|
| Blue on dark (`#4C8BD0` on `#030303`) | Primary CTAs, branding |
| Mint on dark (`#00D4AA` on `#030303`) | Prediction/market features |
| White on dark (`#f0f0f0` on `#030303`) | Standard content |
| Green text (`#00ff66`) | Positive price changes |
| Red text (`#E60000`) | Negative price changes |
| Bold labels on badges | Category tags, status indicators |

---

## 12. Pitch Deck Recommendations

### Slide Backgrounds
- Primary: `#030303` (dark)
- Alternative: `#111111` (slightly lifted for variety)
- Light accent slide: `#f5f5f5` (for contrast/variety)

### Text on Slides
- Titles: Anton, `#f0f0f0`, large (40-80px range)
- Body: Inter Regular/SemiBold, `#cccccc`, 18-24px
- Data callouts: JetBrains Mono Bold, `#00D4AA` or `#4C8BD0`
- Fine print: Inter Light, `#888888`

### Accent Usage
- Use `#4C8BD0` blue for key metrics, CTAs, and emphasis
- Use `#00D4AA` mint for data visualizations, charts, positive metrics
- Use `#00ff66` for growth/positive callout numbers
