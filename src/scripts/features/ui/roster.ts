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


let rosterRefreshActive = false;

function rosterReloadButton() {
    if (!document.querySelector("sl-rooster-weken")) return;
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    const weekend = buttons.find(button => /^(toon|verberg) weekend$/i.test(button.textContent?.trim() || ""));
    if (!weekend) return;
    const anchor = weekend.closest("hmy-button") || weekend;
    const syncButtonStyle = (target: HTMLButtonElement) => {
        const native = getComputedStyle(weekend);
        const styles = {
            color: native.color,
            backgroundColor: native.backgroundColor,
            border: native.border,
            borderRadius: native.borderRadius,
            boxShadow: native.boxShadow,
            height: weekend.getBoundingClientRect().height + "px",
        };
        for (const [key, value] of Object.entries(styles)) {
            const property = key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase());
            if (target.style.getPropertyValue(property) !== value) {
                target.style.setProperty(property, value);
            }
        }
    };
    const existing = anchor.parentElement?.querySelector<HTMLButtonElement>("#mod-roster-reload");
    if (existing) {
        if (!weekend.matches(":hover,:active")) syncButtonStyle(existing);
        return;
    }

    const button = document.createElement("button");
    button.id = "mod-roster-reload";
    button.type = "button";
    button.className = "mod-roster-reload-button";
    button.title = "Rooster vernieuwen";
    button.setAttribute("aria-label", "Rooster vernieuwen");
    button.style.cssText = "appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:42px;height:36px;padding:0 9px;margin-right:8px;flex-shrink:0;cursor:pointer;vertical-align:middle;";
    button.innerHTML = '<svg style="display:block;flex-shrink:0;overflow:visible" width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><mask id="mod-roster-calendar-mask"><rect width="32" height="32" fill="white"/><circle cx="24" cy="24" r="9.5" fill="black"/></mask></defs><g mask="url(#mod-roster-calendar-mask)"><rect x="3" y="5" width="22" height="23" rx="3"/><path d="M9 2v6M19 2v6M3 12h22"/><path d="M8 17h2m4 0h2m4 0h1M8 22h2m4 0h2"/></g><g class="mod-roster-reload-icon" style="transform-box:view-box;transform-origin:24px 24px"><path d="M29.5 21a6.3 6.3 0 1 0 .4 5.5M29.5 16.5V21H25" fill="none"/></g></svg>';
    if (!document.getElementById("mod-roster-reload-style")) {
        const style = document.createElement("style");
        style.id = "mod-roster-reload-style";
        style.textContent = `
            #mod-roster-reload {transition:transform .18s ease,filter .18s ease; background-image:none!important;}
            #mod-roster-reload:hover:not(:disabled) {transform:translateY(-2px);filter:brightness(.97);}
            #mod-roster-reload:active:not(:disabled) {transform:translateY(0);}
            #mod-roster-reload:disabled {opacity:1;cursor:wait;}
            sl-rooster-weken.mod-roster-refreshing {opacity:.78;transition:opacity .2s ease;}
            #mod-roster-reload:focus-visible {outline:2px solid currentColor;outline-offset:2px;}
            @media(prefers-reduced-motion:reduce) {
                #mod-roster-reload {transition:none;}
                sl-rooster-weken.mod-roster-refreshing {transition:none;opacity:1;}
                #mod-roster-reload:hover:not(:disabled) {transform:none;}
            }
        `;
        document.head.append(style);
    }
    syncButtonStyle(button);
    anchor.before(button);

    button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.disabled || rosterRefreshActive) return;
        const today = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            candidate => /^vandaag$/i.test(candidate.textContent?.trim() || candidate.getAttribute("aria-label") || candidate.title)
        ) || document.querySelector<HTMLButtonElement>("button.tertiary.normal.action-primary-normal.center");
        document.getElementById("mod-roster-refresh-status")?.remove();
        button.disabled = true;
        rosterRefreshActive = true;
        button.setAttribute("aria-busy", "true");
        const icon = button.querySelector<SVGElement>(".mod-roster-reload-icon");
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            icon?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
                duration: 650,
                easing: "cubic-bezier(.4,0,.2,1)"
            });
        }
        const roster = document.querySelector("sl-rooster-weken");
        const status = document.createElement("div");
        status.id = "mod-roster-refresh-status";
        status.setAttribute("role", "status");
        status.textContent = "Rooster vernieuwen…";
        status.style.color = getComputedStyle(button).color;
        const background = getComputedStyle(weekend).backgroundColor;
        if (background !== "rgba(0, 0, 0, 0)" && background !== "transparent") status.style.backgroundColor = background;
        status.style.border = getComputedStyle(weekend).border;
        const positionStatus = () => {
            const current = document.querySelector("sl-rooster-weken");
            if (!current) return;
            const rect = current.getBoundingClientRect();
            status.style.top = Math.max(8, rect.top + 8) + "px";
            status.style.left = Math.max(8, rect.right - status.offsetWidth - 12) + "px";
            status.style.visibility = rect.top < 0 || rect.top > window.innerHeight ? "hidden" : "visible";
            current.classList.add("mod-rooster-refreshing");
        };
        document.body.append(status);
        positionStatus();
        roster?.classList.add("mod-roster-refreshing");
        window.addEventListener("resize", positionStatus);
        window.addEventListener("scroll", positionStatus, true);
        let quietTimer: ReturnType<typeof setTimeout>;
        let timeout: ReturnType<typeof setTimeout>;
        let finished = false;
        const started = performance.now();
        const finish = (changed = false) => {
            if (finished) return;
            finished = true;
            observer.disconnect();
            clearTimeout(quietTimer);
            clearTimeout(timeout);
            window.removeEventListener("resize", positionStatus);
            window.removeEventListener("scroll", positionStatus, true);
            status.textContent = changed ? "Roosterweergave bijgewerkt" : "Vernieuwing niet bevestigd";
            setTimeout(() => status.remove(), 1800);
            roster?.classList.remove("mod-roster-refreshing");
            document.querySelector("sl-rooster-weken")?.classList.remove("mod-roster-refreshing");
            rosterRefreshActive = false;
            button.disabled = false;
            button.removeAttribute("aria-busy");
            execute([rosterSimplify]);
        };
        const observer = new MutationObserver(records => {
            const changed = records.some(record =>
                Array.from(record.addedNodes).concat(Array.from(record.removedNodes)).some(node =>
                    node instanceof Element && (node.matches("sl-rooster-weken,sl-rooster-week,sl-rooster-item") ||
                        !!node.querySelector("sl-rooster-week,sl-rooster-item"))
                )
            );
            if (!changed) return;
            positionStatus();
            clearTimeout(quietTimer);
            quietTimer = setTimeout(() => finish(true), Math.max(450, 900 - (performance.now() - started)));
        });
        observer.observe(document.body, { childList: true, subtree: true });
        timeout = setTimeout(() => finish(false), 8000);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (finished) return;
            if (!today?.isConnected || today.disabled) {
                setTimeout(() => finish(false), 900);
                return;
            }
            try {
                today.click();
            } catch (error) {
                console.warn("Rooster vernieuwen mislukt", error);
                finish(false);
            }
        }));
    });
}
