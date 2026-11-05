import { get } from "../../save_version_management";
import { n, tn } from "../../shorthand_functions";

// Change title and icon of Somtoday when enabled
export function browserSettings() {
    if (!n(get("title"))) {
        if (n(tn("title", 0).dataset.modOriginalTitle)) {
            tn("title", 0).dataset.modOriginalTitle = tn("title", 0).innerHTML;
        }
        tn("title", 0).innerHTML = get("title");
    } else if (!n(tn("title", 0).dataset.modOriginalTitle)) {
        tn("title", 0).innerHTML = tn("title", 0).dataset.modOriginalTitle;
    }
    for (const element of tn("link")) {
        if (element.getAttribute("rel") == "icon") {
            if (!n(get("icon"))) {
                if (n(element.dataset.modOriginalHref)) {
                    element.dataset.modOriginalHref = element.href;
                }
                element.href = get("icon");
            } else if (!n(element.dataset.modOriginalHref)) {
                element.href = element.dataset.modOriginalHref;
            }
        }
    }
}
