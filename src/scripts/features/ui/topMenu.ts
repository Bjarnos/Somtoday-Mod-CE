import { get } from "../../save_version_management";
import { cn, id, n, tn, tryRemove } from "../../shorthand_functions";

// Add a menu bar on top of the page
export function topMenu() {
    if (get("layout") == 5 && n(id("mod-top-menu"))) {
        tn("body", 0).insertAdjacentHTML(
            "beforeend",
            '<div id="mod-top-menu"><h2 id="mod-top-menu-title">Titel</h2><div id="mod-logout">' +
                window.getIcon("right-from-bracket") +
                '</div><div id="mod-profile-link"></div></div>',
        );
        id("mod-profile-link").addEventListener("click", () => {
            cn("menu-avatar", 0).click();
        });
        id("mod-logout").addEventListener("click", () => {
            cn("menu-avatar", 0).click();
            tryRemove(id("mod-top-menu"));
            const checkLogoutButtonPresent = setInterval(() => {
                if (cn("selector-option uitloggen", 0)) {
                    cn("selector-option uitloggen", 0).click();
                    clearInterval(checkLogoutButtonPresent);
                }
            }, 10);
        });
    } else if (get("layout") != 5) {
        tryRemove(id("mod-top-menu"));
    } else if (
        cn("avatar", 0)?.getElementsByClassName("foto")[0] &&
        id("mod-profile-link")
    ) {
        id("mod-profile-link").innerHTML =
            "<div>" +
            (cn("avatar", 0)
                .getElementsByClassName("foto")[0]
                .classList.contains("hidden")
                ? "<span>" +
                  (cn("avatar", 0).getElementsByClassName("initials")[0]
                      ?.children[0]
                      ? cn("avatar", 0).getElementsByClassName("initials")[0]
                            .children[0].innerHTML
                      : "?") +
                  "</span>"
                : '<img src="' +
                  (n(get("profilepic"))
                      ? cn("avatar", 0).getElementsByClassName("foto")[0].src
                      : get("profilepic")) +
                  '" />') +
            "</div>";
    }
    if (id("mod-top-menu-title")) {
        let headerText = "";
        for (const element of tn("sl-tab-item")) {
            if (element.classList.contains("active")) {
                headerText = element.getElementsByTagName("span")[0].innerHTML;
            }
        }
        if (n(headerText)) {
            if (cn("desktop-title", 0)) {
                headerText = cn("desktop-title", 0).innerHTML;
            } else if (tn("sl-scrollable-title", 0)) {
                headerText = tn("sl-scrollable-title", 0).innerHTML;
            }
        }
        id("mod-top-menu-title").innerHTML = headerText;
    }
}
