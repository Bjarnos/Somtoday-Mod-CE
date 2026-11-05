import { get, set } from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    execute,
    id,
    n,
    sanitizeString,
    setHTML,
    tn,
} from "../../shorthand_functions";
import { closeModMessage, modMessage } from "../extras/modMessage";

let homeworkBusy = false;
let homework: any;
export function customHomework() {
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
                : element.children[0].ariaLabel.match(/ (\d*? [a-z]*?)$/, "")[1]
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
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

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
                ((isWeek && homework[i].week) || (!isWeek && !homework[i].week))
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
                    insertElement = element.getElementsByClassName("header")[0]
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
                                homework[i].icon ? homework[i].icon : "edit",
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
                        homework[i].subject = id("mod-homework-subject").value;
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
                            element.getElementsByTagName("svg")[0].outerHTML =
                                window.getIcon(
                                    homework[i].icon
                                        ? homework[i].icon
                                        : "edit",
                                    null,
                                    homework[i].color,
                                );
                            element.style.borderLeftColor = homework[i].color;
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
                                for (const element of cn("mod-homework-icon")) {
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
                                    .querySelectorAll(`.${homeworkClassName}`)
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
                                    homework[i].done[curDate.getTime()] = false;
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
                                    homeworkItem.classList.add("mod-before");
                                }
                            }
                            // Checking homework
                            // We always want to place the item as low as possible, since checked items always move to the bottom
                            else {
                                homeworkItem.classList.add("mod-huiswerk-done");
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
                                    hoursToMove += element.getElementsByTagName(
                                        "sl-studiewijzer-item",
                                    ).length;
                                    if (hoursToMove > 0 && !isOnSamePosition) {
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
                                    homework[i].done[curDate.getTime()] = true;
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
                                    homeworkItem.classList.remove("mod-before");
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
