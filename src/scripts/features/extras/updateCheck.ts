import { get, set, version } from "../../save_version_management";
import { id, n, parseJSON } from "../../shorthand_functions";
import { closeModMessage, modMessage } from "./modMessage";

// Change some setting values to ensure the script will work after updating
export function updateCheck() {
    // Make sure to not mess up new user save data
    if (!n(get("firstused"))) {
        // Set default values for new users who first navigate to old version and later to a new one
        if (n(get("bools"))) {
            set("bools", "110001110111100000000000000000");
        }
        if (n(get("layout"))) {
            set("layout", 1);
        }
        if (get("uiblur") == null) {
            set("uiblur", 0);
        }
        if (get("ui") == null) {
            set("ui", 20);
        }
        // Check if user has used the old version of Somtoday and is using new version for the first time
        if (n(get("version")) && !n(get("primarycolor"))) {
            modMessage(
                "Somtoday update!",
                "Somtoday heeft een grote update gekregen! Somtoday Mod is hier op voorbereid en heeft ook een update gekregen. De mod-instellingen zijn nu te vinden in een apart tabblad in de instellingen van Somtoday. Het is mogelijk dat je sommige instellingen opnieuw moet instellen.",
                "Doorgaan",
            );
            id("mod-message-action1").addEventListener(
                "click",
                closeModMessage,
            );
            set("bools", "110001110111100000000000000000");
            set("secondarycolor", "#e69b22");
        }
        const savedVersion = parseFloat(get("version"));
        if (savedVersion == 4) {
            set("bools", get("bools").replaceAt(12, "1"));
        }
        if (savedVersion < 4.6) {
            if (get("blur") == "") {
                set("blur", "0px");
            } else if (
                get("blur") != null &&
                !Number.isNaN(parseInt(get("blur"), 10))
            ) {
                set("blur", `${get("blur")}px`);
            }
            set("bools", get("bools").replaceAt(15, "1"));
        }
        if (savedVersion < 4.7) {
            set("brightness", "100%");
            set("contrast", "100%");
            set("saturate", "100%");
            set("opacity", "100%");
            set("huerotate", "0deg");
            set("grayscale", "0%");
            set("sepia", "0%");
            set("invert", "0%");
        }
        if (savedVersion < 4.9) {
            set("bools", get("bools").replaceAt(16, "1"));
        }
        if (n(get("homework"))) {
            set("homework", "[]");
        }
        if (savedVersion < 5.1) {
            // Update nickname storage to use JSON instead of pipe-delimited string
            if (n(get("nicknames"))) {
                set("nicknames", "[]");
            } else if (parseJSON(get("nicknames")) == null) {
                const json = [];
                const namearray = get("nicknames").split("|");
                for (let i = 0; i < namearray.length / 2; i++) {
                    json.push([namearray[i * 2], namearray[i * 2 + 1]]);
                }
                set("nicknames", JSON.stringify(json));
            }
        }
        if (savedVersion < 5.3) {
            set("bools", get("bools").replaceAt(17, "1"));
        }
    }
    // Save current version for update checks in future versions
    set("version", version);
}
