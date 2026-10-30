# Contributing to CollegeGradez

Thank you for helping improve CollegeGradez. The project is in beta, so
focused bug fixes, usability improvements, documentation, and tests are
especially valuable.

## Before opening an issue

- Search existing issues first.
- Include the application version and Windows version.
- Describe the steps to reproduce the problem.
- Remove personal grade data, exported JSON, screenshots, and other sensitive
  information before attaching anything.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of
  opening a public issue.

## Development workflow

1. Fork the repository and create a focused branch.
2. Install Node.js 24 or a compatible current Node.js release.
3. Install dependencies with `npm install`.
4. Make the smallest change that addresses the issue.
5. Add or update focused tests for behavior changes.
6. Run:

   ```sh
   npm test
   npm run lint
   npm run format:check
   npm run dist:dir
   ```

7. Open a pull request describing the user-visible change and validation.

Keep grade and GPA calculations in `calc.js`, saved-data validation in
`data-schema.js`, Electron main-process and IPC behavior in `main.js` and
`preload.js`, and browser UI behavior in `renderer.js`. Preserve compatibility
with existing saved and exported JSON data.

## Pull requests

Keep pull requests focused and explain any changes to persisted data,
calculation behavior, Electron security settings, or packaging. Do not include
personal grade data, credentials, generated installers, `node_modules`, or
local development artifacts.
