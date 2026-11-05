import { toBrightnessValue } from "../../colors";
import { get } from "../../save_version_management";
import { id, n, tn, tryRemove } from "../../shorthand_functions";

// Update the CSS variables used by Somtoday and Somtoday Mod
let primaryColorValue: any;
let secondaryColorValue: any;
let darkModeValue: any;
let uiValue: any;
let uiBlurValue: any;
let layoutValue: any;
export function updateCssVariables() {
    // Do not update CSS variables when nothing relevant changed
    if (
        !n(primaryColorValue) &&
        primaryColorValue == get("primarycolor") &&
        secondaryColorValue == get("secondarycolor") &&
        darkModeValue ==
            (tn("html", 0).classList.contains("dark") ||
                tn("html", 0).classList.contains("night")) &&
        uiValue == get("ui") &&
        uiBlurValue == get("uiblur") &&
        layoutValue == get("layout")
    ) {
        return;
    }
    primaryColorValue = get("primarycolor");
    secondaryColorValue = get("secondarycolor");
    darkModeValue =
        tn("html", 0).classList.contains("dark") ||
        tn("html", 0).classList.contains("night");
    const darkmode = darkModeValue;
    uiValue = get("ui");
    uiBlurValue = get("uiblur");
    layoutValue = get("layout");
    tryRemove(id("mod-css-variables"));
    tryRemove(id("mod-css-variables-2"));
    if (get("ui") != 0 || get("backgroundtype") == "live") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style id="mod-css-variables-2">sl-vakgemiddelden sl-dropdown,sl-cijfer-overzicht sl-dropdown{background:var(--bg-neutral-none);margin-top:-5px;margin-bottom:-5px;}' +
                (get("uiblur") == 0
                    ? ""
                    : ".nieuw-bericht-form hmy-popup{top:70px !important;left:70px !important;}sl-plaatsingen,.nieuw-bericht-form,sl-header,sl-laatste-resultaat-item,sl-vakresultaat-item,.berichten-lijst,.vakken," +
                      (get("layout") == "4"
                          ? ""
                          : "sl-vakresultaten,hmy-geen-data,hmy-switch-group:has(hmy-switch),sl-bericht-detail .header,sl-bericht-nieuw > .titel,") +
                      ".headers-container,.tabs,sl-studiewijzer-week:has(.datum.vandaag),#mod-top-menu,sl-home > * > sl-tab-bar.show,sl-dagen-header,sl-scrollable-title,sl-studiewijzer-weken-header,sl-cijfer-overzicht-voortgang>div,sl-rooster-tijden{backdrop-filter:blur(" +
                      get("uiblur") +
                      "px);}") +
                "@media(max-width:767px){sl-laatste-resultaat-item{backdrop-filter:none;}sl-laatsteresultaten{backdrop-filter:blur(" +
                get("uiblur") +
                "px);}}:root, :root.dark.dark {--thinnest-solid-neutral-strong:1px solid transparent !important;--text-weakest:var(--text-weak);--border-neutral-normal:transparent;" +
                (darkmode && get("ui") > 0.9 ? "--text-weak:#fff;" : "") +
                "--bg-neutral-none:" +
                (darkmode
                    ? `rgba(0,0,0,${1 - get("ui") / 100})`
                    : `rgba(255,255,255,${1 - get("ui") / 100})`) +
                ";--bg-neutral-weakest:" +
                (darkmode
                    ? `rgba(0, 0, 0, ${1 - get("ui") / 100})`
                    : `rgba(255, 255, 255, ${1 - get("ui") / 100})`) +
                ";}.mod-multi-choice,input:not(:hover):not(:focus):not(.mod-color-textinput):not(.ng-pristine):not(.ng-dirty),textarea:not(:hover):not(:focus):not(.ng-pristine):not(.ng-dirty),.select-selected{border:1px solid rgba(0,0,0,0.1) !important;}hmy-toggle .toggle:not(:has(input:checked)) .slider{border:2px solid rgba(0,0,0,0.1) !important;}sl-dag-header-tab,.periode-icon{background:none !important;}@media (max-width:767px){sl-vakgemiddelden sl-dropdown,sl-cijfer-overzicht sl-dropdown{margin-top:10px;}}</style>",
        );
    }
    // If at least one of the colors is not set to the default value, modify Somtoday color variables
    let css =
        (darkmode
            ? "#mod-setting-panel ::placeholder{ color: var(--action-neutral-normal) !important; }"
            : "") +
        " :root, :root.dark.dark { --mod-transparent: rgba(" +
        (darkmode ? "0,0,0,0.3" : "255,255,255,0.3") +
        "); --mod-ui-transparent: rgba(" +
        (darkmode ? "0,0,0" : "255,255,255") +
        "," +
        (1 - get("ui") / 100) +
        "); --mod-semi-transparant: " +
        (tn("html", 0).classList.contains("night")
            ? "#000"
            : darkmode
              ? "rgba(0,0,0,0.35)"
              : "rgba(255,255,255,0.65)") +
        "; --mod-border-neutral-normal: rgb(" +
        (darkmode ? "55,64,72" : "208,214,220") +
        ");";
    if (
        get("primarycolor") != "#0067c2" ||
        get("secondarycolor") != "#e69b22"
    ) {
        let cssVariables = "";
        const blueBrightness = [
            "241",
            "220",
            "198",
            "169",
            "140",
            "115",
            "89",
            "81",
            "56",
            "52",
            "48",
        ];
        const greenBrightness = [
            "245",
            "228",
            "209",
            "200",
            "192",
            "183",
            "160",
            "137",
            "114",
            "68",
            "46",
        ];
        const yellowBrightness = [
            "241",
            "220",
            "198",
            "190",
            "180",
            "173",
            "162",
            "137",
            "114",
            "68",
            "46",
        ];
        const purpleBrightness = [
            "231",
            "201",
            "170",
            "126",
            "100",
            "88",
            "77",
            "65",
            "53",
            "50",
            "41",
        ];
        const orangeBrightness = [
            "241",
            "220",
            "198",
            "180",
            "168",
            "155",
            "141",
            "90",
            "56",
            "52",
            "48",
        ];
        for (let i = 0; i < blueBrightness.length; i++) {
            cssVariables += `--blue-${i * 10}: ${toBrightnessValue(get("primarycolor"), blueBrightness[i])};`;
            cssVariables += `--green-${i * 10}: ${toBrightnessValue(get("secondarycolor"), greenBrightness[i])};`;
            cssVariables += `--yellow-${i * 10}: ${toBrightnessValue(get("secondarycolor"), yellowBrightness[i])};`;
            cssVariables += `--purple-${i * 10}: ${toBrightnessValue(get("secondarycolor"), purpleBrightness[i])};`;
            cssVariables += `--orange-${i * 10}: ${toBrightnessValue(get("secondarycolor"), orangeBrightness[i])};`;
        }
        // Generate and adjust colors based on highest color channel value
        css +=
            cssVariables +
            `}
        sl-account-modal i {
            --bg-neutral-moderate: ${darkmode ? "#282e34" : "#dadfe3"};
            --fg-on-neutral-moderate: ${darkmode ? "#eaedf0" : "#374048"};
            --bg-primary-weakest: ${darkmode ? "#1a344d" : "#e5f3ff"};
            --fg-on-primary-weakest: ${darkmode ? "#e5f3ff" : "#004180"};
            --bg-alternative-weak: ${darkmode ? "#342060" : "#ece3ff"};
            --fg-on-alternative-weak: ${darkmode ? "#d4c0fd" : "#29017d"};
            --bg-accent-weak: ${darkmode ? "#4d3919" : "#fff4e3"};
            --fg-on-accent-weak: ${darkmode ? "#fff4e3" : "#4d3919"};
            --bg-positive-weakest: ${darkmode ? "#133914" : "#ebf9ec"};
            --fg-on-positive-weakest: ${darkmode ? "#baf5bc" : "#145716"};
        }`;
    } else {
        css += "}";
    }
    tn("head", 0).insertAdjacentHTML(
        "beforeend",
        `<style id="mod-css-variables">${css}</style>`,
    );
}
