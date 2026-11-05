import { adjust, hexToRgb, rgbToHex } from "../../colors";
import {
    contributors,
    get,
    isExtension,
    platform,
    set,
    version_name,
} from "../../save_version_management";
import {
    BOOL_INDEX,
    cn,
    execute,
    hide,
    id,
    n,
    parseJSON,
    sanitizeString,
    setHTML,
    show,
    tn,
    toDataURL,
    tryRemove,
} from "../../shorthand_functions";
import { startTheEscape } from "../../the_escape";
import { closeModMessage, modMessage } from "../extras/modMessage";
import { showLetterbeoordelingenMessage } from "../grades/average";
import { gradeGraphs } from "../grades/graphs";
import { fonts } from "../theme/fonts";
import { randomColor, startLiveWallpaper } from "../theme/liveWallpaper";
import { getBackgroundFilters } from "../theme/wallpaper";
import { exportSettings, importSettings, reset } from "./backup";
import { addSetting, addSlider, addTheme, resetThemeCount } from "./controls";
import { insertModSettingLink } from "./newUser";
import {
    incrementFilesProcessed,
    removeSlideshowBackgrounds,
    resetFilesProcessed,
    saveReload,
    saveSlideshowBackground,
} from "./slideshow";

export function openSettings() {
    const darkmode = Boolean(
        tn("html", 0)?.classList.contains("dark") ||
            tn("html", 0)?.classList.contains("night"),
    );
    tryRemove(id("mod-setting-panel"));
    // Check if account modal is opened
    if (tn("sl-account-modal", 0)) {
        setTimeout(() => {
            // Set modsettings text
            if (
                tn("sl-account-modal-header", 1)?.getElementsByClassName(
                    "title ng-star-inserted",
                )[0]
            ) {
                tn("sl-account-modal-header", 1).getElementsByClassName(
                    "title ng-star-inserted",
                )[0].dataset.originalText = tn(
                    "sl-account-modal-header",
                    1,
                ).getElementsByClassName("title ng-star-inserted")[0].innerHTML;
                setHTML(
                    tn("sl-account-modal-header", 1).getElementsByClassName(
                        "title ng-star-inserted",
                    )[0],
                    "Mod-instellingen",
                );
            }
            // Make opening modsettings multiple times work
            if (
                document.documentElement.clientWidth <= 767 &&
                tn("sl-account-modal", 0).getElementsByClassName("container")[0]
            ) {
                if (
                    !tn("sl-account-modal", 0)
                        .getElementsByClassName("container")[0]
                        .classList.contains("show-details")
                ) {
                    if (
                        tn("sl-account-modal-tab", 0).classList.contains(
                            "active",
                        )
                    ) {
                        tn("sl-account-modal-tab", 1).click();
                    } else {
                        tn("sl-account-modal-tab", 0).click();
                    }
                    openSettings();
                }
            }
        }, 10);
        if (n(tn("sl-account-modal", 0).getElementsByClassName("content")[0])) {
            tn("sl-account-modal", 0).insertAdjacentHTML(
                "beforeend",
                '<div class="content" style="padding: 20px 40px;"></div>',
            );
        }
        if (
            tn("sl-account-modal", 0).getElementsByClassName("content")[0]
                ?.children[0]?.children[0]
        ) {
            tn("sl-account-modal", 0).getElementsByClassName(
                "content",
            )[0].children[0].children[0].inert = true;
        }
        if (
            tn("sl-account-modal", 0).getElementsByClassName(
                "ng-star-inserted active",
            )[0]
        ) {
            tn("sl-account-modal", 0)
                .getElementsByClassName("ng-star-inserted active")[0]
                .classList.remove("active");
        }
        if (
            n(
                tn("sl-account-modal", 0).getElementsByClassName("content")[0]
                    .children[0],
            )
        ) {
            tn("sl-account-modal", 0)
                .getElementsByClassName("content")[0]
                .insertAdjacentHTML("beforeend", "<div></div>");
            if (tn("sl-account-modal-tab", 0).classList.contains("active")) {
                tn("sl-account-modal-tab", 1).click();
            } else {
                tn("sl-account-modal-tab", 0).click();
            }
        }
        if (id("mod-setting-button")) {
            id("mod-setting-button").classList.add("active");
        } else {
            execute([insertModSettingLink]);
        }

        // Nicknames
        let nicknames = `
        <h3>Nicknames</h3>
        <p>Verander de naam van docenten in Somtoday. HTML is ondersteund.</p>
        <p>Vul de docentnaam precies in als op de berichtenpagina ("Dhr. E.X. Ample"). Vul bij de afkorting de docentafkorting in die in het rooster staat als je op een les klikt (optioneel). Vul tenslotte in welke nickname je deze docent wil geven.</p>
        <div id="nickname-wrapper">`;
        let nicknameArray = parseJSON(get("nicknames"));
        if (Array.isArray(nicknameArray) == false) {
            nicknameArray = [];
            set("nicknames", "[]");
        }
        nicknameArray.push(["", "", ""]);
        for (const nickname of nicknameArray) {
            if (nickname.length == 2 || nickname.length == 3) {
                const teacherName = sanitizeString(nickname[0]);
                const teacherAbbreviation = sanitizeString(nickname[2] ?? "");
                const teacherNickname = sanitizeString(nickname[1]);
                nicknames += `
                <div>
                    <input type="text" placeholder="Docentnaam" value="${teacherName}">
                    <input type="text" placeholder="Afkorting" value="${teacherAbbreviation}">
                    <input type="text" placeholder="Nickname" value="${teacherNickname}">
                </div>`;
            }
        }
        nicknames += `
        </div>
        <div class="br"></div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            <div tabindex="0" class="mod-button" onclick="
                document.getElementById('nickname-wrapper').insertAdjacentHTML('beforeend', \`
                <div>
                    <input type=\\'text\\' placeholder=\\'Docentnaam\\'>
                    <input type=\\'text\\' placeholder=\\'Afkorting\\'>
                    <input type=\\'text\\' placeholder=\\'Nickname\\'>
                </div>\`);
            ">${window.getIcon("plus", null, "var(--fg-on-primary-weak)")}Nickname toevoegen</div>
            <div tabindex="0" class="mod-button" onclick="
                document.getElementById('nickname-wrapper').innerHTML = \`
                <div>
                    <input type=\\'text\\' placeholder=\\'Docentnaam\\'>
                    <input type=\\'text\\' placeholder=\\'Afkorting\\'>
                    <input type=\\'text\\' placeholder=\\'Nickname\\'>
                </div>\`;
            ">${window.getIcon("rotate-left", null, "var(--fg-on-primary-weak)")}Reset</div>
        </div>`;

        // Update details
        const updateinfo = isExtension
            ? "Je browser controleert automatisch op updates."
            : "Je userscriptmanager controleert automatisch op updates.";

        // Credit contributors
        let contributorContent = "";
        for (const [key, value] of Object.entries(contributors)) {
            contributorContent += `
            <a class="mod-credits-gh-pill" href="https://github.com/${sanitizeString(key)}/" target="_blank" rel="noopener">
                <img src="${sanitizeString(value as string)}" alt="${sanitizeString(key)}" class="mod-credits-gh-avatar">
                <span class="mod-credits-gh-name">${sanitizeString(key)}</span>
            </a>
            `;
        }

        // Define some constants used in the replacements we'll do later
        const openDyslexicEnabled = tn("span", 0)
            ? window
                  .getComputedStyle(tn("span", 0))
                  .getPropertyValue("font-family")
                  .indexOf("OpenDyslexic") != -1
            : false;
        // "Weergave > Verberg profielfoto" is overridden when this option exists (some schools don't have profile pictures) AND a custom profile picture is set
        const avatarHiddenOverridden =
            document.querySelector(".avatar .initials") &&
            !n(get("profilepic")) &&
            n(document.getElementsByClassName("profielfoto-optie")[0]);
        const weergave =
            '<i style="background-color:var(--bg-primary-weak);fill:var(--fg-on-primary-weak);display:inline-block;vertical-align:middle;margin:0 5px;padding:5px;border-radius:4px;"><svg width="16px" height="16px" viewBox="0 0 24 24" display="block"><path d="m10.37 19.785-1.018-3.742H4.229L3.21 19.785H0L4.96 4h3.642l4.98 15.785zm-1.73-6.538L7.623 9.591q-.096-.365-.26-.935a114 114 0 0 0-.317-1.172q-.153-.603-.25-1.043-.095.441-.269 1.097a117 117 0 0 1-.538 2.053l-1.01 3.656h3.663Zm10.89-5.731q2.163 0 3.317 1.054Q23.999 9.623 24 11.774v8.01h-2.047l-.567-1.633h-.077q-.462.644-.942 1.053t-1.105.602q-.625.194-1.52.194a3.55 3.55 0 0 1-1.71-.409q-.75-.408-1.182-1.247-.432-.85-.433-2.15 0-1.914 1.202-2.818 1.2-.914 3.604-1.01l1.865-.065v-.527q0-.946-.442-1.387-.442-.44-1.23-.44a4.9 4.9 0 0 0-1.529.247q-.75.246-1.5.623l-.97-2.215a7.8 7.8 0 0 1 1.913-.796 8.3 8.3 0 0 1 2.2-.29m1.558 6.7-1.135.042q-1.422.043-1.98.57-.547.527-.547 1.387 0 .753.394 1.075.393.312 1.028.312.942 0 1.586-.623.654-.624.654-1.775v-.989Z"></path></svg></i>';
        const ngDetected = /(_ngcontent|_nghost|ng-tns-c\d+|ng-c\d+)/.test(
            get("customcss") ?? "",
        );
        const night = document
            .getElementsByTagName("html")[0]
            .classList.contains("night");

        // Fetch settings template HTML
        let settingsContent = window.getResourceAsText("data/settings.html");
        if (n(settingsContent)) {
            settingsContent =
                '<h3 style="margin-top: 200px;">Error</h3><p style="margin-bottom: 200px;">Could not generate the settings HTML at this moment. Try again later.</h3>';
        }

        // Replace keys in replacement with real content
        const replacements: Record<string, string> = {
            "{{icon_floppy_disk}}": window.getIcon(
                "floppy-disk",
                "mod-save-shake",
                "var(--text-moderate)",
            ),
            "{{icon_rotate_left}}": window.getIcon(
                "rotate-left",
                "mod-reset-rotate",
                "var(--text-moderate)",
            ),
            "{{icon_circle_info}}": window.getIcon(
                "circle-info",
                "mod-info-wobble",
                "var(--text-moderate)",
            ),
            "{{icon_circle_exclamation}}": window.getIcon(
                "circle-exclamation",
                "mod-bug-scale",
                "var(--text-moderate)",
            ),
            "{{icon_upload}}": window.getIcon(
                "upload",
                null,
                "var(--fg-on-primary-weak)",
            ),
            "{{icon_shuffle}}": window.getIcon(
                "shuffle",
                null,
                "var(--fg-on-primary-weak)",
            ),
            "{{icon_palette}}": window.getIcon(
                "palette",
                null,
                "var(--fg-on-primary-weak)",
            ),
            "{{icon_edit}}": window.getIcon(
                "edit",
                null,
                "var(--fg-on-primary-weak)",
            ),
            "{{addSetting_primarycolor}}": addSetting(
                "Primaire kleur",
                null,
                "primarycolor",
                "color",
                "#0067c2",
            ),
            "{{addSetting_secondarycolor}}": addSetting(
                "Secundaire kleur",
                null,
                "secondarycolor",
                "color",
                "#0067c2",
            ),
            "{{addLiveColors}}":
                addSetting(null, null, "livecolor1", "color", "#000000") +
                addSetting(null, null, "livecolor2", "color", "#000000") +
                addSetting(null, null, "livecolor3", "color", "#000000"),
            "{{backgroundtype_image_active}}":
                n(get("backgroundtype")) || get("backgroundtype") == "image"
                    ? "active"
                    : "",
            "{{backgroundtype_slideshow_active}}":
                get("backgroundtype") == "slideshow" ? "active" : "",
            "{{backgroundtype_color_active}}":
                get("backgroundtype") == "color" ? "active" : "",
            "{{backgroundtype_live_active}}":
                get("backgroundtype") == "live" ? "active" : "",
            "{{display_bg_image}}":
                n(get("backgroundtype")) || get("backgroundtype") == "image"
                    ? "block"
                    : "none",
            "{{display_mod_filters}}": n(get("background"))
                ? "display:none;"
                : "",
            "{{video_style}}": n(id("mod-background"))
                ? ""
                : `filter:${id("mod-background").style.filter};`,
            "{{video_src}}":
                get("isbackgroundvideo") && get("isbackgroundvideo") != "false"
                    ? `src="${get("background")}"`
                    : "",
            "{{image_style}}":
                (n(id("mod-background"))
                    ? ""
                    : `filter:${id("mod-background").style.filter};`) +
                (get("isbackgroundvideo") && get("isbackgroundvideo") != "false"
                    ? "display:none;"
                    : ""),
            "{{image_src}}": n(get("background"))
                ? "data:image/png;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs="
                : get("background"),
            "{{addSlider_brightness}}": addSlider(
                "Helderheid",
                "brightness",
                0,
                200,
                "%",
                100,
            ),
            "{{addSlider_contrast}}": addSlider(
                "Contrast",
                "contrast",
                0,
                200,
                "%",
                100,
            ),
            "{{addSlider_saturate}}": addSlider(
                "Verzadiging",
                "saturate",
                0,
                200,
                "%",
                100,
            ),
            "{{addSlider_opacity}}": addSlider(
                "Opacity",
                "opacity",
                0,
                100,
                "%",
                100,
            ),
            "{{addSlider_huerotate}}": addSlider(
                "Kleurrotatie",
                "huerotate",
                0,
                360,
                "deg",
                0,
            ),
            "{{addSlider_grayscale}}": addSlider(
                "Grayscale",
                "grayscale",
                0,
                100,
                "%",
                0,
            ),
            "{{addSlider_sepia}}": addSlider("Sepia", "sepia", 0, 100, "%", 0),
            "{{addSlider_invert}}": addSlider(
                "Invert",
                "invert",
                0,
                100,
                "%",
                0,
            ),
            "{{addSlider_blur}}": addSlider("Blur", "blur", 0, 200, "px", 0),
            "{{addSetting_background}}": addSetting(
                "Achtergrondafbeelding",
                "Stel een afbeelding in voor op de achtergrond. Video's worden ook ondersteund.",
                "background",
                "file",
                null,
                "image/*, video/*",
                null,
                `<div tabindex="0" class="mod-button" id="mod-random-background">${window.getIcon("shuffle", null, "var(--fg-on-primary-weak)")}<span>Random</span></div>`,
            ),
            "{{display_bg_slideshow}}":
                get("backgroundtype") == "slideshow" ? "block" : "none",
            "{{display_bg_color}}":
                get("backgroundtype") == "color" ? "block" : "none",
            "{{display_bg_live}}":
                get("backgroundtype") == "live" ? "block" : "none",
            "{{addSetting_backgroundcolor}}": addSetting(
                "Achtergrondkleur",
                null,
                "backgroundcolor",
                "color",
                darkmode ? "#20262d" : "#ffffff",
            ),
            "{{addSetting_ui_transparency}}": night
                ? '<div class="br"></div><div class="mod-info-notice">' +
                  window.getIcon(
                      "circle-info",
                      null,
                      "var(--fg-on-primary-weak)",
                      'style="height: 20px;"',
                  ) +
                  "Somtoday Mod Night mode ondersteunt momenteel geen UI transparantie en/of blur.</div>"
                : addSetting(
                      "UI-transparantie",
                      "Verander de transparantie van de UI.",
                      "ui",
                      "range",
                      get("ui"),
                      0,
                      100,
                      1,
                      true,
                      "image",
                      "opacity",
                  ),
            "{{addSetting_ui_blur}}": night
                ? ""
                : addSetting(
                      "UI-blur",
                      "Verander de blur van de UI.",
                      "uiblur",
                      "range",
                      get("uiblur"),
                      0,
                      100,
                      1,
                      true,
                      "image",
                      "blur",
                  ),
            "{{layout_1}}":
                '<div tabindex="0" class="layout-container' +
                (get("layout") == 1 ? " layout-selected" : "") +
                '" id="layout-1"><div style="width:94%;height:19%;top:4%;left: 3%;"></div><div style="width:94%;height:68%;top:27%;left:3%;"></div><h3>Standaard</h3></div>',
            "{{layout_2}}":
                '<div tabindex="0" class="layout-container' +
                (get("layout") == 2 ? " layout-selected" : "") +
                '" id="layout-2"><div style="width: 16%; height: 92%; top: 4%; left: 3%;"></div><div style="width: 75%; height: 92%; right: 3%; top: 4%;"></div><h3>Sidebar links</h3></div>',
            "{{layout_3}}":
                '<div tabindex="0" class="layout-container' +
                (get("layout") == 3 ? " layout-selected" : "") +
                '" id="layout-3"><div style="width:75%;height:92%;left:3%;top:4%;"></div><div style="width:16%;height:92%;right:3%;top:4%;"></div><h3>Sidebar rechts</h3></div>',
            "{{layout_4}}":
                '<div tabindex="0" class="layout-container' +
                (get("layout") == 4 ? " layout-selected" : "") +
                '" id="layout-4"><div style="width:68%;height:19%;top:4%;left:16%;"></div><div style="width: 68%;height:68%;top:27%;left: 16%;"></div><h3>Gecentreerd</h3></div>',
            "{{layout_5}}":
                '<div tabindex="0" class="layout-container' +
                (get("layout") == 5 ? " layout-selected" : "") +
                '" id="layout-5"><div style="width:16%;height:92%;top:4%;left:3%;"></div><div style="width:75%;height:19%;right:3%;top:4%;"></div><div style="width:75%;height:69%;right:3%;top:27%;"></div><h3>Menu & sidebar</h3></div>',
            "{{menu_settings}}":
                addSetting(
                    "Laat menu altijd zien",
                    "Toon de bovenste menubalk altijd. Als dit uitstaat, verdwijnt deze als je naar beneden scrolt.",
                    "bools00",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Paginanaam in menu",
                    "Laat een tekst met de paginanaam zien in het menu.",
                    "bools01",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Verberg bericht teller",
                    "Verberg het tellertje dat het aantal ongelezen berichten aangeeft.",
                    "bools02",
                    "checkbox",
                    false,
                ),
            "{{nicknames}}": nicknames,
            "{{username_wrapper}}":
                '<h3>Gebruikersnaam</h3><p>Verander je gebruikersnaam.</p><div id="username-wrapper"><div><input title="Echte naam" class="mod-custom-setting" id="realname" type="text" placeholder="Echte naam" value="' +
                (n(get("realname")) ? "" : get("realname")) +
                '"><input title="Nieuwe gebruikersnaam" class="mod-custom-setting" id="username" type="text" placeholder="Nieuwe gebruikersnaam" value="' +
                (n(get("username")) ? "" : sanitizeString(get("username"))) +
                '"></div></div>',
            "{{font_settings}}":
                `
                <h3>Lettertype</h3>` +
                (openDyslexicEnabled
                    ? '<div class="br"></div><div class="mod-info-notice">' +
                      window.getIcon(
                          "circle-info",
                          null,
                          "var(--fg-on-primary-weak)",
                          'style="height: 20px;"',
                      ) +
                      "De instelling <b>" +
                      weergave +
                      'Weergave > Optimaliseer voor dyslexie</b> moet uitstaan om dit te laten werken.</div><div class="br"></div><div class="br"></div>'
                    : "") +
                `
                <div class="br"></div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    <div class="mod-custom-select notranslate">
                        <select id="mod-font-select" title="Selecteer een lettertype">
                            <option selected disabled hidden>
                                ${n(get("customfontname")) ? get("fontname") : sanitizeString(get("customfontname"))}
                            </option>
                            <option>${fonts.join("</option><option>")}</option>
                        </select>
                    </div>
                    <label tabindex="0" class="mod-file-label" for="mod-font-file">
                        ${window.getIcon("upload", null, "var(--fg-on-primary-weak)")}
                        <span>Of upload lettertype</span>
                    </label>
                </div>
                <input id="mod-font-file" type="file" style="display:none;" accept=".otf,.ttf,.fnt,.woff,.woff2">
                <div class="example-box-wrapper">
                    <div id="font-box">
                        <h3 style="letter-spacing:normal;">Lettertype</h3>
                        <p style="letter-spacing:normal;margin-bottom:0;">Kies een lettertype voor Somtoday.</p>
                    </div>
                </div>
                <div class="br"></div><div class="br"></div><div class="br"></div>`,
            "{{profilepic_setting}}": addSetting(
                "Profielafbeelding",
                "Gebruik een eigen profielafbeelding in plaats van je schoolfoto." +
                    (avatarHiddenOverridden
                        ? '<div class="mod-info-notice">' +
                          window.getIcon(
                              "circle-info",
                              null,
                              "var(--fg-on-primary-weak)",
                              'style="height: 20px;"',
                          ) +
                          "De instelling <b>" +
                          weergave +
                          "Weergave > Verberg profielfoto</b> wordt genegeerd omdat je een custom profielafbeelding hebt ingesteld. Reset deze instelling om je initialen te tonen.</div>"
                        : ""),
                "profilepic",
                "file",
                null,
                "image/*",
                "120",
            ),
            "{{grade_reveal_setting}}":
                '<div><h3>Cijfer-reveal</h3><p style="margin-right:15px;">Toon bij je cijfers een optel-animatie.</p><div id="grade-reveal-select" class="mod-multi-choice"><span' +
                (get("bools").charAt(BOOL_INDEX.GRADE_REVEAL) == "1"
                    ? ' class="active"'
                    : "") +
                ' tabindex="0">Alleen bij nieuwe cijfers</span><span' +
                (get("bools").charAt(BOOL_INDEX.GRADE_REVEAL) == "2"
                    ? ' class="active"'
                    : "") +
                ' tabindex="0">Altijd</span><span' +
                (get("bools").charAt(BOOL_INDEX.GRADE_REVEAL) == "0"
                    ? ' class="active"'
                    : "") +
                ' tabindex="0">Nooit</span></div></div>',
            "{{letterbeoordelingen_setting}}": `<div><h3>Letterbeoordelingen</h3><p style="margin-right:15px;">Stel in hoeveel lettercijfers (O, V, G, etc) waard zijn voor jouw school.</p><div id="mod-change-letterbeoordelingen" tabindex="0" class="mod-button">${window.getIcon("edit", null, "var(--fg-on-primary-weak)")}Instellen</div></div>`,
            "{{extra_settings}}":
                addSetting(
                    "Analyse op cijferpagina",
                    "Laat een korte analyse zien op de cijfer-pagina van een vak.",
                    "bools18",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Compact rooster",
                    "Maak je rooster compacter door lesuren in een grid te zetten. Werkt niet voor alle scholen.",
                    "bools03",
                    "checkbox",
                    false,
                ) +
                addSetting(
                    "Deel debug-data",
                    "Verstuur bij een error anonieme informatie naar de developers om Somtoday Mod te verbeteren.",
                    "bools04",
                    "checkbox",
                    false,
                ) +
                addSetting(
                    "Downloadknop voor cijfers",
                    "Laat een downloadknop zien op de laatste cijfers en vakgemiddelden-pagina.",
                    "bools05",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Feestdagen",
                    "Laat bij feestdagen soms iets zien, zoals een kerstmuts op het Somtoday-logo.",
                    "bools17",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Felicitatieberichten",
                    "Laat een felicitatiebericht zien als je jarig bent, of als je al een aantal jaar van Somtoday Mod gebruik maakt.",
                    "bools06",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Grafieken op cijferpagina",
                    "Laat een cijfer- en gemiddeldegrafiek zien op de cijfer-pagina van een vak.",
                    "bools07",
                    "checkbox",
                    true,
                ) +
                (get("layout") == 2 || get("layout") == 3 || get("layout") == 5
                    ? addSetting(
                          "Logo van mod in menu",
                          "Laat in plaats van het logo van Somtoday het logo van Somtoday Mod zien.",
                          "bools08",
                          "checkbox",
                          true,
                      )
                    : "") +
                addSetting(
                    "Raster bij rooster",
                    "Laat een raster zien achter je rooster.",
                    "bools15",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Redirect naar ELO",
                    "Redirect je automatisch van https://som.today naar https://inloggen.somtoday.nl.",
                    "bools09",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Rekentool op cijferpagina",
                    "Voeg een rekentool toe op de cijferpagina om snel te berekenen welk cijfer je moet halen.",
                    "bools10",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Scrollbar",
                    "Laat de scrollbar van een pagina zien.",
                    "bools11",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Selecteren",
                    "Maak alle tekst selecteerbaar.",
                    "bools13",
                    "checkbox",
                    false,
                ) +
                addSetting(
                    "Somtoday Recap",
                    "Laat aan het einde van het schooljaar een recap-knop zien (vanaf 26 juni).",
                    "bools12",
                    "checkbox",
                    true,
                ) +
                addSetting(
                    "Taken toevoegen",
                    "Laat een knop zien om taken toe te voegen aan de studiewijzer.",
                    "bools16",
                    "checkbox",
                    true,
                ),
            "{{browser_settings}}":
                addSetting(
                    "Titel",
                    "Verander de titel van Somtoday in de tabbladen van de browser.",
                    "title",
                    "text",
                    "",
                    "Somtoday",
                ) +
                '<div class="br"></div><div class="br"></div><div class="br"></div>' +
                addSetting(
                    "Icoon",
                    "Verander het icoontje van Somtoday in de menubalk van de browser. Accepteert png, jpg/jpeg, gif, svg, ico en meer.</p>" +
                        (platform == "Firefox"
                            ? ""
                            : '<div class="mod-info-notice">' +
                              window.getIcon(
                                  "circle-info",
                                  null,
                                  "var(--fg-on-primary-weak)",
                                  'style="height: 20px;"',
                              ) +
                              "Bewegende GIF-bestanden werken alleen in Firefox.</div>") +
                        '<div class="br"></div><p>',
                    "icon",
                    "file",
                    null,
                    "image/*",
                    "300",
                ) +
                '<div class="br"></div><div class="br"></div>' +
                addSetting(
                    "Aangepaste CSS",
                    "Voer hier je eigen CSS in om Somtoday nóg verder te veranderen. Dit is een geavanceerde instelling voor gebruikers die weten hoe CSS werkt.",
                    "customcss",
                    "textarea",
                    "",
                    "/* Voorbeeld: */\nbody {\n    background: red;\n}",
                    "15",
                ) +
                '<div id="angular-hash-warning" style="display: ' +
                (ngDetected ? "block" : "none") +
                ';"><div class="br"></div><div class="mod-info-notice">' +
                window.getIcon(
                    "circle-info",
                    null,
                    "var(--fg-on-primary-weak)",
                    'style="height: 20px;"',
                ) +
                'We hebben een _ng-attribuut of ng-classname gedetecteerd. Deze worden door A<b>ng</b>ular bij elke versie van Somtoday opnieuw gegenereerd, waardoor de CSS over een paar maanden niet meer zal werken. Het is beter om id\'s, normale classnames en andere selectors te gebruiken.</div><div class="br"></div><div class="br"></div></div>',
            "{{autologin_warning}}":
                get("logincredentialsincorrect") == "1"
                    ? '<div class="mod-info-notice">' +
                      window.getIcon(
                          "circle-info",
                          null,
                          "var(--fg-on-primary-weak)",
                          'style="height: 20px;"',
                      ) +
                      'Autologin is tijdelijk uitgeschakeld.</div><div class="br"></div><div class="br"></div><div class="br"></div>'
                    : "",
            "{{autologin_school}}": addSetting(
                "School",
                "Voer je schoolnaam in.",
                "loginschool",
                "text",
                "",
                "",
            ),
            "{{autologin_name}}": addSetting(
                "Gebruikersnaam",
                "Voer je gebruikersnaam in.",
                "loginname",
                "text",
                "",
                "",
            ),
            "{{autologin_pass}}": addSetting(
                "Wachtwoord",
                "Voer je wachtwoord in.",
                "loginpass",
                "password",
                "",
                "",
            ),
            "{{somtoday_version}}": `Versie ${version_name} van Somtoday Mod`,
            "{{platform}}": `Somtoday ${platform}`,
            "{{contributors_list}}": contributorContent,
            "{{updateinfo}}": updateinfo,
            "{{export_import_buttons}}": `<div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"><div id="export-settings" class="mod-button">${window.getIcon("export", null, "var(--fg-on-primary-weak)")}<span>Exporteer Mod-instellingen</span></div><div id="import-settings" class="mod-button">${window.getIcon("import", null, "var(--fg-on-primary-weak)")}<span>Importeer Mod-instellingen</span></div></div><input type="file" id="import-settings-json" class="hidden" accept="application/json">`,
        };
        for (const key in replacements) {
            settingsContent = settingsContent.replaceAll(
                key,
                replacements[key],
            );
        }

        // Insert the HTML
        tn("sl-account-modal", 0)
            .getElementsByClassName("content")[0]
            .children[0].insertAdjacentHTML("beforeend", settingsContent);

        for (const element of cn("mod-game")) {
            element.addEventListener("click", () => {
                execute([startTheEscape]);
            });
        }

        // Import/export settings
        if (
            id("import-settings") &&
            id("export-settings") &&
            id("import-settings-json")
        ) {
            id("export-settings").addEventListener("click", exportSettings);
            id("import-settings").addEventListener("click", () => {
                modMessage(
                    "Instellingen importeren?",
                    "Wanneer je Mod-instellingen importeert worden je huidige instellingen overschreven. Importeer alleen instellingsbestanden die je vertrouwt of zelf hebt ge&euml;xporteerd.",
                    "Ja",
                    "Nee",
                );
                id("mod-message-action1").addEventListener("click", () => {
                    id("import-settings-json").click();
                    closeModMessage();
                });
                id("mod-message-action2").addEventListener(
                    "click",
                    closeModMessage,
                );
            });
            id("import-settings-json").addEventListener(
                "input",
                importSettings,
            );
        }

        // Upload your own custom font file, like Wingdings
        if (id("mod-font-file")) {
            id("mod-font-file").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const fontFile = this.files?.[0];
                    if (fontFile) {
                        tryRemove(id("mod-font-preview"));
                        const label =
                            this.parentElement?.getElementsByTagName(
                                "label",
                            )[0];
                        if (label?.children[1]) {
                            (label.children[1] as HTMLElement).innerText =
                                fontFile.name.toLowerCase();
                        }
                        label?.classList.add("mod-active");
                        const reader = new FileReader();
                        reader.readAsDataURL(fontFile);
                        reader.onload = () => {
                            setTimeout(() => {
                                tn("head", 0).insertAdjacentHTML(
                                    "beforeend",
                                    '<style id="mod-font-preview">@font-face{font-family:modCustomFontPreview;src:url("' +
                                        reader.result +
                                        '");}</style>',
                                );
                                const fontBox =
                                    document.getElementById("font-box");
                                if (fontBox?.children[0]) {
                                    (
                                        fontBox.children[0] as HTMLElement
                                    ).style.setProperty(
                                        "font-family",
                                        "modCustomFontPreview, sans-serif",
                                        "important",
                                    );
                                }
                                if (fontBox?.children[1]) {
                                    (
                                        fontBox.children[1] as HTMLElement
                                    ).style.setProperty(
                                        "font-family",
                                        "modCustomFontPreview, sans-serif",
                                        "important",
                                    );
                                }
                            }, 100);
                        };
                    } else {
                        const label =
                            this.parentElement?.getElementsByTagName(
                                "label",
                            )[0];
                        if (label?.children[1]) {
                            (label.children[1] as HTMLElement).innerText =
                                "Of upload lettertype";
                        }
                        label?.classList.remove("mod-active");
                        this.value = "";
                    }
                },
            );
        }
        if (id("customcss")) {
            // Insert tab instead of moving to the next element
            id("customcss").addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Tab") {
                    e.preventDefault();
                    e.preventDefault();

                    // execCommand doesn't mess with Ctrl Z history
                    if (!document.execCommand("insertText", false, "    ")) {
                        // Fallback, execCommand is technically deprecated and could be removed sooner or later
                        const start = id("customcss").selectionStart;
                        const end = id("customcss").selectionEnd;

                        id("customcss").value =
                            id("customcss").value.substring(0, start) +
                            "    " +
                            id("customcss").value.substring(end);

                        id("customcss").selectionStart = id(
                            "customcss",
                        ).selectionEnd = start + 4;
                    }
                }
            });

            // Live input checking
            id("customcss").addEventListener("input", (e: any) => {
                const content = e.target.value;

                // Angular hash check
                if (/(_ngcontent|_nghost|ng-tns-c\d+|ng-c\d+)/.test(content)) {
                    id("angular-hash-warning").style.display = "block";
                } else {
                    id("angular-hash-warning").style.display = "none";
                }

                // Live sanitization to prevent surprises after save
                if (
                    content.indexOf("javascript:") != -1 ||
                    content.indexOf("@import") != -1
                ) {
                    e.target.value = e.target.value
                        .replace(/javascript:[^'"]*/gi, "")
                        .replace(/@import[^;\n]*/gi, "");
                }
            });
        }

        // Add themes
        // Background images thanks to Pexels: https://www.pexels.com
        resetThemeCount(); // used for "Meer bekijken" logic, gets incremented with each addTheme()
        addTheme("Standaard", "", "#0067c2", "#e69b22");
        addTheme("Bergen", "618833", "#3b4117", "#3b4117");
        addTheme("Eiland", "994605", "#2a83b1", "#2a83b1");
        addTheme("Zee", "756856", "#173559", "#173559");
        addTheme("Bergmeer", "1284296", "#4a6a2f", "#4a6a2f");
        addTheme("Rivieruitzicht", "822528", "#526949", "#526949");
        addTheme("Ruimte", "110854", "#0d0047", "#0d0047");
        addTheme("Bergen en ruimte", "1624504", "#6489a0", "#6489a0");
        addTheme("Stad", "2246476", "#18202d", "#18202d");
        addTheme("Weg", "1820563", "#de3c22", "#de3c22");
        addTheme("Woestijn", "847402", "#ac7a0d", "#ac7a0d");
        addTheme("Kronkelweg", "34535324", "#ee8317", "#ee8317");
        addTheme("Kat", "730896", "#2b2d36", "#ffffff");
        addTheme("Honden", "215957", "#ee8317", "#ee8317");
        addTheme("Gamen", "539986", "#1100ffff", "#ffffff");
        addTheme("Biljard", "6253916", "#27f56c", "#13bd4c");
        addTheme("Arcade", "28920045", "#fd4ff4", "#fd4ff4");
        addTheme("Ski's", "257961", "#f71111", "#f71111");
        addTheme("Schaken", "277124", "#514642", "#e8e8e8");
        addTheme("Kerstmis", "1708601", "#0dac0d", "#a50c0c");
        id("theme-wrapper").insertAdjacentHTML(
            "afterend",
            `<div id="more-themes" tabindex="0" class="mod-button">Meer bekijken</div>`,
        );
        document
            .getElementById("more-themes")
            ?.addEventListener("click", function (this: HTMLElement) {
                const hiddenThemes =
                    this.previousElementSibling?.querySelectorAll(
                        ".theme[style]",
                    );
                if (!hiddenThemes) return;
                for (let i = 0; i < 10; i++) {
                    if (n(hiddenThemes[i])) break;

                    hiddenThemes[i].removeAttribute("style");
                }
                if (hiddenThemes.length - 10 <= 0) {
                    this.remove();
                }
            });

        // Backgrounds
        const slideshowWrapper = id("mod-background-wrapper");
        const slideshowLabel =
            slideshowWrapper.getElementsByTagName("label")[0];
        const slideCount = n(get("slides")) ? 0 : get("slides");
        // Insert placeholder divs (will be replaced with <img> elements)
        for (let i = 0; i < slideCount; i++) {
            slideshowWrapper.insertBefore(
                document.createElement("div"),
                slideshowLabel,
            );
        }

        // Add slideshow image asynchronous
        async function addImage(url: string, element: Element | null = null) {
            return new Promise<void>((resolve, reject) => {
                if (n(slideshowLabel)) {
                    resolve();
                }

                const img = document.createElement("img");
                img.onload = () => resolve();
                img.onerror = reject;
                img.addEventListener("click", function (this: HTMLElement) {
                    id("mod-background-wrapper").classList.add("mod-modified");
                    this.remove();
                });
                img.tabIndex = 0;
                img.src = url;
                if (element) {
                    element.replaceWith(img);
                } else {
                    slideshowWrapper.insertBefore(img, slideshowLabel);
                }
            });
        }

        // Replace all placeholder <div> elements with their corresponding <img> elements
        addSlide(0);
        async function addSlide(i: number) {
            const div = slideshowWrapper.getElementsByTagName("div")[0];
            const background = get(`background${i}`);

            if (i >= slideCount) {
                slideshowWrapper.classList.remove("mod-loading");
                return;
            }

            await addImage(background, div);
            await new Promise((resolve) => setTimeout(resolve, 1));

            addSlide(i + 1);
        }
        const notLoaded = slideshowWrapper.querySelectorAll("div");
        notLoaded.forEach((el: Element) => {
            el.remove();
        });

        // Backgrounds section event listeners
        if (
            id("mod-background-preview-image") &&
            id("mod-background-preview-video")
        ) {
            const isbackgroundvideo =
                get("isbackgroundvideo") && get("isbackgroundvideo") != "false";
            id("mod-background-preview-image").style.setProperty(
                "filter",
                getBackgroundFilters(false),
            );
            id("mod-background-preview-video").style.setProperty(
                "filter",
                getBackgroundFilters(false),
            );
            id("mod-background-preview-image").style.display =
                !isbackgroundvideo ? "block" : "none";
            id("mod-background-preview-video").style.display = isbackgroundvideo
                ? "block"
                : "none";
        }
        if (id("addbackground")) {
            id("addbackground").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const files = this.files;
                    if (!files) return;
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        if (!file) continue;
                        if (
                            this.accept != "image/*" ||
                            file.type.indexOf("image") != -1
                        ) {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => {
                                id("mod-background-wrapper").classList.add(
                                    "mod-modified",
                                );
                                addImage(reader.result as string);
                            };
                        }
                    }
                },
            );
        }
        if (id("background")) {
            id("background").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const file = this.files?.[0];
                    if (file != null) {
                        const isVideo = file.type.indexOf("video") != -1;
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        id("mod-background-preview-image").style.display =
                            !isVideo ? "block" : "none";
                        id("mod-background-preview-video").style.display =
                            isVideo ? "block" : "none";
                        id("mod-filters").style.display = "block";
                        reader.onload = () => {
                            if (isVideo) {
                                id("mod-background-preview-video").src =
                                    reader.result;
                            } else {
                                id("mod-background-preview-image").src =
                                    reader.result;
                            }
                        };
                    } else {
                        id("mod-filters").style.display = "none";
                    }
                },
            );
        }
        if (id("mod-reset-filters")) {
            id("mod-reset-filters").addEventListener("click", () => {
                id("brightness").value = 100;
                id("brightness").dispatchEvent(new Event("input"));
                id("contrast").value = 100;
                id("contrast").dispatchEvent(new Event("input"));
                id("saturate").value = 100;
                id("saturate").dispatchEvent(new Event("input"));
                id("opacity").value = 100;
                id("opacity").dispatchEvent(new Event("input"));
                id("huerotate").value = 0;
                id("huerotate").dispatchEvent(new Event("input"));
                id("grayscale").value = 0;
                id("grayscale").dispatchEvent(new Event("input"));
                id("sepia").value = 0;
                id("sepia").dispatchEvent(new Event("input"));
                id("invert").value = 0;
                id("invert").dispatchEvent(new Event("input"));
                id("blur").value = 0;
                id("blur").dispatchEvent(new Event("input"));
                id("mod-background-preview-image").style.setProperty(
                    "filter",
                    getBackgroundFilters(false),
                );
                id("mod-background-preview-video").style.setProperty(
                    "filter",
                    getBackgroundFilters(false),
                );
            });
        }
        if (
            id("type-image") &&
            id("type-slideshow") &&
            id("type-color") &&
            id("type-live")
        ) {
            id("type-image").addEventListener(
                "click",
                function (this: HTMLElement) {
                    this.parentElement
                        ?.getElementsByClassName("active")[0]
                        ?.classList.remove("active");
                    this.classList.add("active");
                    show(id("mod-bg-image"));
                    hide(id("mod-bg-slideshow"));
                    hide(id("mod-bg-color"));
                    hide(id("mod-bg-live"));
                },
            );
            id("type-slideshow").addEventListener(
                "click",
                function (this: HTMLElement) {
                    this.parentElement
                        ?.getElementsByClassName("active")[0]
                        ?.classList.remove("active");
                    this.classList.add("active");
                    hide(id("mod-bg-image"));
                    show(id("mod-bg-slideshow"));
                    hide(id("mod-bg-color"));
                    hide(id("mod-bg-live"));
                },
            );
            id("type-color").addEventListener(
                "click",
                function (this: HTMLElement) {
                    this.parentElement
                        ?.getElementsByClassName("active")[0]
                        ?.classList.remove("active");
                    this.classList.add("active");
                    hide(id("mod-bg-image"));
                    hide(id("mod-bg-slideshow"));
                    show(id("mod-bg-color"));
                    hide(id("mod-bg-live"));
                },
            );
            id("type-live").addEventListener(
                "click",
                function (this: HTMLElement) {
                    this.parentElement
                        ?.getElementsByClassName("active")[0]
                        ?.classList.remove("active");
                    this.classList.add("active");
                    hide(id("mod-bg-image"));
                    hide(id("mod-bg-slideshow"));
                    hide(id("mod-bg-color"));
                    show(id("mod-bg-live"));
                },
            );
        }

        // Multiple choice select
        for (const element of cn("mod-multi-choice")) {
            for (const child of element.children) {
                child.addEventListener("click", function (this: HTMLElement) {
                    this.parentElement
                        ?.getElementsByClassName("active")[0]
                        ?.classList.remove("active");
                    this.classList.add("active");
                });
            }
        }
        // Filter sliders
        for (const element of cn("mod-slider")) {
            if (!element.getElementsByTagName("input")[0]) {
                continue;
            }
            element
                .getElementsByTagName("input")[0]
                .addEventListener("input", function (this: HTMLInputElement) {
                    this.classList.add("mod-modified");
                    if (this.parentElement?.children[2]) {
                        this.parentElement.children[2].innerHTML =
                            this.value + (this.dataset.unit || "");
                    }
                    id("mod-background-preview-image").style.setProperty(
                        "filter",
                        getBackgroundFilters(false),
                    );
                    id("mod-background-preview-video").style.setProperty(
                        "filter",
                        getBackgroundFilters(false),
                    );
                });
        }
        // Drag and drop on file inputs
        for (const element of cn("mod-file-label")) {
            element.addEventListener("drop", (event: DragEvent) => {
                // Prevent default behavior (Prevent file from being opened)
                event.preventDefault();

                if (!event.dataTransfer) return;

                let done = false;
                if (event.dataTransfer.items) {
                    [...event.dataTransfer.items].forEach((item) => {
                        if (!done && item.kind === "file") {
                            done = true;
                            element.classList.remove("mod-drag-and-drop");
                            const file = item.getAsFile();
                            if (!file) return;
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            const fileList = dataTransfer.files;
                            const prevInput = element.parentElement
                                ?.previousElementSibling as HTMLInputElement | null;
                            if (prevInput) {
                                prevInput.files = fileList;
                            }
                        }
                    });
                } else if (event.dataTransfer.files) {
                    [...event.dataTransfer.files].forEach((file) => {
                        if (!done) {
                            done = true;
                            element.classList.remove("mod-drag-and-drop");
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            const fileList = dataTransfer.files;
                            const prevInput = element.parentElement
                                ?.previousElementSibling as HTMLInputElement | null;
                            if (prevInput) {
                                prevInput.files = fileList;
                            }
                        }
                    });
                }
                const inputEvent = new Event("input", {
                    bubbles: false,
                });
                element.parentElement?.previousElementSibling?.dispatchEvent(
                    inputEvent,
                );
            });
            element.addEventListener("dragover", (event: DragEvent) => {
                event.preventDefault();
                element.classList.add("mod-drag-and-drop");
                element.children[1].innerHTML = "Drop een afbeelding";
            });
            element.addEventListener("dragleave", () => {
                element.classList.remove("mod-drag-and-drop");
                element.children[1].innerHTML = "Kies een bestand";
            });
        }
        // File reset buttons
        for (const element of cn("mod-file-reset")) {
            element.addEventListener("click", () => {
                const shouldBeActive =
                    !element.classList.contains("mod-active");
                for (const btn of element.parentElement.getElementsByClassName(
                    "mod-active",
                )) {
                    btn.classList.remove("mod-active");
                    if (btn.classList.contains("mod-file-label")) {
                        setHTML(btn.children[1], "Kies een bestand");
                        element.parentElement.previousElementSibling.value =
                            null;
                    }
                }
                if (shouldBeActive) {
                    element.classList.add("mod-active");
                }
            });
        }

        // Section collapsing
        let number = 0;
        if (n(get("category"))) {
            set("category", "1".repeat(20));
        }
        const categories = get("category");
        for (const element of cn("mod-setting-button")) {
            element.addEventListener(
                "keyup",
                (event: KeyboardEvent) => {
                    if (event.keyCode === 13) {
                        element.click();
                    }
                },
                { once: true },
            );
        }
        for (const element of id("mod-setting-panel").getElementsByClassName(
            "category",
        )) {
            const index = number;
            id(`category-${element.dataset.category}`).style.display =
                categories.charAt(index) == "1" ? "block" : "none";
            if (categories.charAt(index) == "1") {
                element.classList.remove("collapsed");
            } else {
                element.classList.add("collapsed");
            }
            element.addEventListener("click", () => {
                // Collapsed: whether the category was collapsed before toggling
                // So if collapsed == true, then the category should be shown
                const collapsed =
                    id(`category-${element.dataset.category}`).style.display ==
                    "none";
                set(
                    "category",
                    get("category").replaceAt(index, collapsed ? "1" : "0"),
                );
                if (collapsed) {
                    element.classList.remove("collapsed");
                } else {
                    element.classList.add("collapsed");
                }
                id(`category-${element.dataset.category}`).style.display =
                    collapsed ? "block" : "none";
            });
            element.addEventListener(
                "keyup",
                (event: KeyboardEvent) => {
                    if (event.keyCode === 13) {
                        element.click();
                    }
                },
                { once: true },
            );
            number++;
        }

        // Add event listeners to make layout boxes work
        for (const element of cn("layout-container")) {
            element.addEventListener("click", () => {
                for (const element of cn("layout-selected")) {
                    element.classList.remove("layout-selected");
                }
                element.classList.add("layout-selected");
            });
        }

        // Make save button and reset button work
        if (id("save")) {
            id("save").addEventListener("click", () => {
                execute([save]);
            });
        }
        if (id("reset")) {
            id("reset").addEventListener("click", () => {
                modMessage(
                    "Alles resetten?",
                    "Al je instellingen zullen worden gereset. Weet je zeker dat je door wil gaan?",
                    "Ja",
                    "Nee",
                );
                id("mod-message-action1").addEventListener("click", () => {
                    reset();
                    saveReload(true);
                    if (
                        id("mod-grades-graphs") &&
                        get("bools").charAt(BOOL_INDEX.SUBJECT_GRAPHS) == "1" &&
                        tn("sl-vakresultaten", 0)
                    ) {
                        tryRemove(id("mod-grades-graphs"));
                        tn("sl-vakresultaten", 0).insertAdjacentHTML(
                            "beforeend",
                            '<div id="mod-grades-graphs"><h3>Mijn cijfers</h3><div><canvas id="mod-chart-1"></canvas></div><h3>Mijn gemiddelde</h3><div><canvas id="mod-chart-2"></canvas></div></div>',
                        );
                        setTimeout(gradeGraphs, 500);
                    }
                    closeModMessage();
                });
                id("mod-message-action2").addEventListener(
                    "click",
                    closeModMessage,
                );
            });
        }
        // Make random background button work
        // Random background images thanks to Lorem Picsum: https://picsum.photos
        if (id("mod-random-background")) {
            id("mod-random-background").addEventListener("click", () => {
                id("mod-random-background").classList.toggle("mod-active");
                if (id("mod-random-background").previousElementSibling) {
                    if (
                        id(
                            "mod-random-background",
                        ).previousElementSibling.classList.contains(
                            "mod-active",
                        )
                    ) {
                        id(
                            "mod-random-background",
                        ).previousElementSibling.classList.remove("mod-active");
                    }
                    if (
                        id("mod-random-background").previousElementSibling
                            ?.previousElementSibling &&
                        id(
                            "mod-random-background",
                        ).previousElementSibling.previousElementSibling.getElementsByTagName(
                            "label",
                        )[0] &&
                        id("mod-random-background")
                            .previousElementSibling.previousElementSibling.getElementsByTagName(
                                "label",
                            )[0]
                            .classList.contains("mod-active")
                    ) {
                        id("mod-random-background")
                            .previousElementSibling.previousElementSibling.getElementsByTagName(
                                "label",
                            )[0]
                            .classList.remove("mod-active");
                        setHTML(
                            id(
                                "mod-random-background",
                            ).previousElementSibling.previousElementSibling.getElementsByTagName(
                                "label",
                            )[0].children[1],
                            "Kies een bestand",
                        );
                        id(
                            "mod-random-background",
                        ).previousElementSibling.previousElementSibling.getElementsByTagName(
                            "input",
                        )[0].value = null;
                    }
                }
            });
        }

        // Live wallpaper
        if (id("mod-live-random")) {
            let liveType: any, col1: any, col2: any, col3: any;

            id("primarycolor").addEventListener("change", () => {
                if (liveType == "primary") {
                    id("mod-live-primary").click();
                }
            });

            id("secondarycolor").addEventListener("change", () => {
                if (liveType == "secondary") {
                    id("mod-live-secondary").click();
                }
            });

            id("livecolor1").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const rgb = hexToRgb(this.value);
                    if (
                        col1[0] != rgb[0] ||
                        col1[1] != rgb[1] ||
                        col1[2] != rgb[2]
                    ) {
                        col1 = rgb;
                        resetLiveButtons();
                    }
                },
            );
            id("livecolor2").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const rgb = hexToRgb(this.value);
                    if (
                        col2[0] != rgb[0] ||
                        col2[1] != rgb[1] ||
                        col2[2] != rgb[2]
                    ) {
                        col2 = rgb;
                        resetLiveButtons();
                    }
                },
            );
            id("livecolor3").addEventListener(
                "input",
                function (this: HTMLInputElement) {
                    const rgb = hexToRgb(this.value);
                    if (
                        col3[0] != rgb[0] ||
                        col3[1] != rgb[1] ||
                        col3[2] != rgb[2]
                    ) {
                        col3 = rgb;
                        resetLiveButtons();
                    }
                },
            );

            function resetLiveButtons(e?: any) {
                if (e) return;

                id("mod-bg-live").dataset.type = liveType;
                id("mod-live-random").classList.remove("mod-active");
                id("mod-live-primary").classList.remove("mod-active");
                id("mod-live-secondary").classList.remove("mod-active");
                id("mod-live-custom").classList.remove("mod-active");

                id("livecolor1").value = rgbToHex(col1);
                id("livecolor1").dispatchEvent(
                    new Event("input", { bubbles: false }),
                );
                id("livecolor2").value = rgbToHex(col2);
                id("livecolor2").dispatchEvent(
                    new Event("input", { bubbles: false }),
                );
                id("livecolor3").value = rgbToHex(col3);
                id("livecolor3").dispatchEvent(
                    new Event("input", { bubbles: false }),
                );

                id(`mod-live-${liveType}`).classList.add("mod-active");

                if (liveType == "custom") {
                    show(id("mod-live-colors"));
                } else {
                    hide(id("mod-live-colors"));
                }

                startLiveWallpaper(true, col1, col2, col3);
            }

            id("mod-live-random").addEventListener("click", () => {
                liveType = "random";
                col1 = randomColor(0);
                col2 = randomColor(2);
                col3 = randomColor(4);

                resetLiveButtons();
            });
            id("mod-live-primary").addEventListener("click", () => {
                const baseColor = id("primarycolor").value;

                liveType = "primary";
                col1 = hexToRgb(baseColor);
                col2 = hexToRgb(adjust(baseColor, -50));
                col3 = hexToRgb(adjust(baseColor, 50));

                resetLiveButtons();
            });
            id("mod-live-secondary").addEventListener("click", () => {
                const baseColor = id("secondarycolor").value;

                liveType = "secondary";
                col1 = hexToRgb(baseColor);
                col2 = hexToRgb(adjust(baseColor, -50));
                col3 = hexToRgb(adjust(baseColor, 50));

                resetLiveButtons();
            });
            id("mod-live-custom").addEventListener("click", () => {
                liveType = "custom";

                resetLiveButtons();
            });

            if (n(get("livetype"))) {
                id("mod-live-random").click();
            } else {
                liveType = get("livetype");
                col1 = hexToRgb(get("livecolor1"));
                col2 = hexToRgb(get("livecolor2"));
                col3 = hexToRgb(get("livecolor3"));

                resetLiveButtons();
            }
        }

        // Letterbeoordelingen
        if (id("mod-change-letterbeoordelingen")) {
            id("mod-change-letterbeoordelingen").addEventListener(
                "click",
                () => {
                    showLetterbeoordelingenMessage();
                },
            );
        }
        // Add script to make the font select element work
        if (id("mod-font-select-script")) {
            tryRemove(id("mod-font-select-script"));
        }
        id("somtoday-mod").insertAdjacentHTML(
            "beforeend",
            '<style id="mod-font-select-script" onload=\'let x, i, j, l, ll, selElmnt, a, b, c; x = document.getElementsByClassName("mod-custom-select"); l = x.length; for (i = 0; i < l; i++) { selElmnt = x[i].getElementsByTagName("select")[0]; ll = selElmnt.length; a = document.createElement("DIV"); a.setAttribute("class", "select-selected"); a.setAttribute("tabindex", "0"); a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML; x[i].appendChild(a); b = document.createElement("DIV"); b.setAttribute("class", "select-items select-hide"); for (j = 1; j < ll; j++) { c = document.createElement("DIV"); c.innerHTML = selElmnt.options[j].innerHTML; c.setAttribute("tabindex", "0"); c.style.setProperty("font-family", "\\"" + selElmnt.options[j].innerHTML + "\\", sans-serif", "important"); c.addEventListener("click", function(e) { let y, i, k, s, h, sl, yl; s = this.parentNode.parentNode.getElementsByTagName("select")[0]; sl = s.length; h = this.parentNode.previousSibling; for (i = 0; i < sl; i++) { if (this.style.fontFamily.indexOf(s.options[i].innerHTML + ",") != -1 || this.style.fontFamily.indexOf(s.options[i].innerHTML + "\\",") != -1) { s.selectedIndex = i; h.innerHTML = this.innerHTML; y = this.parentNode.getElementsByClassName("same-as-selected"); yl = y.length; for (k = 0; k < yl; k++) { y[k].removeAttribute("class"); } this.setAttribute("class", "same-as-selected"); break; } } h.click(); document.getElementById("mod-font-select").classList.add("mod-modified"); if (document.getElementById("mod-font-preview")) { document.getElementById("mod-font-preview").remove(); } document.getElementById("mod-font-file").value = ""; let event = new Event("input", { bubbles: false }); document.getElementById("mod-font-file").dispatchEvent(event); document.getElementById("font-box").children[0].style.setProperty("font-family", "\\"" + document.getElementById("mod-font-select").value + "\\", sans-serif", "important"); document.getElementById("font-box").children[1].style.setProperty("font-family", "\\"" + document.getElementById("mod-font-select").value + "\\", sans-serif", "important"); document.getElementsByClassName("select-selected")[0].style.setProperty("font-family", "\\"" + document.getElementById("mod-font-select").value + "\\", sans-serif", "important"); }); b.appendChild(c); } x[i].appendChild(b); a.addEventListener("click", function(e) { e.stopPropagation(); closeAllSelect(this); this.nextSibling.classList.toggle("select-hide"); this.classList.toggle("select-arrow-active"); }); } function closeAllSelect(elmnt) { let x, y, i, xl, yl, arrNo = []; x = document.getElementsByClassName("select-items"); y = document.getElementsByClassName("select-selected"); xl = x.length; yl = y.length; for (i = 0; i < yl; i++) { if (elmnt == y[i]) { arrNo.push(i) } else { y[i].classList.remove("select-arrow-active"); } } for (i = 0; i < xl; i++) { if (arrNo.indexOf(i)) { x[i].classList.add("select-hide"); } } } document.addEventListener("click", closeAllSelect, {passive: true});\'></style>',
        );
    }
}

// Close modsettings
export function closeSettings(element: any) {
    id("mod-setting-button").classList.remove("active");
    tryRemove(id("mod-setting-panel"));
    if (tn("sl-account-modal", 0)) {
        if (
            tn("sl-account-modal-header", 1)?.getElementsByClassName(
                "title ng-star-inserted",
            )[0]
        ) {
            tn("sl-account-modal-header", 1).getElementsByClassName(
                "title ng-star-inserted",
            )[0].dataset.originalText;
        }
        tn("sl-account-modal-header", 1).getElementsByClassName(
            "title ng-star-inserted",
        )[0].innerHTML = element.getElementsByTagName("span")[0].innerHTML;
        if (tn("sl-account-modal", 0).getElementsByClassName("content")[0]) {
            if (
                tn("sl-account-modal", 0).getElementsByClassName("content")[0]
                    .children[0]
            ) {
                if (
                    tn("sl-account-modal", 0).getElementsByClassName(
                        "content",
                    )[0].children[0].children[0]
                ) {
                    tn("sl-account-modal", 0)
                        .getElementsByClassName("content")[0]
                        .children[0].children[0].removeAttribute("inert");
                }
            }
        }
    }
}

async function save() {
    const reload = true;
    const nicknames = [];
    // If login credentials have changed, assume they are correct
    if (
        id("loginname").value != get("loginname") ||
        id("loginpass").value != get("loginpass") ||
        id("loginschool").value != get("loginschool")
    ) {
        set("logincredentialsincorrect", "0");
    }
    for (const element of id("nickname-wrapper").children) {
        if (!n(element.getElementsByTagName("input")[1])) {
            // Docent name can't be empty
            if (!n(element.getElementsByTagName("input")[0].value)) {
                nicknames.push([
                    element.getElementsByTagName("input")[0].value,
                    element.getElementsByTagName("input")[2].value,
                    element.getElementsByTagName("input")[1].value,
                ]);
            }
        }
    }
    set("nicknames", JSON.stringify(nicknames));
    // Save all form elements added with addSetting()
    resetFilesProcessed();
    for (const element of cn("mod-slider")) {
        set(
            element.getElementsByTagName("input")[0].dataset.property,
            element.getElementsByTagName("input")[0].value +
                element.getElementsByTagName("input")[0].dataset.unit,
        );
    }
    if (id("mod-font-file")?.files[0]) {
        set("customfontname", id("mod-font-file").files[0].name);
        const reader = new FileReader();
        reader.readAsDataURL(id("mod-font-file").files[0]);
        reader.onload = () => {
            set("customfont", reader.result);
            setTimeout(() => {
                saveReload(true);
            }, 100);
        };
    } else if (id("mod-font-select")?.classList.contains("mod-modified")) {
        set("customfont", "");
        set("customfontname", "");
        set("fontname", id("mod-font-select").value);
    }
    for (const element of cn("mod-custom-setting")) {
        if (element.type == "checkbox" && element.id.indexOf("bools") != -1) {
            set(
                "bools",
                get("bools").replaceAt(
                    parseInt(element.id.charAt(5) + element.id.charAt(6), 10),
                    element.checked ? "1" : "0",
                ),
            );
        } else if (
            element.type == "checkbox" ||
            element.type == "range" ||
            element.type == "text" ||
            element.type == "password" ||
            element.type == "number" ||
            element.type == "color" ||
            element.tagName == "TEXTAREA"
        ) {
            set(element.id, element.value);
        } else if (element.type == "file") {
            if (element.files.length != 0) {
                // Compress files to desired size in pixels using canvas
                let size = element.dataset.size;
                if (
                    !n(size) &&
                    (element.files[0].type == "image/png" ||
                        element.files[0].type == "image/jpeg" ||
                        element.files[0].type == "image/webp")
                ) {
                    size = parseInt(size, 10);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    if (!ctx) return;
                    const img = new Image();
                    canvas.height = size;
                    canvas.width = size;
                    img.onload = () => {
                        canvas.height = canvas.width * (img.height / img.width);
                        ctx.drawImage(
                            img,
                            0,
                            0,
                            img.width,
                            img.height,
                            0,
                            0,
                            canvas.width,
                            canvas.height,
                        );
                        const result = canvas.toDataURL("image/webp");
                        if (result.length > 100) {
                            set(element.id, result);
                            incrementFilesProcessed();
                        }
                        // If result is empty data URI, fall back to non-compressed file
                        else {
                            const reader = new FileReader();
                            reader.readAsDataURL(element.files[0]);
                            reader.onload = () => {
                                set(element.id, reader.result);
                                incrementFilesProcessed();
                            };
                        }
                    };
                    img.src = URL.createObjectURL(element.files[0]);
                }
                // File should not be compressed
                else {
                    const reader = new FileReader();
                    reader.readAsDataURL(element.files[0]);
                    reader.onload = () => {
                        if (element.id == "background") {
                            set(
                                "isbackgroundvideo",
                                element.files[0].type.indexOf("video") != -1,
                            );
                        }
                        set(element.id, reader.result);
                        incrementFilesProcessed();
                    };
                }
            }
            // File is not set
            else {
                incrementFilesProcessed();
            }
        }
    }
    if (id("mod-bg-image").style.display == "block") {
        set("backgroundtype", "image");
    } else if (id("mod-bg-slideshow").style.display == "block") {
        modMessage(
            "Bezig met opslaan",
            "Je achtergrondafbeeldingen worden nu opgeslagen. Dit kan even duren.",
            null,
            null,
            null,
            null,
            true,
        );
        set("backgroundtype", "slideshow");
        if (
            id("mod-background-wrapper").classList.contains("mod-modified") ==
                true &&
            id("mod-background-wrapper").classList.contains("mod-loading") ==
                false
        ) {
            await removeSlideshowBackgrounds();
            let i = 0;
            for (const element of id(
                "mod-background-wrapper",
            ).getElementsByTagName("img")) {
                if (element.complete && element.naturalWidth != 0) {
                    await saveSlideshowBackground(element, i);
                    i++;
                }
            }
            set("slides", i);
        }
    } else if (id("mod-bg-color").style.display == "block") {
        set("backgroundtype", "color");
    } else if (id("mod-bg-live").style.display == "block") {
        set("backgroundtype", "live");
    }
    if (id("mod-bg-live")?.dataset?.type) {
        set("livetype", id("mod-bg-live").dataset.type);
    }
    const selectedtheme = cn("theme-selected", 0);
    if (!n(selectedtheme)) {
        if (id("primarycolor").classList.contains("mod-modified") == false) {
            set("primarycolor", selectedtheme.dataset.color);
        }
        if (id("secondarycolor").classList.contains("mod-modified") == false) {
            set("secondarycolor", selectedtheme.dataset.secondaryColor);
        }
        set("preset", selectedtheme.dataset.name);
        if (selectedtheme.id != "Standaard" && selectedtheme.dataset.url) {
            toDataURL(selectedtheme.dataset.url, (dataUrl: string) => {
                set("background", dataUrl);
                set("backgroundtype", "image");
                incrementFilesProcessed();
            });
        } else {
            set("background", "");
            set("backgroundtype", "image");
            incrementFilesProcessed();
        }
    } else {
        incrementFilesProcessed();
    }
    if (cn("layout-selected", 0)) {
        set("layout", parseInt(cn("layout-selected", 0).id.charAt(7), 10));
    }
    if (id("mod-random-background")) {
        if (id("mod-random-background").classList.contains("mod-active")) {
            toDataURL("https://picsum.photos/1600/800", (dataUrl: string) => {
                set("background", dataUrl);
                incrementFilesProcessed();
            });
        } else {
            incrementFilesProcessed();
        }
    } else {
        incrementFilesProcessed();
    }
    for (const element of cn("mod-file-reset")) {
        if (element.classList.contains("mod-active")) {
            set(element.dataset.key, "");
        }
    }
    if (id("grade-reveal-select")) {
        const showOnlyForNewGrades = id(
            "grade-reveal-select",
        ).children[0].classList.contains("active");
        const showAlways = id(
            "grade-reveal-select",
        ).children[1].classList.contains("active");
        set(
            "bools",
            get("bools").replaceAt(
                14,
                showOnlyForNewGrades ? "1" : showAlways ? "2" : "0",
            ),
        );
    }
    // Reload page to show changes
    // Only reload when all files are processed (required for Firefox, but also an extra check for the other browsers)
    if (reload) {
        execute([saveReload]);
    }
    modMessage(
        "Opgeslagen!",
        "Al je instellingen zijn opgeslagen.",
        "Doorgaan",
    );
    id("mod-message-action1").addEventListener("click", closeModMessage);
}
