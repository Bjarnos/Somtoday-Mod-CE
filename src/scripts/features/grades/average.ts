import { get, set } from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    id,
    n,
    parseJSON,
    tn,
} from "../../shorthand_functions";
import { closeModMessage, modMessage } from "../extras/modMessage";

export function showLetterbeoordelingenMessage(letter?: string) {
    const list: Record<string, any[]> = {
        U: ["Uitstekend", 10],
        ZG: ["Zeer goed", 9],
        G: ["Goed", 8],
        RV: ["Ruim voldoende", 7],
        V: ["Voldoende", 6],
        T: ["Twijfel", 5],
        M: ["Matig", 5],
        O: ["Onvoldoende", 4],
        RO: ["Ruim onvoldoende", 3],
        S: ["Slecht", 2],
        ZS: ["Zeer slecht", 1],
        A: ["Af", 10],
        B: ["Bijna", 5.5],
        N: ["Niet af", 1],
        L: ["Lopend", 1],
    };
    let letterbeoordelingen = parseJSON(get("letterbeoordelingen"));
    if (
        letter != null &&
        !n(letterbeoordelingen) &&
        letterbeoordelingen[letter] == "-"
    ) {
        return;
    }
    if (letterbeoordelingen) {
        for (const [key, value] of Object.entries(letterbeoordelingen)) {
            list[key] = [list[key] ? list[key][0] : key, value];
        }
    }
    if (letter != null && list[letter] == null) {
        list[letter] = [];
    }
    let listHTML = "";
    for (const [key, value] of Object.entries(list)) {
        listHTML +=
            "<div><label>" +
            key +
            (value[0] ? ` (${value[0]})` : "") +
            '</label><input class="mod-letterbeoordelingen-letter" value="' +
            value[1] +
            '" data-mod-letter="' +
            key +
            '" type="number" placeholder="' +
            (value[0] ? value[0] : key) +
            '"></div>';
    }
    modMessage(
        "Letterbeoordelingen",
        'Bij sommige scholen tellen letterbeoordelingen (O, V, G, etc) mee voor je gemiddelde. Helaas verschilt het per school hoeveel een letter als cijfer waard is. Vul hieronder in hoeveel elke letter waard is.</p><div id="mod-letterbeoordelingen">' +
            listHTML +
            "</div><p>",
        "Opslaan",
        "Sluiten",
    );
    id("mod-message-action1").addEventListener("click", () => {
        if (letterbeoordelingen == null) {
            letterbeoordelingen = {};
        }
        // Save letterbeoordelingen
        for (const element of cn("mod-letterbeoordelingen-letter")) {
            if (!Number.isNaN(parseFloat(element.value))) {
                letterbeoordelingen[element.dataset.modLetter] = element.value;
            } else {
                // Save "-" to indicate this letter should be ignored
                letterbeoordelingen[element.dataset.modLetter] = "-";
            }
        }
        console.log(letterbeoordelingen);
        set("letterbeoordelingen", JSON.stringify(letterbeoordelingen));
        closeModMessage();
    });
    id("mod-message-action2").addEventListener("click", () => {
        // Save letterbeoordelingen
        if (letterbeoordelingen == null) {
            letterbeoordelingen = {};
        }
        for (const element of cn("mod-letterbeoordelingen-letter")) {
            // Save "-" to indicate this letter should be ignored
            letterbeoordelingen[element.dataset.modLetter] = "-";
        }
        set("letterbeoordelingen", JSON.stringify(letterbeoordelingen));
        closeModMessage();
    });
}

export function calculateAverage() {
    let total = 0;
    let weight = 0;
    for (const element of document.getElementsByTagName("sl-resultaat-item")) {
        // Each element should have a grade and weight
        if (
            !n(element.getElementsByClassName("cijfer")[0]) &&
            !n(element.getElementsByClassName("cijfer")[0].children[0]) &&
            !n(element.getElementsByClassName("weging")[0])
        ) {
            // Ignore this grade and continue with the next one if the weight is not a number
            // Should never happen unless your school has a fucked up and stupid grade system
            const wegingMatch = element
                .getElementsByClassName("weging")[0]
                ?.innerHTML.replace(",", ".")
                .match(/[0-9]+(\.[0-9]+)?/);
            if (!wegingMatch) {
                continue;
            }
            const tempWeight = parseFloat(wegingMatch[0]);
            const tempGrade = parseFloat(
                element
                    .getElementsByClassName("cijfer")[0]
                    .children[0].innerHTML.replace(",", "."),
            );

            // If grade is not a number, check if user has set a corresponding numeric value
            if (Number.isNaN(tempGrade)) {
                // If weight is zero, it is probably a "handelingsdeel" and we can ignore it
                if (tempWeight != 0) {
                    const letterbeoordelingen = parseJSON(
                        get("letterbeoordelingen"),
                    );
                    const letter = element
                        .getElementsByClassName("cijfer")[0]
                        .children[0].innerHTML.replace(",", ".");
                    if (
                        letterbeoordelingen == null ||
                        letterbeoordelingen[letter] == null
                    ) {
                        // Probably just a future grade with content "-", ignore
                        if (
                            element
                                .getElementsByClassName("cijfer")[0]
                                .classList.contains("neutraal")
                        ) {
                            continue;
                        }
                        // Letter value is not set, ask user to define it
                        showLetterbeoordelingenMessage(letter);
                    } else if (Number.isNaN(letterbeoordelingen[letter])) {
                    } else {
                        // Letter value is numeric and set
                        total += letterbeoordelingen[letter] * tempWeight;
                        weight += tempWeight;
                    }
                }
            } else {
                total += tempGrade * tempWeight;
                weight += tempWeight;
            }
        }
    }
    return {
        total: total,
        weight: weight,
    };
}

export function subjectGradesPageContainsNumberGrades(): boolean {
    for (const element of tn("sl-resultaat-item")) {
        if (element.getElementsByClassName("cijfer")[0]) {
            if (
                !Number.isNaN(
                    parseFloat(
                        element
                            .getElementsByClassName("cijfer")[0]
                            .innerText.replace(",", "."),
                    ),
                )
            ) {
                return true;
            }
        }
    }
    return false;
}

// Add grade calculation tools when enabled
export function insertCalculationTool() {
    if (
        n(id("mod-grade-calculate")) &&
        tn("sl-resultaat-item", 0) &&
        get("bools").charAt(BOOL_INDEX.CALCULATION_TOOL) == "1"
    ) {
        if (!subjectGradesPageContainsNumberGrades()) {
            return;
        }
        tn("sl-vakresultaten", 0).insertAdjacentHTML(
            "beforeend",
            '<div id="mod-grade-calculate"><h3>Gemiddelde berekenen</h3><p>Wat moet ik halen?</p><input id="mod-grade-one-one" type="number" placeholder="Ik wil staan"><input id="mod-grade-one-two" type="number" placeholder="Weging aankomend cijfer"><input id="mod-grade-one-three" type="submit" value="Berekenen"><br><p>Wat ga ik staan?</p><input id="mod-grade-two-one" type="number" placeholder="Ik haal een"><input id="mod-grade-two-two" type="number" placeholder="Met de weging"/><input id="mod-grade-two-three" type="submit" value="Berekenen"/></div>',
        );
        id("mod-grade-one-three").addEventListener("click", () => {
            const averageData = calculateAverage();
            // Calculate grade needed for chosen average
            const chosenAverage = parseFloat(id("mod-grade-one-one").value);
            const chosenWeight = parseFloat(id("mod-grade-one-two").value);
            if (Number.isNaN(chosenAverage) || Number.isNaN(chosenWeight)) {
                id("mod-grade-one-three").value = "Berekenen";
            } else {
                id("mod-grade-one-three").value = (
                    Math.ceil(
                        ((chosenAverage * (chosenWeight + averageData.weight) -
                            averageData.total) /
                            chosenWeight) *
                            100,
                    ) / 100
                )
                    .toFixed(2)
                    .toString()
                    .replace(".", ",");
            }
        });
        id("mod-grade-two-three").addEventListener("click", () => {
            const averageData = calculateAverage();
            // Calculate average with chosen grade added
            const chosenGrade = parseFloat(id("mod-grade-two-one").value);
            const chosenWeight = parseFloat(id("mod-grade-two-two").value);
            if (Number.isNaN(chosenGrade) || Number.isNaN(chosenWeight)) {
                id("mod-grade-two-three").value = "Berekenen";
            } else {
                averageData.total += chosenGrade * chosenWeight;
                averageData.weight += chosenWeight;
                id("mod-grade-two-three").value = (
                    Math.floor((averageData.total / averageData.weight) * 100) /
                    100
                )
                    .toFixed(2)
                    .toString()
                    .replace(".", ",");
            }
        });
    }
}
