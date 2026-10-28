# CollegeGradez

A college grade calculator that is hopefully better than a spreadsheet

## Features to Implement

- Add undo and redo features
- Current grade and the grade needed on remaining work to hit a target
- Dragging to reorder courses, assignments, etc.
- Dynamic syllabus ingestion to automatically set grading policies
- One-click grade import from a screenshot

## Data safety

Use the **Export** button on the Courses screen to save a portable JSON copy of
your grade data. **Import** validates the selected JSON file and asks for
confirmation before replacing the current courses.

The app also creates timestamped backups before each local save and keeps the
10 most recent backups alongside its local data file.

## GPA grading policies

The Courses screen includes a default grading policy made from ordered
percentage thresholds, letter labels, and grade-point values. This supports
schools with or without plus/minus grades and lets you use institution-specific
thresholds. A course can override the default policy, and its credits determine
its weight in the overall GPA. Courses without a completed grade or positive
credits are shown as excluded instead of being treated as zero.

In weighted mode, categories with no scored assignments are excluded until they
have scores. The remaining scored categories are renormalized, and the course
screen shows the configured and active weight totals when they differ.

## Things to Address Before Shipping

- Obtain a Windows code-signing certificate
- Create and publish installers

## Steps to Get Started with Development

1. Make sure node.js and git are installed on your device
2. Clone the repository to your desired location
3. `npm install`
4. `npm start`

## Packaging

Build a Windows installer with electron-builder:

1. Run `npm install`
2. Run `npm run dist`
3. Find the installer in the `release` folder

Use `npm run dist:dir` to create an unpacked build for local testing without
creating an installer.

## Checks

- `npm test` runs calculation, saved-data validation, and persistence tests
- `npm run lint` checks JavaScript with ESLint
- `npm run format:check` checks formatting with Prettier
- `npm run format` formats supported project files

These checks also run in GitHub Actions for pushes and pull requests.

## Copilot customization

Repository-specific Copilot guidance is stored in
[`.github/copilot-instructions.md`](.github/copilot-instructions.md). A
read-only [CollegeGradez reviewer agent](.github/agents/collegegradez-reviewer.agent.md)
is also available for focused diff reviews covering calculations, saved-data
compatibility, Electron boundaries, and responsive UI behavior.

## How to Update Packages

Latest compatible versions: `npm update`  
For security fixes: `npm audit fix`  
With breaking changes (probably don't do this): `npm audit fix --force`
