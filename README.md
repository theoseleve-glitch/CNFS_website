# Centrale Nantes Formula Student — Website

Multi-page static website prototype for **Centrale Nantes Formula Student (CNFS)**, the student motorsport team at Centrale Nantes. The project introduces the team, explains Formula Student, presents the racing project and gives partners a route to get in touch.

**Status:** Website prototype / development repository. This repository contains a static site; it is not a vehicle simulation or race-car control system.

## What is included

- Landing page and dedicated About, Formula Student, Project, Partners and Contact pages
- Events and News page files are included in the source; their navigation entries are currently hidden
- Responsive HTML/CSS layouts, custom visual design and frontend interactions
- Asset folders for media, CSS and JavaScript
- A small, dependency-free Node.js script that copies the source into `dist/` and performs basic CSS/JS size reduction

## Quick start

**Requirements:** Node.js and npm. `npm start` uses `npx serve`, which may download the `serve` package on first use.

```bash
git clone https://github.com/theoseleve-glitch/CNFS_website.git
cd CNFS_website
npm start
```

Open **http://localhost:3000**.

To generate static distributable files:

```bash
npm run build
```

The build script writes to `dist/`. You can serve that folder with any static web server, or inspect `dist/index.html` and its companion pages. The project does not require a database or API server.

## Project structure

```text
src/
  index.html             Landing page
  about.html             Team introduction
  formula-student.html   Competition explainer
  project.html           The vehicle project
  partners.html          Partner information
  events.html            Events
  news.html              News
  contact.html           Contact
  css/                   Styles
  js/                    Frontend scripts
  assets/                Static media
scripts/
  build.js               Static production build
  *.py                   Content and animation development helpers
```

## Build and quality checks

```bash
npm run build
```

A minimal GitHub Actions workflow runs this build on pushes and pull requests. Note that the build script uses lightweight, regular-expression-based transformations rather than a full JavaScript parser/minifier; production bundles should be manually reviewed where JavaScript syntax could be affected.

## How to contribute

Please open an issue explaining the change and expected behavior before submitting larger modifications. When opening a pull request, include before/after screenshots for visual changes, explain how you tested the pages and keep external links and images accessible.

## Scope and attribution

This is a technical website project associated with CNFS. Team marks, imagery and third-party assets may have separate ownership or usage requirements. Consult the project maintainers before reusing them, even when reading or adapting the source code.
