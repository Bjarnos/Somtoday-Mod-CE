import { Chart } from "chart.js/auto";
import { get } from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    id,
    n,
    tn,
    tryRemove,
} from "../../shorthand_functions";
import { startConfetti, stopConfetti } from "../extras/confetti";
import { closeModMessage, modMessage } from "../extras/modMessage";
import { gradeGraphs } from "../grades/graphs";

// Data object which will contain an array of the grades of every subject
let gradedata: any;
let gradingSystems: any;
let totalAverage: any;
let totalGrades = 0;
let totalWeight = 0;
let availablePages: any[] = [];
let music: any;
export let isRecapping = false;

export function somtodayRecap(ignoreRecapConditions = false) {
    const today = new Date();
    const dayInt = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    if (!ignoreRecapConditions) {
        if (get("bools").charAt(BOOL_INDEX.RECAP) == "0") {
            return;
        }
        if (!((month == 5 && dayInt > 25) || month == 6)) {
            return;
        }
    }
    // Set amount of viewed pages to zero
    let pages = 0;
    // Needed to collect all subject grades
    let closing = false;
    const currentYear = year || new Date().getFullYear();
    const startYear = month >= 7 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;
    const fallbackRecapYears = `${startYear.toString().slice(-2)}/${endYear.toString().slice(-2)}`;

    if (
        id("somtoday-recap") &&
        n(id("somtoday-recap-wrapper")) &&
        (tn("sl-vakresultaten", 0) ||
            id("somtoday-recap").nextElementSibling.tagName ==
                "HMY-SWITCH-GROUP")
    ) {
        tryRemove(id("somtoday-recap"));
    }
    if (id("mod-recap-year")) {
        id("mod-recap-year").innerText = tn("sl-dropdown", 0)?.ariaLabel
            ? tn("sl-dropdown", 0).ariaLabel.replace(/^[^/]+\/(\d+)/, "$1")
            : endYear.toString();
    }
    if (
        (tn("sl-resultaat-item", 0) ||
            tn("sl-vakgemiddelde-item", 0) ||
            tn("sl-cijfer-overzicht", 0)) &&
        n(tn("sl-vakresultaten", 0)) &&
        n(id("somtoday-recap"))
    ) {
        try {
            music = new Audio(window.getAudioUrl("background"));
        } catch (e) {
            console.warn(e);
        }
        music.loop = true;
        const recapYear = tn("sl-dropdown", 0)?.ariaLabel
            ? tn("sl-dropdown", 0).ariaLabel.replace(/^[^/]+\/(\d+)/, "$1")
            : endYear.toString();
        tn("hmy-switch-group", 0).insertAdjacentHTML(
            "afterend",
            '<div id="somtoday-recap"><h3>Somtoday Recap' +
                window.logo(
                    null,
                    null,
                    "#fff",
                    "height:1em;width:fit-content;margin-left:10px;transform:translateY(2px);",
                ) +
                '</h3><p>Bekijk hier jouw jaaroverzicht van <span id="mod-recap-year">' +
                recapYear +
                '</span>.</p><div id="somtoday-recap-arrows">' +
                window.getIcon(
                    "chevron-right",
                    null,
                    "#fff",
                    'id="recap-arrow-1"',
                ) +
                window.getIcon(
                    "chevron-right",
                    null,
                    "#fff",
                    'id="recap-arrow-2"',
                ) +
                window.getIcon(
                    "chevron-right",
                    null,
                    "#fff",
                    'id="recap-arrow-3"',
                ) +
                "</div></div>",
        );
        // Open recap on click
        id("somtoday-recap").addEventListener("click", async () => {
            music.currentTime = 0;
            music.play();
            music.volume = 1;
            isRecapping = true;
            // Request fullscreen (to hide URL changes when collecting grades)
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            }
            // Insert recap HTML
            tn("body", 0).style.setProperty(
                "overflow-y",
                "hidden",
                "important",
            );
            const recapYears = tn("sl-dropdown", 0)?.ariaLabel
                ? tn("sl-dropdown", 0).ariaLabel.replace(
                      /^[^/]+(\d\d)\/\d+(\d\d)$/,
                      "$1/$2",
                  )
                : fallbackRecapYears;

            const wrapper = id("somtoday-mod");
            if (wrapper) {
                wrapper.insertAdjacentHTML(
                    "beforeend",
                    `
                    <div id="somtoday-recap-wrapper">
                        <div id="recap-progress"></div>
                        <div id="recap-close">&times;</div>
                        <center class="recap-page">
                            <h1 id="recap-title">Somtoday Recap ${recapYears}</h1>
                            <h2>Het schooljaar zit er al weer bijna op! Hoog tijd voor de Somtoday Recap!</h2>
                            <a id="recap-nextpage">Laden...</a>
                        </center>
                        <ul class="circles">
                            <li></li><li></li><li></li><li></li><li></li>
                            <li></li><li></li><li></li><li></li><li></li>
                        </ul>
                    </div>
                `,
                );
            }

            const recapClose = id("recap-close");
            if (recapClose) {
                recapClose.addEventListener("click", () => {
                    if (document.documentElement.clientWidth < 1280) {
                        window.location.href =
                            "https://leerling.somtoday.nl/cijfers";
                        return;
                    }
                    closing = true;
                    const wrapper = id("somtoday-recap-wrapper");
                    if (wrapper) wrapper.remove();
                    stopConfetti();
                    tn("body", 0).style.overflowX = "hidden";
                    tn("body", 0).style.setProperty(
                        "overflow-y",
                        "scroll",
                        "important",
                    );
                    isRecapping = false;
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    }
                    setTimeout(() => {
                        closing = false;
                    }, 200);
                    endMusic();
                });
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));

            // After recap is opened, collect grade data
            let i = 0;

            if (closing) {
                return;
            }

            gradedata = [];
            totalGrades = 0;
            totalWeight = 0;
            // For some reason some schools use different grading systems
            // System names are made up by me, there is almost no information on the internet about these systems
            gradingSystems = {
                cijfers: false, // Just normal 1-10 numbers
                plusmin: false, // +, - (and -/+ or -/+)
                voortgang: false, // Afgerond, Bijna, Niet afgerond, Lopend, indicates student progress
                letters: false, // Goed (8), Voldoende (6), Matig (5), Onvoldoende (4), etc, every letter has a corresponding number
            };

            // Open cijferoverzicht
            if (n(tn("sl-cijfer-overzicht", 0))) {
                while (!window.navigator.onLine) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                }
                tn("hmy-switch")[2].click();
            }

            while (true) {
                if (closing) {
                    return;
                }
                // Check if cijferoverzicht is opened
                if (tn("sl-cijfer-overzicht", 0) && cn("vak-row", 0)) {
                    break;
                }
                // Try for 7.5 seconds, then try to open cijferoverzicht again
                if (i > 750) {
                    i = 0;
                    if (n(tn("sl-cijfer-overzicht", 0))) {
                        tn("hmy-switch")[2].click();
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 10));
                i++;
            }

            if (tn("sl-dropdown", 0)?.ariaLabel) {
                const detectedYears = tn("sl-dropdown", 0).ariaLabel.replace(
                    /^[^/]+(\d\d)\/\d+(\d\d)$/,
                    "$1/$2",
                );
                const recapTitle = id("recap-title");
                if (recapTitle && detectedYears) {
                    recapTitle.innerText = `Somtoday Recap ${detectedYears}`;
                }
            }

            let totalAverageGrades = 0,
                totalAverageWeight = 0;

            for (const period of cn("periode-header")) {
                if (
                    !period.classList.contains("open") &&
                    parseInt(
                        period.style.getPropertyValue("--aantal-items"),
                        10,
                    ) !== 0 &&
                    period.style.getPropertyValue("--aantal-items") != "0"
                ) {
                    period.click();
                }
            }

            for (i = 0; !closing; i++) {
                if (closing) {
                    return;
                }
                // Check if all periods are expanded, if so, continue
                let allPeriodsExpanded = true;
                for (const period of cn("periode-header")) {
                    if (
                        !period.classList.contains("open") &&
                        parseInt(
                            period.style.getPropertyValue("--aantal-items"),
                            10,
                        ) !== 0 &&
                        period.style.getPropertyValue("--aantal-items") != "0"
                    ) {
                        allPeriodsExpanded = false;
                    }
                }
                if (allPeriodsExpanded || i > 100) {
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 10));
            }

            i = 0;
            for (const element of cn("vak-row")) {
                if (closing) {
                    return;
                }

                const subject: any = {};
                let subjectTotalGrades = 0;
                let subjectTotalWeight = 0;
                const subjectGradingSystems = {
                    cijfers: false,
                    plusmin: false,
                    voortgang: false,
                    letters: false,
                };

                if (element.getElementsByClassName("naam")[0]) {
                    subject.name =
                        element.getElementsByClassName("naam")[0].innerText;
                }
                if (
                    element
                        .getElementsByTagName("hmy-vak-icon")[0]
                        ?.getElementsByTagName("svg")[0]
                ) {
                    subject.icon = element
                        .getElementsByTagName("hmy-vak-icon")[0]
                        .getElementsByTagName("svg")[0].outerHTML;
                }
                const averageElements =
                    element.getElementsByClassName("cijfer gemiddelde");
                if (averageElements.length >= 1) {
                    let average: any;
                    // First, try to take last available numeric and precise average
                    // "Rapport gem." (one to last average) is in format 0.00, "Rapportcijfer" (last average) in format "0"
                    for (const gemiddelde of averageElements) {
                        if (
                            gemiddelde.innerText.indexOf(",") != -1 ||
                            gemiddelde.innerText.indexOf(".") != -1
                        ) {
                            average = gemiddelde.innerText.replace(",", ".");
                        }
                    }
                    // Just take last average, no matter the contents, we've got nothing better
                    if (!average) {
                        average =
                            averageElements[averageElements.length - 1]
                                .innerText;
                    }

                    subject.average = Number.isNaN(parseFloat(average))
                        ? average
                        : parseFloat(average);
                    if (!Number.isNaN(parseFloat(subject.average))) {
                        totalAverageGrades += Math.round(
                            parseFloat(subject.average),
                        );
                        totalAverageWeight++;
                    }
                }

                subject.grades = [];

                // Add individual grades and their weight
                for (const cijfer of element.getElementsByClassName("cijfer")) {
                    if (cijfer.innerText == "") {
                        continue;
                    }
                    const grade = parseFloat(
                        cijfer.innerText.replace(",", "."),
                    );
                    const weging = cijfer.ariaLabel
                        ? parseFloat(
                              cijfer.ariaLabel.replace(
                                  /^[\s\S]*•? ?weging ([\d.,]+)[\s\S]*?$/,
                                  "$1",
                              ),
                          )
                        : null;
                    if (
                        cijfer.ariaLabel &&
                        weging !== null &&
                        !Number.isNaN(weging) &&
                        !cijfer.classList.contains("gemiddelde")
                    ) {
                        subject.grades.push({
                            cijfer: Number.isNaN(grade)
                                ? cijfer.innerText
                                : grade,
                            weging: weging,
                        });
                        if (Number.isNaN(grade)) {
                            if (
                                cijfer.innerText.indexOf("+") != -1 ||
                                cijfer.innerText.indexOf("-") != -1
                            ) {
                                subjectGradingSystems.plusmin = true;
                            } else if (
                                cijfer.innerText.indexOf("A") != -1 ||
                                cijfer.innerText.indexOf("B") != -1 ||
                                cijfer.innerText.indexOf("N") != -1 ||
                                cijfer.innerText.indexOf("L") != -1
                            ) {
                                subjectGradingSystems.voortgang = true;
                            } else {
                                subjectGradingSystems.letters = true;
                            }
                        } else {
                            subjectGradingSystems.cijfers = true;
                        }
                        subjectTotalGrades++;
                        subjectTotalWeight += weging;
                    }
                }

                subject.gradeCount = subjectTotalGrades;
                subject.weightCount = subjectTotalWeight;

                let isUnique = true;
                for (const loopSubject of gradedata) {
                    if (loopSubject.name == subject.name) {
                        isUnique = false;
                    }
                }
                if (subjectTotalGrades > 0 && isUnique) {
                    totalGrades += subjectTotalGrades;
                    totalWeight += subjectTotalWeight;
                    subject.systems = subjectGradingSystems;
                    gradedata.push(subject);

                    if (subjectGradingSystems.cijfers) {
                        gradingSystems.cijfers = true;
                    }
                    if (subjectGradingSystems.plusmin) {
                        gradingSystems.plusmin = true;
                    }
                    if (subjectGradingSystems.voortgang) {
                        gradingSystems.voortgang = true;
                    }
                    if (subjectGradingSystems.letters) {
                        gradingSystems.letters = true;
                    }
                }

                i++;
            }
            if (totalAverageWeight != 0) {
                totalAverage = (
                    totalAverageGrades / totalAverageWeight
                ).toFixed(2);
            }
            console.log(gradedata);

            if (gradedata.length == 0) {
                modMessage(
                    "Geen data",
                    "Het lijkt erop dat je nog geen cijfers hebt gekregen dit jaar. Probeer het later nog eens.",
                    "Doorgaan",
                );
                id("mod-message-action1").addEventListener("click", () => {
                    window.location.href =
                        "https://leerling.somtoday.nl/cijfers";
                    closeModMessage();
                });
                return;
            }

            availablePages = [busyYear, twoTrueOneFalse, twoTrueOneFalse];
            if (gradingSystems.cijfers) {
                availablePages.push(subjectsLow);
                availablePages.push(subjectsHigh);
                availablePages.push(guessTheGraph);
                availablePages.push(onvoldoendeGraph);
                i = 0;
                for (const subject of gradedata) {
                    if (!Number.isNaN(subject.average)) {
                        i++;
                    }
                }
                if (i > 5 && totalGrades > 10) {
                    availablePages.push(overgangsCheck);
                }
                for (const subject of gradedata) {
                    if (!Number.isNaN(subject.average)) {
                        availablePages.push(orderSubjects);
                        break;
                    }
                }
            }
            if (gradingSystems.plusmin) {
                availablePages.push(plusMinGraph);
                availablePages.push(twoTrueOneFalse);
                availablePages.push(twoTrueOneFalse);
            }
            if (gradingSystems.voortgang) {
                availablePages.push(completedGraph);
                availablePages.push(twoTrueOneFalse);
                availablePages.push(twoTrueOneFalse);
            }

            // All grades are collected, allow user to continue
            id("recap-nextpage").innerHTML = "Start Somtoday Recap";
            pages = 0;
            id("recap-nextpage").addEventListener("click", closeRecapPage);
        });
    }

    function orderSubjects() {
        const usedSubjects: any[] = [];
        const subjects: any[] = [];
        let html = "";
        for (let i = 0; i < 5 && i < gradedata.length; i++) {
            let randomSubject =
                gradedata[Math.floor(Math.random() * gradedata.length)];
            if (
                usedSubjects.includes(randomSubject.name) ||
                !randomSubject.systems.cijfers
            ) {
                for (const subject of gradedata) {
                    if (
                        !usedSubjects.includes(subject.name) &&
                        subject.systems.cijfers
                    ) {
                        randomSubject = subject;
                        break;
                    }
                }
                if (
                    usedSubjects.includes(randomSubject.name) ||
                    !randomSubject.systems.cijfers
                ) {
                    break;
                }
            }
            usedSubjects.push(randomSubject.name);
            subjects.push(randomSubject);
            html +=
                '<div class="mod-item"><div>' +
                randomSubject.icon +
                "</div><p>" +
                randomSubject.name +
                "</p>" +
                window.getIcon("grip-vertical", null, "var(--text-weak)") +
                "</div>";
        }
        cn("recap-page", 0).innerHTML =
            '<h1>Wat zijn je beste vakken?</h1><h2>Sorteer je vakken op basis van je gemiddelde</h2><div id="mod-grade-average-sort-list">' +
            html +
            '</div><a id="recap-nextpage">Volgende</a>';

        const list = document.getElementById("mod-grade-average-sort-list");
        let draggingEle: any;
        let placeholder: any;
        let isDraggingStarted = false;
        let x = 0;
        let y = 0;
        const swap = (nodeA: any, nodeB: any) => {
            const parentA = nodeA.parentNode;
            const siblingA =
                nodeA.nextSibling === nodeB ? nodeA : nodeA.nextSibling;
            nodeB.parentNode.insertBefore(nodeA, nodeB);
            parentA.insertBefore(nodeB, siblingA);
        };
        const isAbove = (nodeA: any, nodeB: any) => {
            const rectA = nodeA.getBoundingClientRect();
            const rectB = nodeB.getBoundingClientRect();
            return rectA.top + rectA.height / 2 < rectB.top + rectB.height / 2;
        };
        const mouseDownHandler = (e: any) => {
            if (e.target.classList.contains("mod-item")) {
                draggingEle = e.target;
            } else if (e.target.parentElement.classList.contains("mod-item")) {
                draggingEle = e.target.parentElement;
            } else if (
                e.target.parentElement.parentElement.classList.contains(
                    "mod-item",
                )
            ) {
                draggingEle = e.target.parentElement.parentElement;
            }
            const rect = draggingEle.getBoundingClientRect();
            if (e.touches == null || e.touches[0] == null) {
                x = e.pageX - rect.left;
                y = e.pageY - rect.top;
            } else {
                x = e.touches[0].pageX - rect.left;
                y = e.touches[0].pageY - rect.top;
            }
            document.addEventListener("mousemove", mouseMoveHandler);
            document.addEventListener("touchmove", mouseMoveHandler);
            document.addEventListener("mouseup", mouseUpHandler);
            document.addEventListener("touchend", mouseUpHandler);
        };
        const mouseMoveHandler = (e: any) => {
            if (!isDraggingStarted) {
                isDraggingStarted = true;
                placeholder = document.createElement("div");
                placeholder.classList.add("placeholder");
                draggingEle.parentNode.insertBefore(
                    placeholder,
                    draggingEle.nextSibling,
                );
                placeholder.style.height = "23px";
            }
            draggingEle.style.position = "absolute";
            if (e.touches == null || e.touches[0] == null) {
                draggingEle.style.top = `${e.pageY - y}px`;
                draggingEle.style.left = `${e.pageX - x}px`;
            } else {
                draggingEle.style.top = `${e.touches[0].pageY - y}px`;
                draggingEle.style.left = `${e.touches[0].pageX - x}px`;
            }
            const prevEle = draggingEle.previousElementSibling;
            const nextEle = placeholder.nextElementSibling;
            if (prevEle && isAbove(draggingEle, prevEle)) {
                swap(placeholder, draggingEle);
                swap(placeholder, prevEle);
                return;
            }
            if (nextEle && isAbove(nextEle, draggingEle)) {
                swap(nextEle, placeholder);
                swap(nextEle, draggingEle);
            }
        };
        const mouseUpHandler = () => {
            placeholder?.parentNode?.removeChild(placeholder);
            draggingEle.style.removeProperty("top");
            draggingEle.style.removeProperty("left");
            draggingEle.style.removeProperty("position");
            x = 0;
            y = 0;
            draggingEle = null;
            isDraggingStarted = false;
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("touchmove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
            document.removeEventListener("touchend", mouseUpHandler);
        };
        list?.querySelectorAll<HTMLElement>(".mod-item").forEach((item) => {
            item.addEventListener("mousedown", mouseDownHandler);
            item.addEventListener("touchstart", mouseDownHandler);
        });

        let clicked = false;
        let answerInterval: any;
        let audioHasFired = false;
        id("recap-nextpage").addEventListener("click", () => {
            if (clicked) {
                if (answerInterval != null) {
                    clearInterval(answerInterval);
                }
                closeRecapPage();
                return;
            }
            function checkAnswers(first = false) {
                if (n(id("mod-grade-average-sort-list"))) {
                    clearInterval(answerInterval);
                    return;
                }
                const orderedSubjects = subjects.slice();
                const loopCount = orderedSubjects.length;
                let correct = true;
                for (let i = 0; i < loopCount; i++) {
                    let maxGrade = 0;
                    let maxGradeIndex = 0;
                    for (let j = 0; j < orderedSubjects.length; j++) {
                        if (orderedSubjects[j].average > maxGrade) {
                            maxGrade = orderedSubjects[j].average;
                            maxGradeIndex = j;
                        }
                    }
                    // Correct
                    const pElement = id("mod-grade-average-sort-list")
                        .getElementsByClassName("mod-item")
                        [i].getElementsByTagName("p")[0];
                    if (
                        pElement.innerText ==
                        orderedSubjects[maxGradeIndex].name
                    ) {
                        pElement.classList.remove("wrong");
                        pElement.classList.add("right");
                        if (first) {
                            pElement.insertAdjacentHTML(
                                "afterend",
                                "<p>" +
                                    orderedSubjects[maxGradeIndex].average
                                        .toString()
                                        .replace(".", ",") +
                                    "</p>",
                            );
                        }
                    }
                    // Wrong
                    else {
                        correct = false;
                        let subjectAverage = "";
                        for (const subject of subjects) {
                            if (subject.name == pElement.innerText) {
                                subjectAverage = subject.average
                                    .toString()
                                    .replace(".", ",");
                                break;
                            }
                        }
                        pElement.classList.remove("right");
                        pElement.classList.add("wrong");
                        if (first) {
                            pElement.insertAdjacentHTML(
                                "afterend",
                                `<p>${subjectAverage}</p>`,
                            );
                        }
                    }
                    if (!audioHasFired) {
                        audioHasFired = true;
                        if (correct) {
                            try {
                                new Audio(window.getAudioUrl("correct")).play();
                            } catch (e) {
                                console.warn(e);
                            }
                            startConfetti();
                            setTimeout(stopConfetti, 750);
                        } else {
                            try {
                                new Audio(window.getAudioUrl("error")).play();
                            } catch (e) {
                                console.warn(e);
                            }
                        }
                    }
                    orderedSubjects.splice(maxGradeIndex, 1);
                }
            }
            checkAnswers(true);
            answerInterval = setInterval(checkAnswers, 50);
            setTimeout(() => {
                clicked = true;
            }, 100);
        });
    }
    function closeRecapPage() {
        id("recap-progress").insertAdjacentHTML("beforeend", "<div></div>");
        cn("recap-page", 0).classList.add("recap-closing");
        setTimeout(() => {
            cn("recap-page", 0).classList.remove("recap-closing");
        }, 350);
        pages++;
        let i: number;
        if (pages > 8) {
            pages = 8;
        }
        switch (pages) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
                music.volume = 1;
                if (availablePages.length > 0) {
                    i = Math.round(Math.random() * (availablePages.length - 1));
                    availablePages[i]();
                    availablePages.splice(i, 1);
                    break;
                } else {
                    pages = 7;
                    award();
                    break;
                }
            case 7:
                award();
                break;
            case 8:
                finish();
                break;
        }
    }
    function finish() {
        setTimeout(startConfetti, 100);
        cn("recap-page", 0).innerHTML =
            '<h1>Gefeliciteerd!</h1><h2>Het jaar zit erop en de vakantie is al in zicht.</h2><h3>Veel plezier in de vakantie en hopelijk tot volgend jaar!</h3><a id="recap-nextpage">Sluiten</a>';
        id("recap-nextpage").addEventListener("click", () => {
            // overzicht page causes menu to disappear on small devices, just reload cijfers page to prevent this bug
            if (document.documentElement.clientWidth < 1280) {
                window.location.href = "https://leerling.somtoday.nl/cijfers";
                return;
            }
            setTimeout(() => {
                tryRemove(id("somtoday-recap-wrapper"));
                stopConfetti();
                tn("body", 0).style.overflowX = "hidden";
                tn("body", 0).style.setProperty(
                    "overflow-y",
                    "scroll",
                    "important",
                );
                endMusic();
            }, 550);
            isRecapping = false;
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        });
        return;
    }
    async function endMusic() {
        let prev = music.volume;
        while (true) {
            if (music.volume > prev) {
                break;
            }
            prev = music.volume;
            const newVolume = music.volume - 0.05;
            if (newVolume >= 0) {
                music.volume = newVolume;
            } else {
                music.pause();
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    function award() {
        let award = "none";
        let description: any;
        let icon: any;
        let times = 0;
        while (award == "none" && times < 50) {
            let min: any, max: any;
            const randomAwardTry = Math.round(Math.random() * (13 - 1) + 1);
            switch (randomAwardTry) {
                case 1:
                    // MEESTERBREIN AWARD
                    if (totalAverage && totalAverage > 8) {
                        award = "meesterbrein";
                        description = "je gemiddelde hoger is dan een 8";
                        icon = "brain";
                    }
                    break;
                case 2:
                    if (gradingSystems.cijfers) {
                        // STEADY AWARD
                        min = 10;
                        max = 0;
                        for (const subject of gradedata) {
                            for (const grade of subject.grades) {
                                if (!Number.isNaN(grade.cijfer)) {
                                    if (grade.cijfer > max) {
                                        max = grade.cijfer;
                                    }
                                    if (grade.cijfer < min) {
                                        min = grade.cijfer;
                                    }
                                }
                            }
                        }
                        if (max - min < 2 && max - min > 0) {
                            award = "steady";
                            description =
                                "het verschil tussen je hoogste en laagste punt minder dan 2 is";
                            icon = "arrows-left-right";
                        }
                    }
                    break;
                case 3:
                    // ALGEBRA AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("wis") != -1 ||
                            subject.name.toLowerCase().indexOf("math") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "algebra";
                                description =
                                    "je een voldoende staat voor wiskunde";
                                icon = "calculator";
                            }
                            break;
                        }
                    }
                    break;
                case 4:
                    // SCHEIKUNDE AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("sch") != -1 ||
                            subject.name.toLowerCase().indexOf("chem") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "chemicus";
                                description =
                                    "je een voldoende staat voor scheikunde";
                                icon = "flask";
                            }
                            break;
                        }
                    }
                    break;
                case 5:
                    // TAALGENIE AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("fra") != -1 ||
                            subject.name.toLowerCase().indexOf("eng") != -1 ||
                            subject.name.toLowerCase().indexOf("dui") != -1 ||
                            subject.name.toLowerCase().indexOf("spa") != -1 ||
                            subject.name.toLowerCase().indexOf("eng") != -1 ||
                            subject.name.toLowerCase().indexOf("chi") != -1 ||
                            subject.name.toLowerCase().indexOf("taal") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "taalgenie";
                                description =
                                    "je een voldoende staat voor een taal";
                                icon = "earth-europe";
                            }
                            break;
                        }
                    }
                    break;
                case 6:
                    // OUDHEID AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("gri") != -1 ||
                            subject.name.toLowerCase().indexOf("gre") != -1 ||
                            subject.name.toLowerCase().indexOf("lat") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "oudheid";
                                description =
                                    "je een voldoende staat voor een klassieke taal";
                                icon = "landmark";
                            }
                            break;
                        }
                    }
                    break;
                case 7:
                    // WETENSCHAPPER AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("nat") != -1 ||
                            subject.name.toLowerCase().indexOf("phy") != -1 ||
                            subject.name.toLowerCase().indexOf("bio") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "wetenschapper";
                                description =
                                    "je een voldoende staat voor natuurkunde of biologie";
                                icon = "microscope";
                            }
                            break;
                        }
                    }
                    break;
                case 8:
                    // ONTDEKKER AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("aard") != -1 ||
                            subject.name.toLowerCase().indexOf("geo") != -1 ||
                            subject.name.toLowerCase().indexOf("ges") != -1 ||
                            subject.name.toLowerCase().indexOf("his") != -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "ontdekker";
                                description =
                                    "je een voldoende staat voor aardrijkskunde of geschiedenis";
                                icon = "map-location-dot";
                            }
                            break;
                        }
                    }
                    break;
                case 9:
                    // FOCUSED AWARD
                    max = false;
                    for (const subject of gradedata) {
                        if (
                            !Number.isNaN(parseFloat(subject.average)) &&
                            parseFloat(subject[0]) >= 8.5
                        ) {
                            max = true;
                        }
                    }
                    if (max) {
                        award = "gefocust";
                        description =
                            "je afgeronde gemiddelde van minstens &eacute;&eacute;n vak een 9 of hoger is";
                        icon = "bullseye";
                    }
                    break;
                case 10:
                    if (gradedata.length >= 15) {
                        award = "drukte";
                        description = "je 15 of meer vakken had";
                        icon = "book";
                    }
                    break;
                case 11:
                    // ARTIEST AWARD
                    for (const subject of gradedata) {
                        if (
                            subject.name.toLowerCase().indexOf("beeldend") !=
                                -1 ||
                            subject.name.toLowerCase().indexOf("kunst") != -1 ||
                            subject.name.toLowerCase().indexOf("art") != -1 ||
                            subject.name.toLowerCase().indexOf("vorming") !=
                                -1 ||
                            subject.name.toLowerCase().indexOf("ckv") != -1 ||
                            subject.name.toLowerCase().indexOf("kcv") != -1 ||
                            subject.name.toLowerCase().indexOf("cultuur") !=
                                -1 ||
                            subject.name.toLowerCase().indexOf("culturele") !=
                                -1
                        ) {
                            if (subject.average >= 5.5) {
                                award = "artiest";
                                description =
                                    "je een voldoende staat voor " +
                                    subject.name;
                                icon = "palette";
                            }
                            break;
                        }
                    }
                    break;
                case 12: {
                    // SMART AWARD
                    let tens = 0;
                    if (gradingSystems.cijfers) {
                        for (const subject of gradedata) {
                            for (const grade of subject.grades) {
                                if (!Number.isNaN(grade) && grade == 10) {
                                    tens++;
                                }
                            }
                        }
                        if (tens >= 3) {
                            award = "smart";
                            description =
                                "je 3 keer een tien hebt gehaald dit jaar";
                            icon = "brain";
                        }
                    }
                    break;
                }
                case 13:
                    award = "vakantie";
                    description = "het nu alweer bijna zomervakantie is";
                    icon = "sun";
                    break;
            }
            times++;
        }
        if (award == "none") {
            award = "vakantie";
            description = "het nu alweer bijna zomervakantie is";
            icon = "sun";
        }
        cn("recap-page", 0).innerHTML =
            '<div id="award-wrapper">' +
            window.getIcon(icon, null, "#1f86f6") +
            "</div><h1>AWARD!</h1><h2>Je hebt het dit jaar weer geweldig gedaan.</h2><h3>Omdat " +
            description +
            " krijg je de " +
            award +
            '-award.</h3><a id="recap-nextpage">Volgende</a>';
        id("recap-nextpage").addEventListener("click", closeRecapPage);
        setTimeout(() => {
            try {
                new Audio(window.getAudioUrl("tada")).play();
            } catch (e) {
                console.warn(e);
            }
        }, 1000);
    }
    function busyYear() {
        if (totalGrades > 15) {
            cn("recap-page", 0).innerHTML =
                "<h1>" +
                (pages > 1 ? "En w" : "W") +
                "at was het toch een druk jaar 😅</h1><h2>Je hebt in totaal <i>" +
                totalGrades +
                "</i> " +
                (totalGrades == 1 ? "cijfer" : "cijfers") +
                " gekregen met een totale weging van maar liefst <i>" +
                totalWeight +
                '</i>!</h2><h3>Dat is wel een applausje waard!</h3><a id="recap-nextpage">Volgende</a>';
        } else {
            cn("recap-page", 0).innerHTML =
                "<h1>Lekker rustig jaartje 😎</h1><h2>Je hebt in totaal <i>" +
                totalGrades +
                "</i> " +
                (totalGrades == 1 ? "cijfer" : "cijfers") +
                " gekregen met een totale weging van <i>" +
                totalWeight +
                '</i>!</h2><h3>Dat is relaxed door het jaar heen gaan!</h3><a id="recap-nextpage">Volgende</a>';
        }
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function subjectsHigh() {
        let highest = Number.MIN_SAFE_INTEGER,
            highestName: any,
            secondHighest: any,
            secondHighestName: any;
        for (const subject of gradedata) {
            if (subject.systems.cijfers) {
                for (const grade of subject.grades) {
                    if (
                        !Number.isNaN(grade.cijfer) &&
                        grade.cijfer >= highest
                    ) {
                        if (highestName) {
                            secondHighest = highest;
                            secondHighestName = highestName;
                        }
                        highest = grade.cijfer;
                        highestName = subject.name;
                    }
                }
            }
        }
        if (highest >= 5.5 && (secondHighest == null || secondHighest >= 5.5)) {
            cn("recap-page", 0).innerHTML =
                "<h1>" +
                (pages > 1 ? "En w" : "W") +
                "at heb je toch goede cijfers gehaald </h1><h2>Toen je een <i>" +
                highest +
                "</i> haalde voor " +
                highestName +
                " was je echt de uitblinker van de klas ✨</h2>" +
                (secondHighest
                    ? "<h3>En vergeet ook niet de <i>" +
                      secondHighest +
                      "</i> die je voor " +
                      secondHighestName +
                      " haalde!</h3>"
                    : "") +
                '<a id="recap-nextpage">Volgende</a>';
        } else {
            cn("recap-page", 0).innerHTML =
                "<h1>Laten we naar je cijfers kijken</h1><h2>Daar is wel wat ruimte voor verbetering 😅. Je hoogste cijfer is een <i>" +
                highest +
                "</i> voor " +
                highestName +
                ".</h2>" +
                (secondHighest
                    ? "<h3>En je op een na hoogste een <i>" +
                      secondHighest +
                      "</i> die je voor " +
                      secondHighestName +
                      " kreeg.</h3>"
                    : "") +
                '<a id="recap-nextpage">Volgende</a>';
        }
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function subjectsLow() {
        let lowest = Number.MAX_SAFE_INTEGER,
            lowestName: any,
            lowestAverage: any;
        for (const subject of gradedata) {
            if (subject.systems.cijfers) {
                for (const grade of subject.grades) {
                    if (!Number.isNaN(grade.cijfer) && grade.cijfer < lowest) {
                        lowest = grade.cijfer;
                        lowestName = subject.name;
                        lowestAverage = subject.average;
                    }
                }
            }
        }
        if (lowest < 5.5) {
            cn("recap-page", 0).innerHTML =
                "<h1>Soms was een toets vervelend 😓</h1><h2>Sommige toetsen zijn veel te moeilijk. Zoals de toets waarbij je een <i>" +
                lowest +
                "</i> haalde voor " +
                lowestName +
                ".</h2><h3>" +
                (lowestAverage < 5.5
                    ? "Toch heb je dit nog wel wat omhoog weten te halen naar een <i>" +
                      lowestAverage +
                      "</i>."
                    : "Gelukkig bleef je doorzetten en sta je nu toch voldoende met een gemiddelde van <i>" +
                      lowestAverage +
                      "</i>!") +
                '</h3><a id="recap-nextpage">Volgende</a>';
        } else {
            cn("recap-page", 0).innerHTML =
                "<h1>Wow, alleen maar voldoendes!</h1><h2>Je hebt geen enkele onvoldoende gekregen dit jaar 🥳! Je laagste cijfer was een <i>" +
                lowest +
                "</i> voor " +
                lowestName +
                ".</h2><h3>Ondanks dat " +
                lowestName +
                " soms lastig is, is je gemiddelde voor dit vak een <i>" +
                lowestAverage +
                '</i>!</h3><a id="recap-nextpage">Volgende</a>';
        }
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function twoTrueOneFalse() {
        // Determine which one is a lie
        let i = 0;
        // average
        const averageSubject =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))];
        let average = averageSubject.average;
        let replacementSubject: any,
            replacement = 0;
        if (n(average)) {
            replacementSubject = averageSubject;
            for (const cijfer of replacementSubject.grades) {
                replacement += cijfer.weging;
            }
        }
        // grade
        const gradeSubject =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))];
        let grade =
            gradeSubject.grades[
                Math.round(Math.random() * (gradeSubject.grades.length - 1))
            ].cijfer;
        // amount
        const amountSubject =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))];
        let amount = amountSubject.gradeCount;
        let real: any;
        const random = Math.round(Math.random() * (3 - 1) + 1);
        switch (random) {
            case 1:
                if (replacementSubject) {
                    real = replacement;
                    const randomNumber = Math.floor(
                        Math.random() * (3 - -3 + 1) + -3,
                    );
                    replacement += randomNumber == 0 ? 1 : randomNumber;
                    break;
                }
                real = average;
                if (Number.isNaN(parseFloat(average))) {
                    let choices: any;
                    if (
                        average.indexOf("+") != -1 ||
                        average.indexOf("-") != -1
                    ) {
                        choices = ["+", "-", "-/+"];
                    } else if (
                        average.indexOf("A") != -1 ||
                        average.indexOf("B") != -1 ||
                        average.indexOf("N") != -1 ||
                        average.indexOf("L") != -1
                    ) {
                        choices = ["A", "B", "N", "L"];
                    } else {
                        choices = ["O", "V", "G"];
                    }
                    choices = (choices as any[]).filter(
                        (item: any) => item !== average,
                    );
                    average =
                        choices[
                            Math.round(Math.random() * (choices.length - 1))
                        ];
                } else {
                    const add =
                        Math.round(Math.random() * (2 - 0.5) + 0.5 * 100) / 100;
                    average += add == 0 ? 0.1 : add;
                    average = average.toFixed(2);
                }
                break;
            case 2:
                real = grade;
                if (gradeSubject.systems.cijfers) {
                    if (Number.isNaN(grade)) {
                        for (const gradeInList of gradeSubject.grades) {
                            if (gradeInList && !Number.isNaN(gradeInList)) {
                                grade = gradeInList;
                                break;
                            }
                        }
                    }
                    real = grade;
                    i = 0;
                    while (true) {
                        grade +=
                            Math.round(Math.random() * (1 + 1) - 1 * 10) / 10;

                        let gradeInGradeList = false;
                        for (const gradeInList of gradeSubject.grades) {
                            if (gradeInList.cijfer == grade) {
                                gradeInGradeList = true;
                                break;
                            }
                        }
                        if (!gradeInGradeList && real != grade) {
                            break;
                        }

                        // HOW DID THIS HAPPEN?!?
                        if (i > 100) {
                            grade = Math.PI.toFixed(5);
                            break;
                        }

                        i++;
                    }
                    grade = grade.toFixed(1);
                } else {
                    let choices: any;
                    if (gradeSubject.systems.plusmin) {
                        choices = ["+", "-", "-/+"];
                    } else if (gradeSubject.systems.voortgang) {
                        choices = ["A", "B", "N", "L"];
                    } else if (gradeSubject.systems.letters) {
                        choices = ["O", "V", "G"];
                    }
                    for (const gradeInList of gradeSubject.grades) {
                        choices = (choices as any[]).filter(
                            (item: any) => item !== gradeInList.cijfer,
                        );
                    }
                    if (choices.length == 0) {
                        grade = Math.PI.toFixed(5);
                    } else {
                        grade =
                            choices[
                                Math.round(Math.random() * (choices.length - 1))
                            ];
                    }
                }
                break;
            case 3:
                real = amount;
                i = 0;
                while (real == amount) {
                    if (i > 100) {
                        if (Number.isNaN(amount)) {
                            amount = 0;
                        } else {
                            amount += 1;
                        }
                        break;
                    }
                    amount += Math.round(Math.random() * (2 + 2) - 2);
                    i++;
                }
                break;
        }
        cn("recap-page", 0).innerHTML =
            '<h1>Kies een van de opties.</h1><h2>Welke van de volgende opties klopt niet? 🤔</h2><label><input type="checkbox" id="recap-option-1"/><p>' +
            (replacementSubject
                ? "Je cijfers voor " +
                  replacementSubject.name +
                  ' hebben een totale weging van <span class="number">' +
                  replacement +
                  '</span><span class="correction"></span>'
                : 'Je staat een <span class="number">' +
                  average +
                  '</span><span class="correction"></span> voor ' +
                  averageSubject.name) +
            '</p></label><label><input type="checkbox" id="recap-option-2"/><p>Je hebt een <span class="number">' +
            grade +
            '</span><span class="correction"></span> voor ' +
            gradeSubject.name +
            ' gehaald</p></label><label><input type="checkbox" id="recap-option-3"/><p>Je hebt <span class="number">' +
            amount +
            '</span><span class="correction"></span> ' +
            (amount == 1 ? "cijfer" : "cijfers") +
            " voor " +
            amountSubject.name +
            ' gehaald</p></label><a id="recap-nextpage">Controleren</a>';
        let clicked = false;
        id("recap-nextpage").addEventListener(
            "click",
            function (this: HTMLElement) {
                if (clicked) {
                    closeRecapPage();
                    return;
                }
                if (
                    !id("recap-option-1").checked &&
                    !id("recap-option-2").checked &&
                    !id("recap-option-3").checked
                ) {
                    return;
                }
                id("recap-option-1").parentElement.style.pointerEvents = "none";
                id("recap-option-2").parentElement.style.pointerEvents = "none";
                id("recap-option-3").parentElement.style.pointerEvents = "none";
                if (id(`recap-option-${random}`).checked) {
                    clicked = true;
                    id(`recap-option-${random}`).parentElement.classList.add(
                        "right",
                    );
                    id(
                        `recap-option-${random}`,
                    ).parentElement.getElementsByClassName(
                        "correction",
                    )[0].innerHTML = ` ${real}`;
                    this.innerHTML = "Volgende";
                    try {
                        new Audio(window.getAudioUrl("correct")).play();
                    } catch (e) {
                        console.warn(e);
                    }
                    startConfetti();
                    setTimeout(stopConfetti, 750);
                } else {
                    try {
                        new Audio(window.getAudioUrl("error")).play();
                    } catch (e) {
                        console.warn(e);
                    }
                    clicked = true;
                    if (id("recap-option-1").checked) {
                        id("recap-option-1").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    if (id("recap-option-2").checked) {
                        id("recap-option-2").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    if (id("recap-option-3").checked) {
                        id("recap-option-3").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    id(`recap-option-${random}`).parentElement.classList.add(
                        "right",
                    );
                    id(
                        `recap-option-${random}`,
                    ).parentElement.getElementsByClassName(
                        "correction",
                    )[0].innerHTML = ` ${real}`;
                    this.innerHTML = "Volgende";
                }
            },
        );
        id("recap-option-1").addEventListener("change", () => {
            id("recap-option-2").checked = false;
            id("recap-option-3").checked = false;
        });
        id("recap-option-2").addEventListener("change", () => {
            id("recap-option-1").checked = false;
            id("recap-option-3").checked = false;
        });
        id("recap-option-3").addEventListener("change", () => {
            id("recap-option-1").checked = false;
            id("recap-option-2").checked = false;
        });
    }
    function overgangsCheck() {
        const distribution = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        let tekorten = 0,
            compensatie = 0;
        const kernvakken_onvoldoende = [];
        const kernvakken_5_of_hoger = [];
        const alle_vakken_4_of_hoger = [];
        const onvoldoendes = [];
        let overgang = 100;
        for (const subject of gradedata) {
            if (!Number.isNaN(parseFloat(subject.average))) {
                const average = Math.round(subject.average);
                const kernvak =
                    subject.name.toLowerCase().indexOf("wiskunde") != -1 &&
                    subject.name.toLowerCase().indexOf("nederlands") != -1 &&
                    subject.name.toLowerCase().indexOf("engels") != -1;
                tekorten += Math.max(6 - average, 0);
                compensatie += Math.max(average - 6, 0);
                if (average < 6 && kernvak) {
                    kernvakken_onvoldoende.push(subject);
                    if (kernvakken_onvoldoende.length > 1) {
                        overgang -= 25;
                    }
                }
                if (average < 5 && kernvak) {
                    kernvakken_5_of_hoger.push(subject);
                    overgang -= 25;
                }
                if (average < 4) {
                    alle_vakken_4_of_hoger.push(subject);
                    overgang -= (tekorten - 2) * 25;
                }
                if (average <= 5) {
                    onvoldoendes.push(subject);
                }
            }
            for (const grade of subject.grades) {
                if (!Number.isNaN(parseFloat(grade.cijfer))) {
                    distribution[Math.round(grade.cijfer) - 1]++;
                }
            }
        }
        if (tekorten > 3) {
            overgang -= 50 * (tekorten - 3);
        } else {
            overgang -= 2 * tekorten;
        }
        if (tekorten > 1 && tekorten > compensatie) {
            overgang -= 25 * (tekorten - compensatie);
        }
        if (overgang > 0 && overgang < 95) {
            overgang += Math.floor(Math.random() * (5 + 1));
        }
        overgang = Math.max(overgang, 5); // never 0%, because this makes people angry :(
        overgang = Math.min(overgang, 99); // never 100%, because this makes people disappointed if incorrect
        cn("recap-page", 0).innerHTML =
            "<h1>" +
            overgang +
            "% kans om over te gaan</h1><h2>" +
            (overgang == 100
                ? "Met deze flawless cijferlijst ga je natuurlijk zeker weten over! ✅"
                : overgang > 75
                  ? "Prima gedaan! Af en toe een onvoldoende halen kan gebeuren, maar dat zit jou nooit in de weg! 🙃"
                  : overgang > 50
                    ? "Redelijke cijferlijst, al voldoe je niet aan alle overgangsnormen."
                    : overgang >= 25
                      ? "Hmm, dat gaat een taai overgangsgesprek worden. Maar jij kan dit! Veel succes!"
                      : "Hmm, dat gaat een taai overgangsgesprek worden. Hopelijk komt het goed voor je.") +
            '</h3><br><br><div id="recap-chart-wrapper"><canvas id="recap-chart" width="350" height="350"></canvas></div><a id="recap-nextpage">Doorgaan</a>';
        id("recap-nextpage").addEventListener("click", closeRecapPage);
        if (
            distribution[9] +
                distribution[8] +
                distribution[7] +
                distribution[6] +
                distribution[5] +
                distribution[4] +
                distribution[3] +
                distribution[2] +
                distribution[1] +
                distribution[0] ==
            0
        ) {
            id("recap-chart").remove();
            return;
        }
        Chart.defaults.color = "#fff";
        const recapCanvas = document.getElementById(
            "recap-chart",
        ) as HTMLCanvasElement;
        const recapCtx = recapCanvas?.getContext("2d");
        if (!recapCtx) return;
        new Chart(recapCtx, {
            type: "doughnut",
            data: {
                labels: ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"],
                datasets: [
                    {
                        data: [
                            distribution[9],
                            distribution[8],
                            distribution[7],
                            distribution[6],
                            distribution[5],
                            distribution[4],
                            distribution[3],
                            distribution[2],
                            distribution[1],
                            distribution[0],
                        ],
                        backgroundColor: [
                            "#317256",
                            "#419873",
                            "#52BF90",
                            "#82C96D",
                            "#CBE07E",
                            "#EBDE7C",
                            "#FAB061",
                            "#EB6963",
                            "#CC4533",
                            "#AB4141",
                        ],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
    }
    function onvoldoendeGraph() {
        let voldoende = 0,
            onvoldoende = 0;
        for (const subject of gradedata) {
            if (subject.systems.cijfers) {
                for (const grade of subject.grades) {
                    if (!Number.isNaN(parseFloat(grade.cijfer))) {
                        if (grade.cijfer >= 5.5) {
                            voldoende++;
                        } else {
                            onvoldoende++;
                        }
                    }
                }
            }
        }
        const percentage =
            (Math.max(voldoende, 1) / Math.max(onvoldoende, 1)) * 100;
        cn("recap-page", 0).innerHTML =
            "<h1>" +
            (percentage > 85
                ? "Voldoende?!? JA!"
                : percentage > 50
                  ? "Voldoendes?"
                  : "Hmmm...") +
            "</h1><h2>" +
            (percentage > 85
                ? "Natuurlijk heb je dit jaar weer veel voldoendes gehaald!"
                : percentage > 50
                  ? "Jazeker! Je hebt meer dan de helft voldoende!"
                  : "Dat is niet zo best. Volgend jaar beter?") +
            '</h3><br><br><div id="recap-chart-wrapper"><canvas id="recap-chart" width="300" height="300"></canvas></div><a id="recap-nextpage">Doorgaan</a>';
        Chart.defaults.color = "#fff";
        const recapCanvas = document.getElementById(
            "recap-chart",
        ) as HTMLCanvasElement;
        const recapCtx = recapCanvas?.getContext("2d");
        if (!recapCtx) return;
        new Chart(recapCtx, {
            type: "doughnut",
            data: {
                labels: ["Voldoende", "Onvoldoende"],
                datasets: [
                    {
                        data: [voldoende, onvoldoende],
                        backgroundColor: [
                            "rgb(144, 255, 194)",
                            "rgb(255, 163, 171)",
                        ],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: false,
            },
        });
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function completedGraph() {
        let a = 0,
            b = 0,
            n = 0,
            l = 0;
        for (const subject of gradedata) {
            if (subject.systems.voortgang) {
                for (const grade of subject.grades) {
                    if (grade.cijfer.toString().indexOf("A") != -1) {
                        a++;
                    }
                    if (grade.cijfer.toString().indexOf("B") != -1) {
                        b++;
                    }
                    if (grade.cijfer.toString().indexOf("N") != -1) {
                        n++;
                    }
                    if (grade.cijfer.toString().indexOf("L") != -1) {
                        l++;
                    }
                }
            }
        }
        cn("recap-page", 0).innerHTML =
            '<h1>Doel gehaald! 🎯</h1><h2>Goed gedaan! Ook dit jaar is weer voorbij!</h2><h3>Hoeveel proefwerken en opdrachten heb je wel niet gemaakt? Veel.</h3><br><br><div id="recap-chart-wrapper"><canvas id="recap-chart" width="300" height="300"></canvas></div><a id="recap-nextpage">Doorgaan</a>';
        Chart.defaults.color = "#fff";
        const recapCanvas = document.getElementById(
            "recap-chart",
        ) as HTMLCanvasElement;
        const recapCtx = recapCanvas?.getContext("2d");
        if (!recapCtx) return;
        new Chart(recapCtx, {
            type: "doughnut",
            data: {
                labels: ["Afgerond", "Bijna", "Niet afgerond", "Lopend"],
                datasets: [
                    {
                        data: [a, b, n, l],
                        backgroundColor: [
                            "rgb(144, 255, 194)",
                            "rgb(255, 235, 171)",
                            "rgb(255, 163, 171)",
                            "rgb(100, 171, 255)",
                        ],
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                responsive: false,
            },
        });
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function plusMinGraph() {
        let plus = 0,
            min = 0,
            plusmin = 0;
        for (const subject of gradedata) {
            if (subject.systems.plusmin) {
                for (const grade of subject.grades) {
                    const containsPlus =
                        grade.cijfer.toString().indexOf("+") != -1;
                    const containsMin =
                        grade.cijfer.toString().indexOf("-") != -1;
                    if (containsPlus && containsMin) {
                        plusmin++;
                    } else if (containsPlus) {
                        plus++;
                    } else if (containsMin) {
                        min++;
                    }
                }
            }
        }
        cn("recap-page", 0).innerHTML =
            "<h1>Je krijgt een dikke plus!</h1><h2>" +
            (plus > min
                ? "Ook dit jaar zijn er weer flink wat plussen uitgedeeld!"
                : plus < min
                  ? "De minnen overtroffen dit jaar helaas de plussen... Maar niet getreurd, want je hebt toch nog " +
                    plus +
                    " plussen bij elkaar weten te verzamelen! Goed gedaan!"
                  : "Het is een gelijkspel! Je hebt precies evenveel plussen als minnen!") +
            '</h2><br><br><div id="recap-chart-wrapper"><canvas id="recap-chart"></canvas></div><a id="recap-nextpage">Doorgaan</a>';
        Chart.defaults.color = "#fff";
        const recapCanvas = document.getElementById(
            "recap-chart",
        ) as HTMLCanvasElement;
        const recapCtx = recapCanvas?.getContext("2d");
        if (!recapCtx) return;
        new Chart(recapCtx, {
            type: "bar",
            data: {
                labels: ["+", "-", "-/+"],
                datasets: [
                    {
                        data: [plus, min, plusmin],
                        backgroundColor: [
                            "rgb(144, 255, 194)",
                            "rgb(255, 163, 171)",
                            "rgb(255, 235, 171)",
                        ],
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
        id("recap-nextpage").addEventListener("click", closeRecapPage);
    }
    function guessTheGraph() {
        cn("recap-page", 0).innerHTML =
            '<h1>Van welk vak is deze grafiek?</h1><h2>Van welk vak denk je dat de onderstaande grafiek is?</h2><div id="recap-chart-wrapper"><canvas id="recap-chart"></canvas></div><label><input type="checkbox" id="recap-option-1"/><p id="recap-text-1"></p></label><label><input type="checkbox" id="recap-option-2"/><p id="recap-text-2"></p></label><label><input type="checkbox" id="recap-option-3"/><p id="recap-text-3"></p></label><a id="recap-nextpage">Controleren</a>';
        let chosenSubject =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))];
        while (!chosenSubject.systems.cijfers) {
            chosenSubject =
                gradedata[Math.round(Math.random() * (gradedata.length - 1))];
        }
        gradeGraphs(chosenSubject);
        const random = Math.round(Math.random() * (3 - 1) + 1);
        id(`recap-option-${random}`).innerHTML = chosenSubject.name;
        let fakeOptionOne =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))].name;
        let i = 0;
        const subjectArray = [
            "Aardrijkskunde",
            "Geschiedenis",
            "Nederlands",
            "Engels",
            "Frans",
            "Natuurkunde",
            "Wiskunde",
            "Biologie",
            "Scheikunde",
        ];
        while (fakeOptionOne == chosenSubject.name) {
            if (i > 100) {
                fakeOptionOne =
                    subjectArray[
                        Math.floor(Math.random() * subjectArray.length)
                    ];
                break;
            }
            fakeOptionOne =
                gradedata[Math.round(Math.random() * (gradedata.length - 1))]
                    .name;
            i++;
        }
        i = 0;
        let fakeOptionTwo =
            gradedata[Math.round(Math.random() * (gradedata.length - 1))].name;
        while (
            fakeOptionTwo == chosenSubject.name ||
            fakeOptionTwo == fakeOptionOne
        ) {
            if (i > 100) {
                fakeOptionTwo =
                    subjectArray[
                        Math.floor(Math.random() * subjectArray.length)
                    ];
                break;
            }
            fakeOptionTwo =
                gradedata[Math.round(Math.random() * (gradedata.length - 1))]
                    .name;
            i++;
        }
        id(`recap-text-${random}`).innerHTML = chosenSubject.name;
        switch (random) {
            case 1:
                id("recap-text-2").innerHTML = fakeOptionOne;
                id("recap-text-3").innerHTML = fakeOptionTwo;
                break;
            case 2:
                id("recap-text-1").innerHTML = fakeOptionOne;
                id("recap-text-3").innerHTML = fakeOptionTwo;
                break;
            case 3:
                id("recap-text-1").innerHTML = fakeOptionOne;
                id("recap-text-2").innerHTML = fakeOptionTwo;
                break;
        }
        let clicked = false;
        id("recap-nextpage").addEventListener(
            "click",
            function (this: HTMLElement) {
                if (clicked) {
                    closeRecapPage();
                    return;
                }
                if (
                    !id("recap-option-1").checked &&
                    !id("recap-option-2").checked &&
                    !id("recap-option-3").checked
                ) {
                    return;
                }
                if (id(`recap-option-${random}`).checked) {
                    clicked = true;
                    id(`recap-option-${random}`).parentElement.classList.add(
                        "right",
                    );
                    this.innerHTML = "Volgende";
                    try {
                        new Audio(window.getAudioUrl("correct")).play();
                    } catch (e) {
                        console.warn(e);
                    }
                    startConfetti();
                    setTimeout(stopConfetti, 750);
                } else {
                    try {
                        new Audio(window.getAudioUrl("error")).play();
                    } catch (e) {
                        console.warn(e);
                    }
                    clicked = true;
                    if (id("recap-option-1").checked) {
                        id("recap-option-1").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    if (id("recap-option-2").checked) {
                        id("recap-option-2").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    if (id("recap-option-3").checked) {
                        id("recap-option-3").parentElement.classList.add(
                            "wrong",
                        );
                    }
                    id(`recap-option-${random}`).parentElement.classList.add(
                        "right",
                    );
                    this.innerHTML = "Volgende";
                }
            },
        );
        id("recap-option-1").addEventListener("change", () => {
            id("recap-option-2").checked = false;
            id("recap-option-3").checked = false;
        });
        id("recap-option-2").addEventListener("change", () => {
            id("recap-option-1").checked = false;
            id("recap-option-3").checked = false;
        });
        id("recap-option-3").addEventListener("change", () => {
            id("recap-option-1").checked = false;
            id("recap-option-2").checked = false;
        });
    }
}
