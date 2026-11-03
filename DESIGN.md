---
name: CollegeGradez
description: A practical, local-first grade tracker with calm paper surfaces and clear academic status.
colors:
  canvas: "#f4f1ea"
  paper: "#fffdf8"
  ink: "#1a252c"
  muted: "#5c6776"
  line: "#d9d2c5"
  accent: "#0066cc"
  accent-hover: "#0052a3"
  danger: "#a33b3b"
  danger-hover: "#822e2e"
  white: "#ffffff"
  success-surface: "#e8f5e8"
  success-border: "#9ecb9e"
  error-surface: "#f8ecec"
  error-border: "#d9aaaa"
  ghost-hover: "#e8f3ef"
typography:
  display:
    fontFamily: "Segoe UI, Tahoma, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Segoe UI, Tahoma, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Segoe UI, Tahoma, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI, Tahoma, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "18px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "18px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
---

## Overview

**Creative North Star: "The Calm Gradebook."**

CollegeGradez uses a quiet, practical desktop-tool language: warm off-white
canvas, paper-like cards, and a single clear blue action color. The interface
should feel dependable while a student is entering live academic information,
with status and calculation results easy to scan rather than theatrically
presented.

The visual system is intentionally restrained. Rounded containers, thin warm
dividers, and a diffuse low shadow create separation without making the
workspace feel heavy. Use the existing hierarchy and spacing rhythm to keep
course editing useful at both wide and narrow window sizes.

**Key Characteristics:**
- Warm canvas with near-white paper surfaces.
- Blue primary actions and grade/GPA emphasis.
- Segoe UI system typography with compact headings.
- Thin beige borders and a single ambient shadow vocabulary.
- Responsive layouts that stack secondary GPA and policy information below the
  primary editing content.

## Colors

- **Canvas:** `#f4f1ea` is the application background.
- **Paper:** `#fffdf8` is used for cards, panels, summaries, and dialogs.
- **Ink:** `#1a252c` is the primary text color.
- **Muted:** `#5c6776` supports labels, help text, metadata, and empty states.
- **Line:** `#d9d2c5` defines card, field, and button boundaries.
- **Accent:** `#0066cc` marks primary actions, grades, GPA values, and links.
- **Accent hover:** `#0052a3` is the stronger action state.
- **Danger:** `#a33b3b` and **Danger hover:** `#822e2e` are reserved for
  destructive actions and destructive dialog states.
- **Feedback:** success uses `#e8f5e8` / `#9ecb9e`; errors use
  `#f8ecec` / `#d9aaaa`.

**The One Accent Rule.** Keep blue as the dominant interactive and academic
status signal. Do not introduce additional saturated accents for ordinary
categories or decoration.

## Typography

Use the system stack `"Segoe UI", Tahoma, sans-serif` throughout. The product
has no display/body font contrast; hierarchy comes from size, weight, color,
and spacing.

- **Application title:** `1.85rem`, regular, with `-0.02em` tracking.
- **Section and course titles:** default heading sizing or `1.15rem` for course
  cards.
- **Body:** `1rem` with comfortable default line height.
- **Labels and helper text:** approximately `0.86rem` to `0.92rem`, usually
  muted.
- **Grade/GPA values:** approximately `1.4rem` to `1.8rem`, bold, accent blue.

**The Clarity Hierarchy Rule.** Reserve the largest or heaviest text for the
product title and calculated results; supporting copy stays muted and compact.

## Layout

The main application container is centered with a maximum width of `920px`,
`28px 24px 64px` padding, and a compact vertical rhythm. Major sections use
`16px` gaps; header actions use `8px` gaps.

The home view uses a course list beside a `320px` to `360px` policy sidebar.
The course view uses a `320px` to `360px` GPA sidebar beside the flexible grade
editor. At widths below `850px`, these layouts become a vertical flex stack
with primary editing content first and secondary summaries or policy controls
second. At widths below `720px`, horizontal padding reduces to `14px` and
assignment tables become labeled stacked rows.

**The Primary Work First Rule.** Keep the course editor and course list ahead of
secondary GPA, policy, and explanatory panels when the layout stacks.

## Elevation & Depth

The system uses tonal layering and one restrained shadow:

```css
box-shadow: 0 8px 24px rgba(28, 36, 48, 0.08);
```

Cards, panels, summaries, course metadata, and dialogs use this ambient shadow
with a `1px` warm border. Nested assignment groups use a border and white
background without a shadow. Avoid layered shadows or dramatic floating
effects.

## Shapes

Cards and major containers use a `12px` radius. Assignment groups use `10px`;
buttons, inputs, notices, and policy errors use `8px`. Borders are thin and
warm beige rather than high-contrast black. Inputs use white backgrounds,
`1px` line borders, and `8px 10px` internal padding.

## Components

### Buttons

Primary buttons use blue fill, white text, `8px` radius, and `8px 14px` padding.
Ghost buttons are transparent with blue text and a warm border; their hover
surface is `#e8f3ef`. Danger buttons are transparent with red text and a warm
border; their hover surface is `#f8ecec`.

### Cards and Panels

Course cards, panels, summaries, course metadata, and dialogs share the paper
surface, warm border, `12px` radius, ambient shadow, and `18px` padding.
Course cards align the course identity and grade summary with actions on the
right.

### Inputs and Fields

Text, number, and select fields fill their available width, use the white
surface, warm border, `8px` radius, and inherited system typography. Labels
stack above fields with a `6px` gap and muted label text.

### Tables and Assignment Groups

Tables are full width with collapsed borders and compact `6px` row padding.
Column headings are left aligned, muted, and approximately `0.82rem`. Assignment
groups use a white surface, warm border, `10px` radius, and `14px` padding.
Below `720px`, assignment table headings disappear and each cell receives a
visible `data-label`.

### Summaries and Feedback

Grade and GPA values use accent blue and bold weight. Summary supporting rows
are muted and spaced in a compact list. App errors and success notices use
soft tinted surfaces, matching borders, rounded corners, and explicit text;
never represent invalid or incomplete data as a zero value.

### Dialogs

Dialogs cover the viewport with `rgba(28, 36, 48, 0.4)`, center a paper dialog
card with the shared border, radius, shadow, and `20px` padding, and place
actions at the lower right.

## Do's and Don'ts

### Do:
- **Do** use the established warm canvas, paper surfaces, beige borders, and
  blue action hierarchy.
- **Do** keep calculated grades and GPA visually prominent but compact.
- **Do** preserve the two-column desktop layout and stacked narrow-screen
  behavior.
- **Do** make empty, invalid, error, and success states explicit with the
  established muted or soft feedback treatments.
- **Do** use system typography and the existing radius/spacing scale.

### Don't:
- **Don't** add gradients, decorative illustrations, or high-intensity visual
  effects to ordinary editor surfaces.
- **Don't** use the danger red for non-destructive status or primary actions.
- **Don't** replace the paper-card hierarchy with dense dark surfaces or
  unbordered floating elements.
- **Don't** hide secondary GPA or policy information above the primary course
  editing workflow on narrow screens.
- **Don't** treat missing or invalid academic data as a successful numeric
  result.
