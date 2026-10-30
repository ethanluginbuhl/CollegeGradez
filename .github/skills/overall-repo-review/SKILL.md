---
name: overall-repo-review
description: "Review the CollegeGradez repository for correctness, regressions, packaging issues, security risks, maintainability concerns, and missing validation."
argument-hint: "Optional focus area, changed files, issue, or release context"
user-invocable: true
disable-model-invocation: true
---

Perform an overall review of the CollegeGradez repository. This is a review
task: do not modify files, create commits, or make unrelated cleanup changes
unless the user explicitly asks for implementation.

## Review approach

1. Inspect the worktree and repository structure before drawing conclusions.
2. Read the relevant source, tests, package configuration, CI workflow, README,
   and current diff when one exists. If the user supplied a focus area or
   changed-file list, prioritize it while still checking tightly coupled
   behavior.
3. Trace behavior across the application rather than reporting issues from
   isolated lines:
   - Keep grade and GPA calculations in `calc.js`.
   - Check persisted-data validation and compatibility in `data-schema.js` and
     `persistence.js`.
   - Check Electron main-process and IPC behavior in `main.js` and `preload.js`.
   - Check renderer behavior, DOM updates, error handling, accessibility, and
     responsive layouts in `renderer.js`, `index.html`, and `styles.css`.
4. Pay particular attention to:
   - Incorrect grade, GPA, weighting, dropping, or incomplete-course behavior.
   - Saved-data and exported-JSON compatibility, validation gaps, corruption
     recovery, atomic writes, and backup retention.
   - Context isolation, sandboxing, preload API narrowness, IPC input
     validation, unsafe HTML/data flows, and exposed filesystem capabilities.
   - Packaging completeness: every runtime file imported by the Electron app
     must be included in the electron-builder configuration. Check the
     unpacked build or ASAR contents when practical.
   - Missing focused tests, CI gaps, release/distribution risks, and
     documentation that contradicts the implementation.
   - Narrow viewport behavior and whether invalid or incomplete states are
     explicit instead of silently treated as valid or zero.
5. Search for prior art and existing helpers before suggesting new abstractions.
   Do not report formatting or stylistic preferences unless they create a
   concrete correctness or maintenance risk.
6. Run the smallest relevant existing checks, escalating to the full suite as
   needed:
   - `npm test`
   - `npm run lint`
   - `npm run format:check`
   - `npm run dist:dir` for packaging or release-related concerns

## Output

Start with a concise overall assessment. Report only meaningful findings,
ordered by severity and then confidence, using this table:

| #   | Severity | File              | Lines | Finding and impact             | Recommended fix      | Confidence |
| --- | -------- | ----------------- | ----- | ------------------------------ | -------------------- | ---------- |
| 1   | High     | `path/to/file.js` | 10-15 | Concrete issue and user impact | Minimal surgical fix | 9/10       |

Use `Critical`, `High`, `Medium`, or `Low` severity. Include exact file paths
and line numbers. Distinguish confirmed issues from risks that require
additional context, and do not inflate severity for hypothetical concerns.

After the table, include:

- Validation commands run and their results.
- A short list of worthwhile improvements that are not defects, clearly
  separated from confirmed findings.
- Any context or product decisions needed from the user.

If no meaningful findings exist, say so plainly and still list the validation
commands and any remaining release or testing caveats.
