import { get } from "../../save_version_management";
import { id, n, tn, tryRemove } from "../../shorthand_functions";
import { startLiveWallpaper, stopLiveWallpaper } from "./liveWallpaper";

export function getBackgroundFilters(fromSavedSettings = true) {
    let filter = "";
    const properties = [
        "brightness",
        "contrast",
        "saturate",
        "opacity",
        "huerotate",
        "grayscale",
        "sepia",
        "invert",
        "blur",
    ];
    for (const filterProperty of properties) {
        const value = fromSavedSettings
            ? get(filterProperty)
            : id(filterProperty).value + id(filterProperty).dataset.unit;
        if (value != null) {
            // Add to filter
            // Extensions can't save data with "hue-rotate" as key because it contains a hyphen
            filter +=
                " " +
                (filterProperty == "huerotate"
                    ? "hue-rotate"
                    : filterProperty) +
                "(" +
                value +
                ")";
        }
    }
    if (fromSavedSettings) {
        if (!n(filter)) {
            filter = `filter:${filter};`;
        }
    }
    return filter;
}

// Insert the background
export function setBackground() {
    tryRemove(id("mod-background"));
    tryRemove(id("mod-backgroundcolor"));
    tryRemove(id("mod-backgroundslide"));
    tryRemove(id("mod-background-style"));
    stopLiveWallpaper();
    if (
        (n(get("backgroundtype")) || get("backgroundtype") == "image") &&
        !n(get("background"))
    ) {
        // Unfortunately, localStorage can only save strings, so check for 'false' too
        if (get("isbackgroundvideo") && get("isbackgroundvideo") != "false") {
            id("somtoday-mod", 0).insertAdjacentHTML(
                "beforeend",
                '<video id="mod-background" src="' +
                    get("background") +
                    '" style="' +
                    getBackgroundFilters() +
                    '" autoplay muted loop></video>',
            );
        } else {
            id("somtoday-mod", 0).insertAdjacentHTML(
                "beforeend",
                '<img id="mod-background" src="' +
                    get("background") +
                    '" style="' +
                    getBackgroundFilters() +
                    '">',
            );
        }
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style id="mod-background-style">#mod-background{' +
                (get("layout") == 5
                    ? "--safe-area-inset-top: 0px !important;"
                    : "") +
                "pointer-events:none;user-select:none;position:fixed;left:calc(var(--safe-area-inset-left) - " +
                get("blur") +
                ");top:calc(var(--safe-area-inset-top) - " +
                get("blur") +
                ");width:calc(100% - var(--safe-area-inset-left) - var(--safe-area-inset-right) - 2 * " +
                get("blur") +
                ");height:calc(100% - var(--safe-area-inset-top) - 2 * " +
                get("blur") +
                ");margin:" +
                get("blur") +
                ";object-fit:cover;z-index:-1;}</style>",
        );
    } else if (get("backgroundtype") == "color" && !n(get("backgroundcolor"))) {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style id="mod-backgroundcolor">body{background:' +
                get("backgroundcolor") +
                " !important;}</style>",
        );
    } else if (get("backgroundtype") == "slideshow" && !n(get("background0"))) {
        let i = 0;
        let images = "";
        let slides = "";
        while (!n(get(`background${i}`))) {
            images += `<img src="${get(`background${i}`)}" style="${getBackgroundFilters()}">`;
            slides +=
                (i == 0 ? "0%, " : "") +
                (
                    (100 / (get("backgroundslidecount") * 2)) *
                    (i * 2)
                ).toString() +
                "% {transform:translateX(" +
                (i * -100).toString() +
                "vw);} " +
                (
                    (100 / (get("backgroundslidecount") * 2)) *
                    (i * 2 + 1)
                ).toString() +
                "% {transform:translateX(" +
                (i * -100).toString() +
                "vw);} ";
            i++;
        }
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style id="mod-backgroundslide">#mod-backgroundslide img{' +
                (get("layout") == 5
                    ? "--safe-area-inset-top: 0px !important;"
                    : "") +
                "left:calc(var(--safe-area-inset-left) - " +
                get("blur") +
                ");top:calc(var(--safe-area-inset-top) - " +
                get("blur") +
                ");width:calc(100vw - var(--safe-area-inset-left) - var(--safe-area-inset-right) - 2 * " +
                get("blur") +
                ");height:calc(100% - var(--safe-area-inset-top) - 2 * " +
                get("blur") +
                ");margin:" +
                get("blur") +
                ";}#mod-backgroundslide{animation:" +
                (get("backgroundslidecount") * 10).toString() +
                "s infinite slide ease;}@keyframes slide{" +
                slides +
                "100%{transform:translateX(0vw);}}</style>",
        );
        id("somtoday-mod", 0).insertAdjacentHTML(
            "beforeend",
            `<div id="mod-backgroundslide">${images}</div>`,
        );
    } else if (get("backgroundtype") == "live") {
        startLiveWallpaper();
    }
}
