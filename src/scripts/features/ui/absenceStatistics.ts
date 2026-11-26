import { get } from "../../save_version_management";

const categories = [
    { name: "Afwezig ongeoorloofd", short: "Ongeoorloofd", color: "#68aff4" },
    { name: "Afwezig geoorloofd", short: "Geoorloofd", color: "#75ce79" },
    { name: "Huiswerk niet in orde", short: "Huiswerk", color: "#9baab7" },
    { name: "Materiaal niet in orde", short: "Materiaal", color: "#b69ad9" },
    { name: "Te laat", short: "Te laat", color: "#e9b35c" },
    { name: "Verwijderd", short: "Verwijderd", color: "#e87575" },
];

const svgNS = "http://www.w3.org/2000/svg";
let previousSignature = "";

function installStyles() {
    if (document.getElementById("mod-absence-style")) return;
    const style = document.createElement("style");
    style.id = "mod-absence-style";
    style.textContent = `
        .mod-absence-statistics { margin: 28px 0 40px; color: inherit; }
        .mod-absence-statistics h2 { font-size: 1.3em; font-weight: 700; margin: 0 0 18px; }
        .mod-absence-body { display: flex; align-items: center; gap: 28px; }
        .mod-absence-chart { width: 160px; max-width: 38%; height: auto; overflow: visible; flex-shrink: 0; }
        .mod-absence-legend { flex: 1; display: grid; gap: 4px; min-width: 0; }
        .mod-absence-legend-row { display: flex; align-items: center; gap: 10px; padding: 5px 8px; border-radius: 6px; transition: background 180ms ease, transform 180ms ease; }
        .mod-absence-legend-row:hover,.mod-absence-legend-row:focus-visible,.mod-absence-legend-row.is-active { background: color-mix(in srgb,currentColor 8%,transparent); }
        .mod-absence-legend-row.is-active { transform: translateX(4px); }
        .mod-absence-legend-row strong { margin-left: auto; }
        .mod-absence-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .mod-absence-segment { transition: stroke-width 150ms ease, opacity 150ms ease; }
        .mod-absence-segment.is-active { stroke-width: 21; }
        .mod-absence-statistics { animation: mod-absence-enter 260ms ease both; }
        .mod-absence-segment { animation: mod-absence-segment-enter 450ms ease; }
        .mod-absence-chart:has(.mod-absence-segment.is-active) .mod-absence-segment:not(.is-active) { opacity: .45; }
        .mod-absence-dot { transition: transform 180ms ease; }
        .mod-absence-legend-row.is-active .mod-absence-dot { transform: scale(1.3); }
        @keyframes mod-absence-enter { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mod-absence-segment-enter { from { opacity: 0; stroke-width: 4; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
            .mod-absence-statistics,.mod-absence-segment,.mod-absence-legend-row,.mod-absence-dot { animation: none; transition: none; transform: none; }
            .mod-absence-segment { transform: rotate(-90deg); transform-origin: 80px 80px; }
        }
    `;
    document.head.append(style);
}

function findCard(name: string, grid: HTMLElement) {
    const card = Array.from(
        grid.querySelectorAll<HTMLElement>("hmy-registratie-categorie"),
    ).find(
        (element) =>
            element.querySelector(".categorie-naam")?.textContent?.trim() ===
            name,
    );
    if (!card) return null;
    const count = parseInt(
        card.querySelector(".aantal")?.textContent || "",
        10,
    );
    return Number.isFinite(count) ? { card, count } : null;
}

function svgElement(name: string, attributes: Record<string, string>) {
    const element = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes))
        element.setAttribute(key, value);
    return element;
}

export function absenceStatistics() {
    const enabled = get("absenceStatisticsEnabled");
    if (enabled === false || enabled === "false") {
        document
            .querySelectorAll(".mod-absence-zero,.mod-absence-statistics")
            .forEach((element) => {
                element.remove();
            });
        previousSignature = "";
        return;
    }
    const boundary = document.querySelector<HTMLElement>(
        "sl-registratie-overzicht",
    );
    const grid = boundary?.querySelector<HTMLElement>(
        "sl-registraties .registratie-categorieen",
    );
    const measures = boundary?.querySelector<HTMLElement>("sl-maatregelen");
    if (!boundary || !grid || !measures) {
        document
            .querySelectorAll(".mod-absence-zero,.mod-absence-statistics")
            .forEach((element) => {
                element.remove();
            });
        previousSignature = "";
        return;
    }
    const found = categories.map((category) => findCard(category.name, grid));
    const counts = found.map((entry) => entry?.count || 0);
    const signature = JSON.stringify([
        counts,
        boundary.querySelector(".tijdspan-selectie .dropdown-value")
            ?.textContent,
    ]);
    const existing = boundary.querySelector(".mod-absence-statistics");
    if (
        existing &&
        previousSignature === signature &&
        !grid.querySelector(".mod-absence-zero")
    )
        return;
    installStyles();
    boundary
        .querySelectorAll(".mod-absence-zero,.mod-absence-statistics")
        .forEach((element) => {
            element.remove();
        });
    previousSignature = signature;
    const section = document.createElement("section");
    section.className = "mod-absence-statistics";
    const header = document.createElement("h2");
    header.textContent = "Statistieken";
    const body = document.createElement("div");
    body.className = "mod-absence-body";
    const chart = svgElement("svg", {
        viewBox: "0 0 160 160",
        class: "mod-absence-chart",
        role: "img",
        "aria-label": "Verdeling van registraties",
    });
    const total = counts.reduce((sum, count) => sum + count, 0);
    const circumference = 2 * Math.PI * 62;
    chart.append(
        svgElement("circle", {
            cx: "80",
            cy: "80",
            r: "62",
            fill: "none",
            stroke: "currentColor",
            opacity: ".08",
            "stroke-width": "17",
        }),
    );
    const legend = document.createElement("div");
    legend.className = "mod-absence-legend";
    let offset = 0;
    const number = svgElement("text", {
        x: "80",
        y: "79",
        "text-anchor": "middle",
        "font-size": "29",
        "font-weight": "700",
        fill: "currentColor",
    });
    number.textContent = String(total);
    const caption = svgElement("text", {
        x: "80",
        y: "98",
        "text-anchor": "middle",
        "font-size": "11",
        fill: "currentColor",
    });
    caption.textContent = "Registraties";
    categories.forEach((category, index) => {
        const count = counts[index];
        const length = total ? (count / total) * circumference : 0;
        const segment = svgElement("circle", {
            cx: "80",
            cy: "80",
            r: "62",
            fill: "none",
            stroke: category.color,
            "stroke-width": "17",
            "stroke-dasharray":
                Math.max(
                    0,
                    length - (count === total ? 0 : Math.min(4, length / 3)),
                ) +
                " " +
                circumference,
            "stroke-dashoffset": String(-offset),
            transform: "rotate(-90 80 80)",
            class: "mod-absence-segment",
        });
        offset += length;
        if (count) chart.append(segment);
        const row = document.createElement("div");
        row.className = "mod-absence-legend-row";
        row.tabIndex = 0;
        const dot = document.createElement("span");
        dot.className = "mod-absence-dot";
        dot.style.backgroundColor = category.color;
        const label = document.createElement("span");
        label.textContent = category.short;
        const value = document.createElement("strong");
        value.textContent = count + "x";
        row.append(dot, label, value);
        legend.append(row);
        function highlight(active: boolean) {
            row.classList.toggle("is-active", active);
            segment.classList.toggle("is-active", active);
            number.textContent = String(active ? count : total);
            caption.textContent = active ? category.short : "Registraties";
        }
        for (const element of [row, segment]) {
            element.addEventListener("mouseenter", () => highlight(true));
            element.addEventListener("mouseleave", () => highlight(false));
        }
        row.addEventListener("focus", () => highlight(true));
        row.addEventListener("blur", () => highlight(false));
    });
    chart.append(number, caption);
    body.append(chart, legend);
    section.append(header, body);
    measures.insertAdjacentElement("beforebegin", section);
}

window.addEventListener(
    "somtoday-mod-absence-setting-changed",
    absenceStatistics,
);
