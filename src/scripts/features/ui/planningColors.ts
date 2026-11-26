const palette = [
    ["Rood", "#df6262"],
    ["Oranje", "#e99845"],
    ["Geel", "#d9bd45"],
    ["Groen", "#49a873"],
    ["Turquoise", "#39aaa9"],
    ["Blauw", "#528de0"],
    ["Paars", "#986bd7"],
    ["Roze", "#d779ad"],
];

const storageKey = "somtoday-mod-planning-colors";
const itemSelector = "sl-rooster-item";
let lastItem: HTMLElement | null = null;
let pending: {
    title: string;
    start: string;
    end: string;
    location: string;
    color: string;
    before: Set<string>;
    expires: number;
} | null = null;
let initialized = false;

function readColors(): Record<string, string> {
    try {
        return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
        return {};
    }
}

function itemKey(item: HTMLElement): string {
    const day = item.closest("[data-date], [data-datum], [datetime]");
    const date =
        day?.getAttribute("data-date") ||
        day?.getAttribute("data-datum") ||
        day?.getAttribute("datetime");
    return date
        ? JSON.stringify([date, item.getAttribute("aria-label")])
        : fallbackKey(item);
}

function fallbackKey(item: HTMLElement): string {
    const label = item.getAttribute("aria-label");
    return label ? JSON.stringify(["appointment", label]) : "";
}

function ownItem(item: HTMLElement): boolean {
    return (
        !!item.querySelector(".bovenregel hmy-pill[color='positive']") &&
        !item.querySelector(".opacity-80")
    );
}

function paint(item: HTMLElement, color: string) {
    if (/^#[0-9a-f]{6}$/i.test(color)) {
        item.style.setProperty("--mod-planning-color", color);
        item.classList.add("mod-planning-colored");
    } else {
        item.style.removeProperty("--mod-planning-color");
        item.classList.remove("mod-planning-colored");
    }
}

function saveColor(item: HTMLElement, color: string) {
    const key = itemKey(item);
    if (key) {
        const colors = readColors();
        const fallback = fallbackKey(item);
        if (color) {
            colors[key] = color;
            if (fallback && fallback !== key) delete colors[fallback];
        } else {
            delete colors[key];
            if (fallback) delete colors[fallback];
        }
        localStorage.setItem(storageKey, JSON.stringify(colors));
    }
    paint(item, color);
}

function addPicker(form: HTMLElement) {
    if (form.querySelector(".mod-planning-picker")) return;
    const location = form.querySelector("#zp-locatie")?.closest(".form-row");
    if (!location) return;
    const row = document.createElement("div");
    row.className = "form-row mod-planning-picker";
    const scope = location
        .getAttributeNames()
        .find((name) => name.startsWith("_ngcontent-"));
    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = "Kleur";
    if (scope) {
        row.setAttribute(scope, "");
        label.setAttribute(scope, "");
    }
    row.append(label);
    const choices = document.createElement("div");
    choices.className = "mod-planning-choices";
    row.append(choices);
    let selected =
        lastItem?.style.getPropertyValue("--mod-planning-color") || "";
    const buttons: HTMLButtonElement[] = [];
    const custom = document.createElement("input");
    custom.type = "color";
    custom.value = selected || "#528de0";
    custom.setAttribute("aria-label", "Eigen kleur kiezen");
    custom.title = "Eigen kleur kiezen";
    function select(color: string) {
        selected = color;
        if (color) custom.value = color;
        for (const button of buttons) {
            button.setAttribute(
                "aria-pressed",
                String(button.dataset.color === color),
            );
        }
    }
    for (const [name, color] of [["Standaardkleur", ""], ...palette]) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mod-planning-swatch";
        button.dataset.color = color;
        button.title = name;
        button.setAttribute("aria-label", name);
        if (color) button.style.backgroundColor = color;
        else button.textContent = "↺";
        button.addEventListener("click", () => select(color));
        buttons.push(button);
        choices.append(button);
    }
    custom.addEventListener("input", () => select(custom.value));
    const customLabel = document.createElement("label");
    customLabel.className = "mod-planning-custom";
    customLabel.title = "Eigen kleur kiezen";
    const customText = document.createElement("span");
    customText.textContent = "+ Eigen kleur";
    customLabel.append(custom, customText);
    choices.append(customLabel);
    select(selected);
    location.insertAdjacentElement("afterend", row);
    const original = lastItem;
    const save = form.querySelector("hmy-button[label='Opslaan'] button");
    save?.addEventListener(
        "click",
        () => {
            const title = form
                .querySelector<HTMLInputElement>("#zp-titel")
                ?.value.trim();
            const place =
                form
                    .querySelector<HTMLInputElement>("#zp-locatie")
                    ?.value.trim() || "";
            const times = Array.from(
                form.querySelectorAll(".tijd-row .dropdown-value"),
            ).map((el) => el.textContent?.trim() || "");
            if (!title || times.length !== 4) return;
            if (original && ownItem(original)) saveColor(original, selected);
            pending = {
                title,
                location: place,
                start: times.slice(0, 2).join(":"),
                end: times.slice(2).join(":"),
                color: selected,
                before: new Set(
                    Array.from(
                        document.querySelectorAll<HTMLElement>(itemSelector),
                    ).map((item) => item.getAttribute("aria-label") || ""),
                ),
                expires: Date.now() + 15000,
            };
        },
        true,
    );
    lastItem = null;
}

export function planningColors() {
    if (!initialized) {
        initialized = true;
        const style = document.createElement("style");
        style.textContent = `
            .mod-planning-choices { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
            .mod-planning-swatch, .mod-planning-choices input[type=color] {
                box-sizing: border-box; width: 32px; height: 32px; border-radius: 6px;
                border: 1px solid var(--border-neutral-weak, currentColor);
                cursor: pointer; color: inherit; background: var(--bg-neutral-none);
            }
            .mod-planning-swatch, .mod-planning-custom, .mod-planning-custom input[type=color] {
                transition: transform 150ms ease, box-shadow 150ms ease, outline-offset 150ms ease, border-color 150ms ease;
            }
            @media (hover: hover) {
                .mod-planning-swatch:hover, .mod-planning-custom input[type=color]:hover {
                    transform: translateY(-2px) scale(1.06);
                    box-shadow: 0 3px 8px #0002;
                }
                .mod-planning-custom:hover {
                    border-color: var(--action-primary-normal);
                    transform: translateY(-1px);
                }
            }
            .mod-planning-swatch:active, .mod-planning-custom:active {
                transform: scale(0.94);
            }
            @media (prefers-reduced-motion: reduce) {
                .mod-planning-swatch, .mod-planning-custom, .mod-planning-custom input[type=color] {
                    transition: none;
                    transform: none !important;
                }
            }
            .mod-planning-swatch[aria-pressed=true] {
                outline: 2px solid var(--action-primary-normal); outline-offset: 2px;
            }
            .mod-planning-swatch:focus-visible, .mod-planning-choices input:focus-visible {
                outline: 2px solid var(--action-primary-normal); outline-offset: 2px;
            }
            .mod-planning-custom {
                display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px;
                border: 1px solid var(--border-neutral-weak, currentColor);
                border-radius: 6px; cursor: pointer; color: inherit;
            }
            .mod-planning-custom input[type=color] {
                display: block !important; visibility: visible !important; opacity: 1 !important;
                appearance: auto !important; position: static !important;
                width: 24px !important; height: 24px !important; padding: 2px !important;
                margin: 0 !important; clip-path: none !important;
            }
            .mod-planning-colored {
                border-color: var(--mod-planning-color) !important;
                outline-color: var(--mod-planning-color) !important;
                border-left-color: var(--mod-planning-color) !important;
                background-color: color-mix(in srgb, var(--mod-planning-color) 18%, var(--bg-neutral-none)) !important;
            }
            .mod-planning-colored::before, .mod-planning-colored::after {
                border-color: var(--mod-planning-color) !important;
                background-color: var(--mod-planning-color) !important;
            }
            .mod-planning-colored hmy-pill[color="positive"] {
                background: var(--mod-planning-color) !important;
                color: #111 !important;
                border-color: var(--mod-planning-color) !important;
            }
            .mod-planning-colored hmy-pill[color="positive"] span {
                color: #111 !important;
                background: transparent !important;
            }
        `;
        document.head.append(style);
        document.addEventListener(
            "click",
            (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                const item = target.closest<HTMLElement>(itemSelector);
                if (item) lastItem = ownItem(item) ? item : null;
                else if (
                    !target.closest("sl-zelfplannen-afspraak-formulier") &&
                    target.closest("button")?.textContent?.trim() ===
                        "Zelf plannen"
                )
                    lastItem = null;
            },
            true,
        );
    }
    const colors = readColors();
    const items = Array.from(
        document.querySelectorAll<HTMLElement>(itemSelector),
    );
    for (const item of items) {
        const key = itemKey(item);
        if (!key || !ownItem(item)) continue;
        const color = colors[key] || colors[fallbackKey(item)];
        if (color) paint(item, color);
        else if (item.classList.contains("mod-planning-colored"))
            paint(item, "");
    }
    if (pending && Date.now() > pending.expires) pending = null;
    if (pending) {
        const current = pending;
        const expected =
            current.title +
            ", " +
            current.start +
            " tot " +
            current.end +
            (current.location ? ", Locatie: " + current.location : "");
        const matches = items.filter(
            (item) =>
                ownItem(item) &&
                item.getAttribute("aria-label") === expected &&
                !current.before.has(expected),
        );
        if (matches.length === 1) {
            saveColor(matches[0], current.color);
            pending = null;
        }
    }
    document
        .querySelectorAll<HTMLElement>("sl-zelfplannen-afspraak-formulier")
        .forEach(addPicker);
}
