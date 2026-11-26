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
            #mod-ragmannetje {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                display: grid;
                place-items: center;
                padding: 24px;
                pointer-events: none;
                font-family: inherit;
                user-select: none;
            }
            #mod-ragmannetje > span {
                max-width: min(100%, 1000px);
                font: inherit;
                font-size: clamp(24px, 4.5vw, 60px);
                font-weight: 800;
                line-height: 1.35;
                text-align: center;
                text-wrap: balance;
                position: relative;
                isolation: isolate;
                overflow: hidden;
                box-sizing: border-box;
                padding: clamp(20px, 4vw, 48px);
                border: 1px solid #8edaff88;
                border-radius: 24px;
                background: linear-gradient(125deg, #10243b, #174b72, #174e54, #10243b);
                background-size: 300% 300%;
                box-shadow: 0 18px 60px #10243b55;
                animation: mod-ragmannetje-show 5s both,
                    mod-rag-background 5s ease-in-out infinite;
            }
            #mod-ragmannetje > span::before {
                content: "";
                position: absolute;
                inset: -50%;
                z-index: -1;
                background: radial-gradient(ellipse at 30% 40%, #54c9ff44, transparent 40%),
                    radial-gradient(ellipse at 70% 65%, #73ffd233, transparent 35%);
                animation: mod-rag-aurora 5s ease-in-out infinite alternate;
            }
            @keyframes mod-rag-background {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            @keyframes mod-rag-aurora {
                from { transform: translate(-12%, -8%) rotate(-12deg); }
                to { transform: translate(12%, 8%) rotate(12deg); }
            }
            #mod-ragmannetje .rag-word {
                display: inline-block;
                white-space: nowrap;
            }
            #mod-ragmannetje .rag-letter {
                display: inline-block;
                color: #f8fcff;
                -webkit-text-stroke: 2px #10243b;
                paint-order: stroke fill;
                text-shadow: 0 2px 2px #10243b, 0 0 12px #10243b66;
                animation: mod-rag-letter 5s cubic-bezier(.22, 1, .36, 1) both;
                animation-delay: calc(var(--letter-index) * 18ms);
            }
            #mod-ragmannetje .rag-word:nth-child(2) .rag-letter {
                color: #7edbff;
            }
            #mod-ragmannetje .rag-word:nth-child(n+6) .rag-letter {
                color: #b8f5d5;
            }
            @keyframes mod-rag-letter {
                0% { opacity: 0; transform: translateY(30px) rotate(-8deg) scale(.75); }
                14% { opacity: 1; transform: translateY(-5px) scale(1.06); }
                22%, 42%, 66%, 100% { opacity: 1; transform: translateY(0) scale(1); }
                32%, 56% { opacity: 1; transform: translateY(-7px) scale(1.035); }
            }
            @keyframes mod-ragmannetje-show {
                0% { opacity: 0; transform: scale(.96); }
                9%, 80% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: translateY(-18px) scale(.98); }
            }
            @media (prefers-reduced-motion: reduce) {
                #mod-ragmannetje > span, #mod-ragmannetje > span::before,
                #mod-ragmannetje .rag-letter { animation: none; }
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
        let ragmannetjeIndex = 0;
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
            const ragmannetjeKeys = "ragmannetje123";
            if (
                e.key.toLowerCase() === ragmannetjeKeys.charAt(ragmannetjeIndex)
            ) {
                ragmannetjeIndex++;
            } else {
                ragmannetjeIndex = e.key.toLowerCase() === "r" ? 1 : 0;
            }
            if (ragmannetjeIndex === ragmannetjeKeys.length) {
                ragmannetjeIndex = 0;
                showRagmannetje();
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

function showRagmannetje() {
    document.getElementById("mod-ragmannetje")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "mod-ragmannetje";
    overlay.setAttribute("role", "status");
    const message = document.createElement("span");
    const greeting = "Het ragmannetje wenst je een fijne dag";
    message.setAttribute("aria-label", greeting);
    let index = 0;
    for (const word of greeting.split(" ")) {
        if (index > 0) message.appendChild(document.createTextNode(" "));
        const wordElement = document.createElement("span");
        wordElement.className = "rag-word";
        wordElement.setAttribute("aria-hidden", "true");
        for (const character of word) {
            const letter = document.createElement("span");
            letter.className = "rag-letter";
            letter.style.setProperty("--letter-index", String(index++));
            letter.textContent = character;
            wordElement.appendChild(letter);
        }
        message.appendChild(wordElement);
    }
    overlay.appendChild(message);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 5000);
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
