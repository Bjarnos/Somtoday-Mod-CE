import { get } from "../../save_version_management";
import { BOOL_INDEX, cn, n, tn } from "../../shorthand_functions";
import { getGoogleFontsUrl } from "./fonts";
import { highLightColor, menuColor, updateMenuColors } from "./themeManager";

// Apply style
export function style() {
    updateMenuColors();
    while (cn("mod-style", 0)) {
        cn("mod-style", 0).remove();
    }
    if (get("bools").charAt(BOOL_INDEX.SCROLLBAR) == "0") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">html, body{scrollbar-width:none !important;}</style>',
        );
    }
    if (get("bools").charAt(BOOL_INDEX.TEXT_SELECTION) == "1") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">*{user-select:auto !important;}</style>',
        );
    }
    // General style
    tn("head", 0).insertAdjacentHTML(
        "beforeend",
        '<style class="mod-style">' +
            (get("bools").charAt(BOOL_INDEX.ROSTER_GRID) == "0"
                ? "sl-rooster-week .uur{border-left:none !important;border-bottom:none !important;}"
                : "") +
            "sl-rooster-dag.weekend,sl-rooster-dag.weekend .uur,sl-rooster-week .weekend,sl-rooster-week-header .weekend{background:transparent !important;background-color:transparent !important;}</style>",
    );
    tn("head", 0).insertAdjacentHTML(
        "beforeend",
        '<style class="mod-style">@media (min-width:767px){:root{--min-content-vh:calc(100vh - ' +
            (get("layout") == "4" ? "66px" : "74px") +
            ") !important;}}</style>",
    );
    // Font
    if (n(get("customfontname"))) {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">@import url("' +
                getGoogleFontsUrl() +
                '");*{font-family:"' +
                get("fontname") +
                '","Open Sans",sans-serif !important;' +
                (get("fontname") == "Bebas Neue" || get("fontname") == "Oswald"
                    ? "letter-spacing:1px;"
                    : "") +
                "}</style>",
        );
    } else {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">@import url("' +
                getGoogleFontsUrl() +
                '");@font-face{font-family:modCustomFont;src:url("' +
                get("customfont") +
                '");}*{font-family:modCustomFont,"Open Sans",sans-serif !important;}</style>',
        );
    }
    // Make sure everything is readable with background with 100% ui transparency
    if (
        get("layout") != 4 &&
        ((get("backgroundtype") == "image" && !n(get("background"))) ||
            get("backgroundtype") == "color" ||
            (get("backgroundtype") == "slideshow" && !n(get("background0"))) ||
            get("backgroundtype") == "live")
    ) {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">hmy-switch-group:has(hmy-switch),sl-bericht-detail .header,sl-bericht-nieuw > .titel{border-radius:6px;padding:10px;background-color:var(--bg-neutral-none);}.content:has(sl-registraties){background:var(--mod-transparent);}sl-studiewijzer-week{border-bottom:2px solid var(--mod-transparent) !important;}sl-studiewijzer-dag{border-right:2px solid var(--mod-transparent) !important;}' +
                (get("bools").charAt(BOOL_INDEX.ROSTER_GRID) == "1"
                    ? "sl-rooster-week .uur{border-left:2px solid var(--mod-transparent) !important;border-bottom:2px solid var(--mod-transparent) !important;}"
                    : "") +
                ".container:has(sl-vakresultaten){padding-bottom:0 !important;}sl-vakresultaten{background-color:var(--bg-neutral-none);padding:20px !important; padding-bottom:40px !important;}hmy-geen-data > span{margin-top:20px;}hmy-geen-data{background:var(--mod-ui-transparent);padding:30px 60px;border-radius:24px;}</style>",
        );
    }
    // Adjust menu for layouts
    if (get("layout") == 2 || get("layout") == 3 || get("layout") == 5) {
        if (get("layout") == 2 || get("layout") == 3) {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">sl-popup{position:fixed !important;top:70px !important;}hmy-popup:has(sl-leerling-menu-acties){position:fixed !important;bottom:80px !important;top:unset !important;}@media (min-width:1280px){.header,.headers-container{top:0 !important;}div.berichten-lijst{height:calc(100vh - 64px) !important;}}</style>',
            );
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">@media (min-width: 767px){.berichten-lijst{height:calc(100vh - 129px) !important;}.menu-avatar{width:calc(100% - 12px * 2) !important;justify-content:center;}}</style>',
            );
        } else {
            tn("head", 0).insertAdjacentHTML(
                "beforeend",
                '<style class="mod-style">sl-sidebar-page{top: 0px !important; height: 100% !important;}sl-rooster-weken{margin-top:63px;}sl-registratie-overzicht{margin-top:50px;}sl-gepubliceerde-schoolinformatie-navigation{padding-top: 80px !important;}sl-popup{position:fixed !important;top:130px !important;}hmy-popup:has(sl-leerling-menu-acties){position:fixed !important;top:65px !important;right:30px !important;left:unset !important;}#mod-top-menu{display:none;}@media (min-width: 767px) and (max-width:1279px){.berichten-lijst{height:calc(100vh - 129px) !important;}sl-header{height:0px !important;position:fixed !important;left: 0px !important;right: 0px !important;}}@media (min-width: 767px){sl-header{background:none !important;backdrop-filter:none !important;}sl-sidebar-page{top:63px !important;height:calc(100% - 63px) !important;}#mod-new-year{margin-top:calc(64px + var(--safe-area-inset-top));}:root:has(sl-berichten){--safe-area-inset-top:64px !important;}body:has(sl-cijfers),body:has(sl-berichten) .tabs,body:has(sl-berichten) .main,sl-studiewijzer-weken,sl-home,sl-start > main,sl-start > .container,sl-home > * > .container,sl-home > * > .content{margin-top:63px !important;}.menu-avatar{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;opacity:0 !important;pointer-events:none !important;}sl-header > div:first-of-type{pointer-events:none !important;}#mod-top-menu-title{color:var(--text-strong);}#mod-top-menu{display:block;border-bottom:var(--thinnest-solid-neutral-normal);background:var(--bg-neutral-none);position:' +
                    (get("bools").charAt(BOOL_INDEX.MENU_ALWAYS_SHOW) == "1"
                        ? "fixed"
                        : "absolute") +
                    ";top:0;left:var(--safe-area-inset-left);right:0;height:64px;z-index:50;}#mod-top-menu h2{margin:18px 24px;}#mod-profile-link:hover{filter:brightness(0.8);}#mod-profile-link{transition:0.2s filter ease;box-sizing:border-box;position:absolute;right:24px;cursor:pointer;top:0;bottom:0;height:100%;padding:15px;}#mod-logout{right:90px;cursor:pointer;position:absolute;padding:15px;top:0;}#mod-logout svg{fill:var(--action-primary-normal);height:25px !important;margin-top:4px;transition:fill 0.2s ease;}#mod-logout:hover svg{fill:var(--action-primary-strong);}#mod-profile-link div{height:100%;aspect-ratio:1 / 1;background:var(--bg-primary-weak);overflow:hidden;border-radius:6px;}#mod-profile-link span{margin:6px 0;text-align:center;width:100%;display:block;font-weight:700;color:var(--fg-on-primary-weak);}#mod-profile-link img{width:100%;height:100%;object-fit:cover;}}</style>",
            );
        }
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">.menu-avatar .hamburger { flex-shrink: 1; min-width: 0; } @media (min-width:1280px){:root{--safe-area-inset-' +
                (get("layout") != 3 ? "left:120px" : "right:120px") +
                " !important;--min-content-vh:calc(100vh - var(--safe-area-inset-top) - var(--safe-area-inset-bottom)) !important;}sl-header > div:first-of-type i{--action-neutral-normal:" +
                menuColor +
                ";}#mod-logo-wrapper{width:120px;" +
                (get("layout") != 3 ? "margin-left" : "left") +
                ":calc((var(--safe-area-inset-" +
                (get("layout") != 3 ? "left" : "right") +
                ") - 120px) / 2);position:relative;}#mod-logo{width:65%;height:60px;margin:20px 0;position:relative;left:50%;transform:translateX(-50%);}sl-header sl-tab-bar{--action-neutral-normal:" +
                menuColor +
                ";--action-primary-normal:" +
                menuColor +
                ";position:absolute !important;top:0 !important;left:0 !important;width:100% !important;height:" +
                (get("layout") == 5 ? "100%" : "calc(100% - 80px)") +
                " !important;display:block !important;overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;}sl-header sl-tab-bar::-webkit-scrollbar{display:none !important;}sl-header .item span{text-align:center;margin-top:6px;display:block;}sl-header .active .item, sl-header .item:hover{background:" +
                highLightColor +
                " !important;padding-top:0 !important;}sl-header .item:hover i{scale:0.9;}sl-header .item i{transition:scale 0.3s ease !important;height:36px;display:block;padding-top:0 !important;margin:0 auto;fill:var(--action-neutral-normal) !important;}sl-header .item svg{width:100%;height:36px;}sl-header sl-tab-item{height:120px !important;position:relative !important;display:block !important;}sl-header sl-tab-item .item, sl-header .item{display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;height:100% !important;}sl-popup{z-index:101 !important;}sl-header{position:fixed !important;z-index:15 !important;" +
                (get("layout") != 3 ? "left" : "right") +
                ":0 !important;top: 0 !important;height:100% !important;overflow:hidden !important;border-bottom:0 !important;width:var(--safe-area-inset-" +
                (get("layout") != 3 ? "left" : "right") +
                ") !important;background:" +
                get("primarycolor") +
                " !important;color:" +
                menuColor +
                " !important;}" +
                (get("layout") == 5
                    ? "sl-header > div:first-of-type{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;width:auto !important;z-index:20 !important;pointer-events:none !important;opacity:0 !important;}"
                    : "sl-header > div:first-of-type{position:absolute !important;bottom:20px !important;left:12px !important;z-index:20 !important;width:calc(100% - 24px) !important;display:flex !important;justify-content:center !important;align-items:center !important;--bg-elevated-weakest:" +
                      highLightColor +
                      ";}") +
                "}}</style>",
        );
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">@media (max-width:1279px){#mod-logo-wrapper{width:100px;' +
                (get("layout") != 3 ? "margin-left" : "left") +
                ":calc((var(--safe-area-inset-" +
                (get("layout") != 3 ? "left" : "right") +
                ") - " +
                (get("layout") != 3 ? "100px" : "115px") +
                ") / 2);position:relative;}sl-tab-bar hmy-notification-counter{margin-top:-60px !important;margin-left:40px !important;}:root{--safe-area-inset-" +
                (get("layout") != 3 ? "left" : "right") +
                ": 100px !important;}#mod-background{width:calc(100% - var(--safe-area-inset-left) - var(--safe-area-inset-right) - 2 * " +
                get("blur") +
                " + 15px);}sl-tab-bar:first-of-type{position:fixed;top:0;" +
                (get("layout") != 3 ? "left" : "right") +
                ":0;border-top:none;width:" +
                (get("layout") != 3
                    ? "var(--safe-area-inset-left)"
                    : "var(--safe-area-inset-right)") +
                " !important;height:" +
                (get("layout") == 5 ? "100%" : "calc(100% - 80px)") +
                " !important;display:block !important;overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;z-index:0;background:" +
                get("primarycolor") +
                "}sl-tab-bar:first-of-type::-webkit-scrollbar{display:none !important;}sl-tab-bar:first-of-type sl-tab-item svg{width:100%;height:36px;}sl-tab-bar:first-of-type sl-tab-item span{font-size:14px;margin-top:6px;text-align:center;}sl-tab-bar:first-of-type sl-tab-item i{height:36px;fill:var(--action-neutral-normal) !important;transition:0.3s scale ease !important;padding-top:0 !important;margin:0 auto;}sl-tab-bar:first-of-type .item:hover i{scale:0.9;}sl-tab-bar:first-of-type sl-tab-item .item, sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}sl-tab-bar:first-of-type .active .item, sl-tab-bar:first-of-type .item:hover{background:" +
                highLightColor +
                " !important;padding-top:0 !important;}sl-tab-bar:first-of-type sl-tab-item{--action-neutral-normal:" +
                menuColor +
                ";--action-primary-normal:" +
                menuColor +
                ";display:block !important;width:100%;position:relative !important;height:120px !important;}" +
                (get("layout") == 5
                    ? "sl-header > div:first-of-type, .menu-avatar{position:fixed !important;top:25px !important;right:150px !important;left:unset !important;bottom:unset !important;width:auto !important;pointer-events:none !important;opacity:0 !important;}"
                    : "sl-header > div:first-of-type, .menu-avatar{position:fixed !important;bottom:20px !important;top:unset !important;" +
                      (get("layout") == 3 ? "right" : "left") +
                      ":12px !important;width:calc(var(--safe-area-inset-" +
                      (get("layout") != 3 ? "left" : "right") +
                      ") - 24px) !important;justify-content:center !important;display:flex !important;align-items:center !important;z-index:20 !important;--bg-elevated-weakest:" +
                      highLightColor +
                      ";}") +
                "#mod-logo{--action-neutral-normal: " +
                menuColor +
                ";width:100%;height:60px;margin:20px 0;}}</style>",
        );
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">@media (max-width: 766px){sl-header:not(.with-back-button){border-bottom:none !important;--column-width: 100% !important;}sl-dagen-header{top:calc(' +
                (get("layout") == 1 || get("layout") == 4 ? "64px" : "0px") +
                " + var(--safe-area-inset-top)) !important;border-bottom:none !important;}sl-berichten{background-color:var(--bg-neutral-none);}}</style>",
        );
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">.container{max-width:100%;}sl-header sl-tab-bar div.item span,sl-tab-bar sl-tab-item .item span{text-overflow:ellipsis;overflow:hidden;text-wrap:nowrap;margin-left:-5px;width:calc(100% + 10px);}sl-tab-bar sl-tab-item .item span{' +
                (get("layout") == 3 ? "margin-left:5px;" : "") +
                "width:calc(100% - 10px);text-align:center;}#mod-menu-resizer{width:12px;height:100%;top:0;" +
                (get("layout") == 3 ? "left" : "right") +
                ":-4px;position:absolute;cursor:ew-resize;}sl-tab-bar sl-tab-item .item{padding-bottom:0 !important;max-height:100%;}sl-rooster-dag.dag{width:calc(100vw - 170px) !important;}hmy-notification-counter span{margin:0 !important;}sl-header hmy-notification-counter{position:absolute;right:30px;top:20px;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{position:relative !important;}.active-border-top,.active-border-bottom{top:0;height:100% !important;width:4px !important;position:absolute;" +
                (get("layout") != 3 ? "right" : "left") +
                ":0;}sl-sidebar{height:100% !important;}.active-border{display:none !important;}sl-rooster-week.week{width:calc(100% - 55px) !important;}sl-sidebar-page{padding-right:0 !important;}sl-header > div:first-of-type i{z-index:10000;--fg-on-primary-weak:" +
                menuColor +
                ";--action-neutral-strong:" +
                menuColor +
                ";}sl-header > div:first-of-type{--bg-neutral-weakest:" +
                highLightColor +
                "}sl-header sl-tab-item .item *,sl-tab-bar:first-of-type sl-tab-item .item *{pointer-events:none !important;}@media (min-height:671px){sl-header{overflow:hidden !important;}sl-header sl-tab-bar,sl-tab-bar:first-of-type{overflow-y:auto !important;overflow-x:hidden !important;scrollbar-width:none !important;}}@media (max-height:670px){#mod-logo-wrapper{height:80px;}#mod-logo{height:50px !important;margin:15px 0 !important;}sl-header sl-tab-bar,sl-tab-bar:first-of-type{overflow-y:auto !important;scrollbar-width:none !important;}sl-header sl-tab-bar::-webkit-scrollbar,sl-tab-bar:first-of-type::-webkit-scrollbar{display:none !important;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{height:110px !important;min-height:110px !important;}sl-header sl-tab-item .item,sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}}@media (max-height:600px){#mod-logo-wrapper{display:none !important;}sl-tab-bar:first-of-type sl-tab-item,sl-header sl-tab-item{height:110px !important;min-height:110px !important;}sl-header sl-tab-item .item,sl-tab-bar:first-of-type .item{height:100% !important;display:flex !important;flex-direction:column !important;justify-content:center !important;align-items:center !important;}}</style>",
        );
    } else if (get("layout") == 4) {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">:root{--safe-area-inset-left:calc((100% - 1200px) / 2) !important;--safe-area-inset-right:calc((100% - 1200px) / 2) !important;}#mod-background{left:0;width:100%;}sl-home{position:relative;border:var(--thinnest-solid-neutral-normal);display:block;background:var(--bg-neutral-none) !important;' +
                (get("ui") == 0
                    ? ""
                    : `backdrop-filter:blur(${get("uiblur")}px);`) +
                "}sl-rooster-week.week{width:calc(100% - 55px) !important;}</style>",
        );
    }
    // Position menu relatively
    if (get("bools").charAt(BOOL_INDEX.MENU_ALWAYS_SHOW) == "0") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            `<style class="mod-style">
        :root {
            --mod-menu-height: 64px;
        }

        /* Top menu part on rooster page */
        .headers-container {
            position: relative !important;
        }

        .datum-container {
            position: inherit !important;
        }

        ${
            get("layout") == 1 || get("layout") == 4
                ? `

        /* The main menu visible on big screens */
        sl-header {
	            position: absolute !important;
            width: 100%;
        }

        /* Studiewijzer is not endless on mobile */
        @media (min-width: 767px) {
            /* Compensate for position absolute on main menu */
            sl-home>*>.content, sl-home>*>.container {
                margin-top: var(--mod-menu-height) !important;
            }

            /* The studiewijzer is too big and you start somewhere halfway on the page,
               so we need to always show the menu here unfortunately */
            sl-studiewijzer sl-header {
	                position: sticky !important;
            }

            .headers-container {
                margin-top: calc(-1 * var(--mod-menu-height));
                margin-bottom: var(--mod-menu-height);
            }
        }

        @media (min-width: 767px) and (max-width: 1279px) {
            sl-scrollable-title.scrollable-title.title {
                margin-top: var(--mod-menu-height) !important;
                margin-bottom: calc(-1 * var(--mod-menu-height)) !important;
            }

            body:has(sl-berichten) .tabs {
            margin-top }
        }
        `
                : `
        /* The mod top menu in layout 4 must be fixed in the studiewijzer */
        body:has(sl-studiewijzer) #mod-top-menu {
            position: fixed !important;
        }
        `
        }


        ${
            get("layout") == 5
                ? `
        @media (min-width: 767px) and (max-width: 1279px) {
            body:has(sl-berichten) .tabs {
                margin-top: 0px !important;
            }
        }
        `
                : ""
        }

        @media (max-width: 767px) {
            sl-scrollable-title {
                height: 64px !important;
            }
            sl-header {
                grid-template-columns: 1fr auto auto !important;
            }
            sl-header .actions {
            	height: var(--mod-menu-height);
            	align-items: center;
            }
            .headers-container {
                background: transparent !important;
                margin-bottom: 0px !important;
            }
            sl-dagen-header {
                top: 0px !important;
            }
            sl-header {
                position: relative !important;
                width: 100%;
            }
            sl-header .title {
                opacity: 0;
            }

            ${
                get("layout") == 1 || get("layout") == 5
                    ? `
            .headers-container {
                margin-top: calc(-1 * var(--mod-menu-height)) !important;
            }
            `
                    : ""
            }
        }

        /* Tabs as shown on the grades/messages pages should not be sticky */
        .tabs {
            position: relative !important;
            top: unset !important;
        }

        /* Messages page should be scrollable on the body element instead of on .berichten-lijst */
        div.berichten-lijst {
            height: fit-content !important;
        }

        @media (max-width: 1279px) {
            ${
                get("layout") != 1 && get("layout") != 4
                    ? `
            /* In every layout except the centered one, wethe centered layout */
            sl-header {
                height: 0px !important;
            }

            ${
                get("layout") != 5
                    ? `
            .headers-container {
                margin-top: calc(-1 * var(--mod-menu-height)) !important;
                margin-bottom: var(--mod-menu-height) !important;
            }
            sl-studiewijzer-weken-header {
                top: 0px !important;
            }
            sl-header {
                position: fixed !important;
                left: 0px !important;
                right: 0px !important;
            }
            .menu-avatar {
            	position: fixed !important;
            	bottom: 20px !important;
            	top: unset !important;
            	z-index: 20 !important;
            	${get("layout") == 3 ? "right" : "left"}: 12px;
            }
            .menu-avatar .hamburger {
                fill: #fff !important;
            }
            `
                    : ""
            }
            `
                    : ""
            }
        }

        </style>`,
        );

        /*if (get('layout') == 1 || get('layout') == 4) {
            tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">@media (max-width:767px){sl-cijfers .tabs{position:relative !important;}sl-rooster sl-scrollable-title{display:none !important;}sl-studiewijzer sl-dagen-header,sl-cijfers .tabs{top:var(--safe-area-inset-top) !important;}}sl-dagen-header{position:relative !important;}sl-rooster-weken{margin-top:64px;}' + (get('layout') == 4 ? 'body:has(sl-cijfers) sl-header:first-of-type,body:has(sl-berichten) sl-header:first-of-type{margin-top:-64px;}' : '') + 'body:has(sl-cijfers),body:has(sl-berichten){margin-top:64px;}sl-rooster sl-header,sl-cijfers sl-header,sl-berichten sl-header{position:absolute !important;width:100%;}</style>');
        }
        else if (get('layout') == 5) {
            tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">sl-rooster .headers-container,sl-studiewijzer-weken-header{top:0 !important;}</style>');
        }
        tn('head', 0).insertAdjacentHTML('beforeend', '<style class="mod-style">@media (max-width:767px){sl-berichten div.tabs{top:unset !important;}}' + ((get('layout') == 2 || get('layout') == 3) ? '@media (min-width:1279px){.headers-container{top:calc(var(--safe-area-inset-top)) !important;}}' : '') + 'sl-berichten div.berichten-lijst{height:fit-content !important;}.main,sl-berichten div.tabs{position:relative !important;}sl-rooster .headers-container,sl-rooster .header,sl-cijfers .headers-container,sl-cijfers .header,sl-berichten .headers-container,sl-berichten .header{position:relative !important;}</style>');*/
    }
    // Hide unread message indicator
    if (get("bools").charAt(BOOL_INDEX.HIDE_MESSAGE_COUNT) == "1") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">hmy-notification-counter{display:none !important;}</style>',
        );
    }
    // Hide menu link text
    if (get("bools").charAt(BOOL_INDEX.MENU_PAGE_NAME) == "0") {
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style">sl-header .item span{display:none !important;}@media (max-width:1279px){sl-tab-bar:first-of-type .item span{display:none !important;}}' +
                (get("layout") == 2 || get("layout") == 3 || get("layout") == 5
                    ? "sl-tab-bar:first-of-type sl-tab-item i,sl-header .item i{padding-top:0!important;}"
                    : "sl-header .item i{padding-top:36px !important;}") +
                "</style>",
        );
    }
    // Custom CSS - inject at the end so it overrides mod and Somtoday CSS
    if (!n(get("customcss")) && get("customcss").trim() !== "") {
        // Sanitize CSS to prevent breaking out of style tag and potential code injection
        const sanitizedCSS = get("customcss")
            .replace(/javascript:[^'"]+/gi, "") // Remove javascript: URLs
            .replace(/@import[^;\n]+/gi, ""); // Remove @import to prevent loading external CSS
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style class="mod-style mod-custom-css">' +
                sanitizedCSS +
                "</style>",
        );

        const customCSS = document.createElement("style");
        customCSS.setAttribute("class", "mod-style mod-custom-css");
        customCSS.innerText = sanitizedCSS;
        tn("head", 0).appendChild(customCSS);

        // Force !important on every rule via CSSOM
        for (const sheet of document.styleSheets) {
            if (sheet.ownerNode !== customCSS) continue;
            for (const rule of sheet.cssRules) {
                if (!(rule instanceof CSSStyleRule)) continue;
                for (const prop of rule.style) {
                    rule.style.setProperty(
                        prop,
                        rule.style.getPropertyValue(prop),
                        "important",
                    );
                }
            }
        }
    }
}
