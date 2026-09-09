# Contributing

Thank you for considering contributing to this project! Somtoday Mod (Community Edition) is maintained by the community to keep Somtoday customized, fun, and functional for students.

Only pull requests with fully completed and tested features will be merged. Please read this guide before submitting changes.

---

## Table of Contents

- [Core Principles](#core-principles)
- [Local Development Setup](#local-development-setup)
- [Codebase Architecture](#codebase-architecture)
- [How to Add a Feature or Setting](#how-to-add-a-feature-or-setting)
- [Helper & Shorthand Functions Reference](#helper--shorthand-functions-reference)
- [Important Rules & Userscript Compatibility](#important-rules--userscript-compatibility)
- [Code Quality & Tooling](#code-quality--tooling)
- [Pull Request Checklist](#pull-request-checklist)

---

## Core Principles

1. **Only edit files in `src/`**: All extension versions (Chromium, Firefox) and Userscript builds are generated in `dist/` by `scripts/build.js`. Never edit files in `dist/` directly.
2. **Fully completed features**: Pull requests should be tested, complete, and functional. Avoid submitting half-finished or draft PRs.
3. **Always review AI-assisted code**: AI tools can be great aids, but PRs containing blindly pasted, unreviewed AI output with bugs or unnecessary complexity will be closed. Verify every line of code you submit.

---

## Local Development Setup

To test your modifications, build the extension locally and load the unpacked version into your browser.

### 1. Install dependencies

```bash
git clone https://github.com/Bjarnos/Somtoday-Mod-CE.git
cd Somtoday-Mod-CE
npm install
```

`npm install` also initializes **Husky** git hooks automatically to ensure linting and formatting standards before committing.

### 2. Build the project

```bash
npm run build
```

This compiles your `src/` files into `dist/`:
- `dist/chromium/` (Chromium unpacked extension)
- `dist/firefox/` (Firefox unpacked extension)
- `dist/SomtodayMod.user.js` and `dist/SomtodayMod.min.user.js` (Userscript)

### 3. Load into your browser

- **Google Chrome / Chromium / Edge / Brave**:
  1. Navigate to `chrome://extensions` (or `edge://extensions`).
  2. Enable **Developer mode** (toggle in the top-right corner).
  3. Click **Load unpacked** and select the `dist/chromium` folder from this repo.
- **Firefox**:
  1. Navigate to `about:debugging#/runtime/this-firefox`.
  2. Click **Load Temporary Add-on...**.
  3. Select the `dist/firefox/manifest.json` file.

### 4. Development cycle

Whenever you modify files in `src/`:
1. Run `npm run build` in your terminal.
2. Go to your browser's extension management page and click the **Reload** (refresh) icon on Somtoday Mod.
3. Refresh your Somtoday tab to see your changes.

---

## Codebase Architecture

The project is split across several scripts in `src/`:

| File / Directory | Purpose |
| :--- | :--- |
| `src/scripts/shorthand_functions.js` | Helper utilities for DOM manipulation, SVG icons (`window.getIcon`), resource loading, and the `BOOL_INDEX` setting definitions. |
| `src/scripts/save_version_management.js` | Cross-platform persistent storage (`get(key)` and `set(key, value)`). |
| `src/scripts/execute_after_page_load.js` | Entry point executed after page load. Handles autologin, redirects, and triggers `onload` once Somtoday DOM elements exist. |
| `src/scripts/main_functions.js` | Core feature implementations, Somtoday DOM modifications, recap logic, and the settings modal builder (`addSetting`). |
| `src/data/settings.html` | HTML template for the Somtoday Mod in-page settings panel. |
| `src/css/` | All stylesheets. |
| `src/manifest.chromium.json` / `manifest.firefox.json` | Platform-specific extension manifests. |
| `scripts/build.js` | Build script that validates manifests, packs zips, and embeds assets into the standalone userscripts. |

---

## How to Add a Feature or Setting

Most features in Somtoday Mod are configurable via toggles in the Mod Settings panel.

### Adding a Toggle Setting (Boolean Switch)

Boolean settings are indexed inside a compact bitmask string (`bools`) to keep storage lightweight across all platforms.

#### Step 1: Register your flag in `BOOL_INDEX`
Open `src/scripts/shorthand_functions.js` and add a new constant to `BOOL_INDEX`:

```javascript
const BOOL_INDEX = {
    MENU_ALWAYS_SHOW: 0,
    // ...
    GRADE_ANALYSIS: 18,
    MY_NEW_FEATURE: 19, // Use the next available index number
};
```

#### Step 2: Add the toggle to the Settings panel
In `src/scripts/main_functions.js`, find where settings category strings are constructed (search for `{{extra_settings}}` or the relevant category). Add your setting using `addSetting`:

```javascript
addSetting(
    "My New Feature", // Setting title
    "A short explanation of what this feature does.", // Description
    "bools19", // "bools" followed by the two-digit index from BOOL_INDEX
    "checkbox",
    true, // Default value (true = enabled by default, false = disabled)
)
```

#### Step 3: Implement your feature logic
In `src/scripts/main_functions.js` (or in a separate modular function):

1. Check whether your setting is enabled:
   ```javascript
   if (get("bools").charAt(BOOL_INDEX.MY_NEW_FEATURE) === "1") {
       // Your feature logic here
   }
   ```
2. Because Somtoday is a dynamic Single Page Application (SPA), DOM elements are created asynchronously. Always wait for elements rather than accessing them immediately:
   ```javascript
   async function initMyFeature() {
       const targetElement = await waitForElement(".sl-grades-container");
       if (!targetElement) return;

       // Modify the DOM or attach listeners
   }
   ```
3. Wrap your initial call in `execute([initMyFeature])` to ensure error isolation and automatic debug reporting.

### Adding Non-Boolean / Custom Settings

If your feature requires a custom value (e.g. text, color, array, number):
- Use `get("yourSettingKey")` to read from storage.
- Use `set("yourSettingKey", value)` to save to storage.
- You do not need to register custom keys in `BOOL_INDEX`.

---

## Helper & Shorthand Functions Reference

`src/scripts/shorthand_functions.js` provides several convenience functions used throughout the project:

| Function | Description |
| :--- | :--- |
| `waitForElement(selector, timeout = 30000)` | Returns a Promise resolving to the matching DOM element once it exists. Uses `MutationObserver`. |
| `id(elementId)` | Shorthand for `document.getElementById(elementId)`. |
| `cn(className, [index])` | Shorthand for `document.getElementsByClassName(className)`. If `index` is passed, returns that element or `null`. |
| `tn(tagName, [index])` | Shorthand for `document.getElementsByTagName(tagName)`. If `index` is passed, returns that element or `null`. |
| `n(value)` | Returns `true` if the value or element is `null`, `undefined`, `""`, or `"0"`. |
| `show(element)` / `hide(element)` | Sets `display: block` or `display: none` safely. |
| `tryRemove(element)` | Safely removes an element from the DOM if it exists. |
| `setHTML(element, html)` | Safely assigns `innerHTML` if `element != null`. |
| `get(key)` / `set(key, value)` | Cross-platform getter/setter for user settings. |
| `window.getIcon(name, classname, color)` | Returns an inline SVG element for FontAwesome or Topicus icons. |
| `window.getResource(relativePath)` | Returns a URL or Base64 data URI for an asset in `src/` (works across both extension and userscript). |
| `execute([fn1, fn2])` | Executes functions inside a safe `try...catch` wrapper and logs errors gracefully. |

---

## Important Rules & Userscript Compatibility

Somtoday Mod CE compiles into both browser extensions and a standalone Tampermonkey/Greasemonkey userscript. To keep everything compatible:

- **Do not modify or delete `// [GENERATION]` comments**: The build script (`scripts/build.js`) relies on these comments to inline stylesheets and assets for the userscript.
- **Adding new CSS files**: If you create a new CSS file in `src/css/`, remember to add it to both `manifest.chromium.json` and `manifest.firefox.json` under `content_scripts[0].css`.
- **Static assets**: Put new images or fonts into `src/images/` or `src/fonts/`. Always use `window.getResource("images/your-image.png")` instead of referencing chrome-specific URLs directly.
- **Avoid external dependencies**: Keep features lightweight and vanilla JavaScript whenever possible.

---

## Code Quality & Tooling

We use [Biome](https://biomejs.dev/) for fast linting and code formatting.

| Command | Description |
| :--- | :--- |
| `npm run lint` | Checks code for errors, syntax issues, and potential bugs. |
| `npm run lint:fix` | Automatically fixes safe linter errors. |
| `npm run format` | Formats all files according to project style standards. |
| `npm run format:check` | Verifies formatting without altering files (used in CI). |
| `npm run build` | Builds all browser extension packages and userscripts into `dist/`. |

### Git Hooks (Husky)
A pre-commit hook automatically verifies formatting and catches syntax errors before committing. If your commit is blocked, run `npm run lint:fix && npm run format` and try again.

---

## Pull Request Checklist

Before opening a pull request, please make sure:

- [ ] You ran `npm run build` and tested your changes on Somtoday.
- [ ] You tested the feature on at least one browser (Chromium or Firefox).
- [ ] You tested the feature on the userscript (if relevant).
- [ ] `npm run lint` and `npm run format:check` pass without errors.
- [ ] You added before/after screenshots or screen recordings for any visual/UI changes.
- [ ] You referenced any related issue in your PR description (e.g. `Closes #12`).
