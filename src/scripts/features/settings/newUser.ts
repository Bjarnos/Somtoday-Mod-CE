import {
    data,
    get,
    hasSettingsHash,
    set,
    storageLoadFailed,
    storageMethod,
} from "../../save_version_management";
import { cn, execute, id, n, tn, tryRemove } from "../../shorthand_functions";
import { reset } from "./backup";
import { closeSettings, openSettings } from "./modal";

export function checkNewUser() {
    if (
        (storageMethod === "extension" || storageMethod === "indexedDB") &&
        (storageLoadFailed || data == null)
    ) {
        return;
    }
    if (n(get("firstused"))) {
        set("birthday", "00-00-0000");
        set("lastjubileum", 0);
        execute([reset]);
        tn("head", 0).insertAdjacentHTML(
            "afterbegin",
            `<style>
                #mod-welcome {position:fixed;inset:0;background:#0006;z-index:1000;display:flex;align-items:center;justify-content:center;transition:opacity .3s ease;}
                #mod-welcome > div {width:360px;max-width:calc(100% - 32px);max-height:calc(100% - 32px);overflow:auto;box-sizing:border-box;background:#fff;color:#18334b;border-radius:20px;padding:30px;box-shadow:0 16px 60px #0002;animation:mod-welcome-in .35s ease both;text-align:center;}
                #mod-welcome-logo {width:76px;height:76px;object-fit:contain;border-radius:10px;cursor:pointer;transition:transform .3s ease;}
                #mod-welcome h2 {font-size:21px;font-weight:650;margin:18px 0 10px;}
                #mod-welcome p {font-size:14px;line-height:1.6;margin:0 0 22px;}
                #mod-welcome label {display:flex;align-items:center;gap:10px;text-align:left;font-size:13px;margin:0 0 22px;cursor:pointer;}
                #mod-welcome input {width:18px;height:18px;flex-shrink:0;accent-color:#087bd1;}
                #mod-welcome button {display:block;width:100%;padding:12px;border-radius:10px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s,transform .2s;border:1px solid #d7e0e8;}
                #mod-welcome button:active {transform:scale(.98);}
                #mod-welcome-open-settings {background:#087bd1;color:white;border-color:#087bd1!important;margin-bottom:8px;}
                #mod-welcome-open-settings:hover {background:#066ab5;}
                #mod-welcome-close {background:white;color:#18334b;}
                #mod-welcome-close:hover {background:#f0f5fa;}
                @keyframes mod-welcome-in {from {opacity:0;transform:translateY(10px) scale(.97);}to {opacity:1;transform:none;}}
                @media(prefers-reduced-motion:reduce) {#mod-welcome,#mod-welcome > div,#mod-welcome button,#mod-welcome-logo {animation:none;transition:none;}}
            </style>`,
        );
        const logoUrl = typeof chrome !== "undefined" && chrome.runtime?.getURL
            ? chrome.runtime.getURL("icon128.png")
            : "";
        id("somtoday-mod").insertAdjacentHTML(
            "afterbegin",
            '<div id="mod-welcome"><div role="dialog" aria-modal="true" aria-labelledby="mod-welcome-title">' +
                (logoUrl ? '<img id="mod-welcome-logo" src="' + logoUrl + '" alt="Somtoday Mod CE">' : window.logo("mod-welcome-logo", null, "#087bd1")) +
                '<h2 id="mod-welcome-title">Welkom bij Somtoday Mod CE!</h2><p>Somtoday Mod CE is succesvol geïnstalleerd.</p>' +
                '<label for="errordata"><input type="checkbox" id="errordata">Anonieme foutmeldingen delen (optioneel)</label>' +
                (hasSettingsHash ? "" : '<button type="button" id="mod-welcome-open-settings">Naar Mod-instellingen</button>') +
                '<button type="button" id="mod-welcome-close">Doorgaan naar Somtoday</button></div></div>',
        );
        function closeWelcomeDialog() {
            const now = new Date();
            set(
                "firstused",
                `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
            );
            id("mod-welcome").style.opacity = "0";
            if (id("errordata").checked) {
                // Permission for sending debug-data
                set("bools", get("bools").replaceAt(4, "1"));
            }
            setTimeout(() => {
                tryRemove(id("mod-welcome"));
            }, 400);
        }
        if (!hasSettingsHash) {
            id("mod-welcome-open-settings").addEventListener("click", () => {
                closeWelcomeDialog();
                openModSettingsDirectly(true);
            });
        }
        id("mod-welcome-close").addEventListener("click", () => {
            closeWelcomeDialog();
            if (hasSettingsHash) {
                execute([openSettings]);
            }
        });
        id("mod-welcome-logo").addEventListener(
            "click",
            function (this: HTMLElement) {
                this.style.transform = "scale(1.3)";
                setTimeout(() => {
                    const logo = id("mod-welcome-logo");
                    if (logo) logo.style.transform = "scale(1)";
                }, 300);
            },
        );
    }
}

// Open modsettings directly when hash is #mod-settings
export async function openModSettingsDirectly(forceOpen = false) {
    if (
        window.location.hash == "#mod-settings" ||
        get("opensettingsIntention") == "1" ||
        forceOpen
    ) {
        if (tn("sl-modal", 0)) {
            return;
        }

        if (!forceOpen) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        tn("sl-header", 0).getElementsByTagName("div")[0].click();

        let i = 0,
            j = 0;
        while (n(cn("selector-option instellingen", 0))) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Wait on popup for 20 x 100 = 2000ms, then try clicking element again
            if (i > 20) {
                i = 0;
                j++;
                // Stop after 3 retries
                if (j > 3) {
                    set("opensettingsIntention", "0");
                    return;
                }
                tn("sl-header", 0).getElementsByTagName("div")[0].click();
            }
            i++;
        }

        cn("selector-option instellingen", 0).click();

        i = 0;
        while (n(id("mod-setting-button"))) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (i > 20) {
                set("opensettingsIntention", "0");
                return;
            }
            i++;
        }

        id("mod-setting-button").click();
        set("opensettingsIntention", "0");
        history.replaceState(
            "",
            document.title,
            window.location.pathname + window.location.search,
        );
    }
}

// Insert modsettings link in the setting menu
export function insertModSettingLink() {
    const isDarkMode =
        tn("html", 0)?.classList.contains("dark") ||
        tn("html", 0)?.classList.contains("night");
    if (
        tn("sl-account-modal", 0)?.getElementsByTagName(
            "sl-account-modal-tab",
        )[0] &&
        n(id("mod-setting-button"))
    ) {
        const modbtn = tn("sl-account-modal", 0)
            .getElementsByTagName("sl-account-modal-tab")
            [
                tn("sl-account-modal", 0).getElementsByTagName(
                    "sl-account-modal-tab",
                ).length - 1
            ].cloneNode(true) as HTMLElement;
        modbtn.id = "mod-setting-button";
        modbtn.classList.remove("active");
        modbtn.ariaSelected = "false";
        modbtn.addEventListener("click", openSettings);
        modbtn.getElementsByTagName("span")[0].innerHTML = "Mod-instellingen";
        modbtn.getElementsByTagName("i")[0].style.background = isDarkMode
            ? "#603d20"
            : "#ffefe3";
        modbtn.getElementsByTagName("i")[0].style.paddingBottom = "2px";
        modbtn.getElementsByTagName("i")[0].innerHTML = window.getIcon(
            "gear",
            null,
            "#ea9418",
            'style="width:16px;height:16px;"',
        );
        tn("sl-account-modal", 0)
            .getElementsByTagName("nav")[0]
            .appendChild(modbtn);
        for (const element of tn("sl-account-modal-tab")) {
            if (element.id != "mod-setting-button") {
                element.addEventListener("click", () => {
                    closeSettings(element);
                });
            }
        }
        setTimeout(() => {
            // Save username and birthday
            if (
                cn("data-container", 1)?.getElementsByClassName(
                    "ng-star-inserted",
                )[0] &&
                n(get("realname"))
            ) {
                set(
                    "realname",
                    cn("data-container", 1).getElementsByClassName(
                        "ng-star-inserted",
                    )[0].innerHTML,
                );
            }
            for (const parent of cn("data-container")) {
                for (const element of parent.children) {
                    if (!n(element.getAttribute("aria-label"))) {
                        if (
                            element
                                .getAttribute("aria-label")
                                .toLowerCase()
                                .indexOf("geboortedatum") != -1
                        ) {
                            set("birthday", element.innerHTML);
                        }
                    }
                }
            }
        }, 200);
    }
    // Update background of modsetting link in settings menu
    else if (id("mod-setting-button")) {
        id("mod-setting-button").getElementsByTagName("i")[0].style.background =
            isDarkMode ? "#603d20" : "#ffefe3";
    }
}
