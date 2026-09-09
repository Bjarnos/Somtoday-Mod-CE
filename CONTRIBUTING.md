# Contributing
Thank you for considering contributing to this project! Only pull requests with fully completed features will be merged. I might request you to modify parts of the code in your pull request.

<br>

## Tips

- *If you want to contribute to Somtoday Mod CE, **you'll need to install the browser extension locally**. Either the Chromium or Firefox version.*
  - To do this, follow the steps described in README.md
- *Only modify one version of the code*
  - So if you're using Firefox, do not modify the Chromium version, and vice-versa
  - The other versions are automatically generated when I run the generation process
- *Do not touch the `// [GENERATION]` comments*
  - These are needed for the automatic code generation for the userscript versions
- *Try to keep the file structure roughly the same*
  - It's not bad if you add files, but reorganizing the whole project is just a pain, since the generation process depends on the current structure
- *Always review AI content*
  - Yes, AI is very good at writing code. However, do not just create a pull request with fully AI generated content. Always review what the AI did, and if it's logical.

## Development & Code Quality

### 1. Setup
Run `npm install` after cloning. This installs dependencies and automatically initializes **Husky** git hooks via the `prepare` script:
```bash
npm install
```

### 2. Linting & Formatting

This project uses Biome to maintain code quality and consistent formatting:

• `npm run lint`: Checks for syntax issues and bugs.
• `npm run lint:fix`: Automatically fixes safe linter issues.
• `npm run format`: Automatically formats the repository according to project standards.
• `npm run build`: Builds all extension packages and userscripts into `dist/`.

### 3. Git Hooks (Husky)

Husky runs `npm run lint` automatically before you commit or push. If there are syntax or lint errors, the commit/push will be blocked until resolved. All PRs are also verified automatically in GitHub Actions CI.
