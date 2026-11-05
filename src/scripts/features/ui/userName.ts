import { get } from "../../save_version_management";
import { cn, n, setHTML, tn } from "../../shorthand_functions";

// Change username when enabled
export function userName() {
    if (
        !n(get("username")) &&
        !n(get("realname")) &&
        get("username") != get("realname")
    ) {
        // Name field on Mijn gegevens page
        for (const element of cn("persinfo")) {
            if (element.innerHTML.indexOf(get("realname")) != -1) {
                setHTML(
                    element,
                    element.innerHTML.replaceAll(
                        get("realname"),
                        get("username"),
                    ),
                );
            }
        }
        // Sender field in opened message (can be a teacher name or student name)
        for (const element of cn("van")) {
            if (element.innerHTML.indexOf(get("realname")) != -1) {
                setHTML(element, "");
                element.append(
                    document
                        .createRange()
                        .createContextualFragment(get("username")),
                );
            }
        }
        // Receiver field in opened message (can be a teacher name, student name, group name or "Somtoday (automatisch)")
        // This field is complicated because everything is stored under child elements and it is just a mess.
        // Everything is stored as "<span>FirstName&nbsp;</span> <span>Lastname</span>" and this needs to be parsed
        for (const element of cn("ontvangers")) {
            const search = get("realname").replaceAll(
                " ",
                "&nbsp;</span> <span>",
            );
            if (element.innerHTML.indexOf(search) != -1) {
                element.innerHTML = element.innerHTML.replaceAll(
                    search,
                    get("username").replaceAll(" ", "&nbsp</span> <span>"),
                );
            }
        }
        for (const element of tn("hmy-internal-tag")) {
            if (
                !n(element.getElementsByTagName("span")[0]) &&
                element
                    .getElementsByTagName("span")[0]
                    .innerHTML.indexOf(get("realname")) != -1
            ) {
                element.getElementsByTagName("span")[0].innerHTML = element
                    .getElementsByTagName("span")[0]
                    .innerHTML.replaceAll(get("realname"), get("username"));
            }
        }
        for (const element of cn("omschrijving")) {
            if (element.innerHTML.indexOf(get("realname")) != -1) {
                element.innerHTML = element.innerHTML.replaceAll(
                    get("realname"),
                    get("username"),
                );
            }
        }
        for (const element of tn("sl-html-content")) {
            if (
                !n(element.children[0]) &&
                element.children[0].innerHTML.indexOf(get("realname")) != -1
            ) {
                element.children[0].innerHTML =
                    element.children[0].innerHTML.replaceAll(
                        get("realname"),
                        get("username"),
                    );
            }
        }
    }
}
