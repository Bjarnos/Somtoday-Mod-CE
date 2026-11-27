import { get, set } from "../../save_version_management";
import { n } from "../../shorthand_functions";

type App = {
    id: string;
    name: string;
    url: string;
    icon: string;
    pinned: boolean;
    folderId?: string;
};

type AppFolder = { id: string; name: string; color: string; pinned: boolean };

const appsKey = "simpleApps";
const foldersKey = "simpleAppFolders";
let folders: AppFolder[] = [];
let openFolderId: string | null = null;
let currentApps: App[] = [];
let active = false;
let searchText = "";
let dragging: string | null = null;
let tabObserver: MutationObserver | null = null;
let tabUpdatePending = false;
let lastActiveTab: HTMLElement | null = null;

function loadApps(): App[] {
    const stored = get(appsKey);
    try {
        const items =
            typeof stored === "string" ? JSON.parse(stored || "[]") : stored;
        if (!Array.isArray(items)) {
            return [];
        }
        return items
            .filter(
                (item) =>
                    typeof item.id === "string" &&
                    typeof item.name === "string" &&
                    typeof item.url === "string",
            )
            .map((item) => ({
                id: item.id,
                name: item.name,
                url: item.url,
                icon: typeof item.icon === "string" ? item.icon : "",
                pinned: Boolean(item.pinned),
                folderId:
                    typeof item.folderId === "string"
                        ? item.folderId
                        : undefined,
            }));
    } catch {
        return [];
    }
}

function saveApps() {
    set(appsKey, JSON.stringify(currentApps));
    set(foldersKey, JSON.stringify(folders));
}

function getDefaultFolderColor(): string {
    const color = get("primarycolor");
    if (typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color)) {
        return color;
    }
    if (typeof color === "string" && /^#[0-9a-f]{3}$/i.test(color)) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return "#0067c2";
}

function hasCustomBackground(): boolean {
    return Boolean(
        document.getElementById("mod-background") ||
            document.getElementById("mod-backgroundslide") ||
            document.getElementById("mod-backgroundcolor") ||
            document.getElementById("mod-background-live") ||
            (get("backgroundtype") === "image" && !n(get("background"))) ||
            (get("backgroundtype") === "slideshow" && !n(get("background0"))) ||
            (get("backgroundtype") === "color" && !n(get("backgroundcolor"))) ||
            get("backgroundtype") === "live",
    );
}

function loadFolders(): AppFolder[] {
    try {
        const value = get(foldersKey);
        const items =
            typeof value === "string" ? JSON.parse(value || "[]") : value;
        if (!Array.isArray(items)) return [];
        return items
            .filter(
                (item) =>
                    typeof item.id === "string" &&
                    typeof item.name === "string",
            )
            .map((item) => ({
                id: item.id,
                name: item.name,
                color:
                    typeof item.color === "string"
                        ? item.color
                        : getDefaultFolderColor(),
                pinned: Boolean(item.pinned),
            }));
    } catch {
        return [];
    }
}

function websiteIcon(url: string): string {
    try {
        const host = new URL(url).hostname;
        return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
    } catch {
        return "";
    }
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
    if (!value) {
        return null;
    }
    if (value.startsWith("data:image/")) {
        return value;
    }
    if (/\s/.test(value)) {
        return null;
    }

    const address = /^[a-z][a-z\d+.-]*:\/\//i.test(value)
        ? value
        : `https://${value}`;

    try {
        const url = new URL(address);
        if (
            (url.protocol === "https:" || url.protocol === "http:") &&
            (url.hostname.includes(".") || url.hostname === "localhost")
        ) {
            return url.href;
        }
    } catch {
        return null;
    }
    return null;
}

function appIcon(app: App) {
    const icon = element(
        "div",
        "mod-app-icon",
        app.name.charAt(0).toUpperCase(),
    );
    const source = validUrl(app.icon) || websiteIcon(app.url);
    if (source) {
        const image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.onerror = () => {
            image.remove();
            icon.textContent = app.name.charAt(0).toUpperCase();
        };
        icon.replaceChildren(image);
    }
    return icon;
}

function openEditor(existing?: App, defaultFolderId?: string) {
    document.getElementById("mod-app-editor")?.remove();
    const backdrop = element("div", "mod-app-backdrop");
    backdrop.id = "mod-app-editor";
    const modal = element("div", "mod-app-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
        "aria-label",
        existing ? "App bewerken" : "App toevoegen",
    );

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
    icon.type = "text";
    icon.placeholder = "https://voorbeeld.nl/logo.png";
    icon.value = existing?.icon ?? "";
    iconLabel.append(icon);

    let selectedFolderId =
        existing?.folderId ?? defaultFolderId ?? openFolderId ?? "";
    const folderLabel = element("label", "", "Map (optioneel)");
    const picker = element("div", "mod-app-folder-picker");
    const trigger = button("", "mod-app-folder-picker-trigger", () => {
        const expanded = picker.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(expanded));
    });
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const chosen = element(
        "span",
        "",
        folders.find((f) => f.id === selectedFolderId)?.name ?? "Geen map",
    );
    trigger.append(chosen, element("span", "mod-app-folder-chevron", "⌄"));
    const choices = element("div", "mod-app-folder-picker-options");
    choices.setAttribute("role", "listbox");
    for (const folder of [{ id: "", name: "Geen map" }, ...folders]) {
        const option = button(
            folder.name,
            "mod-app-folder-picker-option",
            () => {
                selectedFolderId = folder.id;
                chosen.textContent = folder.name;
                picker.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            },
        );
        option.setAttribute("role", "option");
        choices.append(option);
    }
    picker.append(trigger, choices);
    folderLabel.append(picker);

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
    form.append(
        nameLabel,
        urlLabel,
        iconLabel,
        folderLabel,
        pinnedLabel,
        error,
        actions,
    );

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
            currentApps = currentApps.map((app) =>
                app.id === existing.id
                    ? {
                          ...app,
                          name: name.value.trim(),
                          url: address,
                          icon: image,
                          pinned: pinned.checked,
                          folderId: selectedFolderId || undefined,
                      }
                    : app,
            );
        } else {
            currentApps.push({
                id: crypto.randomUUID
                    ? crypto.randomUUID()
                    : `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: name.value.trim(),
                url: address,
                icon: image,
                pinned: pinned.checked,
                folderId: selectedFolderId || undefined,
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

function closeAppMenus(except?: HTMLElement) {
    document
        .querySelectorAll<HTMLElement>(
            ".mod-app-menu.open, .mod-app-create-dropdown.open, .mod-app-folder-picker.open",
        )
        .forEach((menu) => {
            if (menu !== except) {
                menu.classList.remove("open");
                menu.querySelector("button[aria-expanded]")?.setAttribute(
                    "aria-expanded",
                    "false",
                );
            }
        });
}

function toggleAppMenu(menu: HTMLElement) {
    const wasOpen = menu.classList.contains("open");
    closeAppMenus();
    if (!wasOpen) menu.classList.add("open");
    menu.querySelector("button[aria-expanded]")?.setAttribute(
        "aria-expanded",
        String(!wasOpen),
    );
}

function openFolderEditor(existing?: AppFolder) {
    document.getElementById("mod-app-editor")?.remove();
    const backdrop = element("div", "mod-app-backdrop");
    backdrop.id = "mod-app-editor";
    const modal = element("div", "mod-app-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute(
        "aria-label",
        existing ? "Map bewerken" : "Map aanmaken",
    );
    const heading = element("div", "mod-app-modal-header");
    heading.append(
        element("h2", "", existing ? "Map bewerken" : "Map aanmaken"),
        button("×", "mod-app-close", () => backdrop.remove()),
    );
    const form = element("form", "mod-app-editor-form");
    const nameLabel = element("label", "", "Mapnaam");
    const name = element("input");
    name.required = true;
    name.maxLength = 40;
    name.value = existing?.name ?? "";
    nameLabel.append(name);
    const defaultColor = getDefaultFolderColor();
    const colorLabel = element("label", "", "Kleur");
    const color = element("input");
    color.type = "color";
    color.value = existing?.color ?? defaultColor;
    color.setAttribute("aria-label", "Mapkleur kiezen");
    const colorPreview = element("span", "mod-app-color-preview");
    colorPreview.style.backgroundColor = color.value;
    const colorValue = element(
        "span",
        "mod-app-color-value",
        color.value.toUpperCase(),
    );
    color.addEventListener("input", () => {
        colorPreview.style.backgroundColor = color.value;
        colorValue.textContent = color.value.toUpperCase();
    });
    const colorPicker = element("div", "mod-app-color-picker");
    colorPicker.append(colorPreview, colorValue, color);
    colorLabel.append(colorPicker);
    const actions = element("div", "mod-app-modal-actions");
    actions.append(
        button("Annuleren", "mod-app-secondary", () => backdrop.remove()),
    );
    const save = element("button", "mod-app-primary", "Opslaan");
    save.type = "submit";
    actions.append(save);
    form.append(nameLabel, colorLabel, actions);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!name.value.trim()) return;
        if (existing) {
            existing.name = name.value.trim();
            existing.color = color.value;
        } else {
            folders.push({
                id: crypto.randomUUID
                    ? crypto.randomUUID()
                    : `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: name.value.trim(),
                color: color.value,
                pinned: false,
            });
        }
        saveApps();
        backdrop.remove();
        renderApps();
    });
    modal.append(heading, form);
    backdrop.append(modal);
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) backdrop.remove();
    });
    document.body.append(backdrop);
    name.focus();
}

function openMoveDialog(app: App) {
    document.getElementById("mod-app-editor")?.remove();
    const backdrop = element("div", "mod-app-backdrop");
    backdrop.id = "mod-app-editor";
    const modal = element("div", "mod-app-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Toevoegen aan groep");
    const heading = element("div", "mod-app-modal-header");
    heading.append(
        element("h2", "", "Toevoegen aan groep"),
        button("×", "mod-app-close", () => backdrop.remove()),
    );
    const form = element("form", "mod-app-editor-form");
    const label = element("label", "", "Selecteer een map");
    let selectedFolderId = app.folderId ?? "";
    const picker = element("div", "mod-app-folder-picker");
    const trigger = button("", "mod-app-folder-picker-trigger", () => {
        const expanded = picker.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(expanded));
    });
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const chosen = element(
        "span",
        "",
        folders.find((folder) => folder.id === selectedFolderId)?.name ??
            "Geen map",
    );
    trigger.append(chosen, element("span", "mod-app-folder-chevron", "⌄"));
    const choices = element("div", "mod-app-folder-picker-options");
    choices.setAttribute("role", "listbox");
    for (const folder of [{ id: "", name: "Geen map" }, ...folders]) {
        const option = button(
            folder.name,
            "mod-app-folder-picker-option",
            () => {
                selectedFolderId = folder.id;
                chosen.textContent = folder.name;
                picker.classList.remove("open");
                trigger.setAttribute("aria-expanded", "false");
            },
        );
        option.setAttribute("role", "option");
        choices.append(option);
    }
    picker.append(trigger, choices);
    label.append(picker);
    const actions = element("div", "mod-app-modal-actions");
    actions.append(
        button("Annuleren", "mod-app-secondary", () => backdrop.remove()),
    );
    const save = element("button", "mod-app-primary", "Opslaan");
    save.type = "submit";
    actions.append(save);
    form.append(label, actions);
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        app.folderId = selectedFolderId || undefined;
        saveApps();
        backdrop.remove();
        renderApps();
    });
    modal.append(heading, form);
    backdrop.append(modal);
    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) backdrop.remove();
    });
    document.body.append(backdrop);
}

function folderMenu(folder: AppFolder) {
    const menu = element("div", "mod-app-menu");
    const trigger = button("⋮", "mod-app-menu-button", () =>
        toggleAppMenu(menu),
    );
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Map-opties");
    const options = element("div", "mod-app-menu-options");
    options.append(
        button(folder.pinned ? "Losmaken" : "Vastzetten", "", () => {
            folder.pinned = !folder.pinned;
            saveApps();
            renderApps();
        }),
        button("Map bewerken", "", () => openFolderEditor(folder)),
        button("Map verwijderen", "mod-app-danger", () => {
            if (
                !window.confirm(
                    `Map "${folder.name}" verwijderen? De apps blijven behouden.`,
                )
            )
                return;
            currentApps.forEach((app) => {
                if (app.folderId === folder.id) delete app.folderId;
            });
            folders = folders.filter((item) => item.id !== folder.id);
            openFolderId = null;
            saveApps();
            renderApps();
        }),
    );
    menu.append(trigger, options);
    return menu;
}

function renderApps() {
    const page = document.getElementById("mod-app-page");
    if (!page) {
        return;
    }
    page.dataset.hasBackground = String(hasCustomBackground());
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
    const create = element("div", "mod-app-create-actions");
    const dropdown = element("div", "mod-app-create-dropdown");
    const arrow = button("▾", "mod-app-primary mod-app-create-arrow", () =>
        toggleAppMenu(dropdown),
    );
    arrow.setAttribute("aria-expanded", "false");
    arrow.setAttribute("aria-label", "Meer toevoegen");
    const choices = element("div", "mod-app-create-options");
    choices.append(
        button("Map aanmaken", "", () => {
            dropdown.classList.remove("open");
            openFolderEditor();
        }),
    );
    dropdown.append(arrow, choices);
    create.append(
        button("+ App toevoegen", "mod-app-primary", () =>
            openEditor(undefined, openFolderId ?? undefined),
        ),
        dropdown,
    );
    const viewControls = element("div", "mod-app-view-controls");
    viewControls.setAttribute("role", "group");
    viewControls.setAttribute("aria-label", "Apps-weergave");
    const listMode = get("simpleAppsView") === "list";
    const viewButtons: HTMLButtonElement[] = [];
    for (const mode of ["grid", "list"] as const) {
        const label = mode === "grid" ? "Kaartweergave" : "Lijstweergave";
        const control = button("", "mod-app-view-button", () => {
            set("simpleAppsView", mode);
            grid.classList.toggle("mod-app-list-view", mode === "list");
            for (const item of viewButtons) {
                item.setAttribute(
                    "aria-pressed",
                    String(item.dataset.view === mode),
                );
            }
        });
        control.dataset.view = mode;
        control.title = label;
        control.setAttribute("aria-label", label);
        control.setAttribute(
            "aria-pressed",
            String(mode === (listMode ? "list" : "grid")),
        );
        control.innerHTML =
            mode === "grid"
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M9 5h12M9 12h12M9 19h12"/><path d="M3 5h1M3 12h1M3 19h1"/></svg>';
        viewButtons.push(control);
        viewControls.append(control);
    }
    const viewRow = element("div", "mod-app-view-row");
    viewRow.append(viewControls);
    toolbar.append(search, create);
    const grid = element("div", "mod-app-grid");
    grid.id = "mod-app-grid";
    grid.classList.toggle("mod-app-list-view", listMode);
    content.append(title, viewRow, toolbar, grid);
    page.append(content);
    updateGrid();
}

function clearAppDrag() {
    dragging = null;
    document
        .querySelectorAll(".mod-app-dragging, .mod-app-drop-target")
        .forEach((item) => {
            item.classList.remove("mod-app-dragging", "mod-app-drop-target");
        });
}

function bindAppDrag(tile: HTMLElement, app: App) {
    tile.draggable = true;
    tile.querySelectorAll<HTMLElement>("a, img").forEach((item) => {
        item.draggable = false;
    });
    tile.addEventListener("dragstart", (event) => {
        if (!event.dataTransfer) return;
        clearAppDrag();
        closeAppMenus();
        dragging = app.id;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", app.id);
        const preview = tile.cloneNode(true) as HTMLElement;
        const rect = tile.getBoundingClientRect();
        preview.classList.add("mod-app-drag-preview");
        preview.style.width = rect.width + "px";
        preview.style.height = rect.height + "px";
        preview.style.background = getComputedStyle(tile).backgroundColor;
        preview.style.color = getComputedStyle(tile).color;
        preview.querySelector(".mod-app-menu")?.remove();
        document.body.append(preview);
        event.dataTransfer.setDragImage(
            preview,
            rect.width / 2,
            rect.height / 2,
        );
        requestAnimationFrame(() => {
            preview.remove();
            if (dragging === app.id) tile.classList.add("mod-app-dragging");
        });
    });
    tile.addEventListener("dragend", clearAppDrag);
}

function bindAppDrop(
    tile: HTMLElement,
    onDrop: (app: App) => void,
    targetAppId?: string,
) {
    tile.addEventListener("dragover", (event) => {
        if (!dragging || dragging === targetAppId) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        tile.classList.add("mod-app-drop-target");
    });
    tile.addEventListener("dragleave", (event) => {
        if (
            event.relatedTarget instanceof Node &&
            tile.contains(event.relatedTarget)
        )
            return;
        tile.classList.remove("mod-app-drop-target");
    });
    tile.addEventListener("drop", (event) => {
        if (!dragging) return;
        event.preventDefault();
        event.stopPropagation();
        const app = currentApps.find((item) => item.id === dragging);
        clearAppDrag();
        if (!app || app.id === targetAppId) return;
        const before = new Map<string, DOMRect>();
        document
            .querySelectorAll<HTMLElement>(
                "#mod-app-grid [data-app-id], #mod-app-grid [data-folder-id]",
            )
            .forEach((item) => {
                before.set(
                    item.dataset.appId || "folder:" + item.dataset.folderId,
                    item.getBoundingClientRect(),
                );
            });
        onDrop(app);
        saveApps();
        updateGrid();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        document
            .querySelectorAll<HTMLElement>(
                "#mod-app-grid [data-app-id], #mod-app-grid [data-folder-id]",
            )
            .forEach((item) => {
                const previous = before.get(
                    item.dataset.appId || "folder:" + item.dataset.folderId,
                );
                if (!previous) return;
                const next = item.getBoundingClientRect();
                const x = previous.left - next.left;
                const y = previous.top - next.top;
                if (x || y)
                    item.animate(
                        [
                            { transform: `translate(${x}px, ${y}px)` },
                            { transform: "none" },
                        ],
                        { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" },
                    );
            });
    });
}

function updateGrid() {
    const grid = document.getElementById("mod-app-grid");
    if (!grid) {
        return;
    }
    grid.replaceChildren();
    const query = searchText.trim().toLowerCase();
    const selectedFolder = folders.find((folder) => folder.id === openFolderId);
    if (openFolderId && !selectedFolder) openFolderId = null;

    if (query) {
        // Global search active: search across all apps and folders
        grid.classList.remove("mod-app-folder-grid");
        const matchingFolders = folders.filter((folder) =>
            folder.name.toLowerCase().includes(query),
        );
        for (const folder of matchingFolders) {
            const members = currentApps.filter(
                (app) => app.folderId === folder.id,
            );
            const tile = element("div", "mod-app-tile mod-app-folder-tile");
            tile.style.setProperty("--mod-folder-color", folder.color);
            tile.dataset.folderId = folder.id;
            bindAppDrop(tile, (app) => {
                app.folderId = folder.id;
            });
            const opener = button("", "mod-app-folder-open", () => {
                openFolderId = folder.id;
                searchText = "";
                renderApps();
            });
            const preview = element("div", "mod-app-folder-preview");
            for (const app of members.slice(0, 4)) preview.append(appIcon(app));
            opener.append(
                preview,
                element("span", "mod-app-name", folder.name),
            );
            tile.append(opener, folderMenu(folder));
            grid.append(tile);
        }

        const matchingApps = currentApps.filter((app) =>
            app.name.toLowerCase().includes(query),
        );
        for (const app of matchingApps) {
            const tile = element("div", "mod-app-tile");
            tile.dataset.appId = app.id;
            if (app.pinned) {
                tile.classList.add("mod-app-pinned");
                const pin = element(
                    "span",
                    "mod-app-pinned-label",
                    "★ Vastgezet",
                );
                pin.title = "Deze app is vastgezet";
                tile.append(pin);
            }
            if (app.folderId) {
                const parentFolder = folders.find((f) => f.id === app.folderId);
                if (parentFolder) {
                    const badge = element(
                        "span",
                        "mod-app-folder-badge",
                        `📁 ${parentFolder.name}`,
                    );
                    badge.style.borderColor = parentFolder.color;
                    tile.append(badge);
                }
            }
            const link = element("a", "mod-app-link");
            link.href = app.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.append(
                appIcon(app),
                element("span", "mod-app-name", app.name),
            );

            const menu = element("div", "mod-app-menu");
            const menuButton = button("⋮", "mod-app-menu-button", () =>
                toggleAppMenu(menu),
            );
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
                button(
                    app.folderId
                        ? "Verplaatsen / uit map halen"
                        : "Toevoegen aan groep",
                    "",
                    () => openMoveDialog(app),
                ),
                button("Verwijderen", "mod-app-danger", () => {
                    currentApps = currentApps.filter(
                        (item) => item.id !== app.id,
                    );
                    saveApps();
                    updateGrid();
                }),
            );
            menu.append(menuButton, options);
            tile.append(link, menu);
            bindAppDrag(tile, app);
            grid.append(tile);
        }
        return;
    }

    if (selectedFolder) {
        grid.classList.add("mod-app-folder-grid");
        const heading = element("div", "mod-app-folder-heading");
        heading.append(
            button("← Alle apps", "mod-app-secondary", () => {
                openFolderId = null;
                renderApps();
            }),
            element("h2", "", selectedFolder.name),
            folderMenu(selectedFolder),
        );
        heading.style.setProperty("--mod-folder-color", selectedFolder.color);
        bindAppDrop(heading.querySelector<HTMLElement>("button")!, (app) => {
            delete app.folderId;
        });
        grid.append(heading);
    } else {
        grid.classList.remove("mod-app-folder-grid");
        for (const folder of [...folders].sort(
            (a, b) => Number(b.pinned) - Number(a.pinned),
        )) {
            const members = currentApps.filter(
                (app) => app.folderId === folder.id,
            );
            const tile = element("div", "mod-app-tile mod-app-folder-tile");
            tile.style.setProperty("--mod-folder-color", folder.color);
            tile.dataset.folderId = folder.id;
            bindAppDrop(tile, (app) => {
                app.folderId = folder.id;
            });
            const opener = button("", "mod-app-folder-open", () => {
                openFolderId = folder.id;
                renderApps();
            });
            const preview = element("div", "mod-app-folder-preview");
            for (const app of members.slice(0, 4)) preview.append(appIcon(app));
            opener.append(
                preview,
                element("span", "mod-app-name", folder.name),
            );
            tile.append(opener, folderMenu(folder));
            tile.addEventListener("contextmenu", (event) => {
                event.preventDefault();
                const menu = tile.querySelector<HTMLElement>(".mod-app-menu");
                if (menu) {
                    closeAppMenus();
                    menu.classList.add("open");
                }
            });
            grid.append(tile);
        }
    }
    const add = button("+", "mod-app-add", () =>
        openEditor(undefined, openFolderId ?? undefined),
    );
    add.append(element("span", "", "App toevoegen"));
    grid.append(add);

    const apps = [...currentApps].sort(
        (a, b) => Number(b.pinned) - Number(a.pinned),
    );
    const filtered = apps.filter((app) =>
        selectedFolder
            ? app.folderId === selectedFolder.id
            : !app.folderId ||
              !folders.some((folder) => folder.id === app.folderId),
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
        const menuButton = button("⋮", "mod-app-menu-button", () =>
            toggleAppMenu(menu),
        );
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
            button(
                app.folderId
                    ? "Verplaatsen / uit map halen"
                    : "Toevoegen aan groep",
                "",
                () => openMoveDialog(app),
            ),
            button("Verwijderen", "mod-app-danger", () => {
                currentApps = currentApps.filter((item) => item.id !== app.id);
                saveApps();
                updateGrid();
            }),
        );
        menu.append(menuButton, options);
        tile.append(link, menu);
        tile.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            closeAppMenus();
            menu.classList.add("open");
            menuButton.setAttribute("aria-expanded", "true");
        });
        bindAppDrag(tile, app);
        bindAppDrop(
            tile,
            (moved) => {
                const source = currentApps.indexOf(moved);
                const destination = currentApps.indexOf(app);
                if (source < 0 || destination < 0) return;
                currentApps.splice(source, 1);
                currentApps.splice(destination, 0, moved);
            },
            app.id,
        );
        grid.append(tile);
    }
}

function updatePageOffset(tab: HTMLElement) {
    const layout = Number(get("layout"));
    const isSidebar = layout === 2 || layout === 3 || layout === 5;
    const isRightSidebar = layout === 3;
    const isTopMenuLayout = layout === 5;

    let top = 0;
    let left = 0;
    let right = 0;

    if (isSidebar) {
        const sidebar =
            tab.closest<HTMLElement>("sl-header, sl-tab-bar") ||
            document.querySelector<HTMLElement>(
                "sl-header, sl-tab-bar:first-of-type",
            );
        const sidebarRect = sidebar?.getBoundingClientRect();
        const sidebarWidth =
            sidebarRect && sidebarRect.width > 0
                ? Math.ceil(sidebarRect.width)
                : 120;

        if (isRightSidebar) {
            right = sidebarWidth;
            left = 0;
            top = 0;
        } else {
            left = sidebarWidth;
            right = 0;
            if (isTopMenuLayout) {
                const topMenu = document.getElementById("mod-top-menu");
                top = topMenu
                    ? Math.ceil(topMenu.getBoundingClientRect().height)
                    : 64;
            } else {
                top = 0;
            }
        }
    } else {
        const tabRect = tab.getBoundingClientRect();
        const navigation = tab.closest<HTMLElement>(
            "sl-header, header, nav, sl-tab-bar",
        );
        const navRect = navigation?.getBoundingClientRect();
        top = Math.max(tabRect.bottom, navRect?.bottom ?? 0);
        if (top <= 0 || top >= window.innerHeight) {
            top = 80;
        }
        top = Math.ceil(top);
    }

    document.documentElement.style.setProperty("--mod-app-top", `${top}px`);
    document.documentElement.style.setProperty("--mod-app-left", `${left}px`);
    document.documentElement.style.setProperty("--mod-app-right", `${right}px`);
    document.documentElement.style.setProperty(
        "--mod-app-header-height",
        `${top}px`,
    );

    const page = document.getElementById("mod-app-page");
    if (page && page.parentElement !== document.body) {
        document.body.append(page);
    }
}

const appsSessionKey = "mod-apps-open";

function restoreAppsPage() {
    const tab = document.getElementById("mod-simple-apps-launcher");
    if (!active && tab && sessionStorage.getItem(appsSessionKey) === "true") {
        showApps(tab);
    }
}

function showApps(tab: HTMLElement) {
    active = true;
    sessionStorage.setItem(appsSessionKey, "true");
    document.documentElement.classList.add("mod-apps-open");
    lastActiveTab = document.querySelector<HTMLElement>(
        "sl-tab-item.active:not(#mod-simple-apps-launcher)",
    );
    document.querySelectorAll("sl-tab-item.active").forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    const page = document.getElementById("mod-app-page");
    if (page) {
        updatePageOffset(tab);
        page.dataset.hasBackground = String(hasCustomBackground());
        page.hidden = false;
    }
    renderApps();
}

function hideApps() {
    sessionStorage.removeItem(appsSessionKey);
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
    closeAppMenus();

    if (lastActiveTab?.isConnected) {
        lastActiveTab.classList.add("active");
        lastActiveTab.setAttribute("aria-selected", "true");
    } else {
        const fallback = document.querySelector<HTMLElement>(
            "sl-tab-item:not(#mod-simple-apps-launcher)",
        );
        fallback?.classList.add("active");
        fallback?.setAttribute("aria-selected", "true");
    }
}

function getTabBar(): HTMLElement | null {
    return document.querySelector<HTMLElement>(
        "sl-header sl-tab-bar, sl-tab-bar:first-of-type, sl-tab-bar",
    );
}

function insertTab() {
    const tabBar = getTabBar();
    if (!tabBar) {
        return;
    }

    const currentTab = document.getElementById("mod-simple-apps-launcher");
    const layout = Number(get("layout"));
    const isSidebar = layout === 2 || layout === 3 || layout === 5;
    const isRightSidebar = layout === 3;

    const tabs = Array.from(
        tabBar.querySelectorAll<HTMLElement>("sl-tab-item"),
    ).filter((tab) => tab.id !== "mod-simple-apps-launcher");

    if (tabs.length === 0) {
        return;
    }

    const lastTab = tabs[tabs.length - 1];

    if (
        currentTab &&
        currentTab.parentElement === tabBar &&
        currentTab.previousElementSibling === lastTab
    ) {
        currentTab.dataset.sidebar = isSidebar ? "true" : "false";
        currentTab.dataset.rightSidebar = isRightSidebar ? "true" : "false";
        return;
    }

    const launcher = currentTab ?? document.createElement("sl-tab-item");
    if (!currentTab) {
        launcher.id = "mod-simple-apps-launcher";
        const item = element("div", "item");
        const iconWrapper = element("i", "mod-app-nav-icon");
        iconWrapper.innerHTML =
            "<svg viewBox='0 0 24 24' width='24' height='24' fill='currentColor' aria-hidden='true'><rect x='2' y='2' width='8' height='8' rx='1'/><rect x='14' y='2' width='8' height='8' rx='1'/><rect x='2' y='14' width='8' height='8' rx='1'/><rect x='14' y='14' width='8' height='8' rx='1'/></svg>";
        const label = element("span", "mod-app-nav-label", "Apps");
        item.append(iconWrapper, label);
        launcher.append(item);
        launcher.classList.add("mod-app-nav-tab");
        launcher.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (active) {
                hideApps();
            } else {
                showApps(launcher);
            }
        });
    }

    launcher.dataset.sidebar = isSidebar ? "true" : "false";
    launcher.dataset.rightSidebar = isRightSidebar ? "true" : "false";
    if (active) {
        launcher.classList.add("active");
        launcher.setAttribute("aria-selected", "true");
    } else {
        launcher.classList.remove("active");
        launcher.removeAttribute("aria-selected");
    }
    lastTab.insertAdjacentElement("afterend", launcher);
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
        document.getElementById("mod-app-styles")?.remove();
        return;
    }
    if (!document.getElementById("mod-app-styles")) {
        const styles = element("style");
        styles.id = "mod-app-styles";
        styles.textContent = `
#mod-simple-apps-launcher {
    cursor: pointer;
    position: relative;
    user-select: none;
}

#mod-simple-apps-launcher svg {
    fill: currentColor !important;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) {
    display: inline-flex !important;
    height: 100% !important;
    align-items: center !important;
    color: var(--action-neutral-normal, rgba(255, 255, 255, 0.7)) !important;
    fill: var(--action-neutral-normal, rgba(255, 255, 255, 0.7)) !important;
    transition: color 0.2s ease, fill 0.2s ease;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .item,
#mod-simple-apps-launcher:not([data-sidebar="true"]) .mod-app-nav-label,
#mod-simple-apps-launcher:not([data-sidebar="true"]) .mod-app-nav-icon,
#mod-simple-apps-launcher:not([data-sidebar="true"]) i,
#mod-simple-apps-launcher:not([data-sidebar="true"]) span {
    color: inherit !important;
    fill: inherit !important;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]):hover,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover .item,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover .mod-app-nav-label,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover .mod-app-nav-icon,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover i,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover span,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active .item,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active .mod-app-nav-label,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active .mod-app-nav-icon,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active i,
#mod-simple-apps-launcher:not([data-sidebar="true"]).active span {
    color: var(--mod-app-nav-highlight, #fff) !important;
    fill: var(--mod-app-nav-highlight, #fff) !important;
}

:root:not(.dark):not(.night):not(.mod-winter) #mod-simple-apps-launcher:not([data-sidebar="true"]) {
    --mod-app-nav-highlight: var(--action-primary-normal, #006bc9);
}
:root:not(.dark):not(.night):not(.mod-winter) #mod-simple-apps-launcher:not([data-sidebar="true"]):hover,
:root:not(.dark):not(.night):not(.mod-winter) #mod-simple-apps-launcher:not([data-sidebar="true"]).active {
    --mod-app-nav-highlight: #006bc9;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .item i,
#mod-simple-apps-launcher:not([data-sidebar="true"]) .item .mod-app-nav-icon,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover .item i,
#mod-simple-apps-launcher:not([data-sidebar="true"]):hover .item .mod-app-nav-icon {
    scale: 1 !important;
    transform: none !important;
    transition: none !important;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .item {
    display: inline-flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px;
    height: 100% !important;
    padding: 0 14px !important;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .mod-app-nav-icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 24px;
    width: 24px;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .mod-app-nav-icon svg {
    width: 22px !important;
    height: 22px !important;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]) .mod-app-nav-label {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
}

#mod-simple-apps-launcher:not([data-sidebar="true"]).active::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--action-accent-normal, var(--orange-50, #f59b21));
    pointer-events: none;
}

#mod-simple-apps-launcher[data-sidebar="true"] {
    display: block !important;
    width: 100% !important;
    height: 120px !important;
    position: relative !important;
    color: var(--action-neutral-normal, #fff) !important;
    fill: var(--action-neutral-normal, #fff) !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .item,
#mod-simple-apps-launcher[data-sidebar="true"] .mod-app-nav-label,
#mod-simple-apps-launcher[data-sidebar="true"] .mod-app-nav-icon,
#mod-simple-apps-launcher[data-sidebar="true"] i,
#mod-simple-apps-launcher[data-sidebar="true"] span {
    color: inherit !important;
    fill: inherit !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    height: 100% !important;
    width: 100% !important;
    padding: 0 !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .item i,
#mod-simple-apps-launcher[data-sidebar="true"] .item .mod-app-nav-icon {
    transition: scale 0.3s ease, transform 0.3s ease !important;
    transform-origin: center center;
}

#mod-simple-apps-launcher[data-sidebar="true"]:hover .item i,
#mod-simple-apps-launcher[data-sidebar="true"]:hover .item .mod-app-nav-icon,
#mod-simple-apps-launcher[data-sidebar="true"] .item:hover i,
#mod-simple-apps-launcher[data-sidebar="true"] .item:hover .mod-app-nav-icon {
    scale: 0.9 !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .mod-app-nav-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    height: 36px !important;
    width: 100% !important;
    margin: 0 auto !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .mod-app-nav-icon svg {
    width: 36px !important;
    height: 36px !important;
}

#mod-simple-apps-launcher[data-sidebar="true"] .mod-app-nav-label {
    font-size: 14px !important;
    margin-top: 6px !important;
    text-align: center !important;
    display: block !important;
    white-space: nowrap !important;
}

#mod-simple-apps-launcher[data-sidebar="true"].active,
#mod-simple-apps-launcher[data-sidebar="true"].active .item,
#mod-simple-apps-launcher[data-sidebar="true"].active .mod-app-nav-label,
#mod-simple-apps-launcher[data-sidebar="true"].active .mod-app-nav-icon {
    color: var(--action-neutral-normal, #fff) !important;
    fill: var(--action-neutral-normal, #fff) !important;
}

#mod-simple-apps-launcher[data-sidebar="true"].active::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    height: 100%;
    right: 0;
    background: var(--action-accent-normal, var(--orange-50, #f59b21));
    pointer-events: none;
    z-index: 2;
}

#mod-simple-apps-launcher[data-sidebar="true"][data-right-sidebar="true"].active::after {
    right: auto;
    left: 0;
}

#mod-app-page,
#mod-app-editor {
    --mod-app-tile-bg: rgba(255, 255, 255, 0.88);
    --mod-app-border-color: rgba(0, 0, 0, 0.12);
    --mod-app-surface: var(--bg-neutral-none, #fff);
    --mod-app-text: var(--text-strong, #263442);
    --mod-app-muted: var(--text-weak, #66758a);
    --mod-app-border: var(--thinnest-solid-neutral-normal, 1px solid #dce3eb);
    --mod-app-hover: var(--bg-neutral-weakest, #edf3f8);
    --mod-app-primary: var(--action-primary-normal, #006bc9);
    --mod-app-soft: var(--bg-primary-weakest, #e6f2ff);
    color: var(--mod-app-text);
    color-scheme: light;
}

:root.dark #mod-app-page,
:root.dark #mod-app-editor {
    --mod-app-tile-bg: rgba(32, 37, 43, 0.88);
    --mod-app-border-color: rgba(255, 255, 255, 0.13);
    --mod-app-surface: var(--bg-neutral-none, #20252b);
    --mod-app-text: var(--text-strong, #f0f3f7);
    --mod-app-muted: var(--text-weak, #b7c0cb);
    --mod-app-hover: var(--bg-neutral-weakest, #303841);
    --mod-app-soft: var(--bg-primary-weakest, #1a344d);
    color-scheme: dark;
}

:root.night #mod-app-page,
:root.night #mod-app-editor {
    --mod-app-tile-bg: rgba(18, 18, 18, 0.92);
    --mod-app-border-color: rgba(255, 255, 255, 0.16);
    --mod-app-surface: var(--bg-neutral-none, #000);
    --mod-app-text: var(--text-strong, #f0f3f7);
    --mod-app-muted: var(--text-weak, #b7c0cb);
    --mod-app-hover: var(--bg-neutral-weakest, #222);
    --mod-app-soft: var(--bg-primary-weakest, #1a344d);
    color-scheme: dark;
}

#mod-app-page {
    position: fixed;
    top: var(--mod-app-top, var(--mod-app-header-height, 80px));
    right: var(--mod-app-right, 0);
    bottom: 0;
    left: var(--mod-app-left, 0);
    z-index: 25;
    isolation: isolate;
    pointer-events: auto;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: transparent;
    color: var(--mod-app-text);
}

#mod-app-page[data-has-background="true"] .mod-app-tile,
#mod-app-page[data-has-background="true"] .mod-app-add,
#mod-app-page[data-has-background="true"] .mod-app-search,
#mod-app-page[data-has-background="true"] .mod-app-folder-heading,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-tile,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-add,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-search,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-folder-heading {
    background: var(--mod-app-tile-bg);
    border-color: var(--mod-app-border-color);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.16);
    backdrop-filter: blur(max(var(--mod-uiblur, 0px), 8px));
    -webkit-backdrop-filter: blur(max(var(--mod-uiblur, 0px), 8px));
}

#mod-app-page[data-has-background="true"] .mod-app-tile.mod-app-pinned,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-tile.mod-app-pinned {
    background: linear-gradient(180deg, var(--mod-app-soft) 0%, var(--mod-app-tile-bg) 65%);
}

#mod-app-page[data-has-background="true"] .mod-app-folder-preview,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-folder-preview {
    background: color-mix(in srgb, var(--mod-folder-color) 25%, var(--mod-app-tile-bg));
}

#mod-app-page[data-has-background="true"] .mod-app-heading h1,
#mod-app-page[data-has-background="true"] .mod-app-heading p,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-heading h1,
:root:has(#mod-background, #mod-backgroundslide, #mod-background-live, #mod-backgroundcolor) #mod-app-page .mod-app-heading p {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

#mod-app-page[hidden] {
    display: none;
}

html.mod-apps-open sl-header,
html.mod-apps-open sl-topbar,
html.mod-apps-open header:has(sl-tab-item),
html.mod-apps-open nav:has(sl-tab-item),
html.mod-apps-open #mod-top-menu,
html.mod-apps-open sl-tab-bar,
html.mod-apps-open sl-tab-item {
    z-index: 100 !important;
}

html.mod-apps-open .menu-avatar,
html.mod-apps-open .selector-options,
html.mod-apps-open .selector-option,
html.mod-apps-open sl-popup,
html.mod-apps-open hmy-popup,
html.mod-apps-open [role="menu"],
html.mod-apps-open [role="listbox"] {
    z-index: 102 !important;
}

html.mod-apps-open body {
    overflow-y: hidden !important;
    overscroll-behavior: none;
}

html.mod-apps-open sl-root,
html.mod-apps-open sl-home,
html.mod-apps-open sl-start {
    background: transparent !important;
}

html.mod-apps-open sl-root > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-root > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-home > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-home > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-start > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-start > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open router-outlet ~ *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open router-outlet ~ *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-cijfers > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-cijfers > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-rooster > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-rooster > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-rooster-weken > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-rooster-weken > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-berichten > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-berichten > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-studiewijzer > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-studiewijzer > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-studiewijzer-weken > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-studiewijzer-weken > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-sidebar-page > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-sidebar-page > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-main-content > *:not(:has(sl-header)):not(sl-header),
html.mod-apps-open sl-main-content > *:not(:has(sl-header)):not(sl-header) *,
html.mod-apps-open sl-registratie-overzicht,
html.mod-apps-open sl-registratie-overzicht *,
html.mod-apps-open sl-gepubliceerde-schoolinformatie-navigation,
html.mod-apps-open sl-gepubliceerde-schoolinformatie-navigation *,
html.mod-apps-open .datum-container,
html.mod-apps-open .datum-container *,
html.mod-apps-open sl-dagen-header,
html.mod-apps-open sl-dagen-header *,
html.mod-apps-open .berichten-lijst,
html.mod-apps-open .berichten-lijst *,
html.mod-apps-open sl-studiewijzer-weken-header,
html.mod-apps-open sl-studiewijzer-weken-header *,
html.mod-apps-open sl-rooster-tijden,
html.mod-apps-open sl-rooster-tijden *,
html.mod-apps-open sl-vakresultaten,
html.mod-apps-open sl-vakresultaten *,
html.mod-apps-open sl-plaatsingen,
html.mod-apps-open sl-plaatsingen *,
html.mod-apps-open #mod-new-year,
html.mod-apps-open #mod-new-year * {
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
}

html.mod-apps-open sl-header,
html.mod-apps-open sl-header *,
html.mod-apps-open sl-topbar,
html.mod-apps-open sl-topbar *,
html.mod-apps-open header:has(sl-tab-item),
html.mod-apps-open header:has(sl-tab-item) *,
html.mod-apps-open nav:has(sl-tab-item),
html.mod-apps-open nav:has(sl-tab-item) *,
html.mod-apps-open sl-tab-bar,
html.mod-apps-open sl-tab-bar *,
html.mod-apps-open sl-tab-item,
html.mod-apps-open sl-tab-item *,
html.mod-apps-open #mod-simple-apps-launcher,
html.mod-apps-open #mod-simple-apps-launcher *,
html.mod-apps-open #mod-top-menu,
html.mod-apps-open #mod-top-menu *,
html.mod-apps-open #mod-logo-wrapper,
html.mod-apps-open #mod-logo-wrapper *,
html.mod-apps-open #mod-logo,
html.mod-apps-open #mod-logo *,
html.mod-apps-open sl-popup,
html.mod-apps-open sl-popup *,
html.mod-apps-open hmy-popup,
html.mod-apps-open hmy-popup *,
html.mod-apps-open .menu-avatar,
html.mod-apps-open .menu-avatar *,
html.mod-apps-open .selector-options,
html.mod-apps-open .selector-option,
html.mod-apps-open [role="menu"],
html.mod-apps-open [role="listbox"],
html.mod-apps-open #mod-app-page,
html.mod-apps-open #mod-app-editor,
html.mod-apps-open #somtoday-mod,
html.mod-apps-open #somtoday-mod * {
    visibility: visible !important;
    opacity: 1 !important;
    pointer-events: auto !important;
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
    color: var(--mod-app-muted);
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
    border: 1px solid var(--border-neutral-normal, #dce3eb);
    border-radius: 8px;
    background: var(--mod-app-surface);
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
    border-color: var(--mod-app-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--mod-app-primary) 18%, transparent);
}

.mod-app-primary {
    border: 0;
    border-radius: 8px;
    background: var(--mod-app-primary);
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
    border: 1px solid var(--border-neutral-normal, #dce3eb);
    border-radius: 12px;
    background: var(--mod-app-surface);
    color: inherit;
    transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

 .mod-app-drag-preview {
    position: fixed !important;
    left: -10000px !important;
    top: 0 !important;
    box-sizing: border-box;
    pointer-events: none;
    border-radius: 12px;
    box-shadow: 0 8px 24px #0003;
}
#mod-app-grid .mod-app-dragging {
    opacity: .35 !important;
    transform: scale(.96);
}
#mod-app-grid .mod-app-drop-target {
    border-color: var(--mod-app-primary, #006bc9) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--mod-app-primary, #006bc9) 28%, transparent);
    transform: scale(1.035);
}
#mod-app-grid .mod-app-folder-tile.mod-app-drop-target {
    background: color-mix(in srgb, var(--mod-folder-color) 15%, var(--mod-app-surface));
}
#mod-app-grid .mod-app-link, #mod-app-grid .mod-app-link img {
    -webkit-user-drag: none;
    user-select: none;
}
@media (prefers-reduced-motion: reduce) {
    #mod-app-grid .mod-app-dragging, #mod-app-grid .mod-app-drop-target { transform: none; transition: none; }
}
.mod-app-tile {
    display: flex;
    flex-direction: column;
    overflow: visible;
    cursor: grab;
}

.mod-app-tile.mod-app-pinned {
    border-color: var(--mod-app-primary);
    background: linear-gradient(180deg, var(--mod-app-soft) 0%, var(--mod-app-surface) 65%);
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
    background: var(--mod-app-soft);
    color: var(--mod-app-primary);
    font-size: 11px;
    font-weight: 700;
    pointer-events: none;
}


#mod-app-page .mod-app-view-row { display:flex; justify-content:flex-end; margin-top:12px; }
#mod-app-page .mod-app-view-row + .mod-app-toolbar { margin-top:8px; }
.mod-app-view-controls { display:flex; gap:4px; padding:3px; border:1px solid var(--border-neutral-normal,#dce3eb); border-radius:8px; background:var(--mod-app-surface); }
.mod-app-view-button { display:grid; place-items:center; width:32px; height:30px; border:0; border-radius:5px; background:transparent; color:var(--mod-app-muted); cursor:pointer; transition:background .18s,color .18s,transform .18s; }
.mod-app-view-button svg { width:18px; height:18px; }
.mod-app-view-button:hover { background:var(--mod-app-hover); color:var(--mod-app-primary); }
.mod-app-view-button[aria-pressed="true"] { background:var(--mod-app-primary); color:#fff; }
.mod-app-view-button:active { transform:scale(.94); }
.mod-app-tile.mod-app-pinned .mod-app-folder-badge { top:38px; }
.mod-app-grid.mod-app-list-view { grid-template-columns:minmax(0,1fr); gap:8px; }
.mod-app-list-view .mod-app-tile, .mod-app-list-view .mod-app-add { min-height:64px; }
.mod-app-list-view .mod-app-link, .mod-app-list-view .mod-app-folder-open { flex-direction:row; justify-content:flex-start; text-align:left; gap:14px; padding:10px 52px 10px 14px; box-sizing:border-box; }
.mod-app-list-view .mod-app-link > .mod-app-icon { width:40px; height:40px; flex:0 0 40px; font-size:20px; border-radius:9px; }
.mod-app-list-view .mod-app-folder-preview { grid-template-columns:repeat(2,14px); grid-template-rows:repeat(2,14px); min-height:0; padding:5px; gap:2px; border-radius:8px; }
.mod-app-list-view .mod-app-folder-preview .mod-app-icon { width:14px; height:14px; font-size:9px; border-radius:3px; }
.mod-app-list-view .mod-app-menu { top:16px; }
.mod-app-list-view .mod-app-add { display:flex; flex-direction:row; align-items:center; justify-content:center; gap:10px; }
.mod-app-list-view .mod-app-pinned-label, .mod-app-list-view .mod-app-folder-badge { position:static; align-self:flex-start; margin:5px 52px 0 14px; max-width:calc(100% - 70px); }
.mod-app-list-view .mod-app-tile:hover { transform:translateX(2px); }
@media (prefers-reduced-motion: reduce) { .mod-app-view-button { transition:none; } }

.mod-app-folder-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    max-width: calc(100% - 58px);
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 11px;
    background: var(--mod-app-hover);
    border: 1px solid var(--border-neutral-normal, #aaa);
    pointer-events: none;
}

.mod-app-tile:hover,
.mod-app-add:hover {
    border-color: var(--mod-app-primary);
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
    background: var(--mod-app-soft);
    color: var(--mod-app-primary);
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
    color: var(--mod-app-muted);
    font-size: 22px;
    cursor: pointer;
}

.mod-app-menu-button:hover,
.mod-app-menu.open .mod-app-menu-button {
    background: var(--mod-app-hover);
}

.mod-app-menu-options {
    display: none;
    position: absolute;
    top: 34px;
    right: 0;
    width: 210px;
    padding: 5px;
    border: 1px solid var(--border-neutral-normal, #dce3eb);
    border-radius: 9px;
    background: var(--mod-app-surface);
    box-shadow: 0 8px 24px #101d2b20;
}

#mod-app-grid .mod-app-tile:has(.mod-app-menu.open) {
    position: relative;
    z-index: 100;
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
    background: var(--mod-app-hover);
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
    color: var(--mod-app-primary);
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
    border: 1px solid var(--border-neutral-normal, #dce3eb);
    border-radius: 16px;
    padding: 28px;
    background: var(--mod-app-surface);
    color: var(--mod-app-text);
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
    background: var(--mod-app-primary);
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
    border-top: 1px solid var(--border-neutral-normal, #dce3eb);
}

.mod-app-secondary {
    border: 1px solid var(--border-neutral-normal, #dce3eb);
    border-radius: 8px;
    background: var(--mod-semi-transparant, transparent);
    color: inherit;
    padding: 11px 17px;
    cursor: pointer;
    font: inherit;
    font-weight: 550;
    backdrop-filter: blur(var(--mod-uiblur, 0px));
    -webkit-backdrop-filter: blur(var(--mod-uiblur, 0px));
}

.mod-app-error {
    margin: 0;
    color: #c92a2a;
    font-size: 13px;
}

.mod-app-error:empty {
    display: none;
}

.mod-app-color-picker { position:relative; display:flex; align-items:center; gap:12px; width:max-content; min-height:48px; padding:6px 12px; border:1px solid var(--border-neutral-normal, #aaa); border-radius:10px; background:var(--mod-app-hover); cursor:pointer; }
.mod-app-color-preview { width:30px; height:30px; border-radius:7px; border:1px solid #8886; pointer-events:none; }
.mod-app-color-value { color:var(--mod-app-text); font:inherit; font-weight:600; pointer-events:none; }
.mod-app-editor-form .mod-app-color-picker input[type="color"] { position:absolute; inset:0; width:100% !important; height:100% !important; opacity:0.01; cursor:pointer; padding:0; }
.mod-app-folder-picker { position:relative; width:100%; }
.mod-app-folder-picker-trigger { width:100%; display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border:1px solid var(--border-neutral-normal, #aaa); border-radius:9px; background:var(--mod-app-surface); color:var(--mod-app-text); font:inherit; cursor:pointer; text-align:left; }
.mod-app-folder-picker-trigger:focus-visible { outline:2px solid var(--mod-app-primary); outline-offset:2px; }
.mod-app-folder-chevron { font-size:20px; }
.mod-app-folder-picker-options { display:none; position:absolute; top:calc(100% + 5px); left:0; right:0; max-height:240px; overflow-y:auto; padding:5px; border:1px solid var(--border-neutral-normal, #aaa); border-radius:9px; background:var(--mod-app-surface); box-shadow:0 10px 25px #0003; z-index:100; }
.mod-app-folder-picker.open .mod-app-folder-picker-options { display:flex; flex-direction:column; }
.mod-app-folder-picker-option { display:block; width:100%; padding:11px 12px; text-align:left; border:0; border-radius:6px; background:transparent; color:var(--mod-app-text); font:inherit; cursor:pointer; }
.mod-app-folder-picker-option:hover, .mod-app-folder-picker-option:focus-visible { background:var(--mod-app-hover); }
.mod-app-create-actions { display:flex; gap:4px; align-items:stretch; }
.mod-app-create-dropdown { position:relative; }
.mod-app-create-arrow { height:100%; min-width:40px; }
.mod-app-create-options { display:none; position:absolute; top:calc(100% + 5px); right:0; z-index:50; min-width:175px; padding:5px; border:1px solid var(--border-neutral-normal, #aaa); border-radius:8px; background:var(--mod-app-surface); box-shadow:0 8px 24px #0003; }
.mod-app-create-dropdown.open .mod-app-create-options { display:block; }
.mod-app-create-options button { width:100%; border:0; background:transparent; color:var(--mod-app-text); text-align:left; padding:10px; cursor:pointer; }
.mod-app-create-options button:hover { background:var(--mod-app-hover); }
.mod-app-tile { position:relative; }
.mod-app-folder-tile { border-color:var(--mod-folder-color); border-width: 1.5px; }
.mod-app-folder-open { border:0; background:transparent; color:var(--mod-app-text); cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%; height:100%; padding:18px; }
.mod-app-folder-preview { display:grid; grid-template-columns:repeat(2, 36px); grid-template-rows:repeat(2, 36px); gap:3px; padding:10px; border-radius:12px; background:color-mix(in srgb, var(--mod-folder-color) 25%, var(--mod-app-tile-bg, var(--mod-app-surface))); min-height:72px; }
.mod-app-folder-preview .mod-app-icon { width:36px; height:36px; font-size:14px; }
.mod-app-folder-heading { grid-column:1/-1; display:flex; align-items:center; justify-content:center; gap:16px; position:relative; padding:14px 20px; border-radius:12px; border:1px solid var(--mod-app-border-color, #aaa); border-bottom:3px solid var(--mod-folder-color); background:var(--mod-app-tile-bg, var(--mod-app-surface)); box-shadow:0 4px 18px rgba(0, 0, 0, 0.16); }
.mod-app-folder-heading h2 { margin:0; color:var(--mod-app-text); }
.mod-app-folder-grid { max-width:780px; margin-inline:auto; }
.mod-app-hint { display:block; font-weight:400; color:var(--mod-app-muted); }
.mod-app-editor-form input[type="color"] { width:64px; height:42px; padding:2px; border:1px solid var(--border-neutral-normal, #aaa); background:transparent; border-radius:8px; }

@media (max-width: 600px) {
    #mod-app-page {
        top: var(--mod-app-header-height, 72px);
        left: 0 !important;
        right: 0 !important;
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

    const page = document.getElementById("mod-app-page") ?? element("main");
    if (!page.id) {
        page.id = "mod-app-page";
        page.hidden = true;
        document.body.append(page);
    }
    page.dataset.hasBackground = String(hasCustomBackground());
    if (!active) {
        currentApps = loadApps();
        folders = loadFolders();
    }
    insertTab();
    restoreAppsPage();

    if (!tabObserver) {
        tabObserver = new MutationObserver(() => {
            if (tabUpdatePending) {
                return;
            }
            tabUpdatePending = true;
            requestAnimationFrame(() => {
                tabUpdatePending = false;
                if (
                    get("appsEnabled") === false ||
                    get("appsEnabled") === "false"
                ) {
                    simpleApps();
                    return;
                }
                insertTab();
                restoreAppsPage();
                if (active) {
                    const tab = document.getElementById(
                        "mod-simple-apps-launcher",
                    );
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
        window.addEventListener("somtoday-mod-apps-setting-changed", () =>
            simpleApps(),
        );
        window.addEventListener("resize", () => {
            if (!active) {
                return;
            }
            const tab = document.getElementById("mod-simple-apps-launcher");
            if (tab) {
                updatePageOffset(tab);
            }
        });
        window.addEventListener("popstate", () => hideApps());
        window.addEventListener("hashchange", () => hideApps());
        document.documentElement.dataset.modAppsListener = "true";
        document.addEventListener(
            "pointerdown",
            (event) => {
                const target = event.target;
                if (
                    target instanceof Element &&
                    !target.closest(
                        ".mod-app-menu, .mod-app-create-dropdown, .mod-app-folder-picker",
                    )
                ) {
                    closeAppMenus();
                }
            },
            true,
        );
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                const editor = document.getElementById("mod-app-editor");
                if (editor) {
                    editor.remove();
                    return;
                }
                if (
                    document.querySelector(
                        ".mod-app-menu.open, .mod-app-create-dropdown.open, .mod-app-folder-picker.open",
                    )
                ) {
                    closeAppMenus();
                    return;
                }
                if (active) {
                    hideApps();
                }
            }
        });
        document.addEventListener(
            "click",
            (event) => {
                const target = event.target as HTMLElement;
                if (
                    target.closest(
                        "sl-tab-item:not(#mod-simple-apps-launcher), .menu-avatar, .selector-option, #mod-top-menu, #mod-logo",
                    )
                ) {
                    hideApps();
                }
            },
            true,
        );
    }
}
