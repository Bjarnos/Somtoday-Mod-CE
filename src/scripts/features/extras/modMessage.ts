import { id, n, tn, tryRemove } from "../../shorthand_functions";

// Show a message on top of the page. Similair to browser confirm().
export function modMessage(
    title?: any,
    description?: any,
    link1?: any,
    link2?: any,
    red1?: any,
    red2?: any,
    noBackgroundClick?: any,
) {
    tn("sl-root", 0).inert = true;
    if (tn("sl-modal", 0)) {
        tn("sl-modal", 0).inert = true;
    }
    while (id("mod-message")) {
        tryRemove(id("mod-message"));
    }
    const element = n(id("somtoday-mod")) ? tn("body", 0) : id("somtoday-mod");
    element.insertAdjacentHTML(
        "afterbegin",
        '<div id="mod-message" class="mod-animation-playing"><center><div onclick="event.stopPropagation();"><h2>' +
            title +
            "</h2><p>" +
            description +
            "</p>" +
            (n(link1)
                ? ""
                : '<a id="mod-message-action1" class="mod-message-button' +
                  (red1 ? " mod-button-discouraged" : "") +
                  '" tabindex="0">' +
                  link1 +
                  "</a>") +
            (n(link2)
                ? ""
                : '<a id="mod-message-action2" class="mod-message-button' +
                  (red2 ? " mod-button-discouraged" : "") +
                  '" tabindex="0">' +
                  link2 +
                  "</a>") +
            "</div></center></div>",
    );
    if (!n(link1)) {
        id("mod-message-action1").focus();
        setTimeout(() => {
            if (id("mod-message-action1")) {
                id("mod-message-action1").addEventListener(
                    "keyup",
                    (event: KeyboardEvent) => {
                        if (
                            event.keyCode === 39 ||
                            event.keyCode === 37 ||
                            event.keyCode === 9
                        ) {
                            event.preventDefault();
                            if (id("mod-message-action2")) {
                                id("mod-message-action2").focus();
                            }
                        }
                    },
                    { once: true },
                );
            }
        }, 50);
        id("mod-message-action1").addEventListener(
            "click",
            () => {
                tn("sl-root", 0).removeAttribute("inert");
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).removeAttribute("inert");
                }
            },
            { once: true },
        );
    }
    if (!n(link2)) {
        setTimeout(() => {
            if (id("mod-message-action2")) {
                id("mod-message-action2").addEventListener(
                    "keyup",
                    (event: KeyboardEvent) => {
                        if (
                            event.keyCode === 39 ||
                            event.keyCode === 37 ||
                            event.keyCode === 9
                        ) {
                            event.preventDefault();
                            id("mod-message-action1").focus();
                        }
                    },
                    { once: true },
                );
            }
        }, 50);
        id("mod-message-action2").addEventListener(
            "click",
            () => {
                tn("sl-root", 0).removeAttribute("inert");
                if (tn("sl-modal", 0)) {
                    tn("sl-modal", 0).removeAttribute("inert");
                }
            },
            { once: true },
        );
        if (noBackgroundClick == null) {
            id("mod-message").addEventListener(
                "click",
                () => {
                    if (!n("mod-message-action2")) {
                        id("mod-message-action2").click();
                    }
                },
                { once: true },
            );
        }
    } else if (!n(link1) && noBackgroundClick == null) {
        id("mod-message").addEventListener(
            "click",
            () => {
                if (!n("mod-message-action1")) {
                    id("mod-message-action1").click();
                }
            },
            { once: true },
        );
    }
    setTimeout(() => {
        if (id("mod-message")) {
            id("mod-message").classList.remove("mod-animation-playing");
        }
    }, 500);
}

export function closeModMessage() {
    id("mod-message").classList.add("mod-msg-closed");
    setTimeout(() => {
        tryRemove(id("mod-message"));
    }, 305);
}
