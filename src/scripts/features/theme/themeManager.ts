import { adjust, getRelativeLuminance, hexToRgb } from "../../colors";
import { get } from "../../save_version_management";

export let menuColor = "#fff";
export let highLightColor = "#000";

export function getMenuColor(): string {
    const primary = get("primarycolor");
    if (!primary) return "#fff";
    if (getRelativeLuminance(hexToRgb(primary)) >= 240) {
        return adjust(primary, -170);
    } else if (getRelativeLuminance(hexToRgb(primary)) >= 160) {
        return adjust(primary, -110);
    } else {
        return "#fff";
    }
}

export function getHighlightColor(): string {
    const primary = get("primarycolor");
    if (!primary) return "#000";
    if (getRelativeLuminance(hexToRgb(primary)) >= 160) {
        return adjust(primary, -35);
    } else {
        return adjust(primary, 35);
    }
}

export function updateMenuColors(): void {
    menuColor = getMenuColor();
    highLightColor = getHighlightColor();
}

export function initTheme() {
    const theme = get("theme");
    if (
        (theme == "light" || theme == "dark" || theme == "night") &&
        get("autotheme") !== "true"
    ) {
        const html = document.documentElement;
        html.classList.remove("light", "dark", "night");
        html.classList.add(theme);
    }
}
