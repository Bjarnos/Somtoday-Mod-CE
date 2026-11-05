import { cn, id, n, tn } from "../../shorthand_functions";
import { toggleConfetti } from "./confetti";
import { newYearCountdown } from "./countdown";
import { closeModMessage, modMessage } from "./modMessage";

type TriggerCallback = () => void;
let onTriggerRecap: TriggerCallback | null = null;

export function registerRecapTrigger(callback: TriggerCallback): void {
    onTriggerRecap = callback;
}

export function easterEggs() {
    if (n(id("mod-easter-eggs"))) {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            `
        <style id="mod-easter-eggs">
            @media (max-width:767px) {
                #mod-logo-inserted,
                #mod-logo-hat {
                    display: none;
                }
            }
        </style>
        `,
        );
        let i = 0;
        let j = 0;
        let k = 0;
        let l = 0;
        let m = 0;
        let nKey = 0;
        let p = 0;
        document.addEventListener("keydown", (e) => {
            if (e == null || e.key == null) {
                return;
            }

            const konamikeys = [
                "arrowup",
                "arrowup",
                "arrowdown",
                "arrowdown",
                "arrowleft",
                "arrowright",
                "arrowleft",
                "arrowright",
                "b",
                "a",
            ];
            if (e.key.toLowerCase() == konamikeys[i]) {
                i++;
            } else {
                i = 0;
            }
            if (i == konamikeys.length) {
                tn("body", 0).classList.add("rainbow");
            }
            // Somtoday Mod
            const somtodaymodkeys = "somtoday mod shake";
            if (e.key.toLowerCase() == somtodaymodkeys.charAt(j)) {
                j++;
            } else {
                j = 0;
            }
            if (j == somtodaymodkeys.length) {
                tn("body", 0).classList.add("easter-egg-shaking");
                easterEggShake();
            }
            // Barrel roll
            const barrelrollkeys = "do a barrel roll";
            if (e.key.toLowerCase() == barrelrollkeys.charAt(k)) {
                k++;
            } else {
                k = 0;
            }
            if (k == barrelrollkeys.length) {
                tn("html", 0).classList.add("barrelroll");
                setTimeout(() => {
                    tn("html", 0).classList.remove("barrelroll");
                }, 2100);
            }
            // Barrel roll x times
            const barrelrollxkeys = "do a barrel roll x";
            if (e.key.toLowerCase() == barrelrollxkeys.charAt(l)) {
                l++;
            } else {
                l = 0;
            }
            if (l == barrelrollxkeys.length) {
                modMessage(
                    "BARREL ROLL",
                    'Hoeveel barrel rolls?<div class="br"></div><input id="mod-barrel-roll-amount" type="number" min="0" step="1" onkeyup="if (this.value != \'\') { this.value = Math.floor(this.value); } if (this.value < 1 && this.value != \'\') { this.value = 1; }"/>',
                    "Doorgaan",
                    "Annuleren",
                );
                id("mod-message-action1").addEventListener("click", () => {
                    closeModMessage();
                    tn("html", 0).classList.add("barrelroll");
                    setTimeout(
                        () => {
                            tn("html", 0).classList.remove("barrelroll");
                        },
                        ((id("mod-barrel-roll-amount") as HTMLInputElement)
                            .value as any) *
                            2000 +
                            100,
                    );
                });
                id("mod-message-action2").addEventListener(
                    "click",
                    closeModMessage,
                );
            }
            // Somtoday recap
            const recapkeys = "recap";
            if (e.key.toLowerCase() == recapkeys.charAt(m)) {
                m++;
            } else {
                m = 0;
            }
            if (m == recapkeys.length) {
                if (onTriggerRecap) {
                    onTriggerRecap();
                }
            }
            // New year countdown
            const countdownkeys = "countdown";
            if (e.key.toLowerCase() == countdownkeys.charAt(nKey)) {
                nKey++;
            } else {
                nKey = 0;
            }
            if (nKey == countdownkeys.length) {
                newYearCountdown(true);
            }
            // Party mode
            const partykeys = "party";
            if (e.key.toLowerCase() == partykeys.charAt(p)) {
                p++;
            } else {
                p = 0;
            }
            if (p == partykeys.length) {
                toggleConfetti();
                try {
                    const tada = new Audio(window.getAudioUrl("tada"));
                    tada.volume = 0.5;
                    tada.play();
                } catch (e) {
                    console.warn(e);
                }
                p = 0;
            }
        });
    }
    if (
        id("somtoday-mod-version-easter-egg") &&
        !id("somtoday-mod-version-easter-egg").classList.contains(
            "mod-easter-egg",
        )
    ) {
        id("somtoday-mod-version-easter-egg").addEventListener("click", () => {
            tn("body", 0).insertAdjacentHTML(
                "beforeend",
                window.logo(
                    null,
                    'mod-easter-egg-logo mod-add-eventlistener" data-add-event-listener="true',
                    "#0099ff",
                ),
            );
            for (const element of cn(
                "mod-easter-egg-logo mod-add-eventlistener",
            )) {
                element.classList.remove("mod-add-eventlistener");
                element.addEventListener("click", function (this: HTMLElement) {
                    this.remove();
                });
            }
        });
        id("somtoday-mod-version-easter-egg").classList.add("mod-easter-egg");
    }
    if (tn("body", 0).classList.contains("easter-egg-shaking")) {
        easterEggShake();
    }
}

function easterEggShake() {
    const shakingElements = [
        ...Array.from(cn("terug") as HTMLCollectionOf<Element>),
        ...Array.from(cn("sluiten") as HTMLCollectionOf<Element>),
        ...Array.from(tn("hmy-button") as HTMLCollectionOf<Element>),
        ...Array.from(tn("hmy-tab") as HTMLCollectionOf<Element>),
        ...Array.from(tn("hmy-switch") as HTMLCollectionOf<Element>),
    ];
    for (const element of shakingElements) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of cn("afspraak-header")) {
        element.children[element.children.length - 1].addEventListener(
            "mouseover",
            function (this: HTMLElement) {
                shakeOnHover(this, -30, 30, -30, 30);
            },
        );
    }
    if (tn("sl-bericht-acties", 0)) {
        for (const element of tn("sl-bericht-acties", 0).children) {
            element.addEventListener("mouseover", function (this: HTMLElement) {
                shakeOnHover(this, -30, 30, -30, 30);
            });
        }
    }
    for (const element of tn("sl-studiewijzer-item")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of tn("sl-studiewijzer-filter-button")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of tn("sl-rooster-item")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of tn("sl-rooster-huiswerk-stack")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of tn("sl-bericht-samenvatting")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of tn("hmy-geen-data")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of cn("button")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    for (const element of cn("nieuw-bericht")) {
        element.addEventListener("mouseover", function (this: HTMLElement) {
            shakeOnHover(this, -30, 30, -30, 30);
        });
    }
    tn("sl-header", 0).addEventListener(
        "mouseover",
        function (this: HTMLElement) {
            shakeOnHover(this, -20, 20, -20, 20);
        },
    );
}

function shakeOnHover(
    element: HTMLElement,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
) {
    element.style.transform =
        "translate(" +
        (Math.random() * (xMax - xMin) + xMin).toString() +
        "px, " +
        (Math.random() * (yMax - yMin) + yMin).toString() +
        "px)";
}
