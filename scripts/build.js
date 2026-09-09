/**
 * Somtoday Mod (Community Edition) - Build Script
 *
 * This script reads the code in `src/` and builds packages for all platforms in `dist/`:
 * - Chromium extension (dist/chromium/ and dist/chromium.zip)
 * - Firefox add-on (dist/firefox/ and dist/firefox.zip)
 * - Userscript (dist/SomtodayMod.user.js and dist/SomtodayMod.min.user.js)
 *
 * To run: npm run build
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { ZipArchive } = require('archiver');

const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const MIME_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function copyDirRecursive(src, dest, ignoreList = []) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (ignoreList.includes(entry.name)) {
            continue;
        }

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath, ignoreList);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function getFilesRecursively(dir, basePath = '') {
    let results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;

        if (entry.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath, relPath));
        } else {
            results.push({ fullPath, relPath });
        }
    }
    return results;
}

function createZipArchive(sourceDir, outZipPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outZipPath);
        const archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function build() {
    console.log('Starting build...');

    // Clean dist folder
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });

    // Read version info
    const versionInfoPath = path.join(SRC_DIR, 'version_info.json');
    const versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, 'utf8'));
    const version = versionInfo.version;

    // Read manifests
    const chromiumManifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.chromium.json'), 'utf8'));
    const firefoxManifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'manifest.firefox.json'), 'utf8'));

    const ignoredInCopy = [
        'manifest.chromium.json',
        'manifest.firefox.json',
    ];

    // --- BUILD CHROMIUM EXTENSION ---
    console.log('1. Building Chromium extension...');
    const chromiumDir = path.join(DIST_DIR, 'chromium');
    copyDirRecursive(SRC_DIR, chromiumDir, ignoredInCopy);
    chromiumManifest.version = version;
    fs.writeFileSync(path.join(chromiumDir, 'manifest.json'), JSON.stringify(chromiumManifest, null, 4));

    const chromiumVersionInfo = { ...versionInfo, platform: 'Chromium', minified: false };
    fs.writeFileSync(path.join(chromiumDir, 'version_info.json'), JSON.stringify(chromiumVersionInfo, null, 4));

    for (const lang of ['nl', 'en']) {
        const msgPath = path.join(chromiumDir, '_locales', lang, 'messages.json');
        if (fs.existsSync(msgPath)) {
            const msgs = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
            msgs.extVersion = { message: `Somtoday Mod CE Chromium v${version}` };
            fs.writeFileSync(msgPath, JSON.stringify(msgs, null, 4));
        }
    }

    // --- BUILD FIREFOX EXTENSION ---
    console.log('2. Building Firefox extension...');
    const firefoxDir = path.join(DIST_DIR, 'firefox');
    copyDirRecursive(SRC_DIR, firefoxDir, ignoredInCopy);
    firefoxManifest.version = version;
    fs.writeFileSync(path.join(firefoxDir, 'manifest.json'), JSON.stringify(firefoxManifest, null, 4));

    const firefoxVersionInfo = { ...versionInfo, platform: 'Firefox', minified: false };
    fs.writeFileSync(path.join(firefoxDir, 'version_info.json'), JSON.stringify(firefoxVersionInfo, null, 4));

    for (const lang of ['nl', 'en']) {
        const msgPath = path.join(firefoxDir, '_locales', lang, 'messages.json');
        if (fs.existsSync(msgPath)) {
            const msgs = JSON.parse(fs.readFileSync(msgPath, 'utf8'));
            msgs.extVersion = { message: `Somtoday Mod CE Firefox v${version}` };
            fs.writeFileSync(msgPath, JSON.stringify(msgs, null, 4));
        }
    }

    // --- BUILD ZIP PACKAGES ---
    console.log('3. Creating ZIP packages for release...');
    await createZipArchive(chromiumDir, path.join(DIST_DIR, 'chromium.zip'));
    await createZipArchive(firefoxDir, path.join(DIST_DIR, 'firefox.zip'));

    // --- BUILD USERSCRIPT ---
    console.log('4. Generating Userscript...');
    const contentScripts = chromiumManifest.content_scripts[0].js;
    let userscriptBody = '';
    for (const scriptFile of contentScripts) {
        const scriptContent = fs.readFileSync(path.join(SRC_DIR, scriptFile), 'utf8');
        userscriptBody += scriptContent + '\n';
    }

    // Insert CSS
    const cssFiles = chromiumManifest.content_scripts[0].css;
    let concatenatedCss = '';
    for (const cssFile of cssFiles) {
        concatenatedCss += fs.readFileSync(path.join(SRC_DIR, cssFile), 'utf8');
    }
    // Prepare CSS: remove newlines, collapse spaces, escape single quotes
    const preparedCss = concatenatedCss
        .replace(/\r?\n|\r/g, '')
        .replace(/'/g, "\\'")
        .replace(/\s+/g, ' ');

    userscriptBody = userscriptBody.replace(
        '// [GENERATION] APPLY_STYLES',
        `tn('head', 0).insertAdjacentHTML('beforeend', '<style>${preparedCss}</style>');`
    );

    // Build fileMap with Base64 assets
    const fileMap = {};
    const accessibleResources = chromiumManifest.web_accessible_resources[0].resources;

    for (const res of accessibleResources) {
        const cleanRes = res.replace('/*', '');
        if (cleanRes === 'sounds') continue; // Sound effects are hosted externally for userscript

        const targetPath = path.join(SRC_DIR, cleanRes);
        if (fs.existsSync(targetPath)) {
            if (fs.statSync(targetPath).isDirectory()) {
                const files = getFilesRecursively(targetPath, cleanRes);
                for (const { fullPath, relPath } of files) {
                    const buffer = fs.readFileSync(fullPath);
                    const mime = getMimeType(fullPath);
                    fileMap[relPath] = `data:${mime};base64,${buffer.toString('base64')}`;
                }
            } else if (cleanRes !== 'version_info.json') {
                const buffer = fs.readFileSync(targetPath);
                const mime = getMimeType(targetPath);
                fileMap[cleanRes] = `data:${mime};base64,${buffer.toString('base64')}`;
            }
        }
    }

    // Add version_info to fileMap
    const userscriptVersionInfo = {
        ...versionInfo,
        platform: 'Userscript',
        minified: false
    };
    fileMap['version_info.json'] = `data:application/json;base64,${Buffer.from(JSON.stringify(userscriptVersionInfo)).toString('base64')}`;

    const userscriptWithFileMap = userscriptBody.replace(
        '// [GENERATION] DEFINE_FILEMAP',
        `fileMap = ${JSON.stringify(fileMap, null, 2)};`
    );

    const matches = chromiumManifest.host_permissions.map(h => `// @match        ${h}`).join('\n');
    const currentYear = new Date().getFullYear();

    const getHeader = (isMinified) => {
        const scriptFileName = isMinified ? 'SomtodayMod.min.user.js' : 'SomtodayMod.user.js';
        const downloadUrl = `https://github.com/Bjarnos/Somtoday-Mod-CE/releases/latest/download/${scriptFileName}`;
        return `// ==UserScript==
// @name         Somtoday Mod (Community Edition)${isMinified ? ' (Minified)' : ''}
// @namespace    https://github.com/Bjarnos/Somtoday-Mod-CE
// @version      ${version}
// @description  Give Somtoday a new look with this Community Edition script.
// @author       Jona Zwetsloot, Bjarnos & Community
${matches}
// @icon         https://raw.githubusercontent.com/Bjarnos/Somtoday-Mod-CE/main/src/icon128.png
// @updateURL    ${downloadUrl}
// @downloadURL  ${downloadUrl}
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// ==/UserScript==

// SOMTODAY MOD (COMMUNITY EDITION)${isMinified ? ' - MINIFIED' : ''}
// Somtoday Mod (c) 2023-${currentYear} by Jona Zwetsloot, Bjarnos & Community is licensed under CC BY-NC-SA 4.0
// This means you are free to edit and share this code if you attribute the creator.
// You also have to use the same license and you are not allowed to use this software for commercial purposes.

// NOTICE: THIS FILE IS GENERATED AUTOMATICALLY. Any manual changes will be overwritten on next build.
// Repository: https://github.com/Bjarnos/Somtoday-Mod-CE

`;
    };

    const fullUserscript = getHeader(false) + userscriptWithFileMap;
    const userscriptPath = path.join(DIST_DIR, 'SomtodayMod.user.js');
    fs.writeFileSync(userscriptPath, fullUserscript, 'utf8');

    // Minify userscript with esbuild
    console.log('Minifying Userscript with esbuild...');
    const minifiedVersionInfo = {
        ...versionInfo,
        platform: 'Userscript',
        minified: true
    };
    const minifiedFileMap = { ...fileMap };
    minifiedFileMap['version_info.json'] = `data:application/json;base64,${Buffer.from(JSON.stringify(minifiedVersionInfo)).toString('base64')}`;

    const userscriptWithMinifiedFileMap = userscriptBody.replace(
        '// [GENERATION] DEFINE_FILEMAP',
        `fileMap = ${JSON.stringify(minifiedFileMap)};`
    );

    const minifiedResult = await esbuild.transform(userscriptWithMinifiedFileMap, {
        minify: true,
        legalComments: 'inline',
    });

    const fullMinifiedUserscript = getHeader(true) + minifiedResult.code;
    const minUserscriptPath = path.join(DIST_DIR, 'SomtodayMod.min.user.js');
    fs.writeFileSync(minUserscriptPath, fullMinifiedUserscript, 'utf8');

    console.log('Build completed successfully!');
}

build().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});
