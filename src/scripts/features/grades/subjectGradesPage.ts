import { get } from "../../save_version_management";
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
}

// Manage calculation tool and graph on subject grades page
export function subjectGradesPage() {
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
