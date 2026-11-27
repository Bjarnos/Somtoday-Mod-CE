import { get } from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    execute,
    n,
    setHTML,
    tn,
} from "../../shorthand_functions";
import { customHomework } from "./customHomework";

export let timeIndicatorTop = 0;
export let normalRosterHeight = 0;

export function rosterSimplify() {
    // Every time the roster is modified, the week may have changed, so update custom homework as well
    execute([customHomework, rosterReloadButton]);
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
            cn("tertiary normal action-primary-normal center", 0).classList.add(
                "mod-vandaag-button-event-listener-added",
            );
        }
        tn("sl-rooster-weken", 0).style.minHeight = "calc(100vh - 175px)";
        // Get the height the roster takes up normally
        normalRosterHeight = Math.max(
            tn("sl-rooster-weken", 0).clientHeight,
            normalRosterHeight,
        );
        // Loop through all loaded weeks and simplify them
        const today = new Date();
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
                    element.getElementsByClassName("opacity-80")[0].innerHTML
                        .length == 0 ||
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
                        tn("sl-rooster-weken", 0).style.overflowY = "visible";
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
                            ].getElementsByClassName("opacity-80")[0].innerHTML;
                        hour = parseInt(hour.substring(0, hour.length - 1), 10);
                        // Get top value of last hour
                        let lastHourTop =
                            elements[elements.length - 1].style.top;
                        lastHourTop = parseInt(
                            lastHourTop.substring(0, lastHourTop.length - 2),
                            10,
                        );
                        // Get top value of time indicator
                        const rawTimeIndicatorTop = cn("tijdlijn", 0).style.top;
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
                        !n(element.getElementsByClassName("opacity-80")[0]) &&
                        !n(
                            element.getElementsByClassName("opacity-80")[0]
                                .parentElement.children[1],
                        )
                    ) {
                        let hour =
                            element.getElementsByClassName("opacity-80")[0]
                                .innerHTML;
                        hour = parseInt(hour.substring(0, hour.length - 1), 10);
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
                    for (const element of tn("sl-rooster-tijden", 0).children) {
                        let span = element.getElementsByTagName("span")[0];
                        if (n(span)) {
                            if (tn("sl-rooster-tijden", 0).children[1]) {
                                setHTML(
                                    element,
                                    tn("sl-rooster-tijden", 0).children[1]
                                        .innerHTML,
                                );
                                span = element.getElementsByTagName("span")[0];
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


function rosterReloadButton() {
    if (!document.querySelector("sl-rooster-weken")) return;
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    const weekend = buttons.find(button => /^(toon|verberg) weekend$/i.test(button.textContent?.trim() || ""));
    if (!weekend) return;
    const anchor = weekend.closest("hmy-button") || weekend;
    if (anchor.parentElement?.querySelector("#mod-roster-reload")) return;

    const button = document.createElement("button");
    button.id = "mod-roster-reload";
    button.type = "button";
    button.className = weekend.className;
    button.title = "Rooster vernieuwen";
    button.setAttribute("aria-label", "Rooster vernieuwen");
    button.style.cssText = "display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:48px;height:36px;padding:0 10px;margin-right:8px;color:var(--fg-primary-normal,#006bc9);flex-shrink:0;cursor:pointer;";
    button.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h2m4 0h2m-8 3h2m4 0h2"/></svg><svg class="mod-roster-reload-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a8 8 0 0 1 14 5M4 12a8 8 0 0 0 14 5"/></svg>';
    anchor.before(button);

    button.addEventListener("click", () => {
        if (button.disabled) return;
        const today = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            candidate => candidate.textContent?.trim() === "Vandaag"
        );
        if (!today || today.disabled) {
            button.title = "Vernieuwen is momenteel niet beschikbaar";
            return;
        }
        button.disabled = true;
        const icon = button.querySelector<SVGElement>(".mod-roster-reload-icon");
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            icon?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
                duration: 650,
                easing: "cubic-bezier(.4,0,.2,1)"
            });
        }
        today.click();
        setTimeout(() => {
            button.disabled = false;
            button.title = "Rooster vernieuwen";
            execute([rosterSimplify]);
        }, 750);
    });
}
