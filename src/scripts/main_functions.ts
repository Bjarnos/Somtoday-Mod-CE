// MAIN FUNCTIONS
import {
    browserSettings,
    congratulations,
    consoleMessage,
    easterEggs,
    newYearCountdown,
    registerRecapTrigger,
    updateCheck,
} from "./features/extras";
import {
    editGrades,
    gradeReveal,
    insertGradeDownloadButton,
    subjectGradesPage,
} from "./features/grades";
import { isRecapping, somtodayRecap } from "./features/recap";
import {
    checkNewUser,
    insertModSettingLink,
    openModSettingsDirectly,
    registerReloadCallback,
} from "./features/settings";
import {
    initTheme,
    setBackground,
    style,
    updateCssVariables,
} from "./features/theme";
import {
    modLogo,
    profilePicture,
    rosterSimplify,
    teacherNicknames,
    topMenu,
    userName,
} from "./features/ui";
import { errorPage } from "./minigame";
import { platform, version } from "./save_version_management";
import { cn, execute, id, n, tn, tryRemove } from "./shorthand_functions";

export function modInit() {
    // Make sure to have only one instance of the mod active at a time
    if (id("somtoday-mod-active")) {
        setTimeout(
            console.warn.bind(
                console,
                "SOMTODAY MOD:\nMultiple instances of Somtoday Mod are running.\nSomtoday Mod " +
                    platform +
                    " v" +
                    version +
                    " will not be working until the other instance is deleted or deactivated.",
            ),
        );
        return;
    }

    //! [GENERATION] APPLY_STYLES

    const mathQuestions = [
        "compose the formula of f'x() where f(x) = 2 * sin(9x + 3)",
        "rewrite 2 * log3(243) + 28 to the form of log(a)",
        "find the value(s) of x in the equation x^2 + 9 = -6x",
        "give the point(s) where  12 = 2y + 6x and y = x^2 - 5x intersect (round on 2 decimals)",
        "rewrite -sin(8x) to the form of cos(ax + b)",
    ];
    const mathAnswers = [
        "Answer: f'(x) = 18 * cos(9x + 3)",
        "Answer: log(10^38)",
        "Answer: x = -3",
        "Answer: (-1,65; 10,94), (3,65; -4,94)",
        "Answer: cos(8x + 0.5pi)",
    ];
    const selectedQuestion = Math.floor(Math.random() * mathQuestions.length);
    tn("body", 0).insertAdjacentHTML(
        "beforeend",
        '<div id="somtoday-mod"><div id="somtoday-mod-active" data-platform="' +
            platform +
            '" data-version="' +
            version +
            '"><!-- Well hello there! Great work, detective. --><!-- Nothing better to do? Solve this math question: ' +
            mathQuestions[selectedQuestion] +
            ' --><div data-info="expand-to-view-answer"><!-- ' +
            mathAnswers[selectedQuestion] +
            " --></div></div></div>",
    );

    // Stop script if 502 error occurs
    if (cn("cf-error-details cf-error-502", 0)) {
        setTimeout(
            console.warn.bind(console, "SOMTODAY MOD: Bad gateway (502)"),
        );
        return;
    }

    // Stop script if any other error occurs
    if (tn("sl-error", 0)) {
        setTimeout(console.warn.bind(console, "SOMTODAY MOD: Unknown error"));
        execute([errorPage]);
        return;
    }

    // Stop script if Somtoday has outage
    if (cn("titlewrap", 0)) {
        // Since https://som.today and the error page are very similar, check if the word 'storing' is present on the page
        if (
            cn("titlewrap", 0).parentElement.parentElement.innerHTML.indexOf(
                "storing",
            ) != -1
        ) {
            setTimeout(
                console.warn.bind(
                    console,
                    "Somtoday Mod ERROR\nSomtoday is down.",
                ),
            );
            return;
        }
    }

    let busy = false;

    registerRecapTrigger(() => {
        somtodayRecap(true);
    });

    // Make sure to remove inert on click if needed
    registerReloadCallback(() => {
        execute([updateCssVariables, setBackground, initTheme, modLogo]);
    });

    document.addEventListener("click", () => {
        if (n(id("mod-message")) && tn("sl-root", 0).inert) {
            tn("sl-root", 0).inert = false;
            if (tn("sl-modal", 0)) {
                tn("sl-modal", 0).inert = false;
            }
        }
    });

    // Executes when page changes
    function pageUpdate(updateStyle = true, updateLogo = true) {
        if (busy || isRecapping) {
            return;
        }
        busy = true;
        execute([
            gradeReveal,
            userName,
            teacherNicknames,
            insertModSettingLink,
            insertGradeDownloadButton,
            subjectGradesPage,
            somtodayRecap,
            rosterSimplify,
            newYearCountdown,
            topMenu,
            easterEggs,
            editGrades,
            browserSettings,
            initTheme,
        ]);
        if (updateStyle) {
            execute([updateCssVariables]);
        }
        if (updateLogo) {
            execute([modLogo]);
        }
        // Allow this function to be executed again after 1ms
        setTimeout(() => {
            busy = false;
        }, 1);
    }

    // Execute pageUpdate when page changes
    function addMutationObserver() {
        // If the page panel changes, do pageUpdate.
        const pageobserver = new MutationObserver(() => {
            if (!busy) {
                setTimeout(() => {
                    execute([pageUpdate]);
                }, 5);
            }
        });
        pageobserver.observe(tn("html", 0), {
            attributes: false,
            subtree: true,
            childList: true,
        });
        const darkModeObserver = new MutationObserver(() => {
            setTimeout(() => {
                execute([updateCssVariables]);
            }, 5);
        });
        darkModeObserver.observe(tn("html", 0), {
            attributes: true,
            subtree: false,
            childList: false,
        });
        window.addEventListener("click", () => {
            pageUpdate(false, true);
        });
    }

    // Execute everything
    execute([
        updateCheck,
        checkNewUser,
        setBackground,
        updateCssVariables,
        style,
        addMutationObserver,
        browserSettings,
        congratulations,
        openModSettingsDirectly,
        profilePicture,
        initTheme,
        consoleMessage,
        pageUpdate,
    ]);

    // Allow transitions after 0.4s
    setTimeout(() => {
        tryRemove(id("transitions-disabled"));
    }, 400);
}

(window as any).modInit = modInit;
