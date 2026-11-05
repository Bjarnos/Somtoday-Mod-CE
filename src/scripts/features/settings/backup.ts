import { get, set } from "../../save_version_management";
import {
    id,
    n,
    parseJSON,
    sanitizeString,
    tn,
} from "../../shorthand_functions";
import { closeModMessage, modMessage } from "../extras/modMessage";
import { fonts } from "../theme/fonts";
import { saveReload } from "./slideshow";

export const settingKeys = [
    "primarycolor",
    "secondarycolor",
    "nicknames",
    "bools",
    "title",
    "icon",
    "background",
    "backgroundtype",
    "backgroundcolor",
    "livetype",
    "livecolor1",
    "livecolor2",
    "livecolor3",
    "ui",
    "uiblur",
    "fontname",
    "theme",
    "preset",
    "layout",
    "profilepic",
    "username",
    "brightness",
    "contrast",
    "saturate",
    "opacity",
    "huerotate",
    "grayscale",
    "sepia",
    "invert",
    "blur",
    "homework",
    "menuwidth",
    "isbackgroundvideo",
    "customfont",
    "customfontname",
    "letterbeoordelingen",
    "customcss",
];

export function exportSettings() {
    const settings: Record<string, any> = {};
    for (const key of settingKeys) {
        settings[key] = get(key);
    }
    let i = 0;
    while (!n(get(`background${i}`))) {
        settings[`background${i}`] = get(`background${i}`);
        i++;
    }
    const json = JSON.stringify(settings);
    const saveData = (() => {
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        return (fileName: string) => {
            const blob = new Blob([json], { type: "octet/stream" });
            const url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        };
    })();

    saveData("config.json");
}

// Ensure the new value is valid
export async function keyIsValid(key: string, value: any) {
    if (value == null) {
        return false;
    }
    if (
        key == "primarycolor" ||
        key == "secondarycolor" ||
        key == "backgroundcolor"
    ) {
        return /^#[0-9a-fA-F]{6}$/.test(value);
    } else if (key == "bools") {
        return /^(0|1){18,}$/.test(value);
    } else if (key == "ui" || key == "uiblur") {
        return value >= 0 && value <= 100;
    } else if (key == "menuwidth") {
        return value >= 50 && value <= 700;
    } else if (
        key == "brightness" ||
        key == "contrast" ||
        key == "saturate" ||
        key == "opacity" ||
        key == "grayscale" ||
        key == "sepia" ||
        key == "invert"
    ) {
        return /^\d+%$/.test(value);
    } else if (key == "huerotate") {
        return /^\d+deg$/.test(value);
    } else if (key == "blur") {
        return /^\d+(\.\d+)?px$/.test(value);
    } else if (key == "layout") {
        return value >= 1 && value <= 5;
    } else if (key == "nicknames") {
        const json = parseJSON(value);
        if (json === null || !Array.isArray(json)) {
            return false;
        }
        let mayContainHTMLTag = false;
        let i = 0;
        for (const nickname of json) {
            if (nickname.length != 2 && nickname.length != 3) {
                return false;
            }
            if (
                /<\/?[a-z][\s\S]*>/i.test(nickname[0]) ||
                /<\/?[a-z][\s\S]*>/i.test(nickname[1])
            ) {
                mayContainHTMLTag = true;
                json[i][0] = sanitizeString(nickname[0]);
                json[i][1] = sanitizeString(nickname[1]);
                if (
                    nickname.length == 3 &&
                    /<\/?[a-z][\s\S]*>/i.test(nickname[2])
                ) {
                    json[i][2] = sanitizeString(nickname[2]);
                }
            }
            i++;
        }
        if (mayContainHTMLTag) {
            while (id("mod-message")) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            modMessage(
                "Onveilige instellingswaarde",
                'Het lijkt erop dat de instellingswaarde voor "Nicknames" HTML-elementen bevat, waarmee er onveilige code op je computer uitgevoerd kan worden. Wil je deze HTML elementen weghalen voor de veiligheid?',
                "Weghalen",
                "Behouden",
                false,
                true,
            );
            id("mod-message-action1").addEventListener("click", () => {
                set("nicknames", JSON.stringify(json));
                closeModMessage();
                saveReload(true);
                tn("sl-root", 0).inert = false;
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).inert = false;
                }
            });
            id("mod-message-action2").addEventListener("click", () => {
                set("nicknames", value);
                closeModMessage();
                saveReload(true);
                tn("sl-root", 0).inert = false;
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).inert = false;
                }
            });
            return null;
        }
        return true;
    } else if (key == "username") {
        if (/<\/?[a-z][\s\S]*>/i.test(value)) {
            while (id("mod-message")) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            modMessage(
                "Onveilige instellingswaarde",
                'Het lijkt erop dat de instellingswaarde voor "Username" HTML-elementen bevat, waarmee er onveilige code op je computer uitgevoerd kan worden. Wil je deze HTML elementen weghalen voor de veiligheid?',
                "Weghalen",
                "Behouden",
                false,
                true,
            );
            id("mod-message-action1").addEventListener("click", () => {
                set("username", sanitizeString(value));
                closeModMessage();
                saveReload(true);
                tn("sl-root", 0).inert = false;
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).inert = false;
                }
            });
            id("mod-message-action2").addEventListener("click", () => {
                set("username", value);
                closeModMessage();
                saveReload(true);
                tn("sl-root", 0).inert = false;
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).inert = false;
                }
            });
            return null;
        }
        return true;
    } else if (key == "homework" || key == "letterbeoordelingen") {
        return parseJSON(value) !== null;
    } else if (
        key == "icon" ||
        key == "background" ||
        key == "profilepic" ||
        key == "customfont"
    ) {
        return value.startsWith("data:");
    } else if (key == "backgroundtype") {
        return (
            value == "image" ||
            value == "color" ||
            value == "slideshow" ||
            value == "live"
        );
    } else if (key == "fontname") {
        return fonts.includes(value);
    } else if (key == "isbackgroundvideo") {
        return (
            value === true ||
            value === false ||
            value === "true" ||
            value === "false"
        );
    }

    return true;
}

export async function importSettings(this: HTMLInputElement) {
    if (!this.files?.[0]) return;
    reset();
    new Response(this.files[0]).json().then(
        (json) => {
            let closeModMessages = true;
            modMessage(
                "Laden...",
                "Dit kan even duren als je veel afbeeldingen hebt ingesteld...",
            );
            Object.keys(json).forEach(async (key) => {
                if (settingKeys.includes(key)) {
                    const isValid = await keyIsValid(key, json[key]);
                    if (isValid) {
                        set(key, json[key]);
                    } else if (isValid === null) {
                        closeModMessages = false;
                    }
                }
            });
            saveReload(true);
            tn("sl-root", 0).inert = false;
            if (tn("sl-modal", 0)) {
                tn("sl-modal", 0).inert = false;
            }
            if (closeModMessages) {
                closeModMessage();
            }
            // For some reason it sometimes needs a timeout to load properly
            setTimeout(() => {
                saveReload(true);
            }, 1000);
        },
        (_err) => {
            modMessage(
                "Oeps...",
                "Het lijkt erop dat dit bestand ongeldig is.",
                "Oke",
            );
            id("mod-message-action1").addEventListener(
                "click",
                closeModMessage,
            );
        },
    );
}

export function reset() {
    const isDarkMode =
        tn("html", 0)?.classList.contains("dark") ||
        tn("html", 0)?.classList.contains("night");
    set("primarycolor", "#0067c2");
    set("secondarycolor", "#e69b22");
    set("nicknames", "[]");
    set("bools", "110001110111101111100000000000");
    set("title", "");
    set("icon", "");
    set("background", "");
    set("backgroundtype", "image");
    set("backgroundcolor", isDarkMode ? "#20262d" : "#ffffff");
    set("livetype", "");
    set("livecolor1", "");
    set("livecolor2", "");
    set("livecolor3", "");
    set("ui", 0);
    set("uiblur", 0);
    set("fontname", "Open Sans");
    set("theme", "light");
    set("preset", "Standaard");
    set("layout", 1);
    set("profilepic", "");
    set("username", "");
    set("brightness", "100%");
    set("contrast", "100%");
    set("saturate", "100%");
    set("opacity", "100%");
    set("huerotate", "0deg");
    set("grayscale", "0%");
    set("sepia", "0%");
    set("invert", "0%");
    set("blur", "0px");
    set("menuwidth", 110);
    set("isbackgroundvideo", false);
    set("customfont", "");
    set("customfontname", "");
    set("letterbeoordelingen", "");
    set("customcss", "");
    set("loginschool", "");
    set("loginname", "");
    set("loginpass", "");
    let i = 0;
    while (!n(get(`background${i}`))) {
        set(`background${i}`, "");
        i++;
    }
}
