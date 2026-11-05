import { get, hasSettingsHash, set } from "../../save_version_management";
import { cn, execute, id, n, tn, tryRemove } from "../../shorthand_functions";
import { reset } from "./backup";
import { closeSettings, openSettings } from "./modal";

export function checkNewUser() {
    if (n(get("firstused"))) {
        set("birthday", "00-00-0000");
        set("lastjubileum", 0);
        execute([reset]);
        tn("head", 0).insertAdjacentHTML(
            "afterbegin",
            "<style>#mod-welcome{background:#0005;position:fixed;top:0;left:0;width:100%;height:100%;z-index:1000;transition:opacity 0.3s ease;}#mod-welcome > div{width:355px;transform:translate(-50%, -50%);top:50%;position:absolute;left:50%;background: var(--bg-elevated-none);border-radius:16px;overflow:hidden;overflow-y:scroll;max-width:calc(100% - 30px);max-height:calc(100% - 30px);}#mod-welcome > div > div:first-child{background:#09f;height:130px;display:flex;justify-content:center;align-items:center}#mod-welcome>div>div>svg{width:70px;height:35%;transition:transform .3s ease;cursor:pointer;}#mod-welcome > div > div:last-child{padding:15px 20px;}#mod-welcome h2{font-weight:400;}#mod-welcome input[type=checkbox]{width:20px;display:inline-block;height:20px;}#mod-welcome label{user-select:none;vertical-align:top;display:inline-block;padding-left:10px;margin-bottom:25px;font-size:14px;max-width:calc(100% - 35px);}div:hover > svg .glasses{animation:1s glasses linear forwards;}@keyframes glasses{0%{transform:translateY(-60px);opacity:0;}50%{transform:translateY(-30px);opacity:1;}100%{transform:translateY(0px);opacity:1;}}@media (min-width: 370px) and (min-height:700px){#mod-welcome > div{overflow-y:hidden;}#mod-welcome > div > div:first-child{height:200px;}#mod-welcome > div > div:last-child{padding:30px;}}</style>",
        );
        const welcomecontent =
            "<h2>Somtoday Mod is ge&iuml;nstalleerd!</h2><p>Stel achtergronden in, krijg inzicht in je cijfers en meer met Somtoday Mod!</p><p>" +
            (hasSettingsHash
                ? "Laten we meteen beginnen!"
                : "Meteen naar de instellingen gaan?") +
            "</p>";
        id("somtoday-mod").insertAdjacentHTML(
            "afterbegin",
            '<div id="mod-welcome"><div><div>' +
                window.logo("mod-welcome-logo", null, "#fff") +
                "</div><div>" +
                welcomecontent +
                '<br><input type="checkbox" id="errordata"><label for="errordata">Verstuur error-data om bugs te fixen</label><div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">' +
                (hasSettingsHash
                    ? ""
                    : '<div tabindex="0" class="mod-button" id="mod-welcome-open-settings">' +
                      window.getIcon(
                          "gear",
                          null,
                          "var(--fg-on-primary-weak)",
                      ) +
                      "<span>Instellingen</span></div>") +
                '<div tabindex="0" class="mod-button" id="mod-welcome-close">Sluiten</div></div></div></div></div>',
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
                    id("mod-welcome-logo").style.transform = "scale(1)";
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
