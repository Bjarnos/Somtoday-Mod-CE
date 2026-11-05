import { get, set } from "../../save_version_management";
import { BOOL_INDEX, cn, n, tn } from "../../shorthand_functions";

export function gradeReveal() {
    if (get("bools").charAt(BOOL_INDEX.GRADE_REVEAL) != "0") {
        if (tn("sl-laatsteresultaten", 0) && tn("sl-resultaat-item", 0)) {
            let i = 0;
            const lastGrade = get("lastgrade");
            const lastGradeTitle = get("lastgradetitle");
            const lastGradeDescription = get("lastgradedescription");
            for (const element of cn("cijfer")) {
                if (element.classList.contains("mod-animation-finished")) {
                    break;
                }
                if (!n(element.children[0])) {
                    if (
                        get("bools").charAt(BOOL_INDEX.GRADE_REVEAL) == "1" &&
                        element.children[0].innerHTML == lastGrade &&
                        (n(
                            element.parentElement.parentElement.parentElement.getElementsByClassName(
                                "titel",
                            )[0],
                        ) ||
                            element.parentElement.parentElement.parentElement.getElementsByClassName(
                                "titel",
                            )[0].innerHTML == lastGradeTitle) &&
                        (n(
                            element.parentElement.parentElement.parentElement.getElementsByClassName(
                                "subtitel",
                            )[0],
                        ) ||
                            element.parentElement.parentElement.parentElement
                                .getElementsByClassName("subtitel")[0]
                                .innerHTML.split("• ")[1] ==
                                lastGradeDescription)
                    ) {
                        break;
                    } else if (i == 0) {
                        set("lastgrade", element.children[0].innerHTML);
                        set(
                            "lastgradetitle",
                            element.parentElement.parentElement.parentElement.getElementsByClassName(
                                "titel",
                            )[0].innerHTML,
                        );
                        set(
                            "lastgradedescription",
                            element.parentElement.parentElement.parentElement
                                .getElementsByClassName("subtitel")[0]
                                .innerHTML.split("• ")[1],
                        );
                    }
                    element.classList.add("mod-animation-finished");
                    if (
                        !Number.isNaN(parseFloat(element.children[0].innerHTML))
                    ) {
                        countAnimation(
                            element.children[0],
                            0,
                            parseFloat(
                                element.children[0].innerHTML.replace(",", "."),
                            ),
                            3500,
                            30,
                        );
                    }
                    i++;
                }
            }
        }
    }
}

// Simple count animation
export function countAnimation(
    element: any,
    begin: any,
    target: any,
    time: any,
    update: any,
    className?: any,
    elapsedTime?: any,
) {
    if (elapsedTime === undefined) {
        elapsedTime = 0;
        className = element.parentElement.getAttribute("class");
    }
    elapsedTime += update;

    let result = target;
    if (elapsedTime < time) {
        const t = elapsedTime / time;
        const ease = 1 - (1 - t) ** 5;
        result = begin + (target - begin) * ease;

        element.parentElement.classList.remove("onvoldoende");
        element.parentElement.classList.remove("ruimvoldoende");
        if (result < 5.5) {
            // Jullie hebben allemaal een onvoldoende
            element.parentElement.classList.add("onvoldoende");
        }
        if (result >= 8.0) {
            // Of nee, toch niet
            element.parentElement.classList.add("ruimvoldoende");
        }

        setTimeout(
            countAnimation,
            update,
            element,
            begin,
            target,
            time,
            update,
            className,
            elapsedTime,
        );
    } else {
        element.parentElement.setAttribute("class", className);
    }

    element.innerHTML = result.toFixed(1).replace(".", ",");
}
