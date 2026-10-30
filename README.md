# CollegeGradez

[![Checks](https://github.com/ethanluginbuhl/CollegeGradez/actions/workflows/checks.yml/badge.svg)](https://github.com/ethanluginbuhl/CollegeGradez/actions/workflows/checks.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

CollegeGradez is a Windows desktop grade tracker and GPA calculator built with
Electron. It is intended to be a practical, local-first alternative to
maintaining grades in a spreadsheet.

> **Status:** Beta (`0.2.0-beta.1`). The application is usable, but is still in
> the beta phase as development continues. Back up your data before testing
> beta releases.

## Download

Windows installers are published on the
[GitHub Releases page](https://github.com/ethanluginbuhl/CollegeGradez/releases).
The installers are currently unsigned, so Windows SmartScreen may display a
warning. Verify that downloads come from this repository's releases and review
the release notes before installing.

CollegeGradez does not currently provide automatic updates. Download newer
versions manually from the releases page.

## Privacy and data safety

CollegeGradez is local-first:

- It does not require an account.
- Grade data is stored in the application's local Electron user-data directory.
- It does not currently send grade data or telemetry to a server.
- Exported JSON files may contain sensitive academic information. Store and
  share them carefully.

Use the **Export** button to create a portable backup before upgrading or
trying an experimental release. See [SECURITY.md](SECURITY.md) for reporting
security issues.

## What it does today

- Track multiple courses, categories, and assignments.
- Calculate grades using weighted categories or total points.
- Drop the lowest scored assignments within a category.
- Show live course grade summaries and overall GPA.
- Configure a default grading policy with custom percentage thresholds, letter
  grades, and grade points.
- Override the default grading policy for an individual course.
- Weight overall GPA by course credits and clearly exclude incomplete or
  ineligible courses instead of treating them as zero.
- Save data locally and create up to 10 timestamped backups before replacing
  the saved file.
- Export grade data to portable JSON and import it again after schema
  validation and confirmation.
- Preserve invalid saved data for recovery instead of silently replacing it.
- Run in a context-isolated, sandboxed Electron renderer with a narrow preload
  API.

## Roadmap

These are the current feature ideas, in roughly the order that would provide
the most value to students while keeping the app reliable.

### Near-term

- Add undo and redo for course, category, assignment, and grading-policy edits.
- Add a projection tool for the grade needed on remaining work or a final exam
  to reach a target course grade.
- Add course, category, and assignment reordering.
- Add a clear what-if mode so students can test hypothetical scores without
  overwriting saved grades.

### Later

- Organize courses by semester or term and support term GPA versus cumulative
  GPA.
- Add CSV import/export in addition to the existing complete JSON backup format.
- Investigate assisted syllabus or screenshot import, with a review step before
  any extracted data is saved. Imported values should never silently change a
  grading policy.

Before implementing automated imports, prioritize accessible editing,
keyboard-friendly workflows, clear validation messages, and migration tests for
saved-data compatibility. These are foundational for safely adding more
powerful features.

## Data safety

Use the **Export** button on the Courses screen to save a portable JSON copy of
your grade data. **Import** validates the selected JSON file and asks for
confirmation before replacing the current courses.

The app saves to its Electron user-data directory. Before each local save it
creates a timestamped backup and keeps the 10 most recent backups alongside the
local data file. If the saved file is invalid, the original is moved aside for
recovery and the app reports the load failure rather than silently discarding
the data.

## Grading and GPA behavior

The default grading policy is made from ordered percentage thresholds, letter
labels, and grade-point values. It supports schools with or without plus/minus
grades and can be customized to match an institution's policy. A course can
override the default policy.

In weighted mode, categories with no scored assignments are excluded until they
have scores. The remaining scored categories are renormalized, and the course
screen shows the configured and active weight totals when they differ. In
points mode, all scored assignment points are totaled directly. A configured
drop-lowest count only removes scored assignments when enough scores remain.

Courses contribute to the overall GPA only when they have a completed grade and
positive credits. Excluded courses are shown explicitly rather than being
treated as zero.

## Development

### Prerequisites

- Node.js 24 or a compatible current Node.js release
- Git
- Windows for running the packaged desktop application

### Run locally

1. Clone the repository and open its directory.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Start the app:

   ```sh
   npm start
   ```

### Checks

Run the same checks used by GitHub Actions:

```sh
npm test
npm run lint
npm run format:check
npm run dist:dir
```

Use `npm run format` to format supported project files. Calculation logic is
kept in `calc.js`, saved-data validation in `data-schema.js`, Electron main and
IPC behavior in `main.js` and `preload.js`, and browser UI behavior in
`renderer.js`.

## Packaging

Build a Windows installer with electron-builder:

```sh
npm run dist
```

The installer is written to the `release` directory. To create an unpacked
build for local testing without an installer, run:

```sh
npm run dist:dir
```

The release workflow is currently manual. Before publishing a release:

1. Update the version in `package.json` and `package-lock.json`.
2. Run the checks above and test the installer on a clean Windows machine.
3. Create a version tag and GitHub release.
4. Attach the installer and include known limitations in the release notes.

Installers are not code-signed during the beta phase. Code signing and
automatic updates may be added later.

## Contributing

Bug reports, feature ideas, documentation improvements, and code contributions
are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an
issue or pull request. By contributing, you agree to follow the project's
[Code of Conduct](CODE_OF_CONDUCT.md).

## Support the project

If CollegeGradez is useful to you, you can
[support its development through GitHub Sponsors](https://github.com/sponsors/ethanluginbuhl).
Donations are optional and do not affect the application's features or support
priority.

## Project guidance

Repository-specific Copilot guidance is in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md). A
read-only [CollegeGradez reviewer agent](.github/agents/collegegradez-reviewer.agent.md)
is available for focused diff reviews covering calculations, saved-data
compatibility, Electron boundaries, and responsive UI behavior.

## License

CollegeGradez is released under the MIT License.

## Maintenance

Use `npm update` to update compatible dependencies. Review the resulting
lockfile and run the checks above. Use `npm audit fix` for applicable security
updates; review breaking changes before using `npm audit fix --force`.
