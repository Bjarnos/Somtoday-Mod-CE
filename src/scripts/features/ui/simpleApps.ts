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
let tabObserver: MutationObserver | null = null;
let tabUpdatePending = false;

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
    const value = input.trim();
    if (!value || /\\s/.test(value)) {
        return null;
    }

    const address = /^[a-z][a-z\\d+.-]*:\/\//i.test(value)
        ? value
        : `https://${value}`;

    try {
        const url = new URL(address);
        if (
            (url.protocol === "https:" || url.protocol === "http:") &&
            url.hostname.includes(".")
        ) {
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
    url.type = "text";
    url.inputMode = "url";
    url.placeholder = "www.voorbeeld.nl";
    url.value = existing?.url ?? "";
    urlLabel.append(url);

    const iconLabel = element("label", "", "Afbeelding (optioneel)");
    const icon = element("input");
    icon.type = "url";
    icon.placeholder = "https://voorbeeld.nl/logo.png";
    icon.value = existing?.icon ?? "";
    iconLabel.append(icon);

    const pinnedLabel = element("label", "mod-app-pin-label");
    const pinText = element("span", "", "Vastzetten");
    const pinned = element("input");
    pinned.type = "checkbox";
    pinned.checked = existing?.pinned ?? false;
    const pinSwitch = element("span", "mod-app-switch");
    pinSwitch.append(pinned, element("span", "mod-app-switch-track"));
    pinnedLabel.append(pinText, pinSwitch);

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
        if (address) {
            url.value = address;
        }
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
        element("h1", "", "Apps"),
        element("p", "", "Al je favoriete websites op één plek."),
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
        button("+ App toevoegen", "mod-app-primary", () => openEditor()),
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
    const oldRects = new Map<string, DOMRect>();
    grid.querySelectorAll<HTMLElement>(".mod-app-tile").forEach((tile) => {
        if (tile.dataset.appId) {
            oldRects.set(tile.dataset.appId, tile.getBoundingClientRect());
        }
    });
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
        tile.dataset.appId = app.id;
        if (app.pinned) {
            tile.classList.add("mod-app-pinned");
            const pin = element("span", "mod-app-pinned-label", "★ Vastgezet");
            pin.title = "Deze app is vastgezet";
            tile.append(pin);
        }
        const link = element("a", "mod-app-link");
        link.href = app.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.append(appIcon(app), element("span", "mod-app-name", app.name));

        const menu = element("div", "mod-app-menu");
        const menuButton = button("⋮", "mod-app-menu-button", () => {
            const expanded = menu.classList.toggle("open");
            menuButton.setAttribute("aria-expanded", String(expanded));
        });
        menuButton.setAttribute("aria-label", "App-opties");
        menuButton.setAttribute("aria-expanded", "false");

        const options = element("div", "mod-app-menu-options");
        options.append(
            button(app.pinned ? "Losmaken" : "Vastzetten", "", () => {
                app.pinned = !app.pinned;
                saveApps();
                updateGrid();
            }),
            button("Bewerken", "", () => openEditor(app)),
            button("Verwijderen", "mod-app-danger", () => {
                currentApps = currentApps.filter((item) => item.id !== app.id);
                saveApps();
                updateGrid();
            }),
        );
        menu.append(menuButton, options);
        tile.append(link, menu);
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
    for (const tile of grid.querySelectorAll<HTMLElement>(".mod-app-tile")) {
        const before = oldRects.get(tile.dataset.appId ?? "");
        if (!before) {
            continue;
        }
        const after = tile.getBoundingClientRect();
        const dx = before.left - after.left;
        const dy = before.top - after.top;
        if (dx || dy) {
            tile.animate(
                [
                    { transform: `translate(${dx}px, ${dy}px)` },
                    { transform: "translate(0, 0)" },
                ],
                { duration: 280, easing: "cubic-bezier(.2,.8,.2,1)" },
            );
        }
    }
}

function updatePageOffset(tab: HTMLElement) {
    const tabRect = tab.getBoundingClientRect();
    const navigation = tab.closest<HTMLElement>("header, nav, sl-tab-bar");
    const navRect = navigation?.getBoundingClientRect();
    const bottom = Math.max(tabRect.bottom, navRect?.bottom ?? 0);

    if (bottom > 0 && bottom < window.innerHeight) {
        document.documentElement.style.setProperty(
            "--mod-app-header-height",
            `${Math.ceil(bottom)}px`,
        );
    }

    const page = document.getElementById("mod-app-page");
    if (page && page.parentElement !== document.body) {
        document.body.append(page);
    }
}

function showApps(tab: HTMLElement) {
    active = true;
    document.documentElement.classList.add("mod-apps-open");
    document.querySelectorAll("sl-tab-item.active").forEach((item) => {
        item.classList.remove("active");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    const page = document.getElementById("mod-app-page");
    if (page) {
        updatePageOffset(tab);
        page.hidden = false;
    }
    renderApps();
}

function hideApps() {
    if (!active) {
        return;
    }
    active = false;
    document.documentElement.classList.remove("mod-apps-open");
    document.getElementById("mod-app-page")?.setAttribute("hidden", "");
    const appsTab = document.getElementById("mod-simple-apps-launcher");
    appsTab?.classList.remove("active");
    appsTab?.setAttribute("aria-selected", "false");
    document.getElementById("mod-app-editor")?.remove();
}

function insertTab() {
    const existing = Array.from(document.querySelectorAll("sl-tab-item"))
        .find((tab) => tab.textContent?.trim().includes("Berichten"));
    const reference = existing ?? document.querySelector("sl-tab-item:last-of-type");
    const currentTab = document.getElementById("mod-simple-apps-launcher");
    if (currentTab && currentTab.parentElement === reference?.parentElement && currentTab.previousElementSibling === reference) {
        return;
    }
    currentTab?.remove();
    if (!reference?.parentElement) {
        return;
    }
    const tab = reference.cloneNode(true) as HTMLElement;
    tab.id = "mod-simple-apps-launcher";
    tab.classList.remove("active");
    tab.removeAttribute("aria-selected");
    tab.replaceChildren();
    const label = element("span", "mod-app-nav-label", "Apps");
    const icon = element("span", "mod-app-nav-icon");
    icon.innerHTML = "<svg viewBox='0 0 24 24' width='20' height='20' fill='currentColor' aria-hidden='true'><rect x='2' y='2' width='8' height='8' rx='1'/><rect x='14' y='2' width='8' height='8' rx='1'/><rect x='2' y='14' width='8' height='8' rx='1'/><rect x='14' y='14' width='8' height='8' rx='1'/></svg>";
    tab.append(icon, label);
    tab.classList.add("mod-app-nav-tab");
    tab.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showApps(tab);
    });
    reference.insertAdjacentElement("afterend", tab);
    if (active) {
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
    }
}

export function simpleApps() {
    const enabled = get("appsEnabled");
    if (enabled === false || enabled === "false") {
        tabObserver?.disconnect();
        tabObserver = null;
        hideApps();
        document.getElementById("mod-simple-apps-launcher")?.remove();
        document.getElementById("mod-app-page")?.remove();
        document.getElementById("mod-app-editor")?.remove();
        return;
    }
    if (!document.getElementById("mod-app-styles")) {
        const styles = element("style");
        styles.id = "mod-app-styles";
        styles.textContent = `
#mod-simple-apps-launcher {
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    position: relative;
}

#mod-simple-apps-launcher.active,
#mod-simple-apps-launcher.active .mod-app-nav-label,
#mod-simple-apps-launcher.active .mod-app-nav-icon {
    color: var(--fg-primary-normal, #006bc9) !important;
}

#mod-simple-apps-launcher.active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #f59b21;
    pointer-events: none;
}

#mod-simple-apps-launcher .mod-app-nav-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    color: inherit;
}

#mod-simple-apps-launcher .mod-app-nav-icon svg {
    display: block;
}

#mod-simple-apps-launcher .mod-app-nav-label {
    display: inline-block;
    white-space: nowrap;
}

#mod-app-page {
    position: fixed;
    top: var(--mod-app-header-height, 80px);
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 5;
    isolation: isolate;
    pointer-events: auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--bg-default-normal, #fff);
    animation: mod-app-page-enter .22s ease-out both;
    color: var(--fg-primary-normal, #263442);
}

#mod-app-page[hidden] {
    display: none;
}

html.mod-apps-open sl-header,
html.mod-apps-open sl-topbar,
html.mod-apps-open header:has(sl-tab-item),
html.mod-apps-open nav:has(sl-tab-item),
html.mod-apps-open #mod-top-menu {
    z-index: 30;
}

html.mod-apps-open sl-tab-bar,
html.mod-apps-open sl-tab-item {
    position: relative;
    z-index: 30;
}

html.mod-apps-open .menu-avatar,
html.mod-apps-open .selector-options,
html.mod-apps-open .selector-option,
html.mod-apps-open [role="menu"],
html.mod-apps-open [role="listbox"] {
    z-index: 40;
}

html.mod-apps-open body {
    overscroll-behavior: none;
}

@keyframes mod-app-page-enter {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes mod-app-card-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes mod-app-modal-enter {
    from { opacity: 0; transform: translateY(12px) scale(.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.mod-app-content {
    max-width: 1050px;
    margin: 0 auto;
    padding: 48px 28px 90px;
}

.mod-app-heading h1 {
    margin: 0 0 8px;
    font-size: 30px;
    font-weight: 650;
    color: inherit;
}

.mod-app-heading p {
    margin: 0;
    color: var(--fg-secondary-normal, #66758a);
    font-size: 15px;
}

.mod-app-toolbar {
    display: flex;
    align-items: stretch;
    gap: 12px;
    margin: 30px 0 25px;
}

.mod-app-search,
.mod-app-editor-form input:not([type="checkbox"]) {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border: 1px solid var(--border-default-normal, #d3dce6);
    border-radius: 8px;
    background: var(--bg-default-normal, #fff);
    color: inherit;
    font: inherit;
    outline: none;
    padding: 12px 14px;
}

.mod-app-search {
    flex: 1;
}

.mod-app-search:focus,
.mod-app-editor-form input:focus {
    border-color: #006bc9;
    box-shadow: 0 0 0 3px #006bc91a;
}

.mod-app-primary {
    border: 0;
    border-radius: 8px;
    background: var(--bg-primary-normal, #006bc9);
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    padding: 12px 20px;
    white-space: nowrap;
}

.mod-app-primary:hover {
    filter: brightness(1.08);
}

.mod-app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 18px;
}

.mod-app-tile,
.mod-app-add {
    min-height: 170px;
    border: 1px solid var(--border-default-normal, #dce3eb);
    border-radius: 12px;
    background: var(--bg-default-normal, #fff);
    color: inherit;
    transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.mod-app-tile {
    display: flex;
    flex-direction: column;
    overflow: visible;
    cursor: grab;
    animation: mod-app-card-in .24s ease-out both;
}

.mod-app-tile.mod-app-pinned {
    border-color: #7cb4ee;
    background: linear-gradient(180deg, #eaf4ff 0%, var(--bg-default-normal, #fff) 55%);
}

.mod-app-pinned-label {
    position: absolute;
    top: 12px;
    left: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    background: #d9ebff;
    color: #075ca8;
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
}

.mod-app-tile:hover,
.mod-app-add:hover {
    border-color: #92b9e4;
    box-shadow: 0 5px 18px #17334b13;
    transform: translateY(-2px);
}

.mod-app-link {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 18px 12px 8px;
    color: inherit;
    text-align: center;
    text-decoration: none;
}

.mod-app-name {
    font-size: 14px;
    font-weight: 550;
    overflow-wrap: anywhere;
}

.mod-app-icon {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: #e6f2ff;
    color: #006bc9;
    font-size: 28px;
    font-weight: 700;
    overflow: hidden;
}

.mod-app-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.mod-app-menu {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
}

.mod-app-menu-button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--fg-secondary-normal, #697789);
    font-size: 22px;
    cursor: pointer;
}

.mod-app-menu-button:hover,
.mod-app-menu.open .mod-app-menu-button {
    background: var(--bg-secondary-normal, #edf3f8);
}

.mod-app-menu-options {
    display: none;
    position: absolute;
    top: 34px;
    right: 0;
    width: 142px;
    padding: 5px;
    border: 1px solid var(--border-default-normal, #dce3eb);
    border-radius: 9px;
    background: var(--bg-default-normal, #fff);
    box-shadow: 0 8px 24px #101d2b20;
}

.mod-app-menu.open .mod-app-menu-options {
    display: flex;
    flex-direction: column;
    animation: mod-app-modal-enter .15s ease-out;
}

.mod-app-menu-options button {
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    padding: 9px 10px;
    text-align: left;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
}

.mod-app-menu-options button:hover {
    background: var(--bg-secondary-normal, #edf3f8);
}

.mod-app-menu-options .mod-app-danger {
    color: #bf3333;
}

.mod-app-add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #006bc9;
    cursor: pointer;
    font-size: 30px;
}

.mod-app-add span {
    font-size: 13px;
    font-weight: 600;
}

.mod-app-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10010;
    display: grid;
    place-items: center;
    padding: 20px;
    background: #182b3c80;
    backdrop-filter: blur(3px);
}

.mod-app-modal {
    box-sizing: border-box;
    width: min(100%, 500px);
    max-height: min(90vh, 760px);
    overflow-y: auto;
    border: 1px solid var(--border-default-normal, #e1e6ec);
    border-radius: 16px;
    padding: 28px;
    background: var(--bg-default-normal, #fff);
    color: var(--fg-primary-normal, #263442);
    box-shadow: 0 20px 70px #101d2b30;
    animation: mod-app-modal-enter .2s ease-out both;
}

.mod-app-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 26px;
}

.mod-app-modal-header h2 {
    margin: 0;
    font-size: 23px;
    font-weight: 650;
}

.mod-app-close {
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 25px;
    padding: 2px 10px;
}

.mod-app-close:hover {
    background: var(--bg-secondary-normal, #eef2f6);
}

.mod-app-editor-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.mod-app-editor-form label {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
}

.mod-app-editor-form input:not([type="checkbox"]) {
    font-weight: 400;
}

.mod-app-editor-form .mod-app-pin-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 4px 0;
}

.mod-app-switch {
    position: relative;
    display: inline-flex;
    width: 52px;
    height: 28px;
}

.mod-app-switch input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    margin: 0;
    z-index: 1;
}

.mod-app-switch-track {
    width: 52px;
    height: 28px;
    border-radius: 30px;
    background: #b7c4d0;
    transition: background .2s;
}

.mod-app-switch-track::after {
    content: "";
    display: block;
    width: 22px;
    height: 22px;
    margin: 3px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px #0002;
    transition: transform .2s;
}

.mod-app-switch input:checked + .mod-app-switch-track {
    background: #006bc9;
}

.mod-app-switch input:checked + .mod-app-switch-track::after {
    transform: translateX(24px);
}

.mod-app-switch input:focus-visible + .mod-app-switch-track {
    outline: 3px solid #6ab1ff;
    outline-offset: 2px;
}

.mod-app-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border-default-normal, #e4eaf0);
}

.mod-app-secondary {
    border: 1px solid var(--border-default-normal, #d3dce6);
    border-radius: 8px;
    background: transparent;
    color: inherit;
    padding: 11px 17px;
    cursor: pointer;
    font: inherit;
}

.mod-app-error {
    margin: 0;
    color: #c92a2a;
    font-size: 13px;
}

.mod-app-error:empty {
    display: none;
}

@media (max-width: 600px) {
    #mod-app-page {
        top: var(--mod-app-header-height, 72px);
    }

    .mod-app-content {
        padding: 28px 16px 60px;
    }

    .mod-app-toolbar {
        flex-direction: column;
    }

    .mod-app-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
    }

    .mod-app-modal {
        padding: 22px;
    }
}
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

    if (!tabObserver) {
        tabObserver = new MutationObserver(() => {
            if (tabUpdatePending) {
                return;
            }
            tabUpdatePending = true;
            requestAnimationFrame(() => {
                tabUpdatePending = false;
                if (get("appsEnabled") === false || get("appsEnabled") === "false") {
                    simpleApps();
                    return;
                }
                insertTab();
                if (active) {
                    const tab = document.getElementById("mod-simple-apps-launcher");
                    if (tab) {
                        updatePageOffset(tab);
                    }
                }
            });
        });
        tabObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    if (!document.documentElement.dataset.modAppsListener) {
        window.addEventListener("somtoday-mod-apps-setting-changed", () => simpleApps());
        window.addEventListener("resize", () => {
            if (!active) {
                return;
            }
            const tab = document.getElementById("mod-simple-apps-launcher");
            if (tab) {
                updatePageOffset(tab);
            }
        });
        document.documentElement.dataset.modAppsListener = "true";
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            if (target.closest("sl-tab-item:not(#mod-simple-apps-launcher)")) {
                hideApps();
            }
        }, true);
    }
}
