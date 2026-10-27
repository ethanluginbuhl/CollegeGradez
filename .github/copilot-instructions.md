# CollegeGradez Project Guidelines

## Architecture

- Keep grade and GPA calculations in `calc.js`; keep persisted-data validation in
  `data-schema.js`.
- Keep Electron main-process file and IPC behavior in `main.js` and
  `preload.js`; keep browser UI behavior in `renderer.js`.
- Preserve the existing context-isolated, sandboxed Electron security model.
- Preserve compatibility with existing `grades.json` files and exported JSON
  whenever the data shape changes. Add focused validation tests for new fields.

## Code and UI Conventions

- Use the existing vanilla JavaScript, HTML, and CSS patterns. Avoid adding a
  framework or dependency for a localized feature.
- Reuse existing helpers and formatting conventions before adding new ones.
- Keep calculation results deterministic and make incomplete or invalid states
  explicit in the UI rather than silently treating them as zero or success.
- Preserve responsive behavior: the central grade editor remains usable on
  narrow screens, and secondary GPA information may stack below it.
- Do not make unrelated cleanup changes while implementing a feature.

## Validation

- Run `npm test` for calculation and saved-data changes.
- Run `npm run lint` for JavaScript changes.
- Run `npm run format:check` for any changed supported project files.
- Add or update focused tests before relying on a full-suite result.
- If a validation command fails because of the environment, report the exact
  command and blocker rather than skipping it silently.
