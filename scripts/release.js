const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const targetVersion = args[0];
const releaseNotes = args.slice(1).join(" ").trim();

if (!targetVersion) {
    console.error(
        "Usage: npm run release <patch|minor|major|x.y.z> [release notes]",
    );
    process.exit(1);
}

// 1. Run checks
console.log("Running typecheck and lint...");
execSync("npm run typecheck && npm run lint", { stdio: "inherit" });

// 2. Bump package.json and package-lock.json without git commit/tag
execSync(`npm version ${targetVersion} --no-git-tag-version`, {
    stdio: "inherit",
});

// 3. Sync src/version_info.json
const rootDir = path.resolve(__dirname, "..");
const pkg = JSON.parse(
    fs.readFileSync(path.join(rootDir, "package.json"), "utf8"),
);
const newVersion = pkg.version;

const versionInfoPath = path.join(rootDir, "src", "version_info.json");
const versionInfo = JSON.parse(fs.readFileSync(versionInfoPath, "utf8"));
const now = new Date();
const day = String(now.getDate()).padStart(2, "0");
const month = String(now.getMonth() + 1).padStart(2, "0");
const year = now.getFullYear();

versionInfo.version = newVersion;
versionInfo.version_name = newVersion;
versionInfo.last_update = `${day}-${month}-${year}`;

fs.writeFileSync(
    versionInfoPath,
    `${JSON.stringify(versionInfo, null, 4)}\n`,
    "utf8",
);
console.log(
    `Synced version ${newVersion} (${versionInfo.last_update}) to src/version_info.json`,
);

// 4. Git commit with clean "Version bump" message
execSync("git add package.json package-lock.json src/version_info.json", {
    stdio: "inherit",
});
execSync(`git commit -m "Version bump to ${newVersion}"`, { stdio: "inherit" });

// 5. Git tag with release notes
const tagMessage = releaseNotes || `Release v${newVersion}`;
execSync(`git tag -a v${newVersion} -m "${tagMessage.replace(/"/g, '\\"')}"`, {
    stdio: "inherit",
});

console.log(
    `\nSuccessfully created version bump commit and tag v${newVersion}!`,
);
console.log("Run 'git push --follow-tags' to publish.");
