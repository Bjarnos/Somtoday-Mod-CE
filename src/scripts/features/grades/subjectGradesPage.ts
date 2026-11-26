import { get, set } from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    execute,
    id,
    n,
    tn,
    tryRemove,
} from "../../shorthand_functions";
import {
    insertCalculationTool,
    subjectGradesPageContainsNumberGrades,
} from "./average";
import { downloadGrades } from "./download";
import { gradeGraphs } from "./graphs";

// Check if latest grades page or average grades page is open
export function insertGradeDownloadButton() {
    if (
        (tn("sl-resultaat-item", 0) ||
            tn("sl-vakgemiddelde-item", 0) ||
            tn("sl-cijfer-overzicht", 0)) &&
        n(tn("sl-vakresultaten", 0)) &&
        get("bools").charAt(BOOL_INDEX.GRADE_DOWNLOAD_BTN) == "1"
    ) {
        if (
            n(id("mod-grades-download-computer")) &&
            tn("hmy-switch-group", 0)
        ) {
            tn("hmy-switch-group", 0).insertAdjacentHTML(
                "beforeend",
                '<a id="mod-grades-download-computer" class="mod-grades-download">' +
                    window.getIcon(
                        "download",
                        null,
                        "var(--fg-primary-normal)",
                    ) +
                    "</a>",
            );
            id("mod-grades-download-computer").addEventListener(
                "click",
                downloadGrades,
            );
        }
        if (
            n(id("mod-grades-download-mobile")) &&
            cn("tabs ng-star-inserted", 0)
        ) {
            if (document.documentElement.clientWidth > 767) {
                cn("tabs ng-star-inserted", 0)
                    .getElementsByClassName("filler")[0]
                    .insertAdjacentHTML(
                        "beforeend",
                        '<a id="mod-grades-download-mobile" class="mod-grades-download">' +
                            window.getIcon(
                                "download",
                                null,
                                "var(--fg-primary-normal)",
                            ) +
                            "</a>",
                    );
                id("mod-grades-download-mobile").addEventListener(
                    "click",
                    downloadGrades,
                );
            } else {
                tn("sl-scrollable-title", 0).insertAdjacentHTML(
                    "beforeend",
                    '<a id="mod-grades-download-mobile" class="mod-grades-download">' +
                        window.getIcon(
                            "download",
                            null,
                            "var(--fg-primary-normal)",
                        ) +
                        "</a>",
                );
                id("mod-grades-download-mobile").addEventListener(
                    "click",
                    downloadGrades,
                );
            }
        }
    }
    insertGradePrivacyButton();
}

// Manage calculation tool and graph on subject grades page
export function subjectGradesPage() {
    insertGradePrivacyButton();
    if (tn("sl-vakresultaten", 0)) {
        execute([insertCalculationTool]);
        const examPage = !n(tn("sl-examenresultaten", 0));
        // Insert graphs + analyse at subject grades page when enabled (2 or more grades need to be present)
        const firstCondition =
            n(id("mod-grades-graphs")) &&
            get("bools").charAt(BOOL_INDEX.SUBJECT_GRAPHS) == "1";
        const secondCondition =
            id("mod-grades-graphs") &&
            ((examPage && id("mod-grades-graphs").dataset.exams == "false") ||
                (!examPage && id("mod-grades-graphs").dataset.exams == "true"));
        if (firstCondition || secondCondition) {
            if (secondCondition) {
                tryRemove(id("mod-grades-graphs"));
            }
            if (!subjectGradesPageContainsNumberGrades()) {
                return;
            }

            tn("sl-vakresultaten", 0).insertAdjacentHTML(
                "beforeend",
                '<div id="mod-cijferanalyse">' +
                    (get("bools").charAt(BOOL_INDEX.GRADE_ANALYSIS) == "1"
                        ? '<h3 style="margin-top: 40px;">Cijferanalyse</h3>' +
                          '<div id="mod-grade-suggestions" style="padding: 15px; margin: 15px 0; background: var(--bg-neutral-none); border-radius: 8px; border: 1px solid var(--border-neutral-weak);">Even geduld, je cijfers worden geanalyseerd...</div>'
                        : "") +
                    "</div>" +
                    '<div id="mod-grades-graphs" data-exams="' +
                    (examPage ? "true" : "false") +
                    '">' +
                    "<h3>Mijn " +
                    (examPage ? "examen" : "") +
                    'cijfers</h3><div><canvas id="mod-chart-1"></canvas></div>' +
                    "<h3>Mijn " +
                    (examPage ? "examen" : "") +
                    'gemiddelde</h3><div><canvas id="mod-chart-2"></canvas></div>' +
                    "</div>",
            );
            setTimeout(() => {
                execute([gradeGraphs]);
            }, 500);
        }
    }
}

const privacyKey = "gradePrivacyEnabled";
const privacySelector = [
    "sl-laatsteresultaten .cijfer",
    "sl-resultaat-item .cijfer",
    "sl-vakgemiddelde-item .cijfer",
    "sl-vakresultaten .cijfer",
    "sl-examenresultaten .cijfer",
    "sl-cijfer-overzicht .vak-row td:not(:first-child)",
    "#mod-grade-suggestions",
    "#mod-grades-graphs canvas",
].join(", ");

let privacyShortcutBound = false;

function gradePrivacyFeatureActive(): boolean {
    const featureEnabled = get("gradePrivacyFeatureEnabled");
    return featureEnabled === true || featureEnabled === "true";
}

function gradePrivacyEnabled(): boolean {
    const value = get(privacyKey);
    return value === true || value === "true";
}

function toggleGradePrivacy() {
    set(privacyKey, !gradePrivacyEnabled());
    updateGradePrivacy();
}

function bindGradePrivacyShortcut() {
    if (privacyShortcutBound) return;
    privacyShortcutBound = true;
    document.addEventListener("keydown", (event) => {
        if (
            event.defaultPrevented ||
            event.ctrlKey ||
            event.metaKey ||
            event.altKey ||
            event.key.toLowerCase() !== "p"
        ) {
            return;
        }
        const target = event.target;
        if (
            target instanceof Element &&
            (target.closest("input, textarea, select, [contenteditable]") ||
                (target instanceof HTMLElement && target.isContentEditable))
        ) {
            return;
        }
        if (
            document.querySelector(
                "dialog[open], sl-modal, #mod-settings-modal",
            ) ||
            !gradePrivacyFeatureActive() ||
            !document.querySelector(".mod-grade-privacy-button")
        ) {
            return;
        }
        event.preventDefault();
        toggleGradePrivacy();
    });
}

function updateGradePrivacy() {
    const enabled = gradePrivacyEnabled();
    document.documentElement.classList.toggle("mod-grade-privacy", enabled);
    document
        .querySelectorAll<HTMLButtonElement>(".mod-grade-privacy-button")
        .forEach((button) => {
            const label = enabled ? "Cijfers tonen" : "Cijfers verbergen";
            button.setAttribute("aria-pressed", String(enabled));
            button.setAttribute("aria-label", label);
            button.title = label;
            const slash = button.querySelector(".mod-grade-privacy-slash");
            if (slash) slash.setAttribute("opacity", enabled ? "1" : "0");
        });
}

window.addEventListener(
    "somtoday-mod-grade-privacy-setting-changed",
    insertGradePrivacyButton,
);

function insertGradePrivacyButton() {
    bindGradePrivacyShortcut();
    if (!gradePrivacyFeatureActive()) {
        document.documentElement.classList.remove("mod-grade-privacy");
        document
            .querySelectorAll(".mod-grade-privacy-button")
            .forEach((button) => {
                button.remove();
            });
        document.getElementById("mod-grade-privacy-style")?.remove();
        return;
    }

    if (!document.getElementById("mod-grade-privacy-style")) {
        const style = document.createElement("style");
        style.id = "mod-grade-privacy-style";
        style.textContent = `
            .mod-grade-privacy-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                width: 44px;
                height: 44px;
                padding: 8px;
                margin-inline: 2px 0;
                border: 0;
                border-radius: 8px;
                background: transparent;
                color: var(--fg-primary-normal);
                cursor: pointer;
                vertical-align: middle;
            }
            .mod-grades-download:has(+ .mod-grade-privacy-button) {
                right: 76px;
            }
            .mod-grades-download + .mod-grade-privacy-button {
                position: absolute;
                right: 20px;
                align-self: center;
                margin: 0;
            }
            sl-laatsteresultaten {
                position: relative;
            }
            sl-laatsteresultaten > .mod-grade-privacy-button {
                position: absolute;
                top: 6px;
                right: 8px;
                margin: 0;
            }
            .mod-grade-privacy-heading {
                display: inline-flex !important;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                gap: 8px;
            }
            .mod-grade-privacy-button:hover,
            .mod-grade-privacy-button[aria-pressed="true"] {
                background: var(--bg-neutral-weakest);
            }
            .mod-grade-privacy-button:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }
            .mod-grade-privacy-button {
                transition: background-color 180ms ease, transform 180ms ease;
            }
            .mod-grade-privacy-button:active {
                transform: scale(.92);
            }
            .mod-grade-privacy-button svg {
                transition: transform 220ms cubic-bezier(.2,.75,.25,1);
            }
            .mod-grade-privacy-button[aria-pressed="true"] svg {
                transform: scale(.94);
            }
            .mod-grade-privacy-slash {
                stroke-dasharray: 26;
                stroke-dashoffset: 26;
                transition: opacity 180ms ease, stroke-dashoffset 220ms ease;
            }
            .mod-grade-privacy-button[aria-pressed="true"] .mod-grade-privacy-slash {
                stroke-dashoffset: 0;
            }
            .mod-grade-privacy-button:hover svg {
                transform: scale(1.08);
            }
            :is(${privacySelector}, #mod-grade-calculate input[type="submit"]) {
                transition: filter 220ms cubic-bezier(.2,.75,.25,1) !important;
            }
            html.mod-grade-privacy :is(${privacySelector}, #mod-grade-calculate input[type="submit"]) {
                filter: blur(12px) grayscale(1) !important;
                transition: filter 140ms cubic-bezier(.2,.75,.25,1) !important;
            }
            html.mod-grade-privacy :is(${privacySelector}, #mod-grade-calculate input[type="submit"]):hover {
                filter: blur(0px) grayscale(0) !important;
                transition: filter 180ms cubic-bezier(.2,.75,.25,1) 200ms !important;
            }
            @media (prefers-reduced-motion: reduce) {
                .mod-grade-privacy-button,
                .mod-grade-privacy-button svg,
                .mod-grade-privacy-slash,
                :is(${privacySelector}, #mod-grade-calculate input[type="submit"]) {
                    transition: none !important;
                }
                html.mod-grade-privacy :is(${privacySelector}, #mod-grade-calculate input[type="submit"]) {
                    transition: none !important;
                }
                html.mod-grade-privacy :is(${privacySelector}, #mod-grade-calculate input[type="submit"]):hover {
                    transition: filter 0s linear 200ms !important;
                }
            }
        `;
        document.head.append(style);
    }

    const gradePage = document.querySelector(
        "sl-laatsteresultaten, sl-resultaat-item, sl-vakgemiddelde-item, sl-cijfer-overzicht, sl-vakresultaten, sl-examenresultaten",
    );
    if (!gradePage) {
        document
            .querySelectorAll(".mod-grade-privacy-button")
            .forEach((button) => {
                button.remove();
            });
        return;
    }

    const downloads = document.querySelectorAll<HTMLElement>(
        ".mod-grades-download",
    );
    const hosts = new Set<Element>();
    downloads.forEach((download) => {
        if (download.parentElement) hosts.add(download.parentElement);
    });
    if (!hosts.size) {
        const host = document.querySelector(
            "hmy-switch-group, sl-scrollable-title",
        );
        if (host) hosts.add(host);
        else if (gradePage instanceof HTMLElement) {
            const heading = gradePage.querySelector(
                ":scope > :is(h1, h2, h3, .titel, .title, .header)",
            );
            if (heading instanceof HTMLElement) {
                heading.classList.add("mod-grade-privacy-heading");
                hosts.add(heading);
            } else {
                hosts.add(gradePage);
            }
        }
    }
    document.querySelectorAll(".mod-grade-privacy-button").forEach((button) => {
        if (!button.parentElement || !hosts.has(button.parentElement))
            button.remove();
    });
    for (const host of hosts) {
        let button = host.querySelector<HTMLButtonElement>(
            ":scope > .mod-grade-privacy-button",
        );
        if (!button) {
            button = document.createElement("button");
            button.type = "button";
            button.className = "mod-grade-privacy-button";
            button.innerHTML =
                '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/><path class="mod-grade-privacy-slash" d="M3 3l18 18" opacity="0"/></svg>';
            button.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleGradePrivacy();
            });
        }
        const download = host.querySelector(".mod-grades-download");
        if (download) {
            if (download.nextElementSibling !== button) {
                download.insertAdjacentElement("afterend", button);
            }
        } else if (button.parentElement !== host) {
            host.append(button);
        }
    }
    updateGradePrivacy();
}
