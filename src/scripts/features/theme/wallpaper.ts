import { get } from "../../save_version_management";
import { id, n } from "../../shorthand_functions";

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
