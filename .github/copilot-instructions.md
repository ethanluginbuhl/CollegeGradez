# CollegeGradez Project Guidelines

CollegeGradez is a Windows desktop grade tracker and GPA calculator built with
Electron. It is a local-first alternative to maintaining grades in a
spreadsheet.

## Working style

- Inspect the relevant files, tests, and existing patterns before making
  changes. Treat the repository and its tests as the source of truth.
- Make precise, complete changes that address the request without unrelated
  cleanup or speculative refactors.
- Ask for clarification when requirements or expected behavior are ambiguous.
  If the request is sufficiently clear, proceed and state any reasonable
  assumptions.
- Do not guess about behavior, APIs, or requirements. Say what is unknown and
  verify it where practical.
- Surface errors explicitly; do not hide failures behind silent defaults or
  success-shaped fallbacks.
- Offer useful follow-up suggestions or alternatives when they could help, but
  ask before applying work that is outside the request.
- Prefer existing helpers, automations, package scripts, and project
  conventions over introducing new dependencies or patterns.
- Keep responses concise and include the files changed, validation performed,
  and any remaining limitations.

## Tech stack and architecture

- Use the existing vanilla JavaScript, HTML, and CSS patterns. Do not add a
  framework for a localized feature.
- Keep grade and GPA calculations in `calc.js`.
- Keep persisted-data validation and compatibility logic in `data-schema.js`.
- Keep Electron main-process and IPC behavior in `main.js` and `preload.js`.
- Keep browser UI behavior in `renderer.js`; keep structure in `index.html` and
  presentation in `styles.css`.
- Preserve Electron's context isolation, sandboxing, and narrow preload API.
- Preserve compatibility with existing `grades.json` files and exported JSON
  whenever the data shape changes. Add focused validation or migration tests
  for new fields and formats.
- Keep calculations deterministic. Represent incomplete or invalid states
  explicitly in the UI rather than treating them as zero or success.
- Preserve responsive behavior: the central grade editor must remain usable on
  narrow screens, and secondary GPA information may stack below it.

## Development workflow

1. Read the relevant implementation and tests, then make the smallest coherent
   change across every affected surface.
2. Update directly related documentation when behavior, data formats, or
   workflows change.
3. Add or update focused tests before relying on the full suite.
4. Run the smallest relevant checks:
   - `npm test` for calculation or saved-data changes
   - `npm run lint` for JavaScript changes
   - `npm run format:check` for changed supported files
   - `npm run dist:dir` for runtime files, `package.json`, Electron
     configuration, or packaging changes
5. Report the exact commands run and any environment blocker if a check cannot
   complete.

Use `npm run format` to format supported project files. Use Windows-style
paths in shell commands and preserve the existing context-isolated,
sandboxed Electron security model.

## Review workflow

After implementation and relevant validation pass, and immediately before
committing or opening a pull request, recommend that the user run the
`CollegeGradez Diff Reviewer` agent. Do not invoke it automatically. Treat the
reviewer as a second-pass review of the current diff, not a replacement for
tests, linting, formatting, packaging checks, or CI.
