// MAIN FUNCTIONS
import {
    adjust,
    getRelativeLuminance,
    hexToRgb,
    toBrightnessValue,
} from "./colors";
import { startConfetti } from "./features/extras/confetti";
import { newYearCountdown } from "./features/extras/countdown";
import { easterEggs, registerRecapTrigger } from "./features/extras/easterEggs";
import { closeModMessage, modMessage } from "./features/extras/modMessage";
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
import { getGoogleFontsUrl } from "./features/theme/fonts";
import {
    startLiveWallpaper,
    stopLiveWallpaper,
} from "./features/theme/liveWallpaper";
import { getBackgroundFilters } from "./features/theme/wallpaper";
import { teacherNicknames } from "./features/ui/teacherNicknames";
import { userName } from "./features/ui/userName";
import { errorPage } from "./minigame";
import {
    contributors,
    get,
    platform,
    set,
    version,
    version_name,
} from "./save_version_management";
import {
    BOOL_INDEX,
    cn,
    execute,
    id,
    n,
    parseJSON,
    sanitizeString,
    setHTML,
    tn,
    tryRemove,
} from "./shorthand_functions";

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

    const today = new Date();
    const dayInt = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    let darkmode =
        tn("html", 0).classList.contains("dark") ||
        tn("html", 0).classList.contains("night");
    let busy = false;
    registerRecapTrigger(() => {
        somtodayRecap(true);
    });
    let menuColor: any;
    let highLightColor: any;
    let menuWidth = n(get("menuwidth")) ? 110 : get("menuwidth");

    // List of all Google Fonts to be loaded
    const fontUrl = getGoogleFontsUrl();

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

    // Write message in the console
    function consoleMessage() {
        setTimeout(
            console.log.bind(
                console,
                "%cSomtoday Mod is geactiveerd!",
                "color:#0067c2;font-weight:bold;font-family:Arial;font-size:26px;",
            ),
        );
        setTimeout(
            console.log.bind(
                console,
                "%cGeniet van je betere versie van Somtoday.\n\nMet dank aan " +
                    Object.keys(contributors).join(", ") +
                    "\nVersie " +
                    version_name +
                    " van Somtoday Mod " +
                    platform,
                "color:#0067c2;font-weight:bold;font-family:Arial;font-size:16px;",
            ),
        );
    }

    function initTheme() {
        const theme = get("theme");
        if (
            (theme == "light" || theme == "dark" || theme == "night") &&
            get("autotheme") !== "true"
        ) {
            const html = document.documentElement;
            html.classList.remove("light", "dark", "night");
            html.classList.add(theme);
        }
    }

    let homeworkBusy = false;
    let homework: any;
    function customHomework() {
        if (n(get("homework"))) {
            set("homework", "[]");
        }
        if (
            get("bools").charAt(BOOL_INDEX.CUSTOM_HOMEWORK) == "1" &&
            !homeworkBusy
        ) {
            if (document.documentElement.clientWidth <= 767) {
                homeworkBusy = true;
                document.querySelectorAll(".mod-huiswerk").forEach((e) => {
                    e.remove();
                });
                document.querySelectorAll(".mod-placeholder").forEach((e) => {
                    e.remove();
                });
                homeworkBusy = false;
            }
            homework = JSON.parse(get("homework"));
            let startIndex = 0;
            for (let i = 0; i < homework.length; i++) {
                if (homework.returning == "0") {
                    startIndex = i;
                    break;
                }
            }
            // STUDIEWIJZER
            // Loop through days on computer
            let index = 0;
            for (const element of tn("sl-studiewijzer-dag")) {
                index = customHomeworkInner(element, index, startIndex);
            }
            // Loop through days on mobile
            index = 0;
            for (const element of tn("sl-studiewijzer-lijst-dag")) {
                index = customHomeworkInner(element, index, startIndex);
            }
            // Loop through week tasks
            index = 0;
            for (const element of tn("sl-studiewijzer-week")) {
                if (element.getElementsByClassName("week")[0]) {
                    index = customHomeworkInner(
                        element.getElementsByClassName("week")[0],
                        index,
                        startIndex,
                    );
                }
            }
            // ROOSTER
            if (tn("sl-rooster-week-header", 0)) {
                // Remove old custom homework first (might belong to different week)
                const elements = document.querySelectorAll(
                    "sl-rooster-week-header .mod-huiswerk",
                );
                elements.forEach((el) => {
                    el.remove();
                });
                // Then add new custom homework
                index = 0;
                for (const element of tn(
                    "sl-rooster-week-header",
                    0,
                ).getElementsByClassName("dag")) {
                    index = customHomeworkInner(element, index, startIndex);
                }
            }
        } else if (!homeworkBusy) {
            homeworkBusy = true;
            document.querySelectorAll(".mod-huiswerk").forEach((e) => {
                e.remove();
            });
            document.querySelectorAll(".mod-add-homework").forEach((e) => {
                e.remove();
            });
            document.querySelectorAll(".mod-placeholder").forEach((e) => {
                e.remove();
            });
            homeworkBusy = false;
        }
    }

    function sortByDate(a: any, b: any) {
        // If weekly or monthly task, position it in the front of the array
        if (a.returning != "0") {
            return -1;
        }
        if (b.returning != "0") {
            return 1;
        }
        // Non-reoccurring tasks are sorted by time after the weekly and monthly tasks
        if (Date.parse(a.date) < Date.parse(b.date)) {
            return -1;
        }
        if (Date.parse(a.date) > Date.parse(b.date)) {
            return 1;
        }
        return 0;
    }

    function ariaLabelToDate(element: any) {
        let dateString: string;
        if (n(element.children[0])) {
            return undefined;
        }
        if (element.getElementsByClassName("header")[0]) {
            element = element.getElementsByClassName("header")[0];
            dateString = `${
                n(element.children[0].ariaLabel) ||
                !element.children[0].ariaLabel.match(/ (\d*? [a-z]*?)$/, "")
                    ? ""
                    : element.children[0].ariaLabel.match(
                          / (\d*? [a-z]*?)$/,
                          "",
                      )[1]
            } `;
        } else {
            dateString = `${
                n(element.children[0].ariaLabel) ||
                !element.children[0].ariaLabel.match(
                    /^[A-Za-z]+? ([0-9]+?[ -][A-Za-z]+)/,
                    "",
                )
                    ? ""
                    : element.children[0].ariaLabel.match(
                          /^[A-Za-z]+? ([0-9]+?[ -][A-Za-z]+)/,
                          "",
                      )[1]
            } `;
        }
        // Datestring does not include the current year. So we have to reason which year it is based on the current month and datestring month
        if (dateString == " ") {
            return undefined;
        }
        if (
            dateString.indexOf("januari") != -1 ||
            dateString.indexOf("februari") != -1 ||
            dateString.indexOf("maart") != -1 ||
            dateString.indexOf("april") != -1 ||
            dateString.indexOf("mei") != -1 ||
            dateString.indexOf("juni") != -1 ||
            dateString.indexOf("juli") != -1
        ) {
            // Viewing Jan-Jul while in Jan-Jul, user is looking at current year
            if (month + 1 <= 7) {
                dateString += year;
            }
            // Viewing Jan-Jul while in Aug-Dec, user is looking at previous year
            else {
                dateString += (year - 1).toString();
            }
        } else {
            // Viewing Aug-Dec while in Jan-Jul, user is looking at previous year
            if (month + 1 <= 7) {
                dateString += (year - 1).toString();
            }
            // Viewing Aug-Dec while in Aug-Dec, user is looking at current year
            else {
                dateString += year;
            }
        }
        const englishDateString = dateString
            .replace("januari", "january")
            .replace("februari", "february")
            .replace("maart", "march")
            .replace("mei", "may")
            .replace("juni", "june")
            .replace("juli", "july")
            .replace("augustus", "august")
            .replace("oktober", "october");
        return new Date(Date.parse(englishDateString));
    }

    function customHomeworkIcons(activeIcon?: any, activeColor?: any) {
        const icons = [
            {
                name: "edit",
                color: "--fg-warning-normal",
            },
            {
                name: "homework",
                color: "--fg-primary-normal",
            },
            {
                name: "assignment",
                color: "--fg-alternative-normal",
            },
            {
                name: "test",
                color: "--fg-warning-normal",
            },
            {
                name: "test",
                color: "--fg-negative-normal",
            },
            {
                name: "book",
                color: "--fg-warning-normal",
            },
            {
                name: "clock",
                color: "--fg-warning-normal",
            },
            {
                name: "palm",
                color: "--fg-on-positive-weak",
            },
        ];
        let iconHTML = "";
        for (const icon of icons) {
            iconHTML += window.getIcon(
                icon.name,
                "mod-homework-icon" +
                    (activeIcon == icon.name ? " mod-active" : ""),
                `var(${icon.color})`,
                `data-icon="${icon.name}" `,
            );
        }
        const col = window
            .getComputedStyle(document.documentElement)
            .getPropertyValue("--fg-warning-normal");
        return (
            '<div style="display:flex;margin-top:20px;align-items:center;gap:10px;flex-wrap:wrap;">' +
            iconHTML +
            '<label tabindex="0" for="homeworkcolor" style="margin-left:auto;cursor:pointer;">Kleur kiezen</label><input style="display:none;" value="' +
            (activeColor?.startsWith("#") ? activeColor : col) +
            '" id="homeworkcolor" type="color"></div>'
        );
    }

    // Called for each day/week in the roster
    function customHomeworkInner(
        element: any,
        startIndex: any,
        recurringTasksEndIndex: any,
    ) {
        if (homeworkBusy) {
            return startIndex;
        }
        const currentStudiewijzerDate = ariaLabelToDate(
            element.classList.contains("week")
                ? element.nextElementSibling
                : element,
        );
        const isWeek = !n(element.getElementsByClassName("header")[0]);
        if (n(element.getElementsByClassName("mod-add-homework")[0])) {
            element.insertAdjacentHTML(
                "beforeend",
                '<div class="mod-add-homework">' +
                    window.getIcon("plus") +
                    "Taak toevoegen</div>",
            );
            element
                .getElementsByClassName("mod-add-homework")[0]
                .addEventListener("click", () => {
                    modMessage(
                        "Taak toevoegen",
                        "Voeg je eigen taak toe aan de kalender. De taak wordt alleen in deze browser opgeslagen.</p>" +
                            '<input id="mod-homework-subject" type="text" placeholder="Vul een vak in"><div class="br"></div><textarea id="mod-homework-description" placeholder="Vul een taak in"></textarea>' +
                            '<div class="mod-multi-choice" id="studiewijzer-afspraak-toevoegen-select"><span class="active" tabindex="0">Eenmalig</span><span tabindex="0">Wekelijks</span>' +
                            (isWeek
                                ? ""
                                : '<span tabindex="0">Maandelijks</span>') +
                            "</div>" +
                            customHomeworkIcons("edit") +
                            "<p>",
                        "Toevoegen",
                        "Annuleren",
                    );
                    for (const element of cn("mod-homework-icon")) {
                        element.addEventListener(
                            "click",
                            function (this: HTMLElement) {
                                cn(
                                    "mod-homework-icon mod-active",
                                    0,
                                ).classList.remove("mod-active");
                                this.classList.add("mod-active");
                            },
                        );
                    }
                    id("homeworkcolor").addEventListener(
                        "input",
                        function (this: HTMLInputElement) {
                            for (const element of cn("mod-homework-icon")) {
                                element.children[0].setAttribute(
                                    "fill",
                                    this.value,
                                );
                            }
                        },
                    );
                    id("mod-message-action1").addEventListener("click", () => {
                        const dateObject = ariaLabelToDate(
                            element.classList.contains("week")
                                ? element.nextElementSibling
                                : element,
                        );
                        homework.push({
                            id: (
                                Math.random() +
                                "" +
                                window.performance.now()
                            ).replaceAll(".", ""),
                            date: dateObject,
                            subject: id("mod-homework-subject").value,
                            description: id("mod-homework-description").value,
                            done: id(
                                "studiewijzer-afspraak-toevoegen-select",
                            ).children[0].classList.contains("active")
                                ? false
                                : {},
                            returning: id(
                                "studiewijzer-afspraak-toevoegen-select",
                            ).children[1].classList.contains("active")
                                ? "1"
                                : id(
                                        "studiewijzer-afspraak-toevoegen-select",
                                    ).children[0].classList.contains("active")
                                  ? "0"
                                  : "2",
                            week: isWeek,
                            icon: cn("mod-homework-icon mod-active", 0).dataset
                                .icon,
                            color: cn(
                                "mod-homework-icon mod-active",
                                0,
                            ).children[0].getAttribute("fill"),
                        });
                        // Mostly sort by date
                        homework.sort(sortByDate);
                        // Remove old homework
                        for (let i = 0; i < homework.length; i++) {
                            if (
                                homework[i].returning == "0" &&
                                new Date().getFullYear() -
                                    new Date(
                                        Date.parse(homework[i].date),
                                    ).getFullYear() >=
                                    2
                            ) {
                                homework.splice(i, 1);
                                i--;
                            }
                        }
                        set("homework", JSON.stringify(homework));
                        execute([customHomework]);
                        closeModMessage();
                    });
                    id("mod-message-action2").addEventListener(
                        "click",
                        closeModMessage,
                    );
                    for (const element of cn("mod-multi-choice")) {
                        for (const child of element.children) {
                            child.addEventListener(
                                "click",
                                function (this: HTMLElement) {
                                    this.parentElement
                                        ?.getElementsByClassName("active")[0]
                                        ?.classList.remove("active");
                                    this.classList.add("active");
                                },
                            );
                        }
                    }
                });
        }
        let lastShown = 0;
        if (
            currentStudiewijzerDate &&
            !Number.isNaN(Number(currentStudiewijzerDate))
        ) {
            const curDate = currentStudiewijzerDate;
            function addHomework(j: number) {
                let i = j;
                let lastRecurring = homework[i].returning;
                const taskId = homework[i].id;
                function updateIndex() {
                    i = 0;
                    for (const homeworkObject of homework) {
                        if (homeworkObject.id == taskId) {
                            break;
                        } else if (i > homework.length) {
                            return;
                        } else {
                            i++;
                        }
                    }
                }
                const homeworkDate = new Date(Date.parse(homework[i].date));
                const showIfOnce =
                    curDate.getFullYear() == homeworkDate.getFullYear() &&
                    curDate.getMonth() == homeworkDate.getMonth() &&
                    curDate.getDate() == homeworkDate.getDate();
                const showIfWeekly =
                    homework[i].returning == "1" &&
                    curDate.getTime() >= homeworkDate.getTime() &&
                    curDate.getDay() == homeworkDate.getDay();
                const showIfMonthly =
                    homework[i].returning == "2" &&
                    curDate.getTime() >= homeworkDate.getTime() &&
                    curDate.getDate() == homeworkDate.getDate() &&
                    !isWeek;
                if (
                    (showIfOnce || showIfWeekly || showIfMonthly) &&
                    n(
                        element.getElementsByClassName(
                            `mod-homework-${homework[i].id}`,
                        )[0],
                    ) &&
                    ((isWeek && homework[i].week) ||
                        (!isWeek && !homework[i].week))
                ) {
                    lastShown = i;
                    let insertElement: any;
                    const studiewijzerItems = element.getElementsByTagName(
                        "sl-studiewijzer-items",
                    )[0];
                    if (
                        studiewijzerItems &&
                        !studiewijzerItems.classList.contains("mod-added") &&
                        studiewijzerItems.childElementCount == 0
                    ) {
                        studiewijzerItems.classList.add("mod-added");
                    } else if (n(studiewijzerItems)) {
                        if (element.getElementsByClassName("header")[0]) {
                            element
                                .getElementsByClassName("header")[0]
                                .insertAdjacentHTML(
                                    "afterend",
                                    '<sl-studiewijzer-items class="mod-added"></sl-studiewijzer-items>',
                                );
                        } else if (
                            element.getElementsByClassName("dag-header")[0]
                        ) {
                            element
                                .getElementsByClassName("dag-header")[0]
                                .insertAdjacentHTML(
                                    "afterend",
                                    '<sl-studiewijzer-items class="mod-added"></sl-studiewijzer-items>',
                                );
                        } else {
                            element.insertAdjacentHTML(
                                "beforeend",
                                '<sl-studiewijzer-items class="mod-added mod-rooster"></sl-studiewijzer-items>',
                            );
                        }
                    }
                    let done: any;
                    // Weekly/monthly task
                    if (typeof homework[i].done === "object") {
                        done = homework[i].done[curDate.getTime()] == true;
                    } else {
                        done = homework[i].done;
                    }
                    if (done) {
                        insertElement = element.getElementsByTagName(
                            "sl-studiewijzer-items",
                        )[0];
                    } else {
                        insertElement = element.getElementsByClassName(
                            "header",
                        )[0]
                            ? element.getElementsByClassName("header")[0]
                            : element.getElementsByClassName("dag-header")[0]
                              ? element.getElementsByClassName("dag-header")[0]
                              : element.getElementsByTagName(
                                    "sl-studiewijzer-items",
                                )[0];
                    }
                    if (!n(insertElement)) {
                        const noMoving = element
                            .getElementsByTagName("sl-studiewijzer-items")[0]
                            ?.classList.contains("mod-rooster");
                        insertElement.insertAdjacentHTML(
                            "afterend",
                            '<div class="mod-huiswerk ' +
                                (done
                                    ? "mod-huiswerk-done"
                                    : noMoving
                                      ? ""
                                      : "mod-before") +
                                " mod-homework-" +
                                homework[i].id +
                                '"' +
                                (homework[i].color
                                    ? ' style="border-left-color:' +
                                      homework[i].color +
                                      '"'
                                    : "") +
                                ">" +
                                window.getIcon(
                                    homework[i].icon
                                        ? homework[i].icon
                                        : "edit",
                                    null,
                                    homework[i].color,
                                ) +
                                "<strong>" +
                                sanitizeString(homework[i].subject) +
                                "</strong><p>" +
                                sanitizeString(homework[i].description) +
                                '</p><div><svg xmlns="http://www.w3.org/2000/svg" width="12px" height="12px" viewBox="0 0 24 24" display="block"><path fill-rule="evenodd" d="m9.706 21.576 13.876-14.05c.538-.55.56-1.43.044-1.998l-2.769-3.06a1.41 1.41 0 0 0-2.076-.025L9.83 11.858a1.41 1.41 0 0 1-2.06-.01L5.424 9.342a1.414 1.414 0 0 0-2.041-.032l-2.96 2.982a1.45 1.45 0 0 0 .003 2.052l7.27 7.242c.56.555 1.455.552 2.01-.01"></path></svg></div></div>',
                        );
                        const homeworkItem = insertElement.nextElementSibling;
                        const homeworkClassName = `mod-homework-${homework[i].id}`;
                        function saveAdjustedHomework(e: Event) {
                            updateIndex();
                            e.stopPropagation();
                            homework[i].subject = id(
                                "mod-homework-subject",
                            ).value;
                            homework[i].description = id(
                                "mod-homework-description",
                            ).value;
                            homework[i].returning = id(
                                "studiewijzer-afspraak-toevoegen-select",
                            ).children[1].classList.contains("active")
                                ? "1"
                                : id(
                                        "studiewijzer-afspraak-toevoegen-select",
                                    ).children[0].classList.contains("active")
                                  ? "0"
                                  : "2";
                            homework[i].icon = cn(
                                "mod-homework-icon mod-active",
                                0,
                            ).dataset.icon;
                            homework[i].color = cn(
                                "mod-homework-icon mod-active",
                                0,
                            ).children[0].getAttribute("fill");
                            const isRecurringAdjusted =
                                lastRecurring != homework[i].returning;
                            lastRecurring = homework[i].returning;
                            for (const element of cn(homeworkClassName)) {
                                element.getElementsByTagName(
                                    "strong",
                                )[0].innerHTML = sanitizeString(
                                    homework[i].subject,
                                );
                                element.getElementsByTagName("p")[0].innerHTML =
                                    sanitizeString(homework[i].description);
                                element.getElementsByTagName(
                                    "svg",
                                )[0].outerHTML = window.getIcon(
                                    homework[i].icon
                                        ? homework[i].icon
                                        : "edit",
                                    null,
                                    homework[i].color,
                                );
                                element.style.borderLeftColor =
                                    homework[i].color;
                            }
                            set("homework", JSON.stringify(homework));
                            if (isRecurringAdjusted) {
                                homeworkBusy = true;
                                document
                                    .querySelectorAll(`.${homeworkClassName}`)
                                    .forEach((e) => {
                                        e.remove();
                                    });
                                homeworkBusy = false;
                            }
                            closeModMessage();
                        }
                        homeworkItem.addEventListener("click", () => {
                            updateIndex();
                            modMessage(
                                "",
                                "</p>" +
                                    '<input id="mod-homework-subject" type="text" value="' +
                                    sanitizeString(homework[i].subject) +
                                    '" style="font-weight:700;font-size:20px;margin-top:-20px;"><div class="br"></div>' +
                                    "<textarea id=\"mod-homework-description\" oninput=\"document.getElementById('mod-message-action1').innerHTML = 'Opslaan';\">" +
                                    sanitizeString(homework[i].description) +
                                    "</textarea>" +
                                    '<div class="mod-multi-choice" id="studiewijzer-afspraak-toevoegen-select"><span' +
                                    (homework[i].returning == "0"
                                        ? ' class="active"'
                                        : "") +
                                    ' tabindex="0">Eenmalig</span><span' +
                                    (homework[i].returning == "1"
                                        ? ' class="active"'
                                        : "") +
                                    ' tabindex="0">Wekelijks</span>' +
                                    (isWeek
                                        ? ""
                                        : "<span" +
                                          (homework[i].returning == "2"
                                              ? ' class="active"'
                                              : "") +
                                          ' tabindex="0">Maandelijks</span>') +
                                    "</div>" +
                                    customHomeworkIcons(
                                        homework[i].icon,
                                        homework[i].color,
                                    ) +
                                    "<p>",
                                "Sluiten",
                                "Taak verwijderen",
                                null,
                                true,
                                true,
                            );
                            for (const element of cn("mod-homework-icon")) {
                                element.addEventListener(
                                    "click",
                                    function (this: HTMLElement) {
                                        cn(
                                            "mod-homework-icon mod-active",
                                            0,
                                        ).classList.remove("mod-active");
                                        this.classList.add("mod-active");
                                    },
                                );
                            }
                            id("homeworkcolor").addEventListener(
                                "input",
                                function (this: HTMLInputElement) {
                                    for (const element of cn(
                                        "mod-homework-icon",
                                    )) {
                                        element.children[0].setAttribute(
                                            "fill",
                                            this.value,
                                        );
                                    }
                                },
                            );
                            id("mod-message-action1").addEventListener(
                                "click",
                                saveAdjustedHomework,
                            );
                            id("mod-message-action2").addEventListener(
                                "click",
                                (e: Event) => {
                                    updateIndex();
                                    e.stopPropagation();
                                    homework.splice(i, 1);
                                    set("homework", JSON.stringify(homework));
                                    homeworkBusy = true;
                                    document
                                        .querySelectorAll(
                                            `.${homeworkClassName}`,
                                        )
                                        .forEach((e) => {
                                            e.remove();
                                        });
                                    homeworkBusy = false;
                                    closeModMessage();
                                },
                            );
                            id("mod-message").addEventListener("click", () => {
                                closeModMessage();
                                tn("sl-root", 0).inert = false;
                                if (tn("sl-modal", 0)) {
                                    tn("sl-modal", 0).inert = false;
                                }
                            });
                            for (const element of cn("mod-multi-choice")) {
                                for (const child of element.children) {
                                    child.addEventListener(
                                        "click",
                                        function (this: HTMLElement) {
                                            this.parentElement
                                                ?.getElementsByClassName(
                                                    "active",
                                                )[0]
                                                ?.classList.remove("active");
                                            this.classList.add("active");
                                        },
                                    );
                                }
                                setHTML(id("mod-message-action1"), "Opslaan");
                            }
                        });
                        homeworkItem
                            .getElementsByTagName("div")[0]
                            .addEventListener("click", (e: Event) => {
                                updateIndex();
                                e.stopPropagation();
                                const noMoving = element
                                    .getElementsByTagName(
                                        "sl-studiewijzer-items",
                                    )[0]
                                    ?.classList.contains("mod-rooster");
                                // Unchecking homework
                                // We place the item above native homework, and above checked Somtoday Mod homework
                                if (
                                    homeworkItem.classList.contains(
                                        "mod-huiswerk-done",
                                    )
                                ) {
                                    homeworkItem.classList.remove(
                                        "mod-huiswerk-done",
                                    );
                                    homeworkItem.classList.remove(
                                        "mod-huiswerk-animation",
                                    );
                                    // Weekly/monthly task
                                    if (typeof homework[i].done === "object") {
                                        homework[i].done[curDate.getTime()] =
                                            false;
                                    }
                                    // Single task
                                    else {
                                        homework[i].done = false;
                                    }
                                    if (!noMoving) {
                                        if (
                                            n(
                                                element.getElementsByTagName(
                                                    "sl-studiewijzer-items",
                                                )[0],
                                            ) &&
                                            element.getElementsByClassName(
                                                "dag-header",
                                            )[0]
                                        ) {
                                            element.insertBefore(
                                                homeworkItem,
                                                element.getElementsByClassName(
                                                    "dag-header",
                                                )[0].nextSibling,
                                            );
                                        } else {
                                            element.insertBefore(
                                                homeworkItem,
                                                element.getElementsByTagName(
                                                    "sl-studiewijzer-items",
                                                )[0],
                                            );
                                        }
                                        homeworkItem.classList.add(
                                            "mod-before",
                                        );
                                    }
                                }
                                // Checking homework
                                // We always want to place the item as low as possible, since checked items always move to the bottom
                                else {
                                    homeworkItem.classList.add(
                                        "mod-huiswerk-done",
                                    );
                                    if (!noMoving) {
                                        let nextElement =
                                            homeworkItem.nextElementSibling;
                                        let isOnSamePosition = true;
                                        // If there is native Somtoday homework, we know that the item can't be at
                                        if (
                                            element.getElementsByTagName(
                                                "sl-studiewijzer-item",
                                            ).length > 0
                                        ) {
                                            isOnSamePosition = false;
                                        } else {
                                            // If there is "fake" Somtoday Mod homework, we also check
                                            let loopBreak = 0;
                                            while (
                                                loopBreak < 100 &&
                                                !nextElement.classList.contains(
                                                    "mod-add-homework",
                                                )
                                            ) {
                                                if (
                                                    nextElement.classList.contains(
                                                        "mod-huiswerk",
                                                    )
                                                ) {
                                                    isOnSamePosition = false;
                                                    break;
                                                }
                                                nextElement =
                                                    nextElement.nextElementSibling;
                                                loopBreak++;
                                            }
                                        }
                                        let hoursToMove =
                                            element.getElementsByClassName(
                                                "mod-huiswerk",
                                            ).length - 1;
                                        hoursToMove +=
                                            element.getElementsByTagName(
                                                "sl-studiewijzer-item",
                                            ).length;
                                        if (
                                            hoursToMove > 0 &&
                                            !isOnSamePosition
                                        ) {
                                            homeworkItem.style.setProperty(
                                                "--mod-hours-to-move",
                                                hoursToMove,
                                            );
                                            homeworkItem.classList.add(
                                                "mod-huiswerk-animation",
                                            );
                                            element
                                                .getElementsByClassName(
                                                    "mod-add-homework",
                                                )[0]
                                                .insertAdjacentHTML(
                                                    "beforebegin",
                                                    '<div class="mod-huiswerk mod-placeholder" style="visibility:hidden;"></div>',
                                                );
                                            homeworkItem.addEventListener(
                                                "animationend",
                                                () => {
                                                    if (
                                                        element.getElementsByClassName(
                                                            "mod-placeholder",
                                                        )[0]
                                                    ) {
                                                        element
                                                            .getElementsByClassName(
                                                                "mod-placeholder",
                                                            )[0]
                                                            .remove();
                                                    }
                                                },
                                            );
                                        }
                                    }
                                    // Weekly/monthly task
                                    if (typeof homework[i].done === "object") {
                                        homework[i].done[curDate.getTime()] =
                                            true;
                                    }
                                    // Single task
                                    else {
                                        homework[i].done = true;
                                    }
                                    if (!noMoving) {
                                        element.insertBefore(
                                            homeworkItem,
                                            element.getElementsByClassName(
                                                "mod-add-homework",
                                            )[0],
                                        );
                                        homeworkItem.classList.remove(
                                            "mod-before",
                                        );
                                    }
                                }
                                set("homework", JSON.stringify(homework));
                            });
                    }
                } else if (homework[i].returning == "0" && lastShown != 0) {
                    return true;
                }
                return false;
            }
            for (let j = 0; j < recurringTasksEndIndex; j++) {
                if (addHomework(j)) {
                    break;
                }
            }
            for (let j = startIndex; j < homework.length; j++) {
                if (addHomework(j)) {
                    break;
                }
            }
        }
        return lastShown;
    }

    // Add a menu bar on top of the page
    function topMenu() {
        if (get("layout") == 5 && n(id("mod-top-menu"))) {
            tn("body", 0).insertAdjacentHTML(
                "beforeend",
                '<div id="mod-top-menu"><h2 id="mod-top-menu-title">Titel</h2><div id="mod-logout">' +
                    window.getIcon("right-from-bracket") +
                    '</div><div id="mod-profile-link"></div></div>',
            );
            id("mod-profile-link").addEventListener("click", () => {
                cn("menu-avatar", 0).click();
            });
            id("mod-logout").addEventListener("click", () => {
                cn("menu-avatar", 0).click();
                tryRemove(id("mod-top-menu"));
                const checkLogoutButtonPresent = setInterval(() => {
                    if (cn("selector-option uitloggen", 0)) {
                        cn("selector-option uitloggen", 0).click();
                        clearInterval(checkLogoutButtonPresent);
                    }
                }, 10);
            });
        } else if (get("layout") != 5) {
            tryRemove(id("mod-top-menu"));
        } else if (
            cn("avatar", 0)?.getElementsByClassName("foto")[0] &&
            id("mod-profile-link")
        ) {
            id("mod-profile-link").innerHTML =
                "<div>" +
                (cn("avatar", 0)
                    .getElementsByClassName("foto")[0]
                    .classList.contains("hidden")
                    ? "<span>" +
                      (cn("avatar", 0).getElementsByClassName("initials")[0]
                          ?.children[0]
                          ? cn("avatar", 0).getElementsByClassName(
                                "initials",
                            )[0].children[0].innerHTML
                          : "?") +
                      "</span>"
                    : '<img src="' +
                      (n(get("profilepic"))
                          ? cn("avatar", 0).getElementsByClassName("foto")[0]
                                .src
                          : get("profilepic")) +
                      '" />') +
                "</div>";
        }
        if (id("mod-top-menu-title")) {
            let headerText = "";
            for (const element of tn("sl-tab-item")) {
                if (element.classList.contains("active")) {
                    headerText =
                        element.getElementsByTagName("span")[0].innerHTML;
                }
            }
            if (n(headerText)) {
                if (cn("desktop-title", 0)) {
                    headerText = cn("desktop-title", 0).innerHTML;
                } else if (tn("sl-scrollable-title", 0)) {
                    headerText = tn("sl-scrollable-title", 0).innerHTML;
                }
            }
            id("mod-top-menu-title").innerHTML = headerText;
        }
    }

    // Reveal new grades with an animation
    // Simplify the roster page, by aligning the lessons in a grid
    let timeIndicatorTop = 0;
    let normalRosterHeight = 0;
    function rosterSimplify() {
        // Every time the roster is modified, the week may have changed, so update custom homework as well
        execute([customHomework]);
        // Only execute roster simplify when enabled and on roster page
        if (
            get("bools").charAt(BOOL_INDEX.ROSTER_SIMPLIFY) == "1" &&
            tn("sl-rooster-weken", 0)
        ) {
            if (
                cn("tertiary normal action-primary-normal center", 0) &&
                !cn(
                    "tertiary normal action-primary-normal center",
                    0,
                ).classList.contains("mod-vandaag-button-event-listener-added")
            ) {
                // If "Vandaag" button is clicked Somtoday will load all weeks from scratch with js, within the pageUpdate timeout
                // This means rosterSimplify has to be called again with a delay
                cn(
                    "tertiary normal action-primary-normal center",
                    0,
                ).addEventListener("click", () => {
                    setTimeout(rosterSimplify, 5000);
                    setTimeout(rosterSimplify, 10000);
                });
                cn(
                    "tertiary normal action-primary-normal center",
                    0,
                ).classList.add("mod-vandaag-button-event-listener-added");
            }
            tn("sl-rooster-weken", 0).style.minHeight = "calc(100vh - 175px)";
            // Get the height the roster takes up normally
            normalRosterHeight = Math.max(
                tn("sl-rooster-weken", 0).clientHeight,
                normalRosterHeight,
            );
            // Loop through all loaded weeks and simplify them
            const currentTime = today.getHours() + today.getMinutes() / 60;
            for (const parent of tn("sl-rooster-week")) {
                const isWeekShown = !parent.ariaHidden;
                let shouldUpdate = true;
                // Check if this week contains lessons without an hour number, if so just leave it like it is to prevent confusion (overlapping/aligning with different hour)
                for (const element of parent.getElementsByTagName(
                    "sl-rooster-item",
                )) {
                    if (
                        n(element.getElementsByClassName("opacity-80")[0]) ||
                        element.getElementsByClassName("opacity-80")[0]
                            .innerHTML.length == 0 ||
                        Number.isNaN(
                            parseInt(
                                element
                                    .getElementsByClassName("opacity-80")[0]
                                    .innerHTML.charAt(0),
                                10,
                            ),
                        )
                    ) {
                        if (isWeekShown) {
                            tn("sl-rooster-weken", 0).style.height =
                                `${normalRosterHeight}px`;
                            tn("sl-rooster-weken", 0).style.overflowY =
                                "visible";
                            // Update the time text at the left to display 'hh:mm' instead of 'nth hour'
                            if (tn("sl-rooster-tijden", 0)) {
                                for (const element of tn("sl-rooster-tijden", 0)
                                    .children) {
                                    const span =
                                        element.getElementsByTagName("span")[0];
                                    if (
                                        !n(span) &&
                                        !n(span.dataset.modOriginalContent)
                                    ) {
                                        setHTML(
                                            span,
                                            span.dataset.modOriginalContent,
                                        );
                                    }
                                }
                            }
                        }
                        shouldUpdate = false;
                    }
                }
                if (shouldUpdate) {
                    let timeIndicatorPositioned = false;
                    // Position time indicator at end if it is past the last lesson
                    if (isWeekShown && cn("tijdlijn", 0)) {
                        const elements = cn(
                            "tijdlijn",
                            0,
                        ).parentElement.getElementsByTagName("sl-rooster-item");
                        if (
                            !n(elements[0]) &&
                            !n(
                                elements[
                                    elements.length - 1
                                ].getElementsByClassName("opacity-80")[0],
                            )
                        ) {
                            // Get hour number from last hour
                            let hour =
                                elements[
                                    elements.length - 1
                                ].getElementsByClassName("opacity-80")[0]
                                    .innerHTML;
                            hour = parseInt(
                                hour.substring(0, hour.length - 1),
                                10,
                            );
                            // Get top value of last hour
                            let lastHourTop =
                                elements[elements.length - 1].style.top;
                            lastHourTop = parseInt(
                                lastHourTop.substring(
                                    0,
                                    lastHourTop.length - 2,
                                ),
                                10,
                            );
                            // Get top value of time indicator
                            const rawTimeIndicatorTop = cn("tijdlijn", 0).style
                                .top;
                            timeIndicatorTop = parseInt(
                                rawTimeIndicatorTop.substring(
                                    0,
                                    rawTimeIndicatorTop.length - 2,
                                ),
                                10,
                            );
                            // If the top value of the last hour is less than the top value of the time indicator the time indicator should be repositioned
                            if (
                                !Number.isNaN(hour) &&
                                !Number.isNaN(lastHourTop) &&
                                !Number.isNaN(timeIndicatorTop) &&
                                lastHourTop < timeIndicatorTop
                            ) {
                                cn("tijdlijn", 0).style.top = `${hour * 84}px`;
                                timeIndicatorTop = hour * 84;
                                timeIndicatorPositioned = true;
                            }
                        }
                    }
                    // Loop through every lesson in the week and reposition it
                    let prevHour = 1;
                    let prevHeight = 0;
                    let lastHour = 1;
                    for (const element of parent.getElementsByTagName(
                        "sl-rooster-item",
                    )) {
                        if (
                            !n(
                                element.getElementsByClassName("opacity-80")[0],
                            ) &&
                            !n(
                                element.getElementsByClassName("opacity-80")[0]
                                    .parentElement.children[1],
                            )
                        ) {
                            let hour =
                                element.getElementsByClassName("opacity-80")[0]
                                    .innerHTML;
                            hour = parseInt(
                                hour.substring(0, hour.length - 1),
                                10,
                            );
                            let lessonTime = element
                                .getElementsByClassName("opacity-80")[0]
                                .parentElement.children[1].innerHTML.split(":");
                            lessonTime =
                                parseFloat(lessonTime[0]) +
                                parseFloat(lessonTime[1]) / 60;
                            let top: number | undefined;
                            if (Number.isNaN(hour)) {
                                top = prevHour * 84 + prevHeight - 84;
                                prevHour++;
                                if (prevHour > lastHour) {
                                    lastHour = prevHour;
                                }
                            } else {
                                prevHour = hour;
                                top = hour * 84 - 84;
                                if (hour > lastHour) {
                                    lastHour = hour;
                                }
                            }
                            element.style.top = `${top}px`;
                            if (
                                isWeekShown &&
                                !Number.isNaN(lessonTime) &&
                                cn("tijdlijn", 0) &&
                                currentTime < lessonTime &&
                                !timeIndicatorPositioned &&
                                !n(
                                    element.parentElement.getElementsByClassName(
                                        "tijdlijn",
                                    )[0],
                                )
                            ) {
                                if (cn("tijdlijn", 0)) {
                                    cn("tijdlijn", 0).style.top = `${top}px`;
                                }
                                timeIndicatorTop = top;
                                timeIndicatorPositioned = true;
                            }
                            prevHeight = element.clientHeight;
                        }
                    }
                    if (isWeekShown) {
                        tn("sl-rooster-weken", 0).style.height =
                            `${Math.max(lastHour + 2, 5) * 84 - 54}px`;
                        tn("sl-rooster-weken", 0).style.overflowY = "hidden";
                    }
                    if (tn("sl-vakantie-header", 0)) {
                        tn("sl-vakantie-header", 0).style.borderTop = "none";
                    }
                    // Update the time text at the left to display 'nth hour' instead of 'hh:mm'
                    if (isWeekShown && tn("sl-rooster-tijden", 0)) {
                        let i = 1;
                        for (const element of tn("sl-rooster-tijden", 0)
                            .children) {
                            let span = element.getElementsByTagName("span")[0];
                            if (n(span)) {
                                if (tn("sl-rooster-tijden", 0).children[1]) {
                                    setHTML(
                                        element,
                                        tn("sl-rooster-tijden", 0).children[1]
                                            .innerHTML,
                                    );
                                    span =
                                        element.getElementsByTagName("span")[0];
                                    setHTML(span, " ");
                                }
                            }
                            if (!n(span)) {
                                if (span.innerHTML.indexOf("uur") == -1) {
                                    span.dataset.modOriginalContent =
                                        span.innerHTML;
                                }
                                setHTML(span, `${i.toString()}e uur`);
                            }
                            i++;
                        }
                    }
                }
            }
        }
    }

    // Apply style
    function style() {
        if (getRelativeLuminance(hexToRgb(get("primarycolor"))) >= 240) {
            menuColor = adjust(get("primarycolor"), -170);
        } else if (getRelativeLuminance(hexToRgb(get("primarycolor"))) >= 160) {
            menuColor = adjust(get("primarycolor"), -110);
        } else {
            menuColor = "#fff";
        }
        if (getRelativeLuminance(hexToRgb(get("primarycolor"))) >= 160) {
            highLightColor = adjust(get("primarycolor"), -35);
        } else {
            highLightColor = adjust(get("primarycolor"), 35);
        }
        while (cn("mod-style", 0)) {
            cn("mod-style", 0).remove();
        }
        if (get("bools").charAt(BOOL_INDEX.SCROLLBAR) == "0") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">html, body{scrollbar-width:none !important;}</style>',
            );
        }
        if (get("bools").charAt(BOOL_INDEX.TEXT_SELECTION) == "1") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">*{user-select:auto !important;}</style>',
            );
        }
        // General style
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">' +
                (get("bools").charAt(BOOL_INDEX.ROSTER_GRID) == "0"
                    ? "sl-rooster-week .uur{border-left:none !important;border-bottom:none !important;}"
                    : "") +
                "sl-rooster-dag.weekend,sl-rooster-dag.weekend .uur,sl-rooster-week .weekend,sl-rooster-week-header .weekend{background:transparent !important;background-color:transparent !important;}</style>",
        );
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">@media (min-width:767px){:root{--min-content-vh:calc(100vh - ' +
                (get("layout") == "4" ? "66px" : "74px") +
                ") !important;}}</style>",
        );
        // Font
        if (n(get("customfontname"))) {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">@import url("' +
                    fontUrl +
                    '");*{font-family:"' +
                    get("fontname") +
                    '","Open Sans",sans-serif !important;' +
                    (get("fontname") == "Bebas Neue" ||
                    get("fontname") == "Oswald"
                        ? "letter-spacing:1px;"
                        : "") +
                    "}</style>",
            );
        } else {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">@import url("' +
                    fontUrl +
                    '");@font-face{font-family:modCustomFont;src:url("' +
                    get("customfont") +
                    '");}*{font-family:modCustomFont,"Open Sans",sans-serif !important;}</style>',
            );
        }
        // Make sure everything is readable with background with 100% ui transparency
        if (
            get("layout") != 4 &&
            ((get("backgroundtype") == "image" && !n(get("background"))) ||
                get("backgroundtype") == "color" ||
                (get("backgroundtype") == "slideshow" &&
                    !n(get("background0"))) ||
                get("backgroundtype") == "live")
        ) {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">hmy-switch-group:has(hmy-switch),sl-bericht-detail .header,sl-bericht-nieuw > .titel{border-radius:6px;padding:10px;background-color:var(--bg-neutral-none);}.content:has(sl-registraties){background:var(--mod-transparent);}sl-studiewijzer-week{border-bottom:2px solid var(--mod-transparent) !important;}sl-studiewijzer-dag{border-right:2px solid var(--mod-transparent) !important;}' +
                    (get("bools").charAt(BOOL_INDEX.ROSTER_GRID) == "1"
                        ? "sl-rooster-week .uur{border-left:2px solid var(--mod-transparent) !important;border-bottom:2px solid var(--mod-transparent) !important;}"
                        : "") +
                    ".container:has(sl-vakresultaten){padding-bottom:0 !important;}sl-vakresultaten{background-color:var(--bg-neutral-none);padding:20px !important; padding-bottom:40px !important;}hmy-geen-data > span{margin-top:20px;}hmy-geen-data{background:var(--mod-ui-transparent);padding:30px 60px;border-radius:24px;}</style>",
            );
        }
        // Adjust menu for layouts
        if (get("layout") == 2 || get("layout") == 3 || get("layout") == 5) {
            if (get("layout") == 2 || get("layout") == 3) {
                tn("head", 0).insertAdjacentHTML(
                    "beforeend",
                    '<style class="mod-style">sl-popup{position:fixed !important;top:70px !important;}hmy-popup:has(sl-leerling-menu-acties){position:fixed !important;bottom:80px !important;top:unset !important;}@media (min-width:1280px){.header,.headers-container{top:0 !important;}div.berichten-lijst{height:calc(100vh - 64px) !important;}}</style>',
                );
                tn("head", 0).insertAdjacentHTML(
                    "beforeend",
                    '<style class="mod-style">@media (min-width: 767px){.berichten-lijst{height:calc(100vh - 129px) !important;}.menu-avatar{width:calc(100% - 12px * 2) !important;justify-content:center;}}</style>',
                );
            } else {
                tn("head", 0).insertAdjacentHTML(
                    "beforeend",
                    '<style class="mod-style">sl-sidebar-page{top: 0px !important; height: 100% !important;}sl-rooster-weken{margin-top:63px;}sl-registratie-overzicht{margin-top:50px;}sl-gepubliceerde-schoolinformatie-navigation{padding-top: 80px !important;}sl-popup{position:fixed !important;top:130px !important;}hmy-popup:has(sl-leerling-menu-acties){position:fixed !important;top:65px !important;right:30px !important;left:unset !important;}#mod-top-menu{display:none;}@media (min-width: 767px) and (max-width:1279px){.berichten-lijst{height:calc(100vh - 129px) !important;}sl-header{height:0px !important;position:fixed !important;left: 0px !important;right: 0px !important;}}@media (min-width: 767px){sl-header{background:none !important;backdrop-filter:none !important;}sl-sidebar-page{top:63px !important;height:calc(100% - 63px) !important;}#mod-new-year{margin-top:calc(64px + var(--safe-area-inset-top));}:root:has(sl-berichten){--safe-area-inset-top:64px !important;}body:has(sl-cijfers),body:has(sl-berichten) .tabs,body:has(sl-berichten) .main,sl-studiewijzer-weken,sl-home,sl-start > main,sl-start > .container,sl-home > * > .container,sl-home > * > .content{margin-top:63px !important;}.menu-avatar{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;opacity:0 !important;pointer-events:none !important;}sl-header > div:first-of-type{pointer-events:none !important;}#mod-top-menu-title{color:var(--text-strong);}#mod-top-menu{display:block;border-bottom:var(--thinnest-solid-neutral-normal);background:var(--bg-neutral-none);position:' +
                        (get("bools").charAt(BOOL_INDEX.MENU_ALWAYS_SHOW) == "1"
                            ? "fixed"
                            : "absolute") +
                        ";top:0;left:var(--safe-area-inset-left);right:0;height:64px;z-index:50;}#mod-top-menu h2{margin:18px 24px;}#mod-profile-link:hover{filter:brightness(0.8);}#mod-profile-link{transition:0.2s filter ease;box-sizing:border-box;position:absolute;right:24px;cursor:pointer;top:0;bottom:0;height:100%;padding:15px;}#mod-logout{right:90px;cursor:pointer;position:absolute;padding:15px;top:0;}#mod-logout svg{fill:var(--action-primary-normal);height:25px !important;margin-top:4px;transition:fill 0.2s ease;}#mod-logout:hover svg{fill:var(--action-primary-strong);}#mod-profile-link div{height:100%;aspect-ratio:1 / 1;background:var(--bg-primary-weak);overflow:hidden;border-radius:6px;}#mod-profile-link span{margin:6px 0;text-align:center;width:100%;display:block;font-weight:700;color:var(--fg-on-primary-weak);}#mod-profile-link img{width:100%;height:100%;object-fit:cover;}}</style>",
                );
            }
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">.menu-avatar .hamburger { flex-shrink: 1; min-width: 0; } @media (min-width:1280px){:root{--safe-area-inset-' +
                    (get("layout") != 3 ? "left:120px" : "right:120px") +
                    " !important;--min-content-vh:calc(100vh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom)) !important;}sl-header > div:first-of-type i{--action-neutral-normal:" +
                    menuColor +
                    ";}#mod-logo-wrapper{width:120px;" +
                    (get("layout") != 3 ? "margin-left" : "left") +
                    ":calc((var(--safe-area-inset-" +
                    (get("layout") != 3 ? "left" : "right") +
                    ") - 120px) / 2);position:relative;}#mod-logo{width:65%;height:60px;margin:20px 0;position:relative;left:50%;transform:translateX(-50%);}sl-header sl-tab-bar{--action-neutral-normal:" +
                    menuColor +
                    ";--action-primary-normal:" +
                    menuColor +
                    ";position:absolute !important;top:0 !important;left:0 !important;width:100% !important;height:" +
                    (get("layout") == 5 ? "100%" : "calc(100% - 80px)") +
                    " !important;display:block !important;overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;}sl-header sl-tab-bar::-webkit-scrollbar{display:none !important;}sl-header .item span{text-align:center;margin-top:6px;display:block;}sl-header .active .item, sl-header .item:hover{background:" +
                    highLightColor +
                    " !important;padding-top:0 !important;}sl-header .item:hover i{scale:0.9;}sl-header .item i{transition:scale 0.3s ease !important;height:36px;display:block;padding-top:0 !important;margin:0 auto;fill:var(--action-neutral-normal) !important;}sl-header .item svg{width:100%;height:36px;}sl-header sl-tab-item{height:120px !important;position:relative !important;display:block !important;}sl-header sl-tab-item .item, sl-header .item{display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;height:100% !important;}sl-popup{z-index:101 !important;}sl-header{position:fixed !important;z-index:15 !important;" +
                    (get("layout") != 3 ? "left" : "right") +
                    ":0 !important;top: 0 !important;height:100% !important;overflow:hidden !important;border-bottom:0 !important;width:var(--safe-area-inset-" +
                    (get("layout") != 3 ? "left" : "right") +
                    ") !important;background:" +
                    get("primarycolor") +
                    " !important;color:" +
                    menuColor +
                    " !important;}" +
                    (get("layout") == 5
                        ? "sl-header > div:first-of-type{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;width:auto !important;z-index:20 !important;pointer-events:none !important;opacity:0 !important;}"
                        : "sl-header > div:first-of-type{position:absolute !important;bottom:20px !important;left:12px !important;z-index:20 !important;width:calc(100% - 24px) !important;display:flex !important;justify-content:center !important;align-items:center !important;--bg-elevated-weakest:" +
                          highLightColor +
                          ";}") +
                    "}}</style>",
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">@media (max-width:1279px){#mod-logo-wrapper{width:100px;' +
                    (get("layout") != 3 ? "margin-left" : "left") +
                    ":calc((var(--safe-area-inset-" +
                    (get("layout") != 3 ? "left" : "right") +
                    ") - " +
                    (get("layout") != 3 ? "100px" : "115px") +
                    ") / 2);position:relative;}sl-tab-bar hmy-notification-counter{margin-top:-60px !important;margin-left:40px !important;}:root{--safe-area-inset-" +
                    (get("layout") != 3 ? "left" : "right") +
                    ": 100px !important;}#mod-background{width:calc(100% - var(--safe-area-inset-left) - var(--safe-area-inset-right) - 2 * " +
                    get("blur") +
                    " + 15px);}sl-tab-bar:first-of-type{position:fixed;top:0;" +
                    (get("layout") != 3 ? "left" : "right") +
                    ":0;border-top:none;width:" +
                    (get("layout") != 3
                        ? "var(--safe-area-inset-left)"
                        : "var(--safe-area-inset-right)") +
                    " !important;height:" +
                    (get("layout") == 5 ? "100%" : "calc(100% - 80px)") +
                    " !important;display:block !important;overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;z-index:0;background:" +
                    get("primarycolor") +
                    "}sl-tab-bar:first-of-type::-webkit-scrollbar{display:none !important;}sl-tab-bar:first-of-type sl-tab-item svg{width:100%;height:36px;}sl-tab-bar:first-of-type sl-tab-item span{font-size:14px;margin-top:6px;text-align:center;}sl-tab-bar:first-of-type sl-tab-item i{height:36px;fill:var(--action-neutral-normal) !important;transition:0.3s scale ease !important;padding-top:0 !important;margin:0 auto;}sl-tab-bar:first-of-type .item:hover i{scale:0.9;}sl-tab-bar:first-of-type sl-tab-item .item, sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}sl-tab-bar:first-of-type .active .item, sl-tab-bar:first-of-type .item:hover{background:" +
                    highLightColor +
                    " !important;padding-top:0 !important;}sl-tab-bar:first-of-type sl-tab-item{--action-neutral-normal:" +
                    menuColor +
                    ";--action-primary-normal:" +
                    menuColor +
                    ";display:block !important;width:100%;position:relative !important;height:120px !important;}" +
                    (get("layout") == 5
                        ? "sl-header > div:first-of-type, .menu-avatar{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;width:auto !important;pointer-events:none !important;opacity:0 !important;}"
                        : "sl-header > div:first-of-type, .menu-avatar{position:fixed !important;bottom:20px !important;top:unset !important;" +
                          (get("layout") == 3 ? "right" : "left") +
                          ":12px !important;width:calc(var(--safe-area-inset-" +
                          (get("layout") != 3 ? "left" : "right") +
                          ") - 24px) !important;justify-content:center !important;display:flex !important;align-items:center !important;z-index:20 !important;--bg-elevated-weakest:" +
                          highLightColor +
                          ";}") +
                    "#mod-logo{--action-neutral-normal: " +
                    menuColor +
                    ";width:100%;height:60px;margin:20px 0;}}</style>",
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">@media (max-width: 766px){sl-header:not(.with-back-button){border-bottom:none !important;--column-width: 100% !important;}sl-dagen-header{top:calc(' +
                    (get("layout") == 1 || get("layout") == 4
                        ? "64px"
                        : "0px") +
                    " + var(--safe-area-inset-top)) !important;border-bottom:none !important;}sl-berichten{background-color:var(--bg-neutral-none);}}</style>",
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">.container{max-width:100%;}sl-header sl-tab-bar div.item span,sl-tab-bar sl-tab-item .item span{text-overflow:ellipsis;overflow:hidden;text-wrap:nowrap;margin-left:-5px;width:calc(100% + 10px);}sl-tab-bar sl-tab-item .item span{' +
                    (get("layout") == 3 ? "margin-left:5px;" : "") +
                    "width:calc(100% - 10px);text-align:center;}#mod-menu-resizer{width:12px;height:100%;top:0;" +
                    (get("layout") == 3 ? "left" : "right") +
                    ":-4px;position:absolute;cursor:ew-resize;}sl-tab-bar sl-tab-item .item{padding-bottom:0 !important;max-height:100%;}sl-rooster-dag.dag{width:calc(100vw - 170px) !important;}hmy-notification-counter span{margin:0 !important;}sl-header hmy-notification-counter{position:absolute;right:30px;top:20px;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{position:relative !important;}.active-border-top,.active-border-bottom{top:0;height:100% !important;width:4px !important;position:absolute;" +
                    (get("layout") != 3 ? "right" : "left") +
                    ":0;}sl-sidebar{height:100% !important;}.active-border{display:none !important;}sl-rooster-week.week{width:calc(100% - 55px) !important;}sl-sidebar-page{padding-right:0 !important;}sl-header > div:first-of-type i{z-index:10000;--fg-on-primary-weak:" +
                    menuColor +
                    ";--action-neutral-strong:" +
                    menuColor +
                    ";}sl-header > div:first-of-type{--bg-neutral-weakest:" +
                    highLightColor +
                    "}sl-header sl-tab-item .item *,sl-tab-bar:first-of-type sl-tab-item .item *{pointer-events:none !important;}@media (min-height:671px){sl-header{overflow:hidden !important;}sl-header sl-tab-bar,sl-tab-bar:first-of-type{overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;}}@media (max-height:670px){#mod-logo-wrapper{height:80px;}#mod-logo{height:50px !important;margin:15px 0 !important;}sl-header sl-tab-bar,sl-tab-bar:first-of-type{overflow-y:auto !important;scrollbar-width:none !important;}sl-header sl-tab-bar::-webkit-scrollbar,sl-tab-bar:first-of-type::-webkit-scrollbar{display:none !important;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{height:110px !important;min-height:110px !important;}sl-header sl-tab-item .item,sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}}@media (max-height:600px){#mod-logo-wrapper{display:none !important;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{height:110px !important;min-height:110px !important;}sl-header sl-tab-item .item,sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}}</style>",
            );
        } else if (get("layout") == 4) {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">:root{--safe-area-inset-left:calc((100% - 1200px) / 2) !important;--safe-area-inset-right:calc((100% - 1200px) / 2) !important;}#mod-background{left:0;width:100%;}sl-home{position:relative;border:var(--thinnest-solid-neutral-normal);display:block;background:var(--bg-neutral-none) !important;' +
                    (get("ui") == 0
                        ? ""
                        : `backdrop-filter:blur(${get("uiblur")}px);`) +
                    "}sl-rooster-week.week{width:calc(100% - 55px) !important;}</style>",
            );
        }
        // Position menu relatively
        if (get("bools").charAt(BOOL_INDEX.MENU_ALWAYS_SHOW) == "0") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                `<style class="mod-style">
            :root {
                --mod-menu-height: 64px;
            }

            /* Top menu part on rooster page */
            .headers-container {
                position: relative !important;
            }

            .datum-container {
                position: inherit !important;
            }

            ${
                get("layout") == 1 || get("layout") == 4
                    ? `

            /* The main menu visible on big screens */
            sl-header {
	            position: absolute !important;
                width: 100%;
            }

            /* Studiewijzer is not endless on mobile */
            @media (min-width: 767px) {
                /* Compensate for position absolute on main menu */
                sl-home>*>.content, sl-home>*>.container {
                    margin-top: var(--mod-menu-height) !important;
                }

                /* The studiewijzer is too big and you start somewhere halfway on the page,
                   so we need to always show the menu here unfortunately */
                sl-studiewijzer sl-header {
	                position: sticky !important;
                }

                .headers-container {
                    margin-top: calc(-1 * var(--mod-menu-height));
                    margin-bottom: var(--mod-menu-height);
                }
            }

            @media (min-width: 767px) and (max-width: 1279px) {
                sl-scrollable-title.scrollable-title.title {
                    margin-top: var(--mod-menu-height) !important;
                    margin-bottom: calc(-1 * var(--mod-menu-height)) !important;
                }

                body:has(sl-berichten) .tabs {
                margin-top }
            }
            `
                    : `
            /* The mod top menu in layout 4 must be fixed in the studiewijzer */
            body:has(sl-studiewijzer) #mod-top-menu {
                position: fixed !important;
            }
            `
            }


            ${
                get("layout") == 5
                    ? `
            @media (min-width: 767px) and (max-width: 1279px) {
                body:has(sl-berichten) .tabs {
                    margin-top: 0px !important;
                }
            }
            `
                    : ""
            }

            @media (max-width: 767px) {
                sl-scrollable-title {
                    height: 64px !important;
                }
                sl-header {
                    grid-template-columns: 1fr auto auto !important;
                }
                sl-header .actions {
                	height: var(--mod-menu-height);
                	align-items: center;
                }
                .headers-container {
                    background: transparent !important;
                    margin-bottom: 0px !important;
                }
                sl-dagen-header {
                    top: 0px !important;
                }
                sl-header {
                    position: relative !important;
                    width: 100%;
                }
                sl-header .title {
                    opacity: 0;
                }

                ${
                    get("layout") == 1 || get("layout") == 5
                        ? `
                .headers-container {
                    margin-top: calc(-1 * var(--mod-menu-height)) !important;
                }
                `
                        : ""
                }
            }

            /* Tabs as shown on the grades/messages pages should not be sticky */
            .tabs {
                position: relative !important;
                top: unset !important;
            }

            /* Messages page should be scrollable on the body element instead of on .berichten-lijst */
            div.berichten-lijst {
                height: fit-content !important;
            }

            @media (max-width: 1279px) {
                ${
                    get("layout") != 1 && get("layout") != 4
                        ? `
                /* In every layout except the centered one, wethe centered layout */
                sl-header {
                    height: 0px !important;
                }

                ${
                    get("layout") != 5
                        ? `
                .headers-container {
                    margin-top: calc(-1 * var(--mod-menu-height)) !important;
                    margin-bottom: var(--mod-menu-height) !important;
                }
                sl-studiewijzer-weken-header {
                    top: 0px !important;
                }
                sl-header {
                    position: fixed !important;
                    left: 0px !important;
                    right: 0px !important;
                }
                .menu-avatar {
                	position: fixed !important;
                	bottom: 20px !important;
                	top: unset !important;
                	z-index: 20 !important;
                	${get("layout") == 3 ? "right" : "left"}: 12px;
                }
                .menu-avatar .hamburger {
                    fill: #fff !important;
                }
                `
                        : ""
                }
                `
                        : ""
                }
            }

            </style>`,
            );

            /*if (get('layout') == 1 || get('layout') == 4) {
                tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">@media (max-width:767px){sl-cijfers .tabs{position:relative !important;}sl-rooster sl-scrollable-title{display:none !important;}sl-studiewijzer sl-dagen-header,sl-cijfers .tabs{top:var(--safe-area-inset-top) !important;}}sl-dagen-header{position:relative !important;}sl-rooster-weken{margin-top:64px;}' + (get('layout') == 4 ? 'body:has(sl-cijfers) sl-header:first-of-type,body:has(sl-berichten) sl-header:first-of-type{margin-top:-64px;}' : '') + 'body:has(sl-cijfers),body:has(sl-berichten){margin-top:64px;}sl-rooster sl-header,sl-cijfers sl-header,sl-berichten sl-header{position:absolute !important;width:100%;}</style>');
            }
            else if (get('layout') == 5) {
                tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">sl-rooster .headers-container,sl-studiewijzer-weken-header{top:0 !important;}</style>');
            }
            tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">@media (max-width:767px){sl-berichten div.tabs{top:unset !important;}}' + ((get('layout') == 2 || get('layout') == 3) ? '@media (min-width:1279px){.headers-container{top:calc(var(--safe-area-inset-top)) !important;}}' : '') + 'sl-berichten div.berichten-lijst{height:fit-content !important;}.main,sl-berichten div.tabs{position:relative !important;}sl-rooster .headers-container,sl-rooster .header,sl-cijfers .headers-container,sl-cijfers .header,sl-berichten .headers-container,sl-berichten .header{position:relative !important;}</style>');*/
        }
        // Hide unread message indicator
        if (get("bools").charAt(BOOL_INDEX.HIDE_MESSAGE_COUNT) == "1") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">hmy-notification-counter{display:none !important;}</style>',
            );
        }
        // Hide menu link text
        if (get("bools").charAt(BOOL_INDEX.MENU_PAGE_NAME) == "0") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">sl-header .item span{display:none !important;}@media (max-width:1279px){sl-tab-bar:first-of-type .item span{display:none !important;}}' +
                    (get("layout") == 2 ||
                    get("layout") == 3 ||
                    get("layout") == 5
                        ? "sl-tab-bar:first-of-type sl-tab-item i,sl-header .item i{padding-top:0!important;}"
                        : "sl-header .item i{padding-top:36px !important;}") +
                    "</style>",
            );
        }
        // Custom CSS - inject at the end so it overrides mod and Somtoday CSS
        if (!n(get("customcss")) && get("customcss").trim() !== "") {
            // Sanitize CSS to prevent breaking out of style tag and potential code injection
            const sanitizedCSS = get("customcss")
                .replace(/javascript:[^'"]+/gi, "") // Remove javascript: URLs
                .replace(/@import[^;\n]+/gi, ""); // Remove @import to prevent loading external CSS
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style mod-custom-css">' +
                    sanitizedCSS +
                    "</style>",
            );

            const customCSS = document.createElement("style");
            customCSS.setAttribute("class", "mod-style mod-custom-css");
            customCSS.innerText = sanitizedCSS;
            tn("head", 0).appendChild(customCSS);

            // Force !important on every rule via CSSOM
            for (const sheet of document.styleSheets) {
                if (sheet.ownerNode !== customCSS) continue;
                for (const rule of sheet.cssRules) {
                    if (!(rule instanceof CSSStyleRule)) continue;
                    for (const prop of rule.style) {
                        rule.style.setProperty(
                            prop,
                            rule.style.getPropertyValue(prop),
                            "important",
                        );
                    }
                }
            }
        }
    }

    // Change some setting values to ensure the script will work after updating
    function updateCheck() {
        // Make sure to not mess up new user save data
        if (!n(get("firstused"))) {
            // Set default values for new users who first navigate to old version and later to a new one
            if (n(get("bools"))) {
                set("bools", "110001110111100000000000000000");
            }
            if (n(get("layout"))) {
                set("layout", 1);
            }
            if (get("uiblur") == null) {
                set("uiblur", 0);
            }
            if (get("ui") == null) {
                set("ui", 20);
            }
            // Check if user has used the old version of Somtoday and is using new version for the first time
            if (n(get("version")) && !n(get("primarycolor"))) {
                modMessage(
                    "Somtoday update!",
                    "Somtoday heeft een grote update gekregen! Somtoday Mod is hier op voorbereid en heeft ook een update gekregen. De mod-instellingen zijn nu te vinden in een apart tabblad in de instellingen van Somtoday. Het is mogelijk dat je sommige instellingen opnieuw moet instellen.",
                    "Doorgaan",
                );
                id("mod-message-action1").addEventListener(
                    "click",
                    closeModMessage,
                );
                set("bools", "110001110111100000000000000000");
                set("secondarycolor", "#e69b22");
            }
            const savedVersion = parseFloat(get("version"));
            if (savedVersion == 4) {
                set("bools", get("bools").replaceAt(12, "1"));
            }
            if (savedVersion < 4.6) {
                if (get("blur") == "") {
                    set("blur", "0px");
                } else if (
                    get("blur") != null &&
                    !Number.isNaN(parseInt(get("blur"), 10))
                ) {
                    set("blur", `${get("blur")}px`);
                }
                set("bools", get("bools").replaceAt(15, "1"));
            }
            if (savedVersion < 4.7) {
                set("brightness", "100%");
                set("contrast", "100%");
                set("saturate", "100%");
                set("opacity", "100%");
                set("huerotate", "0deg");
                set("grayscale", "0%");
                set("sepia", "0%");
                set("invert", "0%");
            }
            if (savedVersion < 4.9) {
                set("bools", get("bools").replaceAt(16, "1"));
            }
            if (n(get("homework"))) {
                set("homework", "[]");
            }
            if (savedVersion < 5.1) {
                // Update nickname storage to use JSON instead of pipe-delimited string
                if (n(get("nicknames"))) {
                    set("nicknames", "[]");
                } else if (parseJSON(get("nicknames")) == null) {
                    const json = [];
                    const namearray = get("nicknames").split("|");
                    for (let i = 0; i < namearray.length / 2; i++) {
                        json.push([namearray[i * 2], namearray[i * 2 + 1]]);
                    }
                    set("nicknames", JSON.stringify(json));
                }
            }
            if (savedVersion < 5.3) {
                set("bools", get("bools").replaceAt(17, "1"));
            }
        }
        // Save current version for update checks in future versions
        set("version", version);
    }

    // Update the CSS variables used by Somtoday and Somtoday Mod
    let primaryColorValue: any;
    let secondaryColorValue: any;
    let darkModeValue: any;
    let uiValue: any;
    let uiBlurValue: any;
    let layoutValue: any;
    function updateCssVariables() {
        // Do not update CSS variables when nothing relevant changed
        if (
            !n(primaryColorValue) &&
            primaryColorValue == get("primarycolor") &&
            secondaryColorValue == get("secondarycolor") &&
            darkModeValue ==
                (tn("html", 0).classList.contains("dark") ||
                    tn("html", 0).classList.contains("night")) &&
            uiValue == get("ui") &&
            uiBlurValue == get("uiblur") &&
            layoutValue == get("layout")
        ) {
            return;
        }
        primaryColorValue = get("primarycolor");
        secondaryColorValue = get("secondarycolor");
        darkModeValue =
            tn("html", 0).classList.contains("dark") ||
            tn("html", 0).classList.contains("night");
        darkmode = darkModeValue;
        uiValue = get("ui");
        uiBlurValue = get("uiblur");
        layoutValue = get("layout");
        tryRemove(id("mod-css-variables"));
        tryRemove(id("mod-css-variables-2"));
        if (get("ui") != 0 || get("backgroundtype") == "live") {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style id="mod-css-variables-2">sl-vakgemiddelden sl-dropdown,sl-cijfer-overzicht sl-dropdown{background:var(--bg-neutral-none);margin-top:-5px;margin-bottom:-5px;}' +
                    (get("uiblur") == 0
                        ? ""
                        : ".nieuw-bericht-form hmy-popup{top:70px !important;left:70px !important;}sl-plaatsingen,.nieuw-bericht-form,sl-header,sl-laatste-resultaat-item,sl-vakresultaat-item,.berichten-lijst,.vakken," +
                          (get("layout") == "4"
                              ? ""
                              : "sl-vakresultaten,hmy-geen-data,hmy-switch-group:has(hmy-switch),sl-bericht-detail .header,sl-bericht-nieuw > .titel,") +
                          ".headers-container,.tabs,sl-studiewijzer-week:has(.datum.vandaag),#mod-top-menu,sl-home > * > sl-tab-bar.show,sl-dagen-header,sl-scrollable-title,sl-studiewijzer-weken-header,sl-cijfer-overzicht-voortgang>div,sl-rooster-tijden{backdrop-filter:blur(" +
                          get("uiblur") +
                          "px);}") +
                    "@media(max-width:767px){sl-laatste-resultaat-item{backdrop-filter:none;}sl-laatsteresultaten{backdrop-filter:blur(" +
                    get("uiblur") +
                    "px);}}:root, :root.dark.dark {--thinnest-solid-neutral-strong:1px solid transparent !important;--text-weakest:var(--text-weak);--border-neutral-normal:transparent;" +
                    (darkmode && get("ui") > 0.9 ? "--text-weak:#fff;" : "") +
                    "--bg-neutral-none:" +
                    (darkmode
                        ? `rgba(0,0,0,${1 - get("ui") / 100})`
                        : `rgba(255,255,255,${1 - get("ui") / 100})`) +
                    ";--bg-neutral-weakest:" +
                    (darkmode
                        ? `rgba(0, 0, 0, ${1 - get("ui") / 100})`
                        : "rgba(255, 255, 255, " +
                          (1 - get("ui") / 100) +
                          ")") +
                    ";}.mod-multi-choice,input:not(:hover):not(:focus):not(.mod-color-textinput):not(.ng-pristine):not(.ng-dirty),textarea:not(:hover):not(:focus):not(.ng-pristine):not(.ng-dirty),.select-selected{border:1px solid rgba(0,0,0,0.1) !important;}hmy-toggle .toggle:not(:has(input:checked)) .slider{border:2px solid rgba(0,0,0,0.1) !important;}sl-dag-header-tab,.periode-icon{background:none !important;}@media (max-width:767px){sl-vakgemiddelden sl-dropdown,sl-cijfer-overzicht sl-dropdown{margin-top:10px;}}</style>",
            );
        }
        // If at least one of the colors is not set to the default value, modify Somtoday color variables
        let css =
            (darkmode
                ? "#mod-setting-panel ::placeholder{ color: var(--action-neutral-normal) !important; }"
                : "") +
            " :root, :root.dark.dark { --mod-transparent: rgba(" +
            (darkmode ? "0,0,0,0.3" : "255,255,255,0.3") +
            "); --mod-ui-transparent: rgba(" +
            (darkmode ? "0,0,0" : "255,255,255") +
            "," +
            (1 - get("ui") / 100) +
            "); --mod-semi-transparant: " +
            (tn("html", 0).classList.contains("night")
                ? "#000"
                : darkmode
                  ? "rgba(0,0,0,0.35)"
                  : "rgba(255,255,255,0.65)") +
            "; --mod-border-neutral-normal: rgb(" +
            (darkmode ? "55,64,72" : "208,214,220") +
            ");";
        if (
            get("primarycolor") != "#0067c2" ||
            get("secondarycolor") != "#e69b22"
        ) {
            let cssVariables = "";
            const blueBrightness = [
                "241",
                "220",
                "198",
                "169",
                "140",
                "115",
                "89",
                "81",
                "56",
                "52",
                "48",
            ];
            const greenBrightness = [
                "245",
                "228",
                "209",
                "200",
                "192",
                "183",
                "160",
                "137",
                "114",
                "68",
                "46",
            ];
            const yellowBrightness = [
                "241",
                "220",
                "198",
                "190",
                "180",
                "173",
                "162",
                "137",
                "114",
                "68",
                "46",
            ];
            const purpleBrightness = [
                "231",
                "201",
                "170",
                "126",
                "100",
                "88",
                "77",
                "65",
                "53",
                "50",
                "41",
            ];
            const orangeBrightness = [
                "241",
                "220",
                "198",
                "180",
                "168",
                "155",
                "141",
                "90",
                "56",
                "52",
                "48",
            ];
            for (let i = 0; i < blueBrightness.length; i++) {
                cssVariables += `--blue-${i * 10}: ${toBrightnessValue(get("primarycolor"), blueBrightness[i])};`;
                cssVariables += `--green-${i * 10}: ${toBrightnessValue(get("secondarycolor"), greenBrightness[i])};`;
                cssVariables += `--yellow-${i * 10}: ${toBrightnessValue(get("secondarycolor"), yellowBrightness[i])};`;
                cssVariables += `--purple-${i * 10}: ${toBrightnessValue(get("secondarycolor"), purpleBrightness[i])};`;
                cssVariables += `--orange-${i * 10}: ${toBrightnessValue(get("secondarycolor"), orangeBrightness[i])};`;
            }
            // Generate and adjust colors based on highest color channel value
            css +=
                cssVariables +
                `}
            sl-account-modal i {
                --bg-neutral-moderate: ${darkmode ? "#282e34" : "#dadfe3"};
                --fg-on-neutral-moderate: ${darkmode ? "#eaedf0" : "#374048"};
                --bg-primary-weakest: ${darkmode ? "#1a344d" : "#e5f3ff"};
                --fg-on-primary-weakest: ${darkmode ? "#e5f3ff" : "#004180"};
                --bg-alternative-weak: ${darkmode ? "#342060" : "#ece3ff"};
                --fg-on-alternative-weak: ${darkmode ? "#d4c0fd" : "#29017d"};
                --bg-accent-weak: ${darkmode ? "#4d3919" : "#fff4e3"};
                --fg-on-accent-weak: ${darkmode ? "#fff4e3" : "#4d3919"};
                --bg-positive-weakest: ${darkmode ? "#133914" : "#ebf9ec"};
                --fg-on-positive-weakest: ${darkmode ? "#baf5bc" : "#145716"};
            }`;
        } else {
            css += "}";
        }
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            `<style id="mod-css-variables">${css}</style>`,
        );
    }

    // Change profile pictures when enabled
    let profilePictureChanged = false;
    function profilePicture() {
        // Change all profile pictures if custom one is set
        if (!n(get("profilepic"))) {
            profilePictureChanged = true;
            tryRemove(id("mod-profile-picture"));
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style id="mod-profile-picture">hmy-avatar>.container{border-radius:var(--border-radius);background:url(\'' +
                    get("profilepic") +
                    "') center / cover !important;}.foto, .initials{opacity:0 !important;}</style>",
            );
        }
        // Reset all profile pictures when profile picture is reset
        else if (profilePictureChanged) {
            profilePictureChanged = false;
            tryRemove(id("mod-profile-picture"));
        }
    }

    // Insert modlogo into menu when enabled
    // This should happen on start and when resizing (because the menu type can change)
    let logoClicks = 0;
    function modLogo() {
        if (get("layout") == 2 || get("layout") == 3 || get("layout") == 5) {
            const tabBars = document.querySelectorAll<HTMLElement>(
                "sl-header sl-tab-bar, sl-tab-bar:first-of-type",
            );
            tabBars.forEach((tabBar) => {
                if (!tabBar.dataset.modWheelAttached) {
                    tabBar.dataset.modWheelAttached = "true";
                    tabBar.addEventListener(
                        "wheel",
                        function (this: HTMLElement, e: WheelEvent) {
                            // Laat de sidebar altijd scrollen zodra de inhoud
                            // hoger is dan de zichtbare tab-bar (voorheen alleen
                            // bij window-hoogte <= 670px, waardoor items op
                            // normale schermen onbereikbaar waren).
                            if (this.scrollHeight > this.clientHeight) {
                                this.scrollTop += e.deltaY;
                                e.preventDefault();
                            }
                        },
                        { capture: true, passive: false },
                    );
                }
            });
            const avatar = cn("menu-avatar", 0);
            if (avatar && !avatar.dataset.modWheelAttached) {
                avatar.dataset.modWheelAttached = "true";
                avatar.addEventListener(
                    "wheel",
                    (e: WheelEvent) => {
                        const tb =
                            tn("sl-header", 0)?.getElementsByTagName(
                                "sl-tab-bar",
                            )[0] || tn("sl-tab-bar", 0);
                        if (tb && tb.scrollHeight > tb.clientHeight) {
                            tb.scrollTop += e.deltaY;
                            e.preventDefault();
                        }
                    },
                    { capture: true, passive: false },
                );
            }
            if (n(id("mod-menu-resizer")) && tn("sl-tab-bar", 0)) {
                tn("sl-tab-bar", 0).insertAdjacentHTML(
                    "beforeend",
                    '<div id="mod-menu-resizer"></div>',
                );
                let moving = false;
                if (get("layout") == 3) {
                    tn("body", 0).style.cssText =
                        "--safe-area-inset-right: " +
                        menuWidth +
                        "px !important";
                } else {
                    tn("body", 0).style.cssText =
                        "--safe-area-inset-left: " +
                        menuWidth +
                        "px !important";
                }
                id("mod-menu-resizer").addEventListener("mousedown", () => {
                    moving = true;
                });
                id("mod-menu-resizer").addEventListener("touchstart", () => {
                    moving = true;
                });
                document.addEventListener("mouseup", () => {
                    moving = false;
                });
                document.addEventListener("touchend", () => {
                    moving = false;
                });
                function moveEventHandler(e: any) {
                    if (moving) {
                        let clientXInput: any;
                        if (e.touches == null || e.touches[0] == null) {
                            clientXInput = e.clientX;
                        } else {
                            clientXInput = e.touches[0].clientX;
                        }
                        if (get("layout") == 3) {
                            menuWidth =
                                document.documentElement.clientWidth -
                                clientXInput;
                            if (menuWidth < 50) {
                                menuWidth = 50;
                            } else if (menuWidth > 700) {
                                menuWidth = 700;
                            }
                            set("menuwidth", menuWidth);
                            tn("body", 0).style.cssText =
                                "--safe-area-inset-right: " +
                                menuWidth +
                                "px !important";
                        } else {
                            menuWidth = clientXInput;
                            if (menuWidth < 50) {
                                menuWidth = 50;
                            } else if (menuWidth > 700) {
                                menuWidth = 700;
                            }
                            set("menuwidth", menuWidth);
                            tn("body", 0).style.cssText =
                                "--safe-area-inset-left: " +
                                menuWidth +
                                "px !important";
                        }
                    }
                }
                document.addEventListener("mousemove", moveEventHandler);
                document.addEventListener("touchmove", moveEventHandler);
            }
        } else {
            tn("body", 0).style.cssText = "";
        }

        // Make sure we do not replace the logo while animations are playing
        if (
            cn("mod-logo-hat-clicked", 0) ||
            cn("mod-logo-decoration-clicked", 0)
        ) {
            return;
        }

        tryRemove(id("mod-logo-wrapper"));
        tryRemove(id("mod-logo-hat"));
        tryRemove(id("mod-logo-inserted"));
        if (get("layout") == 2 || get("layout") == 3 || get("layout") == 5) {
            const logoHTML =
                '<div id="mod-logo-wrapper">' +
                (get("bools").charAt(BOOL_INDEX.MOD_LOGO) == "0"
                    ? window.getIcon("logo", null, menuColor, ' id="mod-logo"')
                    : window.logo(
                          "mod-logo",
                          '" data-clicks="' +
                              (n(id("mod-logo"))
                                  ? "0"
                                  : id("mod-logo").dataset.clicks),
                          "var(--action-neutral-normal)",
                      )) +
                "</div>";
            if (
                n(id("mod-logo")) &&
                tn("sl-header", 0)?.getElementsByTagName("sl-tab-bar")[0]
            ) {
                tn("sl-header", 0)
                    .getElementsByTagName("sl-tab-bar")[0]
                    .insertAdjacentHTML("afterbegin", logoHTML);
            } else if (n(id("mod-logo")) && tn("sl-tab-bar", 0)) {
                tn("sl-tab-bar", 0).insertAdjacentHTML("afterbegin", logoHTML);
            } else {
                return;
            }
            id("mod-logo").addEventListener("click", () => {
                logoClicks += 1;
                if (logoClicks == 10) {
                    logoClicks = 0;
                    if (!document.fullscreenElement) {
                        document.documentElement.requestFullscreen();
                    }
                    tn("body", 0).style.setProperty(
                        "overflow-y",
                        "hidden",
                        "important",
                    );
                    id("somtoday-mod").insertAdjacentHTML(
                        "beforeend",
                        '<div id="blue-screen-of-death"><svg xmlns="http://www.w3.org/2000/svg" width="806.81042" height="588.71942" viewBox="0 0 806.81042 588.71944"><rect style="fill:#1173aa;" width="806.81042" height="588.71942" x="0" y="0"/><g transform="matrix(4.2021373,0,0,4.2021373,0,1.0984253e-5)"><g><path style="fill:#fff;" d="m 28.976126,48.524788 q -1.09375,0 -1.835938,-0.703125 -0.742187,-0.722656 -0.742187,-1.777344 0,-1.074219 0.742187,-1.777344 0.742188,-0.722656 1.835938,-0.722656 1.113281,0 1.855468,0.722656 0.742188,0.703125 0.742188,1.777344 0,1.054688 -0.742188,1.777344 -0.742187,0.703125 -1.855468,0.703125 z m 0,14.902344 q -1.09375,0 -1.835938,-0.703125 -0.742187,-0.722657 -0.742187,-1.777344 0,-1.074219 0.742187,-1.777344 0.742188,-0.722656 1.835938,-0.722656 1.113281,0 1.855468,0.722656 0.742188,0.703125 0.742188,1.777344 0,1.054687 -0.742188,1.777344 -0.742187,0.703125 -1.855468,0.703125 z"/><path style="fill:#fff;" d="m 42.101126,68.974007 q -3.125,-3.417969 -4.53125,-7.363282 -1.386719,-3.964843 -1.386719,-9.335937 0,-5.214844 1.347656,-9.160156 1.367188,-3.964844 4.375,-7.539063 l 1.875,1.5625 q -2.382812,3.417969 -3.476562,7.011719 -1.074219,3.574219 -1.074219,8.125 0,4.433594 1.132812,8.027344 1.132813,3.574218 3.652344,7.109375 z" /></g><g><path style="line-height:142.99999475%;letter-spacing:-0.30000001px;fill:#ffffff" d="m 29.713547,80.950829 -1.688233,-3.325196 h 0.688477 l 1.186523,2.391358 q 0.02197,0.04761 0.05859,0.142822 0.03662,0.09155 0.06958,0.179443 h 0.01099 q 0.03296,-0.120849 0.135499,-0.322265 l 1.241455,-2.391358 h 0.644531 l -1.732178,3.310547 v 1.940918 h -0.615234 z" /><path style="line-height:142.99999475%;letter-spacing:-0.30000001px;fill:#ffffff" d="m 34.016818,82.968651 q -0.55664,0 -0.981445,-0.230713 -0.421143,-0.230713 -0.655518,-0.651856 -0.230712,-0.424804 -0.230712,-0.977783 0,-0.560302 0.230712,-0.988769 0.234375,-0.428467 0.655518,-0.662842 0.424805,-0.234375 0.981445,-0.234375 0.545655,0 0.959473,0.234375 0.413818,0.234375 0.637207,0.662842 0.223389,0.424804 0.219727,0.988769 0,0.556641 -0.227051,0.977783 -0.223389,0.421143 -0.637207,0.651856 -0.410157,0.230713 -0.952149,0.230713 z m 0,-0.578613 q 0.344239,0 0.60791,-0.157471 0.267334,-0.161133 0.413819,-0.45044 0.150146,-0.292968 0.157471,-0.673828 -0.0073,-0.388183 -0.157471,-0.684814 -0.150147,-0.296631 -0.413819,-0.457764 -0.263671,-0.164795 -0.60791,-0.164795 -0.366211,0 -0.648193,0.164795 -0.27832,0.164795 -0.432129,0.461426 -0.150146,0.296631 -0.150146,0.688476 0,0.38086 0.150146,0.670166 0.153809,0.289307 0.432129,0.446778 0.27832,0.157471 0.648193,0.157471 z" /><path style="fill:#fff;" d="m 39.323508,83.01992 q -0.212403,-0.380859 -0.300293,-0.717773 -0.05493,0.150146 -0.212403,0.300293 -0.153808,0.150146 -0.402832,0.252685 -0.245361,0.102539 -0.560302,0.102539 -0.516358,0 -0.834961,-0.201416 -0.318604,-0.201416 -0.454102,-0.520019 -0.135498,-0.322266 -0.135498,-0.706787 v -2.215576 h 0.600586 v 2.028808 q 0,0.479737 0.197754,0.769043 0.201416,0.289307 0.758057,0.289307 0.413818,0 0.684814,-0.194092 0.270996,-0.197754 0.270996,-0.655518 v -2.24121 h 0.600586 v 2.358398 q 0.0037,0.53833 0.318604,1.105957 z" /><path style="fill:#fff;" d="m 41.29006,79.654442 q 0.377197,-0.435791 0.966797,-0.435791 0.164795,0 0.344238,0.03296 L 42.498556,79.8229 q -0.102539,-0.01099 -0.201416,-0.01099 -0.567627,0 -0.941162,0.351562 v 2.713623 h -0.600586 v -3.566894 h 0.454102 l 0.08057,0.344238 z" /><path style="fill:#fff;" d="m 45.497824,77.625633 h 1.442871 q 0.545654,0 0.941162,0.179444 0.39917,0.179443 0.611572,0.531005 0.212403,0.351563 0.212403,0.856934 0,0.516357 -0.245362,0.900879 -0.241699,0.384521 -0.67749,0.593262 -0.432129,0.205078 -0.985107,0.205078 h -0.684815 v 1.984863 h -0.615234 z m 1.256103,2.713623 q 0.615235,0 0.963135,-0.281982 0.3479,-0.281983 0.3479,-0.834961 0,-0.53833 -0.314941,-0.787354 -0.314941,-0.252685 -0.915527,-0.252685 l -0.725098,0.0037 v 2.15332 h 0.644531 z" /><path style="fill:#fff;" d="m 51.661154,82.95034 q -0.736084,0 -1.259766,-0.314941 -0.523681,-0.314942 -0.79834,-0.915527 -0.270996,-0.604249 -0.270996,-1.453858 0,-0.864258 0.314942,-1.479492 0.314941,-0.615234 0.915527,-0.933838 0.604248,-0.322266 1.450195,-0.322266 0.563965,0 1.186524,0.161133 l -0.179444,0.585938 q -0.142822,-0.04761 -0.46875,-0.08423 -0.322265,-0.03662 -0.545654,-0.04761 -0.04395,-0.0037 -0.131836,-0.0037 -0.585937,0 -1.003418,0.256347 -0.41748,0.252686 -0.637207,0.725098 -0.219726,0.472412 -0.219726,1.113281 0,0.662842 0.201416,1.138916 0.205078,0.476074 0.593261,0.72876 0.391846,0.252686 0.9375,0.252686 0.322266,0 0.65918,-0.0769 0.336914,-0.0769 0.703125,-0.201416 l 0.205078,0.560303 q -0.344238,0.131836 -0.794678,0.223389 -0.446777,0.08789 -0.856933,0.08789 z" /><path style="line-height:142.99999475%;letter-spacing:-0.1px;fill:#ffffff" d="m 56.832052,79.654442 q 0.377197,-0.435791 0.966797,-0.435791 0.164795,0 0.344238,0.03296 L 58.040548,79.8229 q -0.102539,-0.01099 -0.201416,-0.01099 -0.567627,0 -0.941162,0.351562 v 2.713623 h -0.600586 v -3.566894 h 0.454102 l 0.08057,0.344238 z" /><path style="line-height:142.99999475%;letter-spacing:-0.1px;fill:#ffffff" d="m 61.27673,83.01992 q -0.201416,-0.351562 -0.303955,-0.725097 -0.06226,0.183105 -0.2417,0.336914 -0.179443,0.153808 -0.428467,0.241699 -0.249023,0.08789 -0.505371,0.08789 -0.362548,0 -0.651855,-0.113526 -0.285645,-0.113525 -0.454102,-0.351562 -0.164795,-0.238037 -0.164795,-0.593262 0,-0.344238 0.17212,-0.596924 0.172119,-0.256347 0.48706,-0.391846 0.318604,-0.135498 0.739746,-0.135498 0.505371,0 0.963135,0.26001 v -0.373535 q 0,-0.439453 -0.205078,-0.640869 -0.205078,-0.201416 -0.60791,-0.201416 -0.153809,0 -0.443116,0.02563 -0.285644,0.02197 -0.534667,0.06225 l -0.10254,-0.600585 q 0.446778,-0.05127 0.699463,-0.07324 0.256348,-0.02197 0.428467,-0.02197 0.666504,0 1.010742,0.351562 0.344239,0.351563 0.347901,1.047363 l 0.0073,1.054688 q 0.0037,0.53833 0.318603,1.105957 z m -1.343995,-0.618896 q 0.285645,0 0.501709,-0.09888 0.216065,-0.09888 0.333252,-0.281983 0.12085,-0.183105 0.12085,-0.421142 v -0.03296 q -0.183105,-0.102539 -0.406494,-0.157471 -0.223389,-0.05859 -0.465088,-0.05859 -0.391846,0 -0.626221,0.139161 -0.234375,0.135498 -0.234375,0.377197 0,0.157471 0.09521,0.27832 0.09888,0.12085 0.274658,0.19043 0.175782,0.06592 0.406494,0.06592 z" /><path style="fill:#fff;" d="m 64.21262,79.214989 q 0.46875,0 0.787353,0.183105 0.318604,0.183106 0.476075,0.505371 0.161132,0.322266 0.161132,0.739746 v 2.233887 h -0.600586 v -2.06543 q 0,-0.450439 -0.194091,-0.736084 -0.19043,-0.285644 -0.633545,-0.289306 -0.314942,0.0037 -0.593262,0.117187 -0.274658,0.109864 -0.487061,0.31128 l -0.0073,2.662353 h -0.600586 l 0.0073,-3.566894 h 0.443116 l 0.113525,0.355224 q 0.424805,-0.450439 1.12793,-0.450439 z" /><path style="line-height:142.99999475%;letter-spacing:-0.49000001px;fill:#ffffff" d="m 68.644493,78.19326 q -0.175781,0 -0.292969,-0.117187 -0.117187,-0.117188 -0.117187,-0.292969 0,-0.172119 0.117187,-0.289307 0.117188,-0.117187 0.292969,-0.117187 0.172119,0 0.289307,0.117187 0.117187,0.117188 0.117187,0.289307 0,0.175781 -0.117187,0.292969 -0.117188,0.117187 -0.289307,0.117187 z m -0.311279,1.116944 H 68.9338 v 3.566894 h -0.600586 z" /><path style="fill:#fff;" d="m 71.362503,79.214989 q 0.46875,0 0.787354,0.183105 0.318603,0.183106 0.476074,0.505371 0.161133,0.322266 0.161133,0.739746 v 2.233887 h -0.600586 v -2.06543 q 0,-0.450439 -0.194092,-0.736084 -0.19043,-0.285644 -0.633545,-0.289306 -0.314941,0.0037 -0.593262,0.117187 -0.274658,0.109864 -0.48706,0.31128 l -0.0073,2.662353 h -0.600585 l 0.0073,-3.566894 h 0.443115 l 0.113525,0.355224 q 0.424805,-0.450439 1.12793,-0.450439 z" /><path style="fill:#fff;" d="m 74.680374,79.844872 v 1.926269 q 0,0.161133 0.06958,0.314941 0.07324,0.150147 0.219727,0.249024 0.146484,0.09522 0.355224,0.09522 0.146485,0 0.333252,-0.02564 v 0.53833 q -0.238037,0.02197 -0.483398,0.02197 -0.340576,0 -0.578613,-0.146485 -0.238037,-0.146484 -0.358887,-0.391845 -0.12085,-0.249024 -0.12085,-0.549317 v -2.03247 h -0.644531 v -0.531006 h 0.644531 v -1.281739 h 0.563965 v 1.281739 h 0.981445 v 0.531006 h -0.981445 z" /><path style="fill:#fff;" d="m 78.078812,82.968651 q -0.556641,0 -0.981446,-0.230713 -0.421142,-0.230713 -0.655517,-0.651856 -0.230713,-0.424804 -0.230713,-0.977783 0,-0.560302 0.230713,-0.988769 0.234375,-0.428467 0.655517,-0.662842 0.424805,-0.234375 0.981446,-0.234375 0.545654,0 0.959472,0.234375 0.413819,0.234375 0.637207,0.662842 0.223389,0.424804 0.219727,0.988769 0,0.556641 -0.227051,0.977783 -0.223389,0.421143 -0.637207,0.651856 -0.410156,0.230713 -0.952148,0.230713 z m 0,-0.578613 q 0.344238,0 0.60791,-0.157471 0.267334,-0.161133 0.413818,-0.45044 0.150147,-0.292968 0.157471,-0.673828 -0.0073,-0.388183 -0.157471,-0.684814 -0.150146,-0.296631 -0.413818,-0.457764 -0.263672,-0.164795 -0.60791,-0.164795 -0.366211,0 -0.648194,0.164795 -0.27832,0.164795 -0.432129,0.461426 -0.150146,0.296631 -0.150146,0.688476 0,0.38086 0.150146,0.670166 0.153809,0.289307 0.432129,0.446778 0.278321,0.157471 0.648194,0.157471 z" /><path style="fill:#fff;" d="m 85.392044,83.01992 q -0.201416,-0.351562 -0.303955,-0.725097 -0.06226,0.183105 -0.241699,0.336914 -0.179444,0.153808 -0.428467,0.241699 -0.249023,0.08789 -0.505371,0.08789 -0.362549,0 -0.651856,-0.113526 -0.285644,-0.113525 -0.454101,-0.351562 -0.164795,-0.238037 -0.164795,-0.593262 0,-0.344238 0.172119,-0.596924 0.172119,-0.256347 0.487061,-0.391846 0.318603,-0.135498 0.739746,-0.135498 0.505371,0 0.963134,0.26001 v -0.373535 q 0,-0.439453 -0.205078,-0.640869 -0.205078,-0.201416 -0.60791,-0.201416 -0.153808,0 -0.443115,0.02563 -0.285645,0.02197 -0.534668,0.06225 L 83.11055,79.310204 q 0.446777,-0.05127 0.699463,-0.07324 0.256347,-0.02197 0.428467,-0.02197 0.666504,0 1.010742,0.351562 0.344238,0.351563 0.3479,1.047363 l 0.0073,1.054688 q 0.0037,0.53833 0.318604,1.105957 z M 84.04805,82.401024 q 0.285644,0 0.501709,-0.09888 0.216064,-0.09888 0.333252,-0.281983 0.120849,-0.183105 0.120849,-0.421142 v -0.03296 q -0.183105,-0.102539 -0.406494,-0.157471 -0.223388,-0.05859 -0.465088,-0.05859 -0.391845,0 -0.62622,0.139161 -0.234375,0.135498 -0.234375,0.377197 0,0.157471 0.09522,0.27832 0.09888,0.12085 0.274658,0.19043 0.175781,0.06592 0.406494,0.06592 z" /><path style="line-height:142.99999475%;letter-spacing:-0.27000001px;fill:#ffffff" d="m 90.639847,79.214989 q 0.505371,0 0.864258,0.212402 0.362548,0.20874 0.549316,0.615234 0.19043,0.402832 0.19043,0.970459 0,0.596924 -0.197754,1.036377 -0.197754,0.435791 -0.5896,0.673828 -0.388183,0.238038 -0.948486,0.238038 -0.86792,0 -1.109619,-0.637207 v 2.274169 h -0.604248 v -5.288085 h 0.446777 l 0.142822,0.454101 q 0.245362,-0.263672 0.567627,-0.406494 0.325928,-0.142822 0.688477,-0.142822 z m -0.08789,3.186035 q 0.300293,0 0.534668,-0.146485 0.238037,-0.146484 0.373535,-0.457763 0.13916,-0.314942 0.13916,-0.791016 0,-0.567627 -0.270996,-0.878906 -0.267334,-0.311279 -0.761718,-0.311279 -0.281983,0 -0.585938,0.09888 -0.300293,0.09521 -0.582275,0.270996 v 1.160888 q 0,0.402832 0.190429,0.64087 0.19043,0.234375 0.45044,0.325927 0.263672,0.08789 0.512695,0.08789 z" /><path style="line-height:142.99999475%;letter-spacing:-0.27000001px;fill:#ffffff" d="m 93.467987,79.654442 q 0.377197,-0.435791 0.966797,-0.435791 0.164795,0 0.344238,0.03296 L 94.676483,79.8229 q -0.102539,-0.01099 -0.201416,-0.01099 -0.567627,0 -0.941162,0.351562 v 2.713623 h -0.600586 v -3.566894 h 0.454102 l 0.08057,0.344238 z" /><path style="fill:#fff;" d="m 96.874748,82.968651 q -0.55664,0 -0.981445,-0.230713 -0.421143,-0.230713 -0.655518,-0.651856 -0.230713,-0.424804 -0.230713,-0.977783 0,-0.560302 0.230713,-0.988769 0.234375,-0.428467 0.655518,-0.662842 0.424805,-0.234375 0.981445,-0.234375 0.545655,0 0.959473,0.234375 0.413818,0.234375 0.637207,0.662842 0.223389,0.424804 0.219726,0.988769 0,0.556641 -0.22705,0.977783 -0.223389,0.421143 -0.637207,0.651856 -0.410157,0.230713 -0.952149,0.230713 z m 0,-0.578613 q 0.344239,0 0.60791,-0.157471 0.267334,-0.161133 0.413819,-0.45044 0.150146,-0.292968 0.15747,-0.673828 -0.0073,-0.388183 -0.15747,-0.684814 -0.150147,-0.296631 -0.413819,-0.457764 -0.263671,-0.164795 -0.60791,-0.164795 -0.366211,0 -0.648193,0.164795 -0.27832,0.164795 -0.432129,0.461426 -0.150147,0.296631 -0.150147,0.688476 0,0.38086 0.150147,0.670166 0.153809,0.289307 0.432129,0.446778 0.27832,0.157471 0.648193,0.157471 z" /><path style="line-height:142.99999475%;letter-spacing:-0.43000001px;fill:#ffffff" d="m 101.51098,79.214989 q 0.52368,0 0.88257,0.223388 0.36255,0.219727 0.54199,0.626221 0.17944,0.402832 0.17944,0.948486 0,0.596924 -0.19775,1.036377 -0.19776,0.435791 -0.5896,0.673828 -0.38818,0.238038 -0.94849,0.238038 -0.84961,0 -1.09863,-0.611573 l -0.17212,0.527344 H 99.6726 L 99.6653,77.32534 h 0.60424 v 2.420655 q 0.49439,-0.531006 1.24146,-0.531006 z m -0.0879,3.186035 q 0.30029,0 0.53467,-0.146485 0.23803,-0.146484 0.37353,-0.457763 0.13916,-0.314942 0.13916,-0.791016 0,-0.3479 -0.12085,-0.615234 -0.11719,-0.270996 -0.35156,-0.421143 -0.23438,-0.153808 -0.5603,-0.153808 -0.36621,0 -0.61158,0.0769 -0.24169,0.07324 -0.55664,0.289307 v 0.688476 l 0.004,0.476074 q 0,0.402832 0.18676,0.64087 0.19043,0.234375 0.45044,0.325927 0.26001,0.08789 0.5127,0.08789 z" /><path style="line-height:142.99999475%;letter-spacing:-0.18000001px;fill:#ffffff" d="m 103.64079,77.32534 h 0.60059 v 5.551758 h -0.60059 z" /><path style="line-height:142.99999475%;letter-spacing:-0.18000001px;fill:#ffffff" d="m 106.96543,82.408348 q 0.24536,0 0.52002,-0.05493 0.27466,-0.05493 0.54932,-0.161132 l 0.18676,0.512695 q -0.26001,0.109863 -0.65917,0.183105 -0.39917,0.07324 -0.7251,0.07324 -0.86426,0 -1.34033,-0.461426 -0.47608,-0.465088 -0.47608,-1.428223 0,-0.600586 0.20874,-1.018066 0.2124,-0.421143 0.61157,-0.637207 0.39917,-0.216065 0.95948,-0.216065 0.49438,0 0.82763,0.230713 0.33325,0.227051 0.49439,0.596924 0.16113,0.366211 0.16113,0.787354 0,0.289306 -0.0806,0.578613 l -2.54882,0.01831 q 0.0806,0.494385 0.41015,0.747071 0.32959,0.249023 0.90088,0.249023 z m -0.24536,-2.633057 q -0.52002,0 -0.78369,0.300293 -0.26367,0.300293 -0.30029,0.809327 l 1.9812,-0.01831 q 0.007,-0.08789 0.007,-0.131836 0,-0.249023 -0.0915,-0.465088 -0.0916,-0.219726 -0.29663,-0.355224 -0.20142,-0.139161 -0.51636,-0.139161 z" /><path style="line-height:142.99999475%;letter-spacing:-0.1px;fill:#ffffff" d="m 113.01468,79.214989 q 0.42847,0 0.72143,0.183105 0.29664,0.183106 0.44312,0.505371 0.14648,0.322266 0.15015,0.739746 v 2.233887 h -0.60059 v -2.06543 q -0.007,-0.454101 -0.19043,-0.736084 -0.1831,-0.285644 -0.60059,-0.285644 -0.29663,0 -0.5603,0.106201 -0.26001,0.102539 -0.4541,0.285645 0.0513,0.223388 0.0513,0.461425 v 2.233887 h -0.60059 v -2.06543 q -0.007,-0.454101 -0.19043,-0.736084 -0.1831,-0.285644 -0.60058,-0.285644 -0.27832,0 -0.52735,0.106201 -0.24902,0.102539 -0.44311,0.289307 l -0.007,2.69165 h -0.60059 l 0.007,-3.566894 h 0.44312 l 0.11352,0.351562 q 0.41382,-0.446777 1.09131,-0.446777 0.37354,0 0.64453,0.13916 0.27466,0.13916 0.43579,0.395508 0.53467,-0.534668 1.27442,-0.534668 z" /><path style="fill:#fff;" d="m 118.17713,79.844872 v 1.926269 q 0,0.161133 0.0696,0.314941 0.0732,0.150147 0.21973,0.249024 0.14648,0.09522 0.35522,0.09522 0.14649,0 0.33325,-0.02564 v 0.53833 q -0.23803,0.02197 -0.48339,0.02197 -0.34058,0 -0.57862,-0.146485 -0.23803,-0.146484 -0.35888,-0.391845 -0.12085,-0.249024 -0.12085,-0.549317 v -2.03247 h -0.64453 v -0.531006 h 0.64453 v -1.281739 h 0.56396 v 1.281739 h 0.98145 v 0.531006 h -0.98145 z" /><path style="line-height:142.99999475%;letter-spacing:-0.14px;fill:#ffffff" d="m 121.65614,79.214989 q 0.46875,0 0.78735,0.183105 0.3186,0.183106 0.47607,0.505371 0.16114,0.322266 0.16114,0.739746 v 2.233887 h -0.60059 v -2.06543 q 0,-0.450439 -0.19409,-0.736084 -0.19409,-0.285644 -0.63355,-0.285644 -0.31494,0 -0.59326,0.113525 -0.27832,0.109864 -0.49438,0.307617 v 2.666016 h -0.60059 v -5.55542 h 0.60059 v 2.307129 q 0.42114,-0.413818 1.09131,-0.413818 z" /><path style="line-height:142.99999475%;letter-spacing:-0.14px;fill:#ffffff" d="m 126.55154,83.01992 q -0.20142,-0.351562 -0.30396,-0.725097 -0.0623,0.183105 -0.2417,0.336914 -0.17944,0.153808 -0.42846,0.241699 -0.24903,0.08789 -0.50538,0.08789 -0.36254,0 -0.65185,-0.113526 -0.28565,-0.113525 -0.4541,-0.351562 -0.1648,-0.238037 -0.1648,-0.593262 0,-0.344238 0.17212,-0.596924 0.17212,-0.256347 0.48706,-0.391846 0.31861,-0.135498 0.73975,-0.135498 0.50537,0 0.96313,0.26001 v -0.373535 q 0,-0.439453 -0.20508,-0.640869 -0.20507,-0.201416 -0.60791,-0.201416 -0.1538,0 -0.44311,0.02563 -0.28565,0.02197 -0.53467,0.06225 l -0.10254,-0.600585 q 0.44678,-0.05127 0.69947,-0.07324 0.25634,-0.02197 0.42846,-0.02197 0.66651,0 1.01074,0.351562 0.34424,0.351563 0.3479,1.047363 l 0.007,1.054688 q 0.004,0.53833 0.3186,1.105957 l -0.531,0.245361 z m -1.344,-0.618896 q 0.28565,0 0.50171,-0.09888 0.21607,-0.09888 0.33325,-0.281983 0.12085,-0.183105 0.12085,-0.421142 v -0.03296 q -0.1831,-0.102539 -0.40649,-0.157471 -0.22339,-0.05859 -0.46509,-0.05859 -0.39184,0 -0.62622,0.139161 -0.23437,0.135498 -0.23437,0.377197 0,0.157471 0.0952,0.27832 0.0989,0.12085 0.27466,0.19043 0.17578,0.06592 0.40649,0.06592 z" /><path style="fill:#fff;" d="m 128.51725,79.844872 v 1.926269 q 0,0.161133 0.0696,0.314941 0.0732,0.150147 0.21973,0.249024 0.14648,0.09522 0.35522,0.09522 0.14649,0 0.33325,-0.02564 v 0.53833 q -0.23803,0.02197 -0.4834,0.02197 -0.34057,0 -0.57861,-0.146485 -0.23804,-0.146484 -0.35889,-0.391845 -0.12084,-0.249024 -0.12084,-0.549317 v -2.03247 h -0.64454 v -0.531006 h 0.64454 v -1.281739 h 0.56396 v 1.281739 h 0.98145 v 0.531006 h -0.98145 z" /><path style="fill:#fff;" d="m 132.67008,78.19326 q -0.17578,0 -0.29297,-0.117187 -0.11718,-0.117188 -0.11718,-0.292969 0,-0.172119 0.11718,-0.289307 0.11719,-0.117187 0.29297,-0.117187 0.17212,0 0.28931,0.117187 0.11719,0.117188 0.11719,0.289307 0,0.175781 -0.11719,0.292969 -0.11719,0.117187 -0.28931,0.117187 z m -0.31128,1.116944 h 0.60059 v 3.566894 h -0.60059 z" /><path style="fill:#fff;" d="m 134.94791,79.844872 v 1.926269 q 0,0.161133 0.0696,0.314941 0.0733,0.150147 0.21973,0.249024 0.14649,0.09522 0.35523,0.09522 0.14648,0 0.33325,-0.02564 v 0.53833 q -0.23804,0.02197 -0.4834,0.02197 -0.34058,0 -0.57861,-0.146485 -0.23804,-0.146484 -0.35889,-0.391845 -0.12085,-0.249024 -0.12085,-0.549317 v -2.03247 h -0.64453 v -0.531006 h 0.64453 v -1.281739 h 0.56396 v 1.281739 h 0.98145 v 0.531006 h -0.98145 z" /><path style="line-height:142.99999475%;letter-spacing:-0.25999999px;fill:#ffffff" d="m 140.03825,82.961327 q -0.55297,0 -0.95214,-0.223389 -0.39917,-0.223389 -0.60791,-0.640869 -0.20875,-0.421143 -0.20875,-0.996094 0,-0.571289 0.21241,-0.996094 0.2124,-0.424804 0.62256,-0.655517 0.41015,-0.230713 0.9851,-0.227051 0.3003,-0.0037 0.5896,0.05493 0.28931,0.05493 0.49073,0.150146 l -0.14649,0.60791 q -0.44678,-0.201416 -0.93017,-0.201416 -0.61158,0 -0.88624,0.314942 -0.27465,0.311279 -0.27465,0.933837 0,0.651856 0.31128,0.970459 0.31494,0.318604 0.91552,0.318604 0.24536,0 0.43579,-0.04761 0.1941,-0.05127 0.50904,-0.168457 l 0.18677,0.55664 q -0.30762,0.117188 -0.63355,0.183106 -0.32593,0.06592 -0.6189,0.06592 z" /><path style="line-height:142.99999475%;letter-spacing:-0.19px;fill:#ffffff" d="m 143.34881,82.968651 q -0.55664,0 -0.98145,-0.230713 -0.42114,-0.230713 -0.65551,-0.651856 -0.23072,-0.424804 -0.23072,-0.977783 0,-0.560302 0.23072,-0.988769 0.23437,-0.428467 0.65551,-0.662842 0.42481,-0.234375 0.98145,-0.234375 0.54565,0 0.95947,0.234375 0.41382,0.234375 0.63721,0.662842 0.22339,0.424804 0.21972,0.988769 0,0.556641 -0.22705,0.977783 -0.22338,0.421143 -0.6372,0.651856 -0.41016,0.230713 -0.95215,0.230713 z m 0,-0.578613 q 0.34424,0 0.60791,-0.157471 0.26733,-0.161133 0.41382,-0.45044 0.15014,-0.292968 0.15747,-0.673828 -0.007,-0.388183 -0.15747,-0.684814 -0.15015,-0.296631 -0.41382,-0.457764 -0.26367,-0.164795 -0.60791,-0.164795 -0.36621,0 -0.6482,0.164795 -0.27832,0.164795 -0.43212,0.461426 -0.15015,0.296631 -0.15015,0.688476 0,0.38086 0.15015,0.670166 0.1538,0.289307 0.43212,0.446778 0.27833,0.157471 0.6482,0.157471 z" /><path style="line-height:142.99999475%;letter-spacing:-0.19px;fill:#ffffff" d="m 148.7655,83.01992 q -0.2124,-0.380859 -0.30029,-0.717773 -0.0549,0.150146 -0.2124,0.300293 -0.15381,0.150146 -0.40283,0.252685 -0.24537,0.102539 -0.56031,0.102539 -0.51635,0 -0.83496,-0.201416 -0.3186,-0.201416 -0.4541,-0.520019 -0.1355,-0.322266 -0.1355,-0.706787 v -2.215576 h 0.60059 v 2.028808 q 0,0.479737 0.19775,0.769043 0.20142,0.289307 0.75806,0.289307 0.41382,0 0.68481,-0.194092 0.271,-0.197754 0.271,-0.655518 v -2.24121 h 0.60059 v 2.358398 q 0.004,0.53833 0.3186,1.105957 z" /><path style="line-height:142.99999475%;letter-spacing:-0.09px;fill:#ffffff" d="m 150.00372,77.32534 h 0.60059 v 5.551758 h -0.60059 z" /><path style="line-height:142.99999475%;letter-spacing:-0.09px;fill:#ffffff" d="m 154.71841,83.01992 q -0.20874,-0.377197 -0.30762,-0.739746 -0.15747,0.336914 -0.49072,0.509033 -0.32959,0.17212 -0.8313,0.17212 -0.47974,0 -0.84229,-0.223389 -0.36255,-0.227051 -0.56396,-0.637207 -0.19776,-0.410156 -0.19776,-0.952149 0,-0.574951 0.22339,-1.010742 0.22339,-0.439453 0.62989,-0.681152 0.41015,-0.241699 0.94848,-0.241699 0.55298,0 1.0437,0.380859 v -2.27417 h 0.60059 v 4.346924 q 0.004,0.53833 0.3186,1.105957 z m -1.48316,-0.633545 q 0.53467,0 0.81299,-0.303955 0.28198,-0.307617 0.28198,-0.864257 V 80.11953 q -0.22705,-0.197754 -0.49072,-0.278321 -0.26367,-0.08057 -0.50537,-0.08057 -0.36987,0 -0.64087,0.164795 -0.271,0.161133 -0.41748,0.465088 -0.14648,0.300293 -0.14648,0.717773 0,0.314942 0.11718,0.60791 0.11719,0.292969 0.36621,0.483399 0.24903,0.186767 0.62256,0.186767 z" /><path style="line-height:142.99999475%;letter-spacing:-0.19px;fill:#ffffff" d="m 157.75219,79.214989 q 0.46875,0 0.78735,0.183105 0.31861,0.183106 0.47608,0.505371 0.16113,0.322266 0.16113,0.739746 v 2.233887 h -0.60059 v -2.06543 q 0,-0.450439 -0.19409,-0.736084 -0.19043,-0.285644 -0.63354,-0.289306 -0.31494,0.0037 -0.59326,0.117187 -0.27466,0.109864 -0.48706,0.31128 l -0.007,2.662353 h -0.60058 l 0.007,-3.566894 h 0.44311 l 0.11353,0.355224 q 0.4248,-0.450439 1.12793,-0.450439 z" /><path style="line-height:142.99999475%;letter-spacing:-0.19px;fill:#ffffff" d="m 160.11102,77.497459 h 0.53101 v 1.71753 h -0.53101 z" /><path style="fill:#fff;" d="m 162.41858,79.844872 v 1.926269 q 0,0.161133 0.0696,0.314941 0.0732,0.150147 0.21973,0.249024 0.14648,0.09522 0.35522,0.09522 0.14648,0 0.33325,-0.02564 v 0.53833 q -0.23803,0.02197 -0.4834,0.02197 -0.34057,0 -0.57861,-0.146485 -0.23804,-0.146484 -0.35889,-0.391845 -0.12085,-0.249024 -0.12085,-0.549317 v -2.03247 h -0.64453 v -0.531006 h 0.64453 v -1.281739 h 0.56397 v 1.281739 h 0.98144 v 0.531006 h -0.98144 z" /><path style="fill:#fff;" d="m 30.251877,89.939988 q 0.46875,0 0.787353,0.183106 0.318604,0.183105 0.476075,0.505371 0.161132,0.322266 0.161132,0.739746 v 2.233887 h -0.600586 v -2.06543 q 0,-0.450439 -0.194091,-0.736084 -0.194092,-0.285645 -0.633545,-0.285645 -0.314942,0 -0.593262,0.113526 -0.27832,0.109863 -0.494385,0.307617 v 2.666016 h -0.600586 v -5.55542 h 0.600586 v 2.307129 q 0.421143,-0.413819 1.091309,-0.413819 z" /><path style="fill:#fff;" d="m 35.287277,93.74492 q -0.201416,-0.351563 -0.303955,-0.725098 -0.06226,0.183106 -0.241699,0.336914 -0.179443,0.153809 -0.428467,0.2417 -0.249023,0.08789 -0.505371,0.08789 -0.362549,0 -0.651855,-0.113525 -0.285645,-0.113526 -0.454102,-0.351563 -0.164795,-0.238037 -0.164795,-0.593261 0,-0.344239 0.172119,-0.596924 0.172119,-0.256348 0.487061,-0.391846 0.318603,-0.135498 0.739746,-0.135498 0.505371,0 0.963135,0.26001 v -0.373535 q 0,-0.439453 -0.205078,-0.64087 -0.205079,-0.201416 -0.607911,-0.201416 -0.153808,0 -0.443115,0.02563 -0.285644,0.02197 -0.534668,0.06226 l -0.102539,-0.600586 q 0.446777,-0.05127 0.699463,-0.07324 0.256348,-0.02197 0.428467,-0.02197 0.666504,0 1.010742,0.351563 0.344238,0.351562 0.3479,1.047363 l 0.0073,1.054688 q 0.0037,0.53833 0.318603,1.105957 l -0.531006,0.245361 z m -1.343994,-0.618897 q 0.285645,0 0.501709,-0.09888 0.216065,-0.09888 0.333252,-0.281983 0.12085,-0.183105 0.12085,-0.421142 v -0.03296 q -0.183106,-0.10254 -0.406495,-0.157471 -0.223388,-0.05859 -0.465087,-0.05859 -0.391846,0 -0.626221,0.13916 -0.234375,0.135498 -0.234375,0.377198 0,0.15747 0.09521,0.27832 0.09888,0.120849 0.274658,0.19043 0.175781,0.06592 0.406494,0.06592 z" /><path style="letter-spacing:-0.52999997px;fill:#ffffff" d="m 38.323166,89.939988 q 0.46875,0 0.787353,0.183106 0.318604,0.183105 0.476075,0.505371 0.161132,0.322266 0.161132,0.739746 v 2.233887 h -0.600585 v -2.06543 q 0,-0.450439 -0.194092,-0.736084 -0.19043,-0.285645 -0.633545,-0.289307 -0.314942,0.0037 -0.593262,0.117188 -0.274658,0.109863 -0.48706,0.311279 l -0.0073,2.662354 h -0.600586 l 0.0073,-3.566895 h 0.443115 l 0.113525,0.355225 q 0.424805,-0.45044 1.12793,-0.45044 z" /><path style="letter-spacing:-0.1px;fill:#ffffff" d="m 43.341262,93.74492 q -0.20874,-0.377197 -0.307617,-0.739746 -0.157471,0.336914 -0.490723,0.509033 -0.32959,0.172119 -0.831299,0.172119 -0.479736,0 -0.842285,-0.223388 -0.362549,-0.227051 -0.563965,-0.637207 -0.197754,-0.410157 -0.197754,-0.952149 0,-0.574951 0.223389,-1.010742 0.223389,-0.439453 0.629883,-0.681152 0.410156,-0.2417 0.948486,-0.2417 0.552979,0 1.043701,0.38086 v -2.27417 h 0.600586 v 4.346924 q 0.0037,0.53833 0.318604,1.105957 z m -1.483154,-0.633545 q 0.534668,0 0.812988,-0.303955 0.281982,-0.307617 0.281982,-0.864258 v -1.098633 q -0.227051,-0.197754 -0.490722,-0.27832 -0.263672,-0.08057 -0.505371,-0.08057 -0.369874,0 -0.64087,0.164795 -0.270996,0.161132 -0.41748,0.465087 -0.146484,0.300293 -0.146484,0.717774 0,0.314941 0.117187,0.60791 0.117188,0.292969 0.366211,0.483398 0.249023,0.186768 0.622559,0.186768 z" /><path style="letter-spacing:-0.1px;fill:#ffffff" d="m 44.676809,88.05034 h 0.600586 v 5.551758 h -0.600586 z" /><path style="fill:#fff;" d="m 48.081448,93.133348 q 0.245361,0 0.520019,-0.05493 0.274658,-0.05493 0.549317,-0.161133 l 0.186767,0.512696 q -0.26001,0.109863 -0.65918,0.183105 -0.399169,0.07324 -0.725097,0.07324 -0.864258,0 -1.340332,-0.461426 -0.476074,-0.465087 -0.476074,-1.428222 0,-0.600586 0.20874,-1.018067 0.212402,-0.421142 0.611572,-0.637207 0.39917,-0.216064 0.959473,-0.216064 0.494384,0 0.827636,0.230713 0.333252,0.227051 0.494385,0.596924 0.161133,0.366211 0.161133,0.787353 0,0.289307 -0.08057,0.578613 l -2.548829,0.01831 q 0.08057,0.494385 0.410157,0.74707 0.32959,0.249024 0.900879,0.249024 z m -0.245362,-2.633057 q -0.520019,0 -0.783691,0.300293 -0.263672,0.300293 -0.300293,0.809326 l 1.981201,-0.01831 q 0.0073,-0.08789 0.0073,-0.131836 0,-0.249024 -0.09155,-0.465088 -0.09155,-0.219727 -0.296631,-0.355225 -0.201416,-0.13916 -0.516358,-0.13916 z" /><path style="fill:#fff;" d="m 49.83926,94.312547 q 0.245361,-0.457764 0.336914,-0.780029 0.09155,-0.322266 0.09155,-0.765381 h 0.65918 q 0,0.454101 -0.161133,0.944824 -0.157471,0.494385 -0.424805,0.856934 z" /><path style="fill:#fff;" d="m 56.456692,93.74492 q -0.201416,-0.351563 -0.303955,-0.725098 -0.06226,0.183106 -0.2417,0.336914 -0.179443,0.153809 -0.428466,0.2417 -0.249024,0.08789 -0.505371,0.08789 -0.362549,0 -0.651856,-0.113525 -0.285644,-0.113526 -0.454101,-0.351563 -0.164795,-0.238037 -0.164795,-0.593261 0,-0.344239 0.172119,-0.596924 0.172119,-0.256348 0.48706,-0.391846 0.318604,-0.135498 0.739746,-0.135498 0.505371,0 0.963135,0.26001 v -0.373535 q 0,-0.439453 -0.205078,-0.64087 -0.205078,-0.201416 -0.60791,-0.201416 -0.153809,0 -0.443115,0.02563 -0.285645,0.02197 -0.534668,0.06226 l -0.102539,-0.600586 q 0.446777,-0.05127 0.699462,-0.07324 0.256348,-0.02197 0.428467,-0.02197 0.666504,0 1.010742,0.351563 0.344239,0.351562 0.347901,1.047363 l 0.0073,1.054688 q 0.0037,0.53833 0.318604,1.105957 l -0.531006,0.245361 z m -1.343994,-0.618897 q 0.285644,0 0.501709,-0.09888 0.216064,-0.09888 0.333252,-0.281983 0.120849,-0.183105 0.120849,-0.421142 v -0.03296 q -0.183105,-0.10254 -0.406494,-0.157471 -0.223389,-0.05859 -0.465088,-0.05859 -0.391846,0 -0.626221,0.13916 -0.234375,0.135498 -0.234375,0.377198 0,0.15747 0.09522,0.27832 0.09888,0.120849 0.274658,0.19043 0.175782,0.06592 0.406495,0.06592 z" /><path style="letter-spacing:-0.23px;fill:#ffffff" d="m 59.49258,89.939988 q 0.46875,0 0.787354,0.183106 0.318603,0.183105 0.476074,0.505371 0.161133,0.322266 0.161133,0.739746 v 2.233887 h -0.600586 v -2.06543 q 0,-0.450439 -0.194092,-0.736084 -0.190429,-0.285645 -0.633545,-0.289307 -0.314941,0.0037 -0.593261,0.117188 -0.274659,0.109863 -0.487061,0.311279 l -0.0073,2.662354 H 57.80071 l 0.0073,-3.566895 h 0.443115 l 0.113526,0.355225 q 0.424804,-0.45044 1.127929,-0.45044 z" /><path style="letter-spacing:-0.23px;fill:#ffffff" d="m 64.810677,93.74492 q -0.208741,-0.377197 -0.307618,-0.739746 -0.15747,0.336914 -0.490722,0.509033 -0.32959,0.172119 -0.831299,0.172119 -0.479736,0 -0.842285,-0.223388 -0.362549,-0.227051 -0.563965,-0.637207 -0.197754,-0.410157 -0.197754,-0.952149 0,-0.574951 0.223389,-1.010742 0.223388,-0.439453 0.629882,-0.681152 0.410157,-0.2417 0.948487,-0.2417 0.552978,0 1.043701,0.38086 v -2.27417 h 0.600586 v 4.346924 q 0.0037,0.53833 0.318603,1.105957 z m -1.483155,-0.633545 q 0.534668,0 0.812989,-0.303955 0.281982,-0.307617 0.281982,-0.864258 v -1.098633 q -0.227051,-0.197754 -0.490723,-0.27832 -0.263672,-0.08057 -0.505371,-0.08057 -0.369873,0 -0.640869,0.164795 -0.270996,0.161132 -0.41748,0.465087 -0.146485,0.300293 -0.146485,0.717774 0,0.314941 0.117188,0.60791 0.117187,0.292969 0.366211,0.483398 0.249023,0.186768 0.622558,0.186768 z" /><path style="letter-spacing:-0.25px;fill:#ffffff" d="m 69.505238,89.939988 q 0.46875,0 0.787353,0.183106 0.318604,0.183105 0.476074,0.505371 0.161133,0.322266 0.161133,0.739746 v 2.233887 h -0.600586 v -2.06543 q 0,-0.450439 -0.194092,-0.736084 -0.190429,-0.285645 -0.633545,-0.289307 -0.314941,0.0037 -0.593261,0.117188 -0.274658,0.109863 -0.487061,0.311279 l -0.0073,2.662354 h -0.600586 l 0.0073,-3.566895 h 0.443116 l 0.113525,0.355225 q 0.424805,-0.45044 1.12793,-0.45044 z" /><path style="letter-spacing:-0.25px;fill:#ffffff" d="m 73.422718,93.69365 q -0.556641,0 -0.981445,-0.230712 -0.421143,-0.230713 -0.655518,-0.651856 -0.230713,-0.424805 -0.230713,-0.977783 0,-0.560303 0.230713,-0.98877 0.234375,-0.428466 0.655518,-0.662841 0.424804,-0.234375 0.981445,-0.234375 0.545654,0 0.959473,0.234375 0.413818,0.234375 0.637207,0.662841 0.223388,0.424805 0.219726,0.98877 0,0.55664 -0.22705,0.977783 -0.223389,0.421143 -0.637208,0.651856 -0.410156,0.230712 -0.952148,0.230712 z m 0,-0.578613 q 0.344238,0 0.60791,-0.157471 0.267334,-0.161132 0.413819,-0.450439 0.150146,-0.292969 0.15747,-0.673828 -0.0073,-0.388184 -0.15747,-0.684815 -0.150147,-0.29663 -0.413819,-0.457763 -0.263672,-0.164795 -0.60791,-0.164795 -0.366211,0 -0.648193,0.164795 -0.278321,0.164795 -0.432129,0.461426 -0.150147,0.29663 -0.150147,0.688476 0,0.380859 0.150147,0.670166 0.153808,0.289307 0.432129,0.446777 0.27832,0.157471 0.648193,0.157471 z" /><path style="letter-spacing:-0.25px;fill:#ffffff" d="m 75.439564,90.035203 h 0.611572 l 0.776367,2.548828 q 0.01465,0.05859 0.0293,0.168457 0.01465,0.109864 0.01831,0.161133 h 0.0293 q 0.0037,-0.04395 0.02563,-0.172119 0.02563,-0.131836 0.04028,-0.175781 l 0.84961,-2.53418 h 0.549316 l 0.791016,2.548828 q 0.01099,0.03296 0.0293,0.161133 0.02197,0.124512 0.02563,0.175781 h 0.0293 q 0.0037,-0.03662 0.02563,-0.146484 0.02197,-0.113526 0.04028,-0.183106 l 0.761719,-2.55249 h 0.615234 l -1.124267,3.585205 H 78.940532 L 78.164165,91.21074 q -0.02197,-0.0769 -0.04761,-0.190429 -0.02197,-0.117188 -0.02564,-0.150147 h -0.01465 q -0.0037,0.03296 -0.03296,0.150147 -0.02563,0.113525 -0.04761,0.186767 l -0.820312,2.41333 h -0.600586 l -1.135254,-3.585205 z" /><path style="fill:#fff;" d="m 83.491566,88.91826 q -0.175782,0 -0.292969,-0.117188 -0.117188,-0.117187 -0.117188,-0.292968 0,-0.17212 0.117188,-0.289307 0.117187,-0.117188 0.292969,-0.117188 0.172119,0 0.289306,0.117188 0.117188,0.117187 0.117188,0.289307 0,0.175781 -0.117188,0.292968 -0.117187,0.117188 -0.289306,0.117188 z m -0.31128,1.116943 h 0.600586 v 3.566895 h -0.600586 z" /><path style="fill:#fff;" d="m 85.769398,90.569871 v 1.92627 q 0,0.161132 0.06958,0.314941 0.07324,0.150147 0.219726,0.249024 0.146485,0.09521 0.355225,0.09521 0.146484,0 0.333252,-0.02563 v 0.53833 q -0.238037,0.02197 -0.483398,0.02197 -0.340577,0 -0.578614,-0.146484 -0.238037,-0.146484 -0.358886,-0.391846 -0.12085,-0.249023 -0.12085,-0.549316 v -2.032471 h -0.644531 v -0.531006 h 0.644531 v -1.281738 h 0.563965 v 1.281738 h 0.981445 v 0.531006 h -0.981445 z" /><path style="fill:#fff;" d="m 91.299183,89.939988 q 0.46875,0 0.787353,0.183106 0.318604,0.183105 0.476075,0.505371 0.161132,0.322266 0.161132,0.739746 v 2.233887 h -0.600585 v -2.06543 q 0,-0.450439 -0.194092,-0.736084 -0.19043,-0.285645 -0.633545,-0.289307 -0.314942,0.0037 -0.593262,0.117188 -0.274658,0.109863 -0.48706,0.311279 l -0.0073,2.662354 h -0.600586 l 0.0073,-3.566895 h 0.443115 l 0.113525,0.355225 q 0.424805,-0.45044 1.12793,-0.45044 z" /><path style="fill:#fff;" d="m 95.547226,93.133348 q 0.245361,0 0.520019,-0.05493 0.274659,-0.05493 0.549317,-0.161133 l 0.186767,0.512696 q -0.260009,0.109863 -0.659179,0.183105 -0.39917,0.07324 -0.725098,0.07324 -0.864258,0 -1.340332,-0.461426 -0.476074,-0.465087 -0.476074,-1.428222 0,-0.600586 0.20874,-1.018067 0.212402,-0.421142 0.611572,-0.637207 0.39917,-0.216064 0.959473,-0.216064 0.494385,0 0.827637,0.230713 0.333252,0.227051 0.494385,0.596924 0.161132,0.366211 0.161132,0.787353 0,0.289307 -0.08057,0.578613 l -2.548828,0.01831 q 0.08057,0.494385 0.410156,0.74707 0.32959,0.249024 0.900879,0.249024 z m -0.245361,-2.633057 q -0.52002,0 -0.783692,0.300293 -0.263672,0.300293 -0.300293,0.809326 l 1.981201,-0.01831 q 0.0073,-0.08789 0.0073,-0.131836 0,-0.249024 -0.09155,-0.465088 -0.09155,-0.219727 -0.296631,-0.355225 -0.201416,-0.13916 -0.516357,-0.13916 z" /><path style="fill:#fff;" d="m 99.458359,93.133348 q 0.245361,0 0.520019,-0.05493 0.274662,-0.05493 0.549312,-0.161133 l 0.18677,0.512696 q -0.26001,0.109863 -0.65918,0.183105 -0.399167,0.07324 -0.725095,0.07324 -0.864258,0 -1.340332,-0.461426 -0.476074,-0.465087 -0.476074,-1.428222 0,-0.600586 0.20874,-1.018067 0.212402,-0.421142 0.611572,-0.637207 0.39917,-0.216064 0.959473,-0.216064 0.494385,0 0.827636,0.230713 0.33325,0.227051 0.49439,0.596924 0.16113,0.366211 0.16113,0.787353 0,0.289307 -0.0806,0.578613 l -2.548826,0.01831 q 0.08057,0.494385 0.410156,0.74707 0.32959,0.249024 0.900879,0.249024 z m -0.245362,-2.633057 q -0.520019,0 -0.783691,0.300293 -0.263672,0.300293 -0.300293,0.809326 l 1.981197,-0.01831 q 0.007,-0.08789 0.007,-0.131836 0,-0.249024 -0.0916,-0.465088 -0.09156,-0.219727 -0.296635,-0.355225 -0.201416,-0.13916 -0.516358,-0.13916 z" /><path style="letter-spacing:-0.25px;fill:#ffffff" d="m 104.66954,93.74492 q -0.20874,-0.377197 -0.30762,-0.739746 -0.15747,0.336914 -0.49072,0.509033 -0.32959,0.172119 -0.8313,0.172119 -0.47973,0 -0.84228,-0.223388 -0.36255,-0.227051 -0.56397,-0.637207 -0.19775,-0.410157 -0.19775,-0.952149 0,-0.574951 0.22339,-1.010742 0.22339,-0.439453 0.62988,-0.681152 0.41016,-0.2417 0.94849,-0.2417 0.55297,0 1.0437,0.38086 v -2.27417 h 0.60058 v 4.346924 q 0.004,0.53833 0.31861,1.105957 z m -1.48315,-0.633545 q 0.53466,0 0.81298,-0.303955 0.28199,-0.307617 0.28199,-0.864258 v -1.098633 q -0.22705,-0.197754 -0.49073,-0.27832 -0.26367,-0.08057 -0.50537,-0.08057 -0.36987,0 -0.64087,0.164795 -0.27099,0.161132 -0.41748,0.465087 -0.14648,0.300293 -0.14648,0.717774 0,0.314941 0.11719,0.60791 0.11718,0.292969 0.36621,0.483398 0.24902,0.186768 0.62256,0.186768 z" /><path style="letter-spacing:-0.25px;fill:#ffffff" d="m 106.76695,93.69365 q -0.57861,-0.0037 -1.20483,-0.285644 l 0.19775,-0.53833 q 0.5896,0.263672 1.00708,0.270996 0.76172,-0.01099 0.76538,-0.501709 0,-0.172119 -0.0989,-0.281982 -0.0952,-0.109864 -0.2417,-0.175782 -0.14283,-0.06592 -0.39551,-0.146484 -0.33325,-0.106201 -0.54199,-0.20874 -0.20874,-0.106202 -0.35889,-0.314942 -0.14648,-0.20874 -0.14648,-0.552978 0.011,-1.025391 1.24878,-1.025391 0.56762,0 0.98876,0.194092 l -0.20874,0.545654 q -0.42114,-0.186767 -0.78002,-0.186767 -0.65552,0.0073 -0.68116,0.472412 0,0.13916 0.0879,0.230713 0.0879,0.09155 0.21607,0.150146 0.13183,0.05493 0.36621,0.131836 0.3479,0.109863 0.56763,0.223389 0.22338,0.109863 0.38452,0.340576 0.16113,0.227051 0.16113,0.604248 0,1.054687 -1.33301,1.054687 z" /><path style="fill:#fff;" d="m 111.59264,90.569871 v 1.92627 q 0,0.161132 0.0696,0.314941 0.0732,0.150147 0.21972,0.249024 0.14649,0.09521 0.35523,0.09521 0.14648,0 0.33325,-0.02563 v 0.53833 q -0.23804,0.02197 -0.4834,0.02197 -0.34058,0 -0.57861,-0.146484 -0.23804,-0.146484 -0.35889,-0.391846 -0.12085,-0.249023 -0.12085,-0.549316 v -2.032471 h -0.64453 v -0.531006 h 0.64453 v -1.281738 h 0.56397 v 1.281738 h 0.98144 v 0.531006 h -0.98144 z" /><path style="fill:#fff;" d="m 114.99107,93.69365 q -0.55664,0 -0.98144,-0.230712 -0.42114,-0.230713 -0.65552,-0.651856 -0.23071,-0.424805 -0.23071,-0.977783 0,-0.560303 0.23071,-0.98877 0.23438,-0.428466 0.65552,-0.662841 0.4248,-0.234375 0.98144,-0.234375 0.54566,0 0.95948,0.234375 0.41381,0.234375 0.6372,0.662841 0.22339,0.424805 0.21973,0.98877 0,0.55664 -0.22705,0.977783 -0.22339,0.421143 -0.63721,0.651856 -0.41015,0.230712 -0.95215,0.230712 z m 0,-0.578613 q 0.34424,0 0.60791,-0.157471 0.26734,-0.161132 0.41382,-0.450439 0.15015,-0.292969 0.15747,-0.673828 -0.007,-0.388184 -0.15747,-0.684815 -0.15014,-0.29663 -0.41382,-0.457763 -0.26367,-0.164795 -0.60791,-0.164795 -0.36621,0 -0.64819,0.164795 -0.27832,0.164795 -0.43213,0.461426 -0.15015,0.29663 -0.15015,0.688476 0,0.380859 0.15015,0.670166 0.15381,0.289307 0.43213,0.446777 0.27832,0.157471 0.64819,0.157471 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 120.36705,90.379441 q 0.3772,-0.435791 0.9668,-0.435791 0.16479,0 0.34424,0.03296 l -0.10254,0.571289 q -0.10254,-0.01099 -0.20142,-0.01099 -0.56763,0 -0.94116,0.351563 v 2.713623 h -0.60059 V 90.0352 h 0.4541 l 0.0806,0.344238 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 123.92438,93.133348 q 0.24536,0 0.52002,-0.05493 0.27466,-0.05493 0.54931,-0.161133 l 0.18677,0.512696 q -0.26001,0.109863 -0.65918,0.183105 -0.39917,0.07324 -0.7251,0.07324 -0.86425,0 -1.34033,-0.461426 -0.47607,-0.465087 -0.47607,-1.428222 0,-0.600586 0.20874,-1.018067 0.2124,-0.421142 0.61157,-0.637207 0.39917,-0.216064 0.95947,-0.216064 0.49439,0 0.82764,0.230713 0.33325,0.227051 0.49438,0.596924 0.16114,0.366211 0.16114,0.787353 0,0.289307 -0.0806,0.578613 l -2.54883,0.01831 q 0.0806,0.494385 0.41016,0.74707 0.32959,0.249024 0.90088,0.249024 z m -0.24536,-2.633057 q -0.52002,0 -0.7837,0.300293 -0.26367,0.300293 -0.30029,0.809326 l 1.9812,-0.01831 q 0.007,-0.08789 0.007,-0.131836 0,-0.249024 -0.0916,-0.465088 -0.0915,-0.219727 -0.29663,-0.355225 -0.20141,-0.13916 -0.51635,-0.13916 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 126.85915,93.69365 q -0.57862,-0.0037 -1.20484,-0.285644 l 0.19776,-0.53833 q 0.5896,0.263672 1.00708,0.270996 0.76171,-0.01099 0.76538,-0.501709 0,-0.172119 -0.0989,-0.281982 -0.0952,-0.109864 -0.2417,-0.175782 -0.14282,-0.06592 -0.39551,-0.146484 -0.33325,-0.106201 -0.54199,-0.20874 -0.20874,-0.106202 -0.35889,-0.314942 -0.14648,-0.20874 -0.14648,-0.552978 0.011,-1.025391 1.24878,-1.025391 0.56763,0 0.98877,0.194092 l -0.20874,0.545654 q -0.42114,-0.186767 -0.78003,-0.186767 -0.65552,0.0073 -0.68115,0.472412 0,0.13916 0.0879,0.230713 0.0879,0.09155 0.21606,0.150146 0.13184,0.05493 0.36621,0.131836 0.3479,0.109863 0.56763,0.223389 0.22339,0.109863 0.38452,0.340576 0.16113,0.227051 0.16113,0.604248 0,1.054687 -1.333,1.054687 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 129.68404,90.569871 v 1.92627 q 0,0.161132 0.0696,0.314941 0.0733,0.150147 0.21973,0.249024 0.14648,0.09521 0.35523,0.09521 0.14648,0 0.33325,-0.02563 v 0.53833 q -0.23804,0.02197 -0.4834,0.02197 -0.34058,0 -0.57861,-0.146484 -0.23804,-0.146484 -0.35889,-0.391846 -0.12085,-0.249023 -0.12085,-0.549316 v -2.032471 h -0.64453 v -0.531006 h 0.64453 v -1.281738 h 0.56396 v 1.281738 h 0.98145 v 0.531006 h -0.98145 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 133.7504,93.74492 q -0.20141,-0.351563 -0.30395,-0.725098 -0.0623,0.183106 -0.2417,0.336914 -0.17944,0.153809 -0.42847,0.2417 -0.24902,0.08789 -0.50537,0.08789 -0.36255,0 -0.65185,-0.113525 -0.28565,-0.113526 -0.4541,-0.351563 -0.1648,-0.238037 -0.1648,-0.593261 0,-0.344239 0.17212,-0.596924 0.17212,-0.256348 0.48706,-0.391846 0.3186,-0.135498 0.73975,-0.135498 0.50537,0 0.96313,0.26001 v -0.373535 q 0,-0.439453 -0.20508,-0.64087 -0.20508,-0.201416 -0.60791,-0.201416 -0.15381,0 -0.44311,0.02563 -0.28565,0.02197 -0.53467,0.06226 l -0.10254,-0.600586 q 0.44678,-0.05127 0.69946,-0.07324 0.25635,-0.02197 0.42847,-0.02197 0.6665,0 1.01074,0.351563 0.34424,0.351562 0.3479,1.047363 l 0.007,1.054688 q 0.004,0.53833 0.3186,1.105957 l -0.53101,0.245361 z m -1.34399,-0.618897 q 0.28564,0 0.50171,-0.09888 0.21606,-0.09888 0.33325,-0.281983 0.12085,-0.183105 0.12085,-0.421142 v -0.03296 q -0.1831,-0.10254 -0.40649,-0.157471 -0.22339,-0.05859 -0.46509,-0.05859 -0.39185,0 -0.62622,0.13916 -0.23438,0.135498 -0.23438,0.377198 0,0.15747 0.0952,0.27832 0.0989,0.120849 0.27466,0.19043 0.17578,0.06592 0.40649,0.06592 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 135.43639,90.379441 q 0.37719,-0.435791 0.96679,-0.435791 0.1648,0 0.34424,0.03296 l -0.10254,0.571289 q -0.10254,-0.01099 -0.20141,-0.01099 -0.56763,0 -0.94117,0.351563 v 2.713623 h -0.60058 V 90.0352 h 0.4541 l 0.0806,0.344238 z" /><path style="letter-spacing:-0.2px;fill:#ffffff" d="m 138.06354,90.569871 v 1.92627 q 0,0.161132 0.0696,0.314941 0.0732,0.150147 0.21972,0.249024 0.14649,0.09521 0.35523,0.09521 0.14648,0 0.33325,-0.02563 v 0.53833 q -0.23804,0.02197 -0.4834,0.02197 -0.34057,0 -0.57861,-0.146484 -0.23804,-0.146484 -0.35889,-0.391846 -0.12085,-0.249023 -0.12085,-0.549316 v -2.032471 h -0.64453 v -0.531006 h 0.64453 v -1.281738 h 0.56397 v 1.281738 h 0.98144 v 0.531006 h -0.98144 z" /><path style="fill:#fff;" d="m 139.86305,93.682664 q -0.18677,0 -0.30029,-0.109863 -0.10986,-0.113526 -0.10986,-0.300293 0,-0.186768 0.10986,-0.300293 0.11352,-0.113526 0.30029,-0.113526 0.18677,0 0.3003,0.113526 0.11352,0.113525 0.11352,0.300293 0,0.186767 -0.11352,0.300293 -0.11353,0.109863 -0.3003,0.109863 z" /></g><g><path style="fill:#fff;" d="m 28.880116,106.02305 -0.844117,-1.6626 h 0.344239 l 0.593261,1.19568 q 0.01099,0.0238 0.0293,0.0714 0.01831,0.0458 0.03479,0.0897 h 0.0055 q 0.01648,-0.0604 0.06775,-0.16113 l 0.620728,-1.19568 h 0.322266 l -0.866089,1.65527 v 0.97046 h -0.307617 v -0.96313 z" /><path style="fill:#fff;" d="m 31.181751,107.03196 q -0.27832,0 -0.490722,-0.11536 -0.210572,-0.11535 -0.327759,-0.32592 -0.115357,-0.21241 -0.115357,-0.4889 0,-0.28015 0.115357,-0.49438 0.117187,-0.21423 0.327759,-0.33142 0.212402,-0.11719 0.490722,-0.11719 0.272827,0 0.479737,0.11719 0.206909,0.11719 0.318603,0.33142 0.111694,0.2124 0.109863,0.49438 0,0.27832 -0.113525,0.4889 -0.111694,0.21057 -0.318604,0.32592 -0.205078,0.11536 -0.476074,0.11536 z m 0,-0.28931 q 0.172119,0 0.303955,-0.0787 0.133667,-0.0806 0.20691,-0.22522 0.07507,-0.14649 0.07873,-0.33692 -0.0037,-0.19409 -0.07873,-0.3424 -0.07507,-0.14832 -0.20691,-0.22889 -0.131836,-0.0824 -0.303955,-0.0824 -0.183105,0 -0.324096,0.0824 -0.139161,0.0824 -0.216065,0.23072 -0.07507,0.14831 -0.07507,0.34424 0,0.19043 0.07507,0.33508 0.0769,0.14465 0.216065,0.22339 0.13916,0.0787 0.324096,0.0787 z" /><path style="fill:#fff;" d="m 33.985096,107.05759 q -0.106201,-0.19043 -0.150147,-0.35888 -0.02746,0.0751 -0.106201,0.15014 -0.0769,0.0751 -0.201416,0.12635 -0.12268,0.0513 -0.280151,0.0513 -0.258179,0 -0.417481,-0.10071 -0.159301,-0.10071 -0.22705,-0.26001 -0.06775,-0.16113 -0.06775,-0.35339 v -1.10779 h 0.300293 v 1.0144 q 0,0.23987 0.09888,0.38452 0.100708,0.14466 0.379028,0.14466 0.206909,0 0.342407,-0.097 0.135498,-0.0989 0.135498,-0.32776 v -1.1206 h 0.300293 v 1.1792 q 0.0018,0.26916 0.159302,0.55297 l -0.265503,0.12268 z" /><path style="fill:#fff;" d="m 36.478992,107.0283 q -0.276489,0 -0.476074,-0.1117 -0.199585,-0.11169 -0.303955,-0.32043 -0.10437,-0.21057 -0.10437,-0.49805 0,-0.28564 0.106201,-0.49805 0.106201,-0.2124 0.31128,-0.32775 0.205078,-0.11536 0.492553,-0.11353 0.150147,-0.002 0.2948,0.0275 0.144653,0.0275 0.245361,0.0751 l -0.07324,0.30395 q -0.223388,-0.1007 -0.465088,-0.1007 -0.305786,0 -0.443115,0.15747 -0.137329,0.15564 -0.137329,0.46692 0,0.32592 0.15564,0.48523 0.15747,0.1593 0.457763,0.1593 0.122681,0 0.217896,-0.0238 0.09705,-0.0256 0.254516,-0.0842 l 0.09338,0.27832 q -0.153808,0.0586 -0.316772,0.0915 -0.162964,0.033 -0.309449,0.033 z" /><path style="fill:#fff;" d="m 38.698231,107.05759 q -0.100708,-0.17578 -0.151978,-0.36254 -0.03113,0.0916 -0.120849,0.16845 -0.08972,0.0769 -0.214234,0.12085 -0.124512,0.0439 -0.252685,0.0439 -0.181275,0 -0.325928,-0.0568 -0.142822,-0.0568 -0.227051,-0.17578 -0.0824,-0.11902 -0.0824,-0.29663 0,-0.17212 0.08606,-0.29846 0.08606,-0.12817 0.243531,-0.19592 0.159301,-0.0678 0.369873,-0.0678 0.252685,0 0.481567,0.13 v -0.18676 q 0,-0.21973 -0.102539,-0.32044 -0.102539,-0.10071 -0.303955,-0.10071 -0.0769,0 -0.221558,0.0128 -0.142822,0.011 -0.267334,0.0311 l -0.05127,-0.30029 q 0.223388,-0.0256 0.349731,-0.0366 0.128174,-0.011 0.214234,-0.011 0.333251,0 0.505371,0.17578 0.172119,0.17578 0.17395,0.52368 l 0.0037,0.52735 q 0.0018,0.26916 0.159302,0.55297 l -0.265503,0.12268 z m -0.671997,-0.30944 q 0.142822,0 0.250854,-0.0494 0.108032,-0.0494 0.166626,-0.14099 0.06043,-0.0916 0.06043,-0.21057 v -0.0165 q -0.09155,-0.0513 -0.203247,-0.0787 -0.111694,-0.0293 -0.232544,-0.0293 -0.195923,0 -0.31311,0.0696 -0.117188,0.0678 -0.117188,0.1886 0,0.0787 0.04761,0.13916 0.04944,0.0604 0.137329,0.0952 0.08789,0.033 0.203247,0.033 z" /><path style="fill:#fff;" d="m 40.216175,105.15513 q 0.234375,0 0.393677,0.0915 0.159302,0.0915 0.238037,0.25269 0.08057,0.16113 0.08057,0.36987 v 1.11694 h -0.300293 v -1.03271 q 0,-0.22522 -0.09705,-0.36804 -0.09521,-0.14283 -0.316772,-0.14466 -0.157471,0.002 -0.296631,0.0586 -0.137329,0.0549 -0.24353,0.15564 l -0.0037,1.33117 H 39.37019 l 0.0037,-1.78344 h 0.221558 l 0.05676,0.17761 q 0.212403,-0.22522 0.563965,-0.22522 z" /><path style="fill:#fff;" d="m 42.977406,107.03196 q -0.289307,-0.002 -0.602417,-0.14282 l 0.09888,-0.26917 q 0.294799,0.13184 0.50354,0.1355 0.380859,-0.005 0.38269,-0.25085 0,-0.0861 -0.04944,-0.141 -0.04761,-0.0549 -0.12085,-0.0879 -0.07141,-0.033 -0.197754,-0.0732 -0.166626,-0.0531 -0.270996,-0.10437 -0.10437,-0.0531 -0.179443,-0.15747 -0.07324,-0.10437 -0.07324,-0.27649 0.0055,-0.51269 0.62439,-0.51269 0.283813,0 0.494385,0.097 l -0.10437,0.27283 q -0.210572,-0.0934 -0.390015,-0.0934 -0.327759,0.004 -0.340576,0.2362 0,0.0696 0.04395,0.11536 0.04395,0.0458 0.108032,0.0751 0.06592,0.0275 0.183106,0.0659 0.17395,0.0549 0.283813,0.11169 0.111695,0.0549 0.192261,0.17029 0.08057,0.11353 0.08057,0.30213 0,0.52734 -0.666503,0.52734 z" /><path style="fill:#fff;" d="m 44.954945,106.75181 q 0.12268,0 0.260009,-0.0275 0.137329,-0.0275 0.274659,-0.0806 l 0.09338,0.25634 q -0.130005,0.0549 -0.329589,0.0916 -0.199585,0.0366 -0.362549,0.0366 -0.432129,0 -0.670166,-0.23072 -0.238037,-0.23254 -0.238037,-0.71411 0,-0.30029 0.10437,-0.50903 0.106201,-0.21057 0.305786,-0.3186 0.199585,-0.10804 0.479736,-0.10804 0.247193,0 0.413819,0.11536 0.166625,0.11353 0.247192,0.29846 0.08057,0.18311 0.08057,0.39368 0,0.14465 -0.04028,0.28931 l -1.274414,0.009 q 0.04028,0.24719 0.205078,0.37354 0.164795,0.12451 0.45044,0.12451 z m -0.122681,-1.31653 q -0.26001,0 -0.391846,0.15015 -0.131836,0.15014 -0.150146,0.40466 l 0.9906,-0.009 q 0.0037,-0.0439 0.0037,-0.0659 0,-0.12452 -0.04578,-0.23255 -0.04578,-0.10986 -0.148315,-0.17761 -0.100708,-0.0696 -0.258179,-0.0696 z" /><path style="fill:#fff;" d="m 47.304188,107.05759 q -0.100708,-0.17578 -0.151978,-0.36254 -0.03113,0.0916 -0.120849,0.16845 -0.08972,0.0769 -0.214234,0.12085 -0.124511,0.0439 -0.252685,0.0439 -0.181275,0 -0.325928,-0.0568 -0.142822,-0.0568 -0.227051,-0.17578 -0.0824,-0.11902 -0.0824,-0.29663 0,-0.17212 0.08606,-0.29846 0.08606,-0.12817 0.243531,-0.19592 0.159301,-0.0678 0.369873,-0.0678 0.252685,0 0.481567,0.13 v -0.18676 q 0,-0.21973 -0.102539,-0.32044 -0.102539,-0.10071 -0.303955,-0.10071 -0.0769,0 -0.221558,0.0128 -0.142822,0.011 -0.267334,0.0311 l -0.05127,-0.30029 q 0.223388,-0.0256 0.349731,-0.0366 0.128174,-0.011 0.214234,-0.011 0.333252,0 0.505371,0.17578 0.172119,0.17578 0.17395,0.52368 l 0.0037,0.52735 q 0.0018,0.26916 0.159302,0.55297 l -0.265503,0.12268 z m -0.671997,-0.30944 q 0.142822,0 0.250854,-0.0494 0.108032,-0.0494 0.166626,-0.14099 0.06043,-0.0916 0.06043,-0.21057 v -0.0165 q -0.09155,-0.0513 -0.203247,-0.0787 -0.111694,-0.0293 -0.232544,-0.0293 -0.195923,0 -0.31311,0.0696 -0.117188,0.0678 -0.117188,0.1886 0,0.0787 0.04761,0.13916 0.04944,0.0604 0.137329,0.0952 0.08789,0.033 0.203247,0.033 z" /><path style="fill:#fff;" d="m 48.247181,105.37486 q 0.188599,-0.2179 0.483398,-0.2179 0.0824,0 0.17212,0.0165 l -0.05127,0.28564 q -0.05127,-0.005 -0.100708,-0.005 -0.283813,0 -0.470581,0.17578 v 1.35681 h -0.300293 v -1.78344 h 0.227051 l 0.04028,0.17212 z" /><path style="fill:#fff;" d="m 50.036121,107.0283 q -0.276489,0 -0.476074,-0.1117 -0.199585,-0.11169 -0.303955,-0.32043 -0.10437,-0.21057 -0.10437,-0.49805 0,-0.28564 0.106201,-0.49805 0.106201,-0.2124 0.311279,-0.32775 0.205079,-0.11536 0.492554,-0.11353 0.150147,-0.002 0.2948,0.0275 0.144653,0.0275 0.245361,0.0751 l -0.07324,0.30395 q -0.223389,-0.1007 -0.465088,-0.1007 -0.305786,0 -0.443115,0.15747 -0.137329,0.15564 -0.137329,0.46692 0,0.32592 0.15564,0.48523 0.15747,0.1593 0.457763,0.1593 0.122681,0 0.217896,-0.0238 0.09705,-0.0256 0.254516,-0.0842 l 0.09338,0.27832 q -0.153809,0.0586 -0.316772,0.0915 -0.162964,0.033 -0.309449,0.033 z" /><path style="fill:#fff;" d="m 51.861683,105.15513 q 0.234375,0 0.393677,0.0915 0.159301,0.0915 0.238037,0.25269 0.08057,0.16113 0.08057,0.36987 v 1.11694 h -0.300293 v -1.03271 q 0,-0.22522 -0.09705,-0.36804 -0.09705,-0.14283 -0.316772,-0.14283 -0.157471,0 -0.296631,0.0568 -0.13916,0.0549 -0.247192,0.15381 v 1.333 h -0.300293 v -2.77771 h 0.300293 v 1.15357 q 0.210571,-0.20691 0.545654,-0.20691 z" /><path style="fill:#fff;" d="m 54.827991,104.47581 q -0.100708,0 -0.155639,0.0476 -0.0531,0.0458 -0.07324,0.13733 -0.02014,0.0897 -0.02014,0.23621 v 0.30395 l 0.437622,-0.002 v 0.26551 h -0.437622 v 1.51794 h -0.300293 v -1.51794 h -0.320434 v -0.26184 l 0.320434,-0.002 v -0.28564 q 0,-0.34424 0.115357,-0.54016 0.115356,-0.19775 0.410156,-0.19775 0.06226,0 0.234375,0.0183 l 0.0769,0.009 -0.06592,0.29297 q -0.06775,-0.007 -0.08606,-0.009 -0.08972,-0.0128 -0.135499,-0.0128 z" /><path style="fill:#fff;" d="m 56.150013,107.03196 q -0.27832,0 -0.490723,-0.11536 -0.210571,-0.11535 -0.327758,-0.32592 -0.115357,-0.21241 -0.115357,-0.4889 0,-0.28015 0.115357,-0.49438 0.117187,-0.21423 0.327758,-0.33142 0.212403,-0.11719 0.490723,-0.11719 0.272827,0 0.479736,0.11719 0.206909,0.11719 0.318604,0.33142 0.111694,0.2124 0.109863,0.49438 0,0.27832 -0.113525,0.4889 -0.111695,0.21057 -0.318604,0.32592 -0.205078,0.11536 -0.476074,0.11536 z m 0,-0.28931 q 0.172119,0 0.303955,-0.0787 0.133667,-0.0806 0.206909,-0.22522 0.07507,-0.14649 0.07874,-0.33692 -0.0037,-0.19409 -0.07874,-0.3424 -0.07507,-0.14832 -0.206909,-0.22889 -0.131836,-0.0824 -0.303955,-0.0824 -0.183105,0 -0.324097,0.0824 -0.13916,0.0824 -0.216064,0.23072 -0.07507,0.14831 -0.07507,0.34424 0,0.19043 0.07507,0.33508 0.0769,0.14465 0.216064,0.22339 0.13916,0.0787 0.324097,0.0787 z" /><path style="fill:#fff;" d="m 57.812611,105.37486 q 0.188598,-0.2179 0.483398,-0.2179 0.0824,0 0.172119,0.0165 l -0.05127,0.28564 q -0.05127,-0.005 -0.100708,-0.005 -0.283814,0 -0.470581,0.17578 v 1.35681 h -0.300293 v -1.78344 h 0.22705 l 0.04028,0.17212 z" /><path style="letter-spacing:0.2px;fill:#ffffff" d="m 60.451576,105.47007 v 0.96313 q 0,0.0806 0.03479,0.15748 0.03662,0.0751 0.109864,0.12451 0.07324,0.0476 0.177612,0.0476 0.07324,0 0.166626,-0.0128 v 0.26916 q -0.119019,0.011 -0.241699,0.011 -0.170288,0 -0.289307,-0.0732 -0.119019,-0.0733 -0.179443,-0.19593 -0.06043,-0.12451 -0.06043,-0.27465 v -1.01624 h -0.322266 v -0.2655 h 0.322266 v -0.64087 h 0.281982 v 0.64087 h 0.490723 v 0.2655 h -0.490723 z" /><path style="letter-spacing:-0.1px;fill:#ffffff" d="m 62.391079,105.15513 q 0.234375,0 0.393677,0.0915 0.159301,0.0915 0.238037,0.25269 0.08057,0.16113 0.08057,0.36987 v 1.11694 H 62.80307 v -1.03271 q 0,-0.22522 -0.09705,-0.36804 -0.09705,-0.14283 -0.316772,-0.14283 -0.157471,0 -0.296631,0.0568 -0.13916,0.0549 -0.247192,0.15381 v 1.333 h -0.300293 v -2.77771 h 0.300293 v 1.15357 q 0.210571,-0.20691 0.545654,-0.20691 z" /><path style="letter-spacing:-0.1px;fill:#ffffff" d="m 64.4151,106.75181 q 0.122681,0 0.26001,-0.0275 0.137329,-0.0275 0.274658,-0.0806 l 0.09338,0.25634 q -0.130005,0.0549 -0.32959,0.0916 -0.199585,0.0366 -0.362549,0.0366 -0.432129,0 -0.670166,-0.23072 -0.238037,-0.23254 -0.238037,-0.71411 0,-0.30029 0.10437,-0.50903 0.106201,-0.21057 0.305786,-0.3186 0.199585,-0.10804 0.479737,-0.10804 0.247192,0 0.413818,0.11536 0.166626,0.11353 0.247192,0.29846 0.08057,0.18311 0.08057,0.39368 0,0.14465 -0.04028,0.28931 l -1.274414,0.009 q 0.04028,0.24719 0.205078,0.37354 0.164795,0.12451 0.450439,0.12451 z m -0.122681,-1.31653 q -0.260009,0 -0.391845,0.15015 -0.131836,0.15014 -0.150147,0.40466 l 0.990601,-0.009 q 0.0037,-0.0439 0.0037,-0.0659 0,-0.12452 -0.04578,-0.23255 -0.04578,-0.10986 -0.148316,-0.17761 -0.100708,-0.0696 -0.258179,-0.0696 z" /><path style="fill:#fff;" d="m 67.296059,106.75181 q 0.12268,0 0.260009,-0.0275 0.13733,-0.0275 0.274659,-0.0806 l 0.09338,0.25634 q -0.130004,0.0549 -0.329589,0.0916 -0.199585,0.0366 -0.362549,0.0366 -0.432129,0 -0.670166,-0.23072 -0.238037,-0.23254 -0.238037,-0.71411 0,-0.30029 0.10437,-0.50903 0.106201,-0.21057 0.305786,-0.3186 0.199585,-0.10804 0.479736,-0.10804 0.247193,0 0.413819,0.11536 0.166626,0.11353 0.247192,0.29846 0.08057,0.18311 0.08057,0.39368 0,0.14465 -0.04028,0.28931 l -1.274414,0.009 q 0.04028,0.24719 0.205078,0.37354 0.164795,0.12451 0.45044,0.12451 z m -0.122681,-1.31653 q -0.26001,0 -0.391846,0.15015 -0.131836,0.15014 -0.150146,0.40466 l 0.9906,-0.009 q 0.0037,-0.0439 0.0037,-0.0659 0,-0.12452 -0.04578,-0.23255 -0.04578,-0.10986 -0.148315,-0.17761 -0.100708,-0.0696 -0.258179,-0.0696 z" /><path style="letter-spacing:0.1px;fill:#ffffff" d="m 68.676674,105.37486 q 0.188599,-0.2179 0.483398,-0.2179 0.0824,0 0.172119,0.0165 l -0.05127,0.28564 q -0.05127,-0.005 -0.100708,-0.005 -0.283814,0 -0.470581,0.17578 v 1.35681 h -0.300293 v -1.78344 h 0.227051 l 0.04028,0.17212 z" /><path style="letter-spacing:0.1px;fill:#ffffff" d="m 70.080383,105.37486 q 0.188599,-0.2179 0.483399,-0.2179 0.0824,0 0.172119,0.0165 l -0.05127,0.28564 q -0.05127,-0.005 -0.100708,-0.005 -0.283813,0 -0.470581,0.17578 v 1.35681 h -0.300293 v -1.78344 H 70.0401 l 0.04028,0.17212 z" /><path style="fill:#fff;" d="m 72.018764,107.03196 q -0.27832,0 -0.490722,-0.11536 -0.210571,-0.11535 -0.327759,-0.32592 -0.115356,-0.21241 -0.115356,-0.4889 0,-0.28015 0.115356,-0.49438 0.117188,-0.21423 0.327759,-0.33142 0.212402,-0.11719 0.490722,-0.11719 0.272828,0 0.479737,0.11719 0.206909,0.11719 0.318603,0.33142 0.111695,0.2124 0.109864,0.49438 0,0.27832 -0.113526,0.4889 -0.111694,0.21057 -0.318603,0.32592 -0.205078,0.11536 -0.476075,0.11536 z m 0,-0.28931 q 0.17212,0 0.303956,-0.0787 0.133667,-0.0806 0.206909,-0.22522 0.07507,-0.14649 0.07873,-0.33692 -0.0037,-0.19409 -0.07873,-0.3424 -0.07507,-0.14832 -0.206909,-0.22889 -0.131836,-0.0824 -0.303956,-0.0824 -0.183105,0 -0.324096,0.0824 -0.13916,0.0824 -0.216065,0.23072 -0.07507,0.14831 -0.07507,0.34424 0,0.19043 0.07507,0.33508 0.0769,0.14465 0.216065,0.22339 0.13916,0.0787 0.324096,0.0787 z" /><path style="fill:#fff;" d="m 73.681362,105.37486 q 0.188599,-0.2179 0.483399,-0.2179 0.0824,0 0.172119,0.0165 l -0.05127,0.28564 q -0.05127,-0.005 -0.100708,-0.005 -0.283813,0 -0.470581,0.17578 v 1.35681 h -0.300293 v -1.78344 h 0.227051 l 0.04028,0.17212 z" /><path style="letter-spacing:0.11px;fill:#ffffff" d="m 76.655128,107.03196 q -0.27832,0 -0.490722,-0.11536 -0.210571,-0.11535 -0.327759,-0.32592 -0.115356,-0.21241 -0.115356,-0.4889 0,-0.28015 0.115356,-0.49438 0.117188,-0.21423 0.327759,-0.33142 0.212402,-0.11719 0.490722,-0.11719 0.272828,0 0.479737,0.11719 0.206909,0.11719 0.318603,0.33142 0.111695,0.2124 0.109864,0.49438 0,0.27832 -0.113526,0.4889 -0.111694,0.21057 -0.318603,0.32592 -0.205078,0.11536 -0.476075,0.11536 z m 0,-0.28931 q 0.17212,0 0.303956,-0.0787 0.133667,-0.0806 0.206909,-0.22522 0.07507,-0.14649 0.07873,-0.33692 -0.0037,-0.19409 -0.07873,-0.3424 -0.07507,-0.14832 -0.206909,-0.22889 -0.131836,-0.0824 -0.303956,-0.0824 -0.183105,0 -0.324096,0.0824 -0.13916,0.0824 -0.216065,0.23072 -0.07507,0.14831 -0.07507,0.34424 0,0.19043 0.07507,0.33508 0.07691,0.14465 0.216065,0.22339 0.13916,0.0787 0.324096,0.0787 z" /><path style="letter-spacing:0.11px;fill:#ffffff" d="m 79.002678,105.15513 q 0.234375,0 0.393677,0.0915 0.159301,0.0915 0.238037,0.25269 0.08057,0.16113 0.08057,0.36987 v 1.11694 h -0.300293 v -1.03271 q 0,-0.22522 -0.09705,-0.36804 -0.09521,-0.14283 -0.316772,-0.14466 -0.157471,0.002 -0.296631,0.0586 -0.137329,0.0549 -0.24353,0.15564 l -0.0037,1.33117 h -0.300293 l 0.0037,-1.78344 h 0.221557 l 0.05676,0.17761 q 0.212402,-0.22522 0.563965,-0.22522 z" /><path style="fill:#fff;" d="m 80.392586,104.2103 h 0.300293 v 2.77588 h -0.300293 z" /><path style="fill:#fff;" d="m 81.456429,104.64426 q -0.08789,0 -0.146485,-0.0586 -0.05859,-0.0586 -0.05859,-0.14648 0,-0.0861 0.05859,-0.14466 0.05859,-0.0586 0.146485,-0.0586 0.08606,0 0.144653,0.0586 0.05859,0.0586 0.05859,0.14466 0,0.0879 -0.05859,0.14648 -0.05859,0.0586 -0.144653,0.0586 z m -0.15564,0.55848 h 0.300293 v 1.78344 h -0.300293 z" /><path style="fill:#fff;" d="m 83.060432,105.15513 q 0.234375,0 0.393677,0.0915 0.159302,0.0915 0.238037,0.25269 0.08057,0.16113 0.08057,0.36987 v 1.11694 h -0.300293 v -1.03271 q 0,-0.22522 -0.09705,-0.36804 -0.09521,-0.14283 -0.316773,-0.14466 -0.15747,0.002 -0.29663,0.0586 -0.13733,0.0549 -0.243531,0.15564 l -0.0037,1.33117 h -0.300293 l 0.0037,-1.78344 h 0.221558 l 0.05676,0.17761 q 0.212402,-0.22522 0.563964,-0.22522 z" /><path style="fill:#fff;" d="m 85.184456,106.75181 q 0.122681,0 0.26001,-0.0275 0.137329,-0.0275 0.274658,-0.0806 l 0.09338,0.25634 q -0.130005,0.0549 -0.32959,0.0916 -0.199585,0.0366 -0.362549,0.0366 -0.432129,0 -0.670166,-0.23072 -0.238037,-0.23254 -0.238037,-0.71411 0,-0.30029 0.10437,-0.50903 0.106201,-0.21057 0.305786,-0.3186 0.199585,-0.10804 0.479736,-0.10804 0.247193,0 0.413819,0.11536 0.166626,0.11353 0.247192,0.29846 0.08057,0.18311 0.08057,0.39368 0,0.14465 -0.04028,0.28931 l -1.274414,0.009 q 0.04028,0.24719 0.205078,0.37354 0.164795,0.12451 0.45044,0.12451 z m -0.122681,-1.31653 q -0.26001,0 -0.391845,0.15015 -0.131836,0.15014 -0.150147,0.40466 l 0.990601,-0.009 q 0.0037,-0.0439 0.0037,-0.0659 0,-0.12452 -0.04578,-0.23255 -0.04578,-0.10986 -0.148315,-0.17761 -0.100708,-0.0696 -0.258179,-0.0696 z" /><path style="fill:#fff;" d="m 86.400276,105.62937 q -0.102539,0 -0.172119,-0.0659 -0.06958,-0.0678 -0.06958,-0.16662 0,-0.10071 0.06958,-0.16663 0.06958,-0.0677 0.172119,-0.0677 0.10437,0 0.17395,0.0677 0.06958,0.0659 0.06958,0.16663 0,0.0989 -0.06958,0.16662 -0.06958,0.0659 -0.17395,0.0659 z m 0,1.3971 q -0.102539,0 -0.172119,-0.0659 -0.06958,-0.0678 -0.06958,-0.16663 0,-0.10071 0.06958,-0.16662 0.06958,-0.0678 0.172119,-0.0678 0.10437,0 0.17395,0.0678 0.06958,0.0659 0.06958,0.16662 0,0.0989 -0.06958,0.16663 -0.06958,0.0659 -0.17395,0.0659 z" /><text x="88" y="107" style="fill:#e1e9ef;font: 3px sans-serif, Arial;">EASTER_EGG_CLICKED_LOGO_TOO_MUCH</text></g></g></svg></div>',
                    );
                    setTimeout(() => {
                        id("blue-screen-of-death").addEventListener(
                            "click",
                            function (this: HTMLElement) {
                                tn("body", 0).style.setProperty(
                                    "overflow-y",
                                    "scroll",
                                    "important",
                                );
                                this.remove();
                            },
                        );
                    }, 1000);
                }
            });
        }

        // Months are 0-indexed
        const monthInt = month + 1;

        // Show logo hat on holidays
        if (
            get("bools").charAt(BOOL_INDEX.EVENTS) == "1" &&
            n(id("mod-logo-hat")) &&
            !tn("body", 0).classList.contains("mod-logo-hat-hidden")
        ) {
            let insertElement = id("mod-logo");
            let isDefaultLikeLayout = false;

            const birthday =
                parseInt(
                    get("birthday").charAt(0) + get("birthday").charAt(1),
                    10,
                ) == dayInt &&
                parseInt(
                    get("birthday").charAt(3) + get("birthday").charAt(4),
                    10,
                ) == monthInt;
            const christmas = monthInt == 12 && dayInt > 10 && dayInt < 31;
            const sinterklaas = monthInt == 12 && dayInt <= 5;

            if (
                (get("layout") == 1 || get("layout") == 4) &&
                tn("sl-header", 0) &&
                (birthday || christmas || sinterklaas)
            ) {
                tn("sl-header", 0).style.overflow = "hidden";
                tn("sl-header", 0).insertAdjacentHTML(
                    "beforeend",
                    window.logo(
                        "mod-logo-inserted",
                        null,
                        "var(--action-neutral-normal)",
                        "position:absolute;width:50px;height:54px;right:25px;bottom:-15px;z-index:-1;transition:bottom 0.4s ease 0.3s;",
                    ),
                );
                insertElement = id("mod-logo-inserted");
                isDefaultLikeLayout = true;
            }
            if (insertElement) {
                // Show birthday hat if it is birthday of user
                if (birthday) {
                    insertElement.insertAdjacentHTML(
                        "beforebegin",
                        '<svg id="mod-logo-hat" style="width:37px;translate:38px -12px;' +
                            (isDefaultLikeLayout
                                ? "right:80px;left:unset;"
                                : "") +
                            '" viewBox="0 0 448 511.7"><path fill="#FFDB56" d="M415.7 428.6c-101.8 39.1-258 38.3-382.5.7L226 11.3l189.7 417.3z"/><path fill="#F6C134" d="M415.7 428.6a411 411 0 0 1-77 20.6l-155.5-345L226 11.4l189.7 417.2z"/><circle fill="#D83636" cx="224" cy="41.6" r="41.6"/><path fill="#F2433B" d="M224 0h.2a37 37 0 0 1-35.5 63.6 41.4 41.4 0 0 1-6.3-22C182.4 18.6 201 0 224 0zM106 271.4l38.5-83.3c46.8-17.9 89.7-37.5 134.8-59.6l2.5 5.5 22.5 51.6C244.7 223.9 177.7 251 106 271.4zm236.9-3 5.3 11.7a756.5 756.5 0 0 1-304 126l37-80.6A770.9 770.9 0 0 0 322 223.6l20.9 44.9zm22.7 50 2.2 5 23 50.9a776.6 776.6 0 0 1-72.1 48.6 485.5 485.5 0 0 1-68.8 35.3c-61.4 1.7-117.6-4-166.1-16.2 93-19.6 187.8-59.6 281.8-123.6z"/><path fill="#F2433B" d="M19.3 480.5a27.8 27.8 0 0 1 17-53A635.4 635.4 0 0 0 227.9 456c64 0 127.7-9.2 183.2-28.5a27.8 27.8 0 1 1 18.3 52.6C368 501.4 298 511.6 227.8 511.7a691.8 691.8 0 0 1-208.5-31.2z"/></svg>',
                    );
                }
                // Show santa hat if it is 11 dec - 30 dec
                else if (christmas) {
                    insertElement.insertAdjacentHTML(
                        "beforebegin",
                        '<svg id="mod-logo-hat" viewBox="0 0 408.7 251.7"' +
                            (isDefaultLikeLayout
                                ? ' style="left:unset;right:35px;height:80px;width:70px;"'
                                : "") +
                            '><g><path d="m382.6 131.7-91.8 63-148.7-1.2-15-21 8.6-16.2c-7.2-4.8-16-9-25.7-12-12.7-4-25.1-5.4-35.5-4.6l-1.2-.5-6.6-20.4a138.5 138.5 0 0 0 74.2-68l2-3.8A99.1 99.1 0 0 1 243 1.1l3.4.4c71.8 14 125.8 59.4 132.8 114z" fill="#ed4241"/><path d="M274.2 8.8c57.6 19 98.9 59.4 104.9 106.8l3.5 16-91.8 63-148.7-1.1-14.4-20.1.4-2 124.7-23c36.4-6 64-36.4 64-73.2a74 74 0 0 0-41.3-65.8z" fill="#c52c37"/><path d="M408.7 164.7c-4 30.8-65.1 65.5-144.2 80.2-71.6 13.4-135.3 6.3-157.8-15.4l20.5-57.6c18.8 18.1 72 24 132 12.9 66-12.4 117.1-41.3 120.5-67z" fill="#c1cfe8"/><path d="M406 161.2c-17.6 38.3-85 69.2-166.9 73.2-20.4 1-40 .2-58.4-2l-3.8-.5a43.5 43.5 0 0 1-43.2-42.6c0-4 .6-7.8 1.7-11.5l.2.2c23.6 13.2 71 16.6 123.5 6.8 66.2-12.4 117.2-41.3 120.6-67l26.5 42.8z" fill="#d7e0ef"/><path d="M75.3 141.3a37.8 37.8 0 1 1-75.5.2 37.8 37.8 0 0 1 75.5-.2z" fill="#c1cfe8"/><path d="M67.6 119A37.5 37.5 0 0 0 0 141.6l.3 1.6a36.5 36.5 0 0 0 33.2 19.5c20 0 36.2-14.5 36.2-32.5 0-3.5-.7-6.9-1.8-10z" fill="#d7e0ef"/></g></svg>',
                    );
                }
                // Show sinterklaas mijter if it is 1 dec - 5 dec
                else if (sinterklaas) {
                    insertElement.insertAdjacentHTML(
                        "beforebegin",
                        '<svg id="mod-logo-hat" viewBox="0 0 155.5 253.7" width="155.5" height="253.7" style="translate:30px -25px;width:40px;' +
                            (isDefaultLikeLayout
                                ? "left:unset;right:73px;"
                                : "") +
                            '"><defs><linearGradient x1="162.4" y1="180" x2="317.9" y2="180" gradientUnits="userSpaceOnUse" id="a"><stop offset="0" stop-color="#ae1d1a"/><stop offset="1" stop-color="#da2d29"/></linearGradient><linearGradient x1="162.6" y1="212.5" x2="317.7" y2="212.5" gradientUnits="userSpaceOnUse" id="b"><stop offset="0" stop-color="#f39221"/><stop offset="1" stop-color="#ffc800"/></linearGradient><linearGradient x1="169.4" y1="289.4" x2="310.8" y2="289.4" gradientUnits="userSpaceOnUse" id="c"><stop offset="0" stop-color="#f39221"/><stop offset="1" stop-color="#ffc800"/></linearGradient><linearGradient x1="226.3" y1="180" x2="253.7" y2="180" gradientUnits="userSpaceOnUse" id="d"><stop offset="0" stop-color="#f8a813"/><stop offset="1" stop-color="#fab20d"/></linearGradient><linearGradient x1="162.4" y1="132.3" x2="317.9" y2="132.3" gradientUnits="userSpaceOnUse" id="e"><stop offset="0" stop-color="#f39221"/><stop offset="1" stop-color="#ffc800"/></linearGradient></defs><g><path d="M162.4 186.9c2.5-12.5 6.2-23.9 10.6-32.8l.9-1.8c22.5-45.5 47.3-82 66-99.2h.2c18.7 17.2 43.5 53.7 66 99.2l.9 1.8c4.4 9 8.1 20.3 10.6 32.8l.3-.2a551.6 551.6 0 0 1-12.5 118l.2.5a1293.6 1293.6 0 0 1-131.2 0l.5-.6c-4.3-18-8-41.9-10.3-68.1-1.6-18-2.3-34.9-2.2-49.8z" fill="url(#a)" transform="translate(-162.4 -53.1)"/><path d="M315.8 232.3c-16.6-5.8-44.4-9.6-75.8-9.6s-59.1 3.8-75.8 9.5c-.8-10.2-1.4-20-1.6-29.4h.2c16.5-6.1 44.9-10.1 77.2-10.1 32.5 0 61 4 77.5 10.2l.2-.2c-.3 9.2-.8 19-1.6 29.1z" fill="url(#b)" transform="translate(-162.4 -53.1)"/><path d="M169.4 276.6c16.9-2.8 42-4.6 70.2-4.6 28.6 0 54.2 1.8 71.2 4.8a379.9 379.9 0 0 1-5.4 27.8l.2.6a1293.6 1293.6 0 0 1-131.2 0l.5-.6c-2-8.2-3.8-17.6-5.4-28z" fill="url(#c)" transform="translate(-162.4 -53.1)"/><path d="M226.3 278.3V81.7h27.4v196.6z" fill="url(#d)" transform="translate(-162.4 -53.1)"/><path d="M317.2 204.3a118 118 0 0 0-10.2-28.8l-.9-1.6c-22.5-42.2-47.3-76.1-66-92h-.2c-18.7 15.9-43.5 49.8-66 92l-.9 1.6c-3.9 7.4-7.3 16.5-9.7 26.6l-.8.7c-.1-4.4-.2-8.6-.1-12.6v.1a129 129 0 0 1 10.6-31.9l.9-1.6c22.5-44.3 47.3-79.7 66-96.5h.2c18.7 16.8 43.5 52.2 66 96.5l.9 1.6a129 129 0 0 1 10.6 32l.3-.2-.1 12.7z" fill="url(#e)" transform="translate(-162.4 -53.1)"/></g></svg>',
                    );
                }
                // Add hat events
                if (birthday || christmas || sinterklaas) {
                    id("mod-logo-hat").addEventListener(
                        "click",
                        function (this: HTMLElement) {
                            if (isDefaultLikeLayout) {
                                id("mod-logo-inserted").style.bottom = "-55px";
                                this.style.opacity = "0";
                                this.style.animation = "none";
                            }
                            this.classList.add("mod-logo-hat-clicked");
                            setTimeout(() => {
                                tn("body", 0).classList.add(
                                    "mod-logo-hat-hidden",
                                );
                                if (id("mod-logo-hat")) {
                                    id("mod-logo-hat").remove();
                                }
                            }, 1050);
                        },
                    );
                }
            }
        }
        if (
            get("bools").charAt(BOOL_INDEX.EVENTS) == "1" &&
            n(id("mod-logo-decoration")) &&
            !tn("body", 0).classList.contains("mod-logo-decoration-hidden")
        ) {
            let insertElement = id("mod-logo");
            let position = "beforebegin";
            if (get("layout") == 1 || get("layout") == 4) {
                insertElement = tn("sl-header", 0);
                position = "beforeend";
            }

            // Easter date is terrible to calculate, but this code seems to work
            const C = Math.floor(year / 100);
            const N = year - 19 * Math.floor(year / 19);
            const K = Math.floor((C - 17) / 25);
            let I =
                C - Math.floor(C / 4) - Math.floor((C - K) / 3) + 19 * N + 15;
            I = I - 30 * Math.floor(I / 30);
            I =
                I -
                Math.floor(I / 28) *
                    (1 -
                        Math.floor(I / 28) *
                            Math.floor(29 / (I + 1)) *
                            Math.floor((21 - N) / 11));
            let J = year + Math.floor(year / 4) + I + 2 - C + Math.floor(C / 4);
            J = J - 7 * Math.floor(J / 7);
            const L = I - J;
            const M = 3 + Math.floor((L + 40) / 44);
            const D = L + 28 - 31 * Math.floor(M / 4);

            const easter = monthInt == M && (dayInt == D || dayInt == D + 1);
            const halloween = monthInt == 10 && dayInt > 25;
            const bevrijdingsdag = monthInt == 5 && dayInt == 5;
            const newyear =
                (monthInt == 12 && dayInt == 31) ||
                (monthInt == 1 && dayInt == 1);

            if (insertElement) {
                // Show easter eggs on easter
                if (easter) {
                    insertElement.insertAdjacentHTML(
                        position,
                        '<svg id="mod-logo-decoration"' +
                            (get("layout") == 1 || get("layout") == 4
                                ? ' style="right:' +
                                  (n(id("mod-logo-hat")) ? "50" : "90") +
                                  'px;top:30px;z-index:-10;"'
                                : "") +
                            ' viewBox="0 0 313.1 232"><g><path d="M227.1 110.9a62.9 62.9 0 0 1-57.2 64.8 62.8 62.8 0 0 1-69.7-52.7l-.5-5C94 56.3 116.8 3.8 151.4.2c35-3.7 68.8 44.2 75.4 107l.1 1.2z" fill="#ff896c"/><path d="m205.7 38.5-1.4-1a34.8 34.8 0 0 0-46 3.4l-1.9 2a34.8 34.8 0 0 1-46 2.7l-2.5-1.8-4.2 14.3c1.7.9 3.2 1.9 4.7 3l2.6 1.7a34.8 34.8 0 0 0 46-2.7l1.9-2a34.8 34.8 0 0 1 45.9-3.3l2.6 1.7c2.7 2.1 5.7 3.8 9 5zM98.6 96.3a34 34 0 0 1 15.3 6.5l2.6 1.7a34.8 34.8 0 0 0 46-2.6l1.9-2a34.8 34.8 0 0 1 41.8-6l8-11.5-1.8-1.4-2.6-1.7a34.8 34.8 0 0 0-46 3.4l-1.9 2a34.8 34.8 0 0 1-46 2.7l-2.5-1.8a34 34 0 0 0-13.5-6.2zM196.1 118.1a35.3 35.3 0 0 0-31.5 9.8l-1.9 2a34.5 34.5 0 0 1-34.8 8.4l6.7 18.6 3.5.2c9.8.2 18.8-3.7 25.1-10l2-2a34.8 34.8 0 0 1 24.4-10.3z" fill="#ff5757"/><path d="M133.4 149.4a62.9 62.9 0 0 1-37.5 77.9 62.8 62.8 0 0 1-81.4-31.9l-1.9-4.6C-9.6 132.9-1.8 76.2 30.5 63.3c32.7-13 78.2 24 101.6 82.6l.4 1.1z" fill="#5de7ff"/><path d="M309.6 180.3a62.9 62.9 0 0 1-72.5 47 62.8 62.8 0 0 1-53-69.5l.9-5c11-60.9 47.2-105.3 81.4-99.5 34.8 5.9 54.4 61.1 43.9 123.4l-.2 1.2z" fill="#ffe16b"/><path d="m109 104.2-16.3 20.4-31.9 1L42.1 150l-31 1-6.7 12.4L1.8 147 8 135.6l29-1L54.5 112l29.8-1 15.2-19zM129.1 139.7l-15 18.8-36.5 1.2-21.4 27.9-35.5 1.2-4.9 8.8-5.5-13.9 6.9-12.6 33.1-1.1 20-26 34.1-1.2 16.6-20.7z" fill="#5ca7ff"/><path d="M261.6 141.3c.8 5.6-3 10.8-8.4 11.6-5.5.8-10.6-3-11.4-8.7-.9-5.6 2.9-10.8 8.4-11.6 5.4-.8 10.5 3 11.4 8.7zM304.8 150c.9 5.6-2.9 10.8-8.4 11.6-5.4.8-10.5-3-11.4-8.7-.8-5.6 3-10.8 8.4-11.6 5.5-.8 10.6 3 11.4 8.7zM218.7 132c.9 5.6-2.9 10.8-8.4 11.6-5.4.8-10.5-3-11.4-8.7-.8-5.5 3-10.7 8.4-11.6 5.5-.8 10.6 3.1 11.4 8.7zM246 95c.6 5.6-3.3 10.7-8.8 11.3-5.5.7-10.5-3.4-11.2-9a10.1 10.1 0 0 1 8.8-11.3c5.5-.7 10.5 3.4 11.1 9zM288.2 103.6c.7 5.7-3.3 10.7-8.7 11.4-5.5.6-10.5-3.4-11.2-9a10.1 10.1 0 0 1 8.8-11.4c5.5-.6 10.4 3.4 11.1 9zM233 184c.6 5.6-3.3 10.7-8.8 11.3-5.5.7-10.5-3.4-11.2-9a10.1 10.1 0 0 1 8.8-11.3c5.5-.7 10.5 3.4 11.1 9zM275.2 192.6c.7 5.7-3.3 10.7-8.7 11.4-5.5.6-10.5-3.4-11.2-9a10.1 10.1 0 0 1 8.8-11.4c5.5-.6 10.4 3.4 11.1 9z" fill="#ffba3a"/></g></svg>',
                    );
                }
                // Show pumpkin on halloween
                else if (halloween) {
                    insertElement.insertAdjacentHTML(
                        position,
                        '<svg id="mod-logo-decoration"' +
                            (get("layout") == 1 || get("layout") == 4
                                ? ' style="right:' +
                                  (n(id("mod-logo-hat")) ? "50" : "90") +
                                  'px;top:30px;z-index:-10;"'
                                : "") +
                            ' viewBox="0 0 186.2 160.9"><g><path d="M121 149c0 7-15 12-34 12s-35-5-35-12 16-12 35-12 34 5 34 12zM154 41c0 7-28 13-61 13-34 0-61-6-61-13s27-13 61-13c33 0 61 6 61 13z" fill="#ca6512"/><path d="M125 154c6-9 8-30 6-54-2-21-7-38-13-48l-1-1a9 9 0 0 1 2-8h1c4-3 9-5 14-5 20 0 36 27 36 60s-16 60-36 60l-9-2z" fill="#ca6512"/><path d="m99 154-30 1-13-1a72 72 0 0 1-22-55c0-35 20-64 45-64 24 0 44 26 45 60l2 27v2c0 12-5 23-12 31z" fill="#ca6512"/><path d="M49 40c-13 8-23 30-23 56 0 24 9 46 22 55l-3 2-8-2-9-4c-13-6-23-29-23-56l1-17 1-2c3-18 16-32 32-36h8l4 2z" fill="#ca6512"/><path d="m106 30 4 2v3l-6 10h-3c-3-4-12-7-21-7l-6 1-1-2 9-7c3-2 4-5 4-9s-2-7-5-9h-1c-2 0-3-1-3-3V8l6-6a6 6 0 0 1 9 1z" fill="#34785d"/><path d="M116 121v2c0 21-13 38-30 38l-7-1-6-3c-17-4-30-28-30-57 0-32 16-57 36-57 19 0 35 24 36 54z" fill="#eb7615"/><path d="M114 154c6-9 8-30 6-54-2-21-7-38-13-48l-1-1a9 9 0 0 1 2-7v-1c5-3 10-5 15-5 20 0 36 27 36 60s-16 60-36 60l-9-2z" fill="#eb7615"/><path d="m140 40 4-2h8c16 4 29 18 32 36l1 2 1 17c0 27-10 50-22 56l-9 4-9 2-3-2c13-9 22-30 22-55 0-26-10-48-23-56z" fill="#eb7615"/><path d="M60 42c-14 8-23 30-23 56 0 25 9 46 21 55l-2 2-9-2-9-4c-13-6-23-29-23-56l2-17v-2c4-18 16-32 33-36h7l4 2z" fill="#eb7615"/><path d="m28 148-8-3-10-11-6-10a119 119 0 0 1-3-48v-2c3-17 14-31 27-35h7C19 46 8 68 8 94c0 22 8 41 19 50zM70 35l-9-2-16 1c2-3 8-5 15-5 5 0 9 1 12 3zM141 36h-6l-4-3h-6l-9 1c3-2 8-3 14-3 5 0 10 1 13 3z" fill="#eb7615"/><path d="m70 69-24 1 14-22z"/><path d="m118 48 14 22-24-1z"/><path d="M95 95H82l7-12z"/><path d="M66 67H55l7-10zM66 122l1-12 11 1-2 12zM102 123l-1-12 10-1 2 12z" fill="#fff"/><path d="M112 110c17-4 31-11 36-19l2 2v2c0 22-26 40-58 40-29 0-53-15-57-34v-1c7 4 19 8 33 10l1 11 8-10 13 1 8-1h3l6 10z"/><path d="m121 57 7 10h-11z" fill="#fff"/></g></svg>',
                    );
                }
                // Show flag on bevrijdingsdag
                else if (bevrijdingsdag) {
                    insertElement.insertAdjacentHTML(
                        position,
                        '<svg id="mod-logo-decoration"' +
                            (get("layout") == 1 || get("layout") == 4
                                ? ' style="right:' +
                                  (n(id("mod-logo-hat")) ? "50" : "90") +
                                  'px;top:30px;z-index:-10;"'
                                : "") +
                            ' viewBox="0 0 200.9 251.5" style="width:35px;rotate:15deg;"><defs><linearGradient x1="149.5" y1="63.4" x2="335.6" y2="63.4" gradientUnits="userSpaceOnUse" id="a"><stop offset="0" stop-color="red"/><stop offset="1" stop-color="#ff6300"/></linearGradient><linearGradient x1="149.5" y1="138.4" x2="335.6" y2="138.4" gradientUnits="userSpaceOnUse" id="b"><stop offset="0" stop-color="#0a00ff"/><stop offset="1" stop-color="#00a2ff"/></linearGradient><linearGradient x1="149.5" y1="100.9" x2="335.6" y2="100.9" gradientUnits="userSpaceOnUse" id="c"><stop offset="0" stop-color="#f0f0f0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><g><path d="M335.6 85.3A71.2 71.2 0 0 1 292 98.9a68 68 0 0 1-47.6-17.2l-3.4-2.7a71.2 71.2 0 0 0-43.7-13.6 68 68 0 0 0-47.7 17.2V45a68 68 0 0 1 47.7-17.2c17.5 0 33.2 5.3 43.7 13.6l3.4 2.7a68 68 0 0 0 47.6 17.2c17.5 0 33.2-5.3 43.7-13.6z" fill="url(#a)" transform="translate(-134.8 -15.4)"/><path d="M335.6 160.3a71.2 71.2 0 0 1-43.7 13.6 68 68 0 0 1-47.6-17.2l-3.4-2.7a71.2 71.2 0 0 0-43.7-13.6 68 68 0 0 0-47.7 17.2V120a68 68 0 0 1 47.7-17.2c17.5 0 33.2 5.3 43.7 13.6l3.4 2.7a68 68 0 0 0 47.6 17.2c17.5 0 33.2-5.3 43.7-13.6z" fill="url(#b)" transform="translate(-134.8 -15.4)"/><path d="M335.6 122.8a71.2 71.2 0 0 1-43.7 13.6 68 68 0 0 1-47.6-17.2l-3.4-2.7a71.2 71.2 0 0 0-43.7-13.6 68 68 0 0 0-47.7 17.2V82.6a68 68 0 0 1 47.7-17.2c17.5 0 33.2 5.3 43.7 13.6l3.4 2.7A68 68 0 0 0 291.9 99c17.5 0 33.2-5.3 43.7-13.6z" fill="url(#c)" transform="translate(-134.8 -15.4)"/><path d="M4.5 245.5v-230h11v230z" fill="#ffad66"/><path d="M21.5 10.8a10.8 10.8 0 1 1-21.5 0 10.8 10.8 0 0 1 21.5 0zM15.5 246a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" fill="#ffad66"/></g></svg>',
                    );
                }
                // Show fireworks on new years eve
                else if (newyear) {
                    insertElement.insertAdjacentHTML(
                        position,
                        '<svg id="mod-logo-decoration"' +
                            (get("layout") == 1 || get("layout") == 4
                                ? ' style="right:' +
                                  (n(id("mod-logo-hat")) ? "50" : "90") +
                                  'px;top:21px;z-index:-10;"'
                                : "") +
                            ' viewBox="0 0 158 151"><defs><linearGradient x1="161.4" y1="148.1" x2="225.1" y2="148.1" gradientUnits="userSpaceOnUse" id="a"><stop offset="0" stop-color="#fad914"/><stop offset="1" stop-color="#fba314"/></linearGradient><linearGradient x1="241.6" y1="129.4" x2="292.1" y2="129.4" gradientUnits="userSpaceOnUse" id="b"><stop offset="0" stop-color="#fad914"/><stop offset="1" stop-color="#fba314"/></linearGradient><linearGradient x1="270.3" y1="182.9" x2="319.6" y2="182.9" gradientUnits="userSpaceOnUse" id="c"><stop offset="0" stop-color="#fad914"/><stop offset="1" stop-color="#fba314"/></linearGradient></defs><g data-paper-data="{&quot;isPaintingLayer&quot;:true}" stroke-miterlimit="10" style="mix-blend-mode:normal"><path d="m196 129 21-10-6 22 14 18-22 1-12 18-8-19-22-6 18-15-1-20z" fill="url(#a)" transform="translate(-161 -105)"/><path d="m266 114 15-9-2 17 13 13-17 3-7 16-9-15-17-2 11-13-3-16z" fill="url(#b)" transform="translate(-161 -105)"/><path d="m302 171 18-3-10 15 7 17-16-4-14 11-1-16-16-9 17-8 3-16z" fill="url(#c)" transform="translate(-161 -105)"/><path d="M52 70c9 9 17 23 20 39 3 15 2 29-2 39M82 109c-2-6-3-13-3-21 0-18 6-34 15-43M81 147c2-26 17-48 37-55" fill="none" stroke="#e19600" stroke-width="6"/></g></svg>',
                    );
                }
                // Add decoration events
                if (
                    tn("sl-header", 0) &&
                    (easter || halloween || bevrijdingsdag || newyear)
                ) {
                    tn("sl-header", 0).style.overflow = "hidden";
                    id("mod-logo-decoration").addEventListener(
                        "click",
                        function (this: HTMLElement) {
                            this.classList.add("mod-logo-decoration-clicked");
                            setTimeout(() => {
                                tn("body", 0).classList.add(
                                    "mod-logo-decoration-hidden",
                                );
                                if (id("mod-logo-decoration")) {
                                    id("mod-logo-decoration").remove();
                                }
                            }, 900);
                        },
                    );
                }
            }
        }
    }

    // Insert the background
    function setBackground() {
        tryRemove(id("mod-background"));
        tryRemove(id("mod-backgroundcolor"));
        tryRemove(id("mod-backgroundslide"));
        tryRemove(id("mod-background-style"));
        stopLiveWallpaper();
        if (
            (n(get("backgroundtype")) || get("backgroundtype") == "image") &&
            !n(get("background"))
        ) {
            // Unfortunately, localStorage can only save strings, so check for 'false' too
            if (
                get("isbackgroundvideo") &&
                get("isbackgroundvideo") != "false"
            ) {
                id("somtoday-mod", 0).insertAdjacentHTML(
                    "beforeend",
                    '<video id="mod-background" src="' +
                        get("background") +
                        '" style="' +
                        getBackgroundFilters() +
                        '" autoplay muted loop></video>',
                );
            } else {
                id("somtoday-mod", 0).insertAdjacentHTML(
                    "beforeend",
                    '<img id="mod-background" src="' +
                        get("background") +
                        '" style="' +
                        getBackgroundFilters() +
                        '">',
                );
            }
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style id="mod-background-style">#mod-background{' +
                    (get("layout") == 5
                        ? "--safe-area-inset-top: 0px !important;"
                        : "") +
                    "pointer-events:none;user-select:none;position:fixed;left:calc(var(--safe-area-inset-left) - " +
                    get("blur") +
                    ");top:calc(var(--safe-area-inset-top) - " +
                    get("blur") +
                    ");width:calc(100% - var(--safe-area-inset-left) - var(--safe-area-inset-right) - 2 * " +
                    get("blur") +
                    ");height:calc(100% - var(--safe-area-inset-top) - var(--safe-area-inset-bottom) - 2 * " +
                    get("blur") +
                    ");object-fit:cover;z-index:-1;}</style>",
            );
        } else if (
            get("backgroundtype") == "color" &&
            !n(get("backgroundcolor"))
        ) {
            id("somtoday-mod", 0).insertAdjacentHTML(
                "beforeend",
                '<div id="mod-backgroundcolor"></div>',
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style id="mod-background-style">#mod-backgroundcolor{pointer-events:none;user-select:none;position:fixed;left:0;width:100%;top:0;height:100%;object-fit:cover;z-index:-1;background:' +
                    get("backgroundcolor") +
                    ";}</style>",
            );
        } else if (
            get("backgroundtype") == "slideshow" &&
            !n(get("background0"))
        ) {
            const randomChoice = Math.floor(Math.random() * get("slides"));
            id("somtoday-mod", 0).insertAdjacentHTML(
                "beforeend",
                '<img id="mod-backgroundslide" src="' +
                    get(`background${randomChoice}`) +
                    '">',
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style id="mod-background-style">#mod-backgroundslide{pointer-events:none;user-select:none;position:fixed;left:0;width:100%;top:0;height:100%;object-fit:cover;z-index:-1;}</style>',
            );
        } else if (get("backgroundtype") == "live") {
            startLiveWallpaper();
        }
    }

    // Change title and icon of Somtoday when enabled
    function browserSettings() {
        if (!n(get("title"))) {
            if (n(tn("title", 0).dataset.modOriginalTitle)) {
                tn("title", 0).dataset.modOriginalTitle = tn(
                    "title",
                    0,
                ).innerHTML;
            }
            tn("title", 0).innerHTML = get("title");
        } else if (!n(tn("title", 0).dataset.modOriginalTitle)) {
            tn("title", 0).innerHTML = tn("title", 0).dataset.modOriginalTitle;
        }
        for (const element of tn("link")) {
            if (element.getAttribute("rel") == "icon") {
                if (!n(get("icon"))) {
                    if (n(element.dataset.modOriginalHref)) {
                        element.dataset.modOriginalHref = element.href;
                    }
                    element.href = get("icon");
                } else if (!n(element.dataset.modOriginalHref)) {
                    element.href = element.dataset.modOriginalHref;
                }
            }
        }
    }

    // Show confetti when it is the users birthday or when the user uses Somtoday Mod for n years
    function congratulations() {
        // Only activate it when enabled in settings and if it is the first time Somtoday is used on the current day (months are zero-based)
        if (
            get("bools").charAt(BOOL_INDEX.CONGRATULATIONS) == "1" &&
            `${year}-${month + 1}-${dayInt}` != get("lastused")
        ) {
            // Get years since first use
            const firstused = new Date(get("firstused"));
            const lastused = new Date(get("lastused"));
            const yeardifference = parseInt(
                (
                    (lastused.getTime() - firstused.getTime()) /
                    1000 /
                    60 /
                    60 /
                    24 /
                    365
                ).toString(),
                10,
            );
            // Get birthday date
            const birthdayday = parseInt(
                get("birthday").charAt(0) + get("birthday").charAt(1),
                10,
            );
            const birthdaymonth = parseInt(
                get("birthday").charAt(3) + get("birthday").charAt(4),
                10,
            );
            // Check if confetti should be shown
            let congratstext = [""];
            if (yeardifference > get("lastjubileum")) {
                congratstext = [
                    "Bedankt" +
                        (n(get("username"))
                            ? n(get("realname"))
                                ? ""
                                : `, ${get("realname").replace(/ .*/, "")}`
                            : `, ${get("username").replace(/ .*/, "")}`) +
                        "!",
                    "Je gebruikt Somtoday Mod nu al " +
                        yeardifference +
                        " jaar. Bedankt!",
                ];
                set("lastjubileum", yeardifference);
            }
            if (birthdayday == dayInt && birthdaymonth == month + 1) {
                const randomDescriptionArray = [
                    "Maak er maar een mooie dag van!",
                    "Gefeliciteerd! Je bent weer een jaartje dichterbij je afstuderen!",
                    "Geniet ervan! Mogen al je dromen uitkomen!",
                    "Jaja, je bent weer jarig! Van harte gefeliciteerd!",
                    '"School is raar, hier is een schaar" ~ iemand die ooit jarig was',
                ];
                congratstext = [
                    "Fijne verjaardag!",
                    randomDescriptionArray[
                        Math.floor(
                            Math.random() * randomDescriptionArray.length,
                        )
                    ],
                ];
            }
            if (congratstext[1] != null) {
                // Confetti should be shown, so insert the confetti
                tn("body", 0).style.setProperty(
                    "overflow-y",
                    "hidden",
                    "important",
                );
                tn("body", 0).insertAdjacentHTML(
                    "afterbegin",
                    '<style>#verjaardag{width:100%;height:100%;position:fixed;top:0;left:0;z-index:10000;background:var(--bg-elevated-none);text-align:center;transition:0.3s opacity ease;}#verjaardag div{top:50%;left:50%;transform:translate(-50%, -50%);position:absolute;}.bouncetext{animation:bounce 0.3s ease forwards;color:var(--action-primary-normal);}.bouncetext.small{font-size:0;animation:bouncesmall 0.5s ease forwards 0.3s;margin-top:35px;}@keyframes bouncesmall{0%{font-size:0px;}80%{font-size:29px;}100%{font-size:24px;}}@keyframes bounce{0%{font-size:0px;}80%{font-size:58px;}100%{font-size:48px;}}.verjaardagbtn{background:var(--action-primary-normal);padding:25px 40px;width:fit-content;color:var(--bg-elevated-none) !important;margin-top:50px;opacity:0;display:block;animation:2s fadein ease 0.6s forwards;font-size:16px;border-radius:16px;transition:0.3s background ease !important;}.verjaardagbtn:hover{cursor:pointer;background:var(--action-primary-strong);}@keyframes fadein{0%{opacity:0;}100%{opacity:1;}}</style><div id="verjaardag"><div><h2 class="bouncetext">' +
                        congratstext[0] +
                        '</h2><h2 class="bouncetext small">' +
                        congratstext[1] +
                        '</h2><center><a class="verjaardagbtn" id="congrats-continue">Doorgaan</a></center></div></div>',
                );
                id("congrats-continue").addEventListener("click", () => {
                    set("lastused", `${year}-${month + 1}-${dayInt}`);
                    id("confetti-canvas").style.opacity = "0";
                    id("verjaardag").style.opacity = "0";
                    setTimeout(() => {
                        tryRemove(id("confetti-canvas"));
                        tryRemove(id("verjaardag"));
                        tn("body", 0).style.setProperty(
                            "overflow-y",
                            "scroll",
                            "important",
                        );
                    }, 350);
                });
                setTimeout(startConfetti, 500);
            } else {
                set("lastused", `${year}-${month + 1}-${dayInt}`);
            }
        } else {
            set("lastused", `${year}-${month + 1}-${dayInt}`);
        }
    }

    // Executes when page changes
    function pageUpdate(updateStyle = true, updateLogo = true) {
        if (busy || isRecapping) {
            return;
        }
        darkmode =
            tn("html", 0).classList.contains("dark") ||
            tn("html", 0).classList.contains("night");
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
