import { get } from "../../save_version_management";
import { cn, n, setHTML, tn } from "../../shorthand_functions";

// Change teacher names to nicknames when enabled
export function teacherNicknames() {
    if (!n(get("nicknames"))) {
        const namearray = JSON.parse(get("nicknames"));
        for (const nickname of namearray) {
            const real = nickname[0];
            const nick = nickname[1];
            if (real != "") {
                const regex = new RegExp(
                    "(.*?)" +
                        real.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                        "(.*?)",
                    "g",
                );
                const regexWhichPreservesIcons = new RegExp(
                    "(.*?)" +
                        real.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                        "(.*?<hmy-?.*)",
                    "g",
                );
                // Sender field in message list (is always a teacher name)
                for (const element of cn("afzenders")) {
                    if (!element.classList.contains("mod-nickname")) {
                        const text = element.innerHTML.replace(
                            regex,
                            `$1${nick}$2`,
                        );
                        if (text != element.innerHTML) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element, "");
                        element.append(
                            document
                                .createRange()
                                .createContextualFragment(text),
                        );
                    }
                }
                // Receiver field in message list (can be a teacher name or "Somtoday (automatisch)")
                for (const element of cn("ontvangers ellipsis")) {
                    if (!element.classList.contains("mod-nickname")) {
                        const text = element.innerHTML.replace(
                            regex,
                            `$1${nick}$2`,
                        );
                        if (text != element.innerHTML) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element, "");
                        element.append(
                            document
                                .createRange()
                                .createContextualFragment(text),
                        );
                    }
                }
                // Receiver field in opened message (can be a teacher name, student name, group name or "Somtoday (automatisch)")
                // This field is complicated because everything is stored under child elements and it is just a mess.
                // Everything is stored as "<span>FirstName&nbsp;</span> <span>Lastname</span>" and this needs to be parsed
                for (const element of cn("ontvangers")) {
                    if (
                        !element.classList.contains("mod-nickname") &&
                        !element.classList.contains("ellipsis") &&
                        !element.classList.contains("input-veld") &&
                        (n(element.children[0]) ||
                            !element.children[0].classList.contains("zoekveld"))
                    ) {
                        setHTML(
                            element,
                            element.innerHTML
                                .replaceAll("&nbsp;</span> <span>", " ")
                                .replaceAll("<span>", "")
                                .replaceAll("</span><!---->", ""),
                        );
                        const text = element.innerHTML.replace(
                            element.innerHTML.indexOf("<hmy-") != -1
                                ? regexWhichPreservesIcons
                                : regex,
                            `$1${nick}$2`,
                        );
                        if (text != element.innerHTML) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element, "");
                        element.append(
                            document
                                .createRange()
                                .createContextualFragment(text),
                        );
                    }
                }
                // Sender field in opened message (can be a teacher name or student name)
                for (const element of cn("van")) {
                    if (!element.classList.contains("mod-nickname")) {
                        const text = element.innerHTML.replace(
                            element.innerHTML.indexOf("<hmy-") != -1
                                ? regexWhichPreservesIcons
                                : regex,
                            `$1${nick}$2`,
                        );
                        if (text != element.innerHTML) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element, "");
                        element.append(
                            document
                                .createRange()
                                .createContextualFragment(text),
                        );
                    }
                }
                // Sender field in opened message (can be a teacher name or student name)
                for (const element of cn("text text-content-smallest-semi")) {
                    if (!element.classList.contains("mod-nickname")) {
                        const text = element.innerHTML.replace(
                            regex,
                            `$1${nick}$2`,
                        );
                        if (text != element.innerHTML) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element, "");
                        element.append(
                            document
                                .createRange()
                                .createContextualFragment(text),
                        );
                    }
                }
                for (const element of cn("docent")) {
                    if (
                        !element.classList.contains("mod-nickname") &&
                        element.getElementsByTagName("span")[0]
                    ) {
                        const text = element
                            .getElementsByTagName("span")[0]
                            .innerHTML.replace(regex, `$1${nick}$2`);
                        if (
                            text !=
                            element.getElementsByTagName("span")[0].innerHTML
                        ) {
                            element.classList.add("mod-nickname");
                        }
                        setHTML(element.getElementsByTagName("span")[0], "");
                        element
                            .getElementsByTagName("span")[0]
                            .append(
                                document
                                    .createRange()
                                    .createContextualFragment(text),
                            );
                    }
                }
                for (const element of tn("hmy-internal-tag")) {
                    if (
                        !element.classList.contains("mod-nickname") &&
                        element.getElementsByTagName("span")[0] &&
                        !element
                            .getElementsByTagName("span")[0]
                            .classList.contains("mod-nickname") &&
                        element.getElementsByTagName("span")[0]
                    ) {
                        if (nickname[2] && element.innerText == nickname[2]) {
                            element
                                .getElementsByTagName("span")[0]
                                .classList.add("mod-nickname");
                            setHTML(
                                element.getElementsByTagName("span")[0],
                                "",
                            );
                            element
                                .getElementsByTagName("span")[0]
                                .append(
                                    document
                                        .createRange()
                                        .createContextualFragment(nick),
                                );
                        } else {
                            const text = element
                                .getElementsByTagName("span")[0]
                                .innerHTML.replace(regex, `$1${nick}$2`);
                            if (
                                text !=
                                element.getElementsByTagName("span")[0]
                                    .innerHTML
                            ) {
                                element
                                    .getElementsByTagName("span")[0]
                                    .classList.add("mod-nickname");
                            }
                            setHTML(
                                element.getElementsByTagName("span")[0],
                                "",
                            );
                            element
                                .getElementsByTagName("span")[0]
                                .append(
                                    document
                                        .createRange()
                                        .createContextualFragment(text),
                                );
                        }
                    }
                }
            }
        }
        for (const element of cn("afzenders")) {
            element.classList.add("mod-nickname");
        }
        for (const element of cn("ontvangers")) {
            element.classList.add("mod-nickname");
        }
        for (const element of cn("van")) {
            element.classList.add("mod-nickname");
        }
        for (const element of cn("text text-content-smallest-semi")) {
            element.classList.add("mod-nickname");
        }
        for (const element of cn("docent")) {
            element.classList.add("mod-nickname");
        }
        for (const element of tn("hmy-internal-tag")) {
            element.classList.add("mod-nickname");
        }
    }
}
