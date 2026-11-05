import { Fireworks } from "fireworks-js";
import { get } from "../../save_version_management";
import { BOOL_INDEX, id } from "../../shorthand_functions";
import { startConfetti } from "./confetti";

// Add new year countdown
let newYearCountdownClosed = false;

export function newYearCountdown(ignoreCountdownConditions = false) {
    const now = new Date();
    const newYear = new Date(now.getFullYear() + 1, 0, 1);
    const diff = newYear.getTime() - now.getTime();
    if (
        (ignoreCountdownConditions ||
            (get("bools").charAt(BOOL_INDEX.EVENTS) == "1" &&
                Math.floor(diff / (1000 * 60 * 60 * 24)) <= 7)) &&
        !newYearCountdownClosed &&
        !id("mod-new-year")
    ) {
        const rosterContainer = document.querySelector("sl-rooster-weken");
        if (rosterContainer) {
            const parent = document.createElement("div");
            parent.id = "mod-new-year";
            const div = document.createElement("div");
            div.id = "mod-new-year-fireworks";
            parent.appendChild(div);
            const button = document.createElement("button");
            button.innerHTML = "&times;";
            button.addEventListener(
                "click",
                function (this: HTMLButtonElement) {
                    newYearCountdownClosed = true;
                    if (this.parentElement) {
                        this.parentElement.style.height = "0px";
                        this.parentElement.style.padding = "0px";
                    }
                    setTimeout(() => {
                        if (this && this.parentElement) {
                            this.parentElement.remove();
                        }
                    }, 500);
                },
            );
            parent.appendChild(button);
            const h3 = document.createElement("h3");
            h3.innerText = "Aftellen tot het nieuwe jaar!";

            const yearDuration = 1000 * 60 * 60 * 24 * 365.25;
            const texts = [
                "Wat is jouw goede voornemen?",
                "Ga jij volgend jaar voor de 10'en?",
                "Al bijna nieuwjaar!",
                "KERSTVAKANTIE!!! (en bijna nieuwjaar dus)",
                "Al zin in volgend jaar?",
                "Wat ga je doen in de vakantie?",
                "Neem tijd voor zelfreflectie en ga gamen ofzo",
                "Alvast een fijne kerst en gelukkig nieuwjaar!",
                "Ga naar buiten en gooi een sneeuwbal (of aardebal als er geen sneeuw ligt)",
                "OLIEBOLLEN ZIJN LEKKER!!!",
                "Op {percentage}% van dit jaar",
                "Als je je huiswerk verbrandt, is het dan vuurwerk?",
                "Vanaf 1 januari is het {next_year}",
                "Volgend jaar wordt minstens 10x beter",
                "Nog ongeveer {seconds_to_next_year} seconden",
                "Over ≈{seconds_to_next_year} seconden is {year} voorbij",
                "Nog maar even...",
            ];
            let current: any;

            setInterval(() => {
                const now = new Date();
                const diff = newYear.getTime() - now.getTime();
                if (diff <= 0) {
                    return;
                }
                let random = Math.floor(Math.random() * texts.length);
                while (current == random) {
                    random = Math.floor(Math.random() * texts.length);
                }
                current = random;
                h3.innerText = texts[current]
                    .replace(
                        "{percentage}",
                        (((yearDuration - diff) / yearDuration) * 100)
                            .toFixed(3)
                            .replace(".", ","),
                    )
                    .replace(
                        "{seconds_to_next_year}",
                        Math.round(diff / 1000).toString(),
                    )
                    .replace("{next_year}", (now.getFullYear() + 1).toString())
                    .replace("{year}", now.getFullYear().toString());
                h3.classList.add("mod-letter-slide");
                setTimeout(() => {
                    h3.classList.remove("mod-letter-slide");
                }, 500);
            }, 10000);

            parent.appendChild(h3);
            const countdownElement = document.createElement("div");
            for (let i = 0; i < 4; i++) {
                const div = document.createElement("div");
                const p = document.createElement("p");
                div.appendChild(p);
                const span = document.createElement("span");
                div.appendChild(span);
                countdownElement.appendChild(div);
            }
            parent.appendChild(countdownElement);
            rosterContainer.parentElement?.insertAdjacentElement(
                "beforebegin",
                parent,
            );
            const fireworks = new Fireworks(id("mod-new-year-fireworks"), {
                intensity: 12,
                traceSpeed: 7,
            });
            fireworks.start();
            window.addEventListener("visibilitychange", () => {
                if (document.visibilityState === "hidden") {
                    fireworks.stop();
                } else {
                    fireworks.start();
                }
            });

            const p1 =
                countdownElement.children[0].getElementsByTagName("p")[0];
            const p2 =
                countdownElement.children[1].getElementsByTagName("p")[0];
            const p3 =
                countdownElement.children[2].getElementsByTagName("p")[0];
            const p4 =
                countdownElement.children[3].getElementsByTagName("p")[0];
            function updateCountdown() {
                const now = new Date();
                const diff = newYear.getTime() - now.getTime();

                const days = Math.max(
                    Math.floor(diff / (1000 * 60 * 60 * 24)),
                    0,
                );
                const hours = Math.max(
                    Math.floor(
                        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
                    ),
                    0,
                );
                const minutes = Math.max(
                    Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                    0,
                );
                const seconds = Math.max(
                    Math.floor((diff % (1000 * 60)) / 1000),
                    0,
                );

                if (p1.innerText !== days.toString()) {
                    p1.classList.add("mod-letter-slide");
                    p1.innerText = days.toString();
                    countdownElement.children[0].getElementsByTagName(
                        "span",
                    )[0].innerText = days == 1 ? "dag" : "dagen";
                    setTimeout(() => {
                        p1.classList.remove("mod-letter-slide");
                    }, 500);
                }
                if (p2.innerText !== hours.toString()) {
                    p2.classList.add("mod-letter-slide");
                    p2.innerText = hours.toString();
                    countdownElement.children[1].getElementsByTagName(
                        "span",
                    )[0].innerText = hours == 1 ? "uur" : "uren";
                    setTimeout(() => {
                        p2.classList.remove("mod-letter-slide");
                    }, 500);
                }
                if (p3.innerText !== minutes.toString()) {
                    p3.classList.add("mod-letter-slide");
                    p3.innerText = minutes.toString();
                    countdownElement.children[2].getElementsByTagName(
                        "span",
                    )[0].innerText = minutes == 1 ? "minuut" : "minuten";
                    setTimeout(() => {
                        p3.classList.remove("mod-letter-slide");
                    }, 500);
                }
                if (p4.innerText !== seconds.toString()) {
                    p4.classList.add("mod-letter-slide");
                    p4.innerText = seconds.toString();
                    countdownElement.children[3].getElementsByTagName(
                        "span",
                    )[0].innerText = seconds == 1 ? "seconde" : "seconden";
                    setTimeout(() => {
                        p4.classList.remove("mod-letter-slide");
                    }, 500);
                }

                // Check for new year
                if (
                    days == 0 &&
                    hours == 0 &&
                    minutes == 0 &&
                    seconds == 0 &&
                    !id("mod-fireworks")
                ) {
                    h3.innerText = "GELUKKIG NIEUWJAAR!";
                    const fireworkElement = document.createElement("div");
                    fireworkElement.id = "mod-fireworks";
                    rosterContainer?.insertAdjacentElement(
                        "beforebegin",
                        fireworkElement,
                    );
                    const fireworks = new Fireworks(fireworkElement);
                    fireworks.start();
                    startConfetti();
                    window.addEventListener("visibilitychange", () => {
                        if (document.visibilityState === "hidden") {
                            fireworks.stop();
                        } else {
                            fireworks.start();
                        }
                    });
                }
            }

            setInterval(updateCountdown, 1000);
            updateCountdown();
        }
    }
}
