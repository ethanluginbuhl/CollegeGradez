# CollegeGradez

A college grade calculator that is hopefully better than a spreadsheet

## Features to Implement

- Add undo and redo features
- Current grade and the grade needed on remaining work to hit a target
- Semester and cumulative GPA, with a toggle for 4.0 vs. plus/minus scales
- Dragging to reorder courses, assignments, etc.
- Dynamic syllabus ingestion to automatically set grading policies
- One-click grade import from a screenshot

## Data safety

Use the **Export** button on the Courses screen to save a portable JSON copy of
your grade data. **Import** validates the selected JSON file and asks for
confirmation before replacing the current courses.

The app also creates timestamped backups before each local save and keeps the
10 most recent backups alongside its local data file.

## Issues to Fix

- None for now!

## Things to Address Before Shipping

- Integrate code formatting with Prettier and ESLint

## Steps to Get Started with Development

1. Make sure node.js and git are installed on your device
2. Clone the repository to your desired location
3. `npm install`
4. `npm start`

## Checks

- `npm test` runs the calculation and saved-data validation tests
- `npm run lint` checks JavaScript with ESLint
- `npm run format:check` checks formatting with Prettier
- `npm run format` formats supported project files

## How to Update Packages

Latest compatible versions: `npm update`  
For security fixes: `npm audit fix`  
With breaking changes (probably don't do this): `npm audit fix --force`
