import { get } from "../../save_version_management";

type SavedApp = {
    id: string;
    name: string;
    url: string;
    pinned: boolean;
};
const STORAGE_KEY = "somtoday-mod-simple-apps";
let appsPanelOpen = false;
let draggedId: string | null = null;

function readApps(): SavedApp[] {
    try {
        const data: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        if (!Array.isArray(data)) {
            return [];
        }
        return data.filter((app): app is SavedApp =>
            typeof app?.id === "string" &&
            typeof app?.name === "string" &&
            typeof app?.url === "string" &&
            typeof app?.pinned === "boolean"
        );
    } catch {
        return [];
    }
}
function saveApps(apps: SavedApp[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}
function createButton(label: string, title: string, action: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.addEventListener("click", action);
    return button;
}
function renderApps() {
    const panel = document.getElementById("mod-simple-apps-panel");
    if (!panel) {
        return;
    }
    panel.replaceChildren();
    const search = document.createElement("input");
    search.type = "search";
    search.placeholder = "Zoek apps op naam...";
    search.className = "mod-app-search";
    const header = document.createElement("header");
    const heading = document.createElement("h2");
    heading.textContent = "Apps";
    header.append(heading);
    panel.append(header);
    const subtitle = document.createElement("p");
    subtitle.textContent = "Voeg je eigen links toe.";
    panel.append(subtitle);
    if (!appsPanelOpen) {
        panel.hidden = true;
        return;
    }
    panel.hidden = false;
    const form = document.createElement("form");
    form.className = "mod-app-form";
    const name = document.createElement("input");
    name.placeholder = "Naam van de app";
    name.maxLength = 60;
    name.required = true;
    name.setAttribute("aria-label", "Appnaam");
    const url = document.createElement("input");
    url.placeholder = "https://voorbeeld.nl";
    url.type = "url";
    url.required = true;
    url.setAttribute("aria-label", "Websiteadres");
    const submit = document.createElement("button");
    submit.textContent = "＋ Ontdek apps";
    submit.type = "submit";
    form.append(name, url, submit);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        let parsed: URL;
        try {
            parsed = new URL(url.value.trim());
        } catch {
            url.setCustomValidity("Vul een geldig adres in.");
            url.reportValidity();
            return;
        }
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
            url.setCustomValidity("Alleen http- en https-websites zijn toegestaan.");
            url.reportValidity();
            return;
        }
        url.setCustomValidity("");
        const apps = readApps();
        apps.push({ id: crypto.randomUUID(), name: name.value.trim(), url: parsed.href, pinned: false });
        saveApps(apps);
        renderApps();
    });
    panel.append(search, form);
    const grid = document.createElement("div");
    grid.className = "mod-app-grid";
    const apps = readApps().sort((a, b) => Number(b.pinned) - Number(a.pinned));
    for (const app of apps) {
        const tile = document.createElement("div");
        tile.className = "mod-app-tile";
        tile.dataset.name = app.name.toLocaleLowerCase();
        tile.draggable = true;
        tile.addEventListener("dragstart", (event) => {
            draggedId = app.id;
            event.dataTransfer?.setData("text/plain", app.id);
        });
        tile.addEventListener("dragover", (event) => event.preventDefault());
        tile.addEventListener("drop", (event) => {
            event.preventDefault();
            const source = draggedId;
            draggedId = null;
            if (!source || source === app.id) {
                return;
            }
            const items = readApps();
            const from = items.findIndex((item) => item.id === source);
            const to = items.findIndex((item) => item.id === app.id);
            if (from < 0 || to < 0) {
                return;
            }
            const moved = items.splice(from, 1)[0];
            moved.pinned = app.pinned;
            items.splice(to, 0, moved);
            saveApps(items);
            renderApps();
        });
        const link = document.createElement("a");
        link.href = app.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const favicon = document.createElement("span");
        favicon.textContent = "🌐";
        favicon.className = "mod-app-icon";
        const text = document.createElement("span");
        text.textContent = app.name;
        link.append(favicon, text);
        const actions = document.createElement("div");
        actions.className = "mod-app-actions";
        actions.append(
            createButton(app.pinned ? "📌" : "📍", app.pinned ? "Losmaken" : "Vastzetten", () => {
                saveApps(readApps().map((item) => item.id === app.id ? { ...item, pinned: !item.pinned } : item));
                renderApps();
            }),
            createButton("✕", "Verwijderen", () => {
                saveApps(readApps().filter((item) => item.id !== app.id));
                renderApps();
            })
        );
        tile.append(link, actions);
        grid.append(tile);
    }
    if (!apps.length) {
        const empty = document.createElement("p");
        empty.textContent = "Nog geen apps. Voeg hierboven je eerste website toe.";
        grid.append(empty);
    }
    panel.append(grid);
    search.addEventListener("input", () => {
        const query = search.value.toLocaleLowerCase();
        for (const tile of grid.querySelectorAll<HTMLElement>(".mod-app-tile")) {
            tile.hidden = !tile.dataset.name?.includes(query);
        }
    });
}

export function simpleApps() {
    if (document.getElementById("mod-simple-apps-launcher")) {
        return;
    }
    if (get("appsEnabled") === false || get("appsEnabled") === "false") {
        document.getElementById("mod-simple-apps-launcher")?.remove();
        document.getElementById("mod-simple-apps-panel")?.remove();
        return;
    }
    const style = document.createElement("style");
    style.id = "mod-simple-apps-style";
    style.textContent = `
#mod-simple-apps-launcher {
    cursor: pointer;
}

#mod-simple-apps-panel {
    position:fixed;
    top:88px;
    left:0;
    right:0;
    bottom:0;
    width:100%;
    z-index: 20;
    overflow:auto;
    border-radius:0;
    padding: 40px max(24px, calc((100vw - 950px) / 2));
    background:var(--bg-default-normal,#fff);
    color:var(--fg-primary-normal,#222);
    box-shadow: none;
}

#mod-simple-apps-launcher .mod-apps-nav-icon {
    font-size: 20px;
    margin-right: 7px;
}

#mod-simple-apps-panel[hidden] {
    display:none
}

#mod-simple-apps-panel header {
    display:flex;
    align-items:center;
    justify-content:space-between;
    margin-bottom:20px
}

#mod-simple-apps-panel h2 {
    margin:0
}

#mod-simple-apps-panel button {
    cursor:pointer;
    border:0;
    border-radius:9px;
    padding:9px;
    background:var(--bg-secondary-normal,#e8edf3);
    color:inherit
}

#mod-simple-apps-panel .mod-app-form {
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    margin-bottom:24px
}

#mod-simple-apps-panel input {
    flex:1;
    min-width:170px;
    padding:10px;
    border:1px solid #9996;
    border-radius:9px;
    background:transparent;
    color:inherit;
    font:inherit
}

#mod-simple-apps-panel .mod-app-grid {
    display:grid;
    grid-template-columns:repeat(auto-fill,minmax(145px,1fr));
    gap:14px
}

#mod-simple-apps-panel .mod-app-tile {
    border:1px solid #9995;
    border-radius:14px;
    padding:12px;
    background:var(--bg-secondary-normal,#f5f7fa);
    cursor:grab
}

#mod-simple-apps-panel .mod-app-tile a {
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:12px;
    min-height:90px;
    text-align:center;
    text-decoration:none;
    color:inherit;
    overflow-wrap:anywhere
}

#mod-simple-apps-panel .mod-app-icon {
    font-size:32px
}

#mod-simple-apps-panel .mod-app-actions {
    display:flex;
    justify-content:space-between;
    margin-top:10px
}

@media(max-width:600px) {
    #mod-simple-apps-panel {
    inset:88px 0 0;
    padding:16px;
    padding:16px
}
#mod-simple-apps-launcher {
    bottom:12px;
    right:12px
}

}

`;
    document.head.append(style);
    const openApps = () => {
        appsPanelOpen = true;
        document.querySelectorAll("sl-tab-item.active").forEach((tab) => {
            tab.classList.remove("active");
        });
        document.getElementById("mod-simple-apps-launcher")?.classList.add("active");
        renderApps();
    };
    const panel = document.createElement("section");
    panel.id = "mod-simple-apps-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Apps");
    const tabs = document.querySelector("sl-tab-item");
    const tabContainer = tabs?.parentElement;
    if (!tabs || !tabContainer) {
        panel.remove();
        style.remove();
        return;
    }

    const launcher = tabs.cloneNode(true) as HTMLElement;
    launcher.id = "mod-simple-apps-launcher";
    launcher.classList.remove("active");
    launcher.removeAttribute("aria-selected");

    const label = launcher.querySelector("span");
    if (label) {
        label.textContent = "Apps";
    } else {
        launcher.textContent = "Apps";
    }

    const icon = launcher.querySelector("svg, i");
    if (icon) {
        icon.remove();
    }

    launcher.insertAdjacentHTML(
        "afterbegin",
        '<span class="mod-apps-nav-icon" aria-hidden="true">▦</span>',
    );
    launcher.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openApps();
    });

    tabContainer.append(launcher);
    document.body.append(panel);

    document.addEventListener("click", (event) => {
        const target = event.target as HTMLElement;
        if (target.closest("sl-tab-item:not(#mod-simple-apps-launcher)")) {
            appsPanelOpen = false;
            launcher.classList.remove("active");
            renderApps();
        }
    });
}
