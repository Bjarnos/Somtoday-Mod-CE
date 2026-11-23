import { get, set } from "../../save_version_management";

type App = {
    id: string;
    name: string;
    url: string;
    icon: string;
    pinned: boolean;
};

const appsKey = "simpleApps";
let currentApps: App[] = [];
let active = false;
let searchText = "";
let dragging: string | null = null;

function loadApps(): App[] {
    const stored = get(appsKey);
    try {
        const items = typeof stored === "string" ? JSON.parse(stored || "[]") : stored;
        if (!Array.isArray(items)) {
            return [];
        }
        return items.filter((item) =>
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.url === "string"
        ).map((item) => ({
            id: item.id,
            name: item.name,
            url: item.url,
            icon: typeof item.icon === "string" ? item.icon : "",
            pinned: Boolean(item.pinned),
        }));
    } catch {
        return [];
    }
}

function saveApps() {
    set(appsKey, JSON.stringify(currentApps));
}

function element<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className = "",
    text = "",
): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
}

function button(text: string, className: string, callback: () => void) {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", callback);
    return node;
}

function validUrl(input: string): string | null {
    try {
        const url = new URL(input.trim());
        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }
    } catch {
        return null;
    }
    return null;
}

function appIcon(app: App) {
    const icon = element("div", "mod-app-icon", app.name.charAt(0).toUpperCase());
    const source = validUrl(app.icon);
    if (source) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.onerror = () => image.remove();
        icon.replaceChildren(image);
    }
    return icon;
}

function openEditor(existing?: App) {
    document.getElementById("mod-app-editor")?.remove();
    const backdrop = element("div", "mod-app-backdrop");
    backdrop.id = "mod-app-editor";
    const modal = element("div", "mod-app-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", existing ? "App bewerken" : "App toevoegen");

    const header = element("div", "mod-app-modal-header");
    header.append(
        element("h2", "", existing ? "App bewerken" : "App toevoegen"),
        button("×", "mod-app-close", () => backdrop.remove()),
    );
    const form = element("form", "mod-app-editor-form");
    const nameLabel = element("label", "", "Naam");
    const name = element("input");
    name.required = true;
    name.maxLength = 60;
    name.placeholder = "Bijvoorbeeld: Wikipedia";
    name.value = existing?.name ?? "";
    nameLabel.append(name);

    const urlLabel = element("label", "", "Website");
    const url = element("input");
    url.required = true;
    url.type = "url";
    url.placeholder = "https://voorbeeld.nl";
    url.value = existing?.url ?? "";
    urlLabel.append(url);

    const iconLabel = element("label", "", "Afbeelding (optioneel)");
    const icon = element("input");
    icon.type = "url";
    icon.placeholder = "https://voorbeeld.nl/logo.png";
    icon.value = existing?.icon ?? "";
    iconLabel.append(icon);

    const pinnedLabel = element("label", "mod-app-pin-label", "Vastzetten");
    const pinned = element("input");
    pinned.type = "checkbox";
    pinned.checked = existing?.pinned ?? false;
    pinnedLabel.prepend(pinned);

    const error = element("p", "mod-app-error");
    const actions = element("div", "mod-app-modal-actions");
    actions.append(
        button("Annuleren", "mod-app-secondary", () => backdrop.remove()),
    );
    const save = element("button", "mod-app-primary", "Opslaan");
    save.type = "submit";
    actions.append(save);
    form.append(nameLabel, urlLabel, iconLabel, pinnedLabel, error, actions);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const address = validUrl(url.value);
        const image = icon.value.trim() ? validUrl(icon.value) : "";
        if (!address || image === null) {
            error.textContent = "Controleer de website en de afbeelding-URL.";
            return;
        }
        if (existing) {
            currentApps = currentApps.map((app) => app.id === existing.id
                ? { ...app, name: name.value.trim(), url: address, icon: image, pinned: pinned.checked }
                : app
            );
        } else {
            currentApps.push({
                id: crypto.randomUUID(),
                name: name.value.trim(),
                url: address,
                icon: image,
                pinned: pinned.checked,
            });
        }
        saveApps();
        backdrop.remove();
        renderApps();
    });
    modal.append(header, form);
    backdrop.append(modal);
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) {
            backdrop.remove();
        }
    });
    document.body.append(backdrop);
    name.focus();
}

function renderApps() {
    const page = document.getElementById("mod-app-page");
    if (!page) {
        return;
    }
    page.replaceChildren();
    const content = element("div", "mod-app-content");
    const title = element("div", "mod-app-heading");
    title.append(
        element("div", "mod-app-eyebrow", "SOMTODAY MOD"),
        element("h1", "", "Apps"),
        element("p", "", "Voeg je eigen links toe."),
    );

    const toolbar = element("div", "mod-app-toolbar");
    const search = element("input", "mod-app-search");
    search.type = "search";
    search.placeholder = "Zoek apps op naam...";
    search.value = searchText;
    search.setAttribute("aria-label", "Apps zoeken");
    search.addEventListener("input", () => {
        searchText = search.value;
        updateGrid();
    });
    toolbar.append(
        search,
        button("+ Ontdek apps", "mod-app-primary", () => openEditor()),
    );
    const grid = element("div", "mod-app-grid");
    grid.id = "mod-app-grid";
    content.append(title, toolbar, grid);
    page.append(content);
    updateGrid();
}

function updateGrid() {
    const grid = document.getElementById("mod-app-grid");
    if (!grid) {
        return;
    }
    grid.replaceChildren();
    const add = button("+", "mod-app-add", () => openEditor());
    add.append(element("span", "", "App toevoegen"));
    grid.append(add);

    const apps = [...currentApps].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    const filtered = apps.filter((app) =>
        app.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())
    );
    for (const app of filtered) {
        const tile = element("div", "mod-app-tile");
        tile.draggable = true;
        const link = element("a", "mod-app-link");
        link.href = app.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.append(appIcon(app), element("span", "mod-app-name", app.name));

        const actions = element("div", "mod-app-tile-actions");
        actions.append(
            button(app.pinned ? "★" : "☆", "mod-app-pin", () => {
                app.pinned = !app.pinned;
                saveApps();
                updateGrid();
            }),
            button("✎", "mod-app-edit", () => openEditor(app)),
            button("×", "mod-app-delete", () => {
                currentApps = currentApps.filter((item) => item.id !== app.id);
                saveApps();
                updateGrid();
            }),
        );
        tile.append(link, actions);
        tile.addEventListener("dragstart", (event) => {
            dragging = app.id;
            event.dataTransfer?.setData("text/plain", app.id);
        });
        tile.addEventListener("dragover", (event) => event.preventDefault());
        tile.addEventListener("drop", (event) => {
            event.preventDefault();
            if (!dragging || dragging === app.id) {
                return;
            }
            const source = currentApps.findIndex((item) => item.id === dragging);
            const destination = currentApps.findIndex((item) => item.id === app.id);
            if (source < 0 || destination < 0) {
                return;
            }
            const [moved] = currentApps.splice(source, 1);
            moved.pinned = app.pinned;
            currentApps.splice(destination, 0, moved);
            dragging = null;
            saveApps();
            updateGrid();
        });
        grid.append(tile);
    }
}

function showApps(tab: HTMLElement) {
    active = true;
    document.querySelectorAll("sl-tab-item.active").forEach((item) => {
        item.classList.remove("active");
    });
    tab.classList.add("active");
    const page = document.getElementById("mod-app-page");
    if (page) {
        page.hidden = false;
    }
    renderApps();
}

function hideApps() {
    if (!active) {
        return;
    }
    active = false;
    document.getElementById("mod-app-page")?.setAttribute("hidden", "");
    document.getElementById("mod-simple-apps-launcher")?.classList.remove("active");
    document.getElementById("mod-app-editor")?.remove();
}

function insertTab() {
    if (document.getElementById("mod-simple-apps-launcher")) {
        return;
    }
    const existing = Array.from(document.querySelectorAll("sl-tab-item"))
        .find((tab) => tab.textContent?.trim().includes("Berichten"));
    const reference = existing ?? document.querySelector("sl-tab-item:last-of-type");
    if (!reference?.parentElement) {
        return;
    }
    const tab = reference.cloneNode(true) as HTMLElement;
    tab.id = "mod-simple-apps-launcher";
    tab.classList.remove("active");
    tab.removeAttribute("aria-selected");
    const label = tab.querySelector("span");
    if (label) {
        label.textContent = "Apps";
    } else {
        tab.textContent = "Apps";
    }
    const oldIcon = tab.querySelector("svg, i");
    oldIcon?.remove();
    const icon = element("span", "mod-app-nav-icon", "▦");
    tab.prepend(icon);
    tab.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showApps(tab);
    });
    reference.insertAdjacentElement("afterend", tab);
}

export function simpleApps() {
    const enabled = get("appsEnabled");
    if (enabled === false || enabled === "false") {
        document.getElementById("mod-simple-apps-launcher")?.remove();
        document.getElementById("mod-app-page")?.remove();
        return;
    }
    if (!document.getElementById("mod-app-styles")) {
        const styles = element("style");
        styles.id = "mod-app-styles";
        styles.textContent = `
#mod-simple-apps-launcher { cursor: pointer; }
#mod-simple-apps-launcher .mod-app-nav-icon { font-size: 20px; margin-right: 8px; }
#mod-app-page { position: fixed; inset: 88px 0 0; z-index: 50; overflow: auto; background: var(--bg-default-normal, #fff); color: var(--fg-primary-normal, #20242b); }
#mod-app-page[hidden] { display: none; }
.mod-app-content { max-width: 1020px; margin: 0 auto; padding: 42px 24px 80px; }
.mod-app-eyebrow { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
.mod-app-heading h1 { font-size: 30px; margin: 6px 0; }
.mod-app-heading p { margin: 0; color: #64748b; }
.mod-app-toolbar { display: flex; gap: 12px; margin: 26px 0; }
.mod-app-search { flex: 1; min-width: 0; border: 1px solid #d4dce5; border-radius: 8px; padding: 11px 14px; font: inherit; background: var(--bg-default-normal, #fff); color: inherit; }
.mod-app-primary { background: #0069c7; color: white; border: 0; border-radius: 7px; padding: 11px 17px; cursor: pointer; font: inherit; }
.mod-app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: 14px; }
.mod-app-tile, .mod-app-add { min-height: 150px; border: 1px solid #dbe1e8; border-radius: 10px; background: var(--bg-default-normal, #fff); color: inherit; }
.mod-app-tile { position: relative; display: flex; flex-direction: column; cursor: grab; }
.mod-app-link { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 12px; padding: 14px; color: inherit; text-decoration: none; text-align: center; }
.mod-app-name { font-size: 13px; overflow-wrap: anywhere; }
.mod-app-icon { width: 48px; height: 48px; border-radius: 11px; display: grid; place-items: center; font-size: 25px; font-weight: 700; background: #e8f2ff; color: #0069c7; overflow: hidden; }
.mod-app-icon img { width: 100%; height: 100%; object-fit: contain; }
.mod-app-tile-actions { display: flex; justify-content: flex-end; gap: 3px; padding: 0 7px 7px; }
.mod-app-tile-actions button { border: 0; background: transparent; color: #64748b; cursor: pointer; padding: 5px; }
.mod-app-add { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; cursor: pointer; color: #0069c7; font-size: 26px; }
.mod-app-add span { font-size: 12px; color: #475569; }
.mod-app-backdrop { position: fixed; inset: 0; z-index: 10010; background: #17233488; display: grid; place-items: center; padding: 18px; }
.mod-app-modal { width: min(100%, 460px); max-height: 90vh; overflow: auto; background: var(--bg-default-normal, #fff); color: var(--fg-primary-normal, #222); border-radius: 14px; padding: 24px; box-shadow: 0 18px 70px #0003; }
.mod-app-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.mod-app-modal-header h2 { margin: 0; font-size: 22px; }
.mod-app-close { background: transparent; border: 0; font-size: 26px; cursor: pointer; color: inherit; }
.mod-app-editor-form { display: flex; flex-direction: column; gap: 16px; }
.mod-app-editor-form label { display: flex; flex-direction: column; gap: 7px; font-size: 14px; }
.mod-app-editor-form input:not([type=checkbox]) { border: 1px solid #d4dce5; border-radius: 7px; padding: 11px; font: inherit; background: transparent; color: inherit; }
.mod-app-editor-form .mod-app-pin-label { flex-direction: row; align-items: center; }
.mod-app-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.mod-app-secondary { border: 1px solid #d4dce5; border-radius: 7px; background: transparent; color: inherit; padding: 10px 16px; cursor: pointer; }
.mod-app-error { color: #c92a2a; margin: 0; }
@media (max-width: 600px) { #mod-app-page { top: 72px; } .mod-app-content { padding: 24px 16px; } .mod-app-toolbar { flex-direction: column; } .mod-app-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
`;
        document.head.append(styles);
    }

    if (!document.getElementById("mod-app-page")) {
        const page = element("main");
        page.id = "mod-app-page";
        page.hidden = true;
        document.body.append(page);
    }
    if (!active) {
        currentApps = loadApps();
    }
    insertTab();

    if (!document.documentElement.dataset.modAppsListener) {
        document.documentElement.dataset.modAppsListener = "true";
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("sl-tab-item:not(#mod-simple-apps-launcher)")) {
                hideApps();
            }
        }, true);
    }
}
