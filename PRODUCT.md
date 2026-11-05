# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

College students managing their current courses, assignments, grades, and GPA.

## Product Purpose

CollegeGradez is a practical local-first grade tracker and GPA calculator that
helps students understand their current academic standing without maintaining
a spreadsheet. Success means students can enter and review course work,
calculate grades and GPA transparently, and keep a portable backup of their
data.

## Positioning

CollegeGradez is a privacy-first alternative to a spreadsheet: it combines
course and assignment tracking with explicit weighted or points-based grade
calculations, configurable grading policies, and transparent GPA eligibility
rules while keeping academic data local.

## Operating Context

Students use the Windows desktop application while managing active courses and
assignments. They may need to review live course summaries, estimate outcomes,
configure an institution's grading policy, and preserve or move their records
between installations using exported JSON backups.

## Capabilities and Constraints

- Track multiple courses, categories, and assignments.
- Calculate grades using weighted categories or total points.
- Drop the lowest scored assignments within a category.
- Show course grade summaries and overall GPA.
- Configure default grading policies with custom percentage thresholds, letter
  grades, and grade points.
- Override the default grading policy for an individual course.
- Weight GPA by course credits and explicitly exclude incomplete or ineligible
  courses rather than treating them as zero.
- Save data locally, create timestamped backups, and import or export portable
  JSON after validation and confirmation.
- Preserve invalid saved data for recovery instead of silently replacing it.
- Preserve compatibility with existing saved `grades.json` files and exported
  JSON as the data shape evolves.
- Preserve the context-isolated, sandboxed Electron security model and narrow
  preload API.
- The application is Windows-focused and built with Electron.
- The product does not require an account and does not currently send grade
  data or telemetry to a server.

## Brand Commitments

- The product name is CollegeGradez.
- The product should remain practical, privacy-first, and transparent about
  calculations and data handling.
- The project is open source under the MIT license.

## Evidence on Hand

- Existing product implementation in the repository, including `index.html`,
  `renderer.js`, `styles.css`, `calc.js`, `data-schema.js`, `main.js`, and
  `preload.js`.
- Existing usage and data-safety documentation in `README.md`.
- Existing Windows Electron packaging configuration in `package.json`.
- No account, telemetry, or remote grade-data service is part of the current
  product.

## Product Principles

1. Keep academic data under the student's control.
2. Make grade and GPA calculations understandable and deterministic.
3. Make incomplete, invalid, or excluded states explicit rather than silently
   treating them as zero or success.
4. Preserve students' existing data and provide safe recovery paths.
5. Keep everyday course editing practical and keyboard-friendly.

## Accessibility & Inclusion

Accessible editing, clear validation messages, and keyboard-friendly workflows
are durable requirements for future work.
