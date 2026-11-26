import { get, set } from "../../save_version_management";
import { christmasTheme } from "./christmas";
import { setBackground } from "./wallpaper";

export const winterAvailable = true;
export function winterEnabled() {
    const value = get("winterTheme");
    return winterAvailable && (value === true || value === "true");
}

const css = `
:root.mod-winter.mod-winter {
    background: #b9d8ee !important;
    --bg-neutral-none:#f5faff !important;
    --bg-neutral-weakest:#eaf4fc !important;
    --bg-neutral-weak:#dcecf8 !important;
    --bg-neutral-moderate:#d1e5f4 !important;
    --bg-neutral-strong:#bdd8ec !important;
    --bg-neutral-strongest:#a7c9e2 !important;
    --bg-neutral-max:#93b9d7 !important;
    --bg-elevated-none:#e5ebf1 !important;
    --bg-elevated-weakest:#dce5ee !important;
    --bg-elevated-weak:#d1dce7 !important;
    --bg-elevated-strong:#d4e8f7 !important;
    --border-neutral-normal:#b3cde1 !important;
    --border-neutral-weak:#c8deee !important;
    --border-neutral-strong:#9abbd4 !important;
    --bg-primary-weakest:#dcefff !important;
    --bg-primary-weak:#c8e5fa !important;
    --action-primary-normal:#246fa8 !important;
    --action-primary-strong:#155483 !important;
    --bg-accent-normal:#70b7e7 !important;
    --bg-accent-strong:#438fc5 !important;
    --text-strong:#18384e !important;
    --text-moderate:#36566d !important;
    --text-weak:#526e83 !important;
    --text-weakest:#607c91 !important;
    --fg-on-neutral-weak:#36566d !important;
    --fg-on-neutral-moderate:#36566d !important;
    --fg-on-neutral-strong:#29495f !important;
    --fg-on-neutral-strongest:#18384e !important;
    --fg-on-primary-weak:#164d78 !important;
    --disabled-bg:#dce8f1 !important;
    --disabled-fg:#607c91 !important;
    --disabled-border:#b3cde1 !important;
    --bg-warning-weakest:#dce3ff !important;
    --bg-warning-weak:#c1cffb !important;
    --bg-warning-normal:#718bdb !important;
    --fg-on-warning-weakest:#293e83 !important;
    --fg-on-warning-weak:#293e83 !important;
    --fg-on-warning-normal:#142452 !important;
    --bg-positive-weak:#dcefe4 !important;
    --fg-on-positive-weak:#285d40 !important;
    --bg-negative-weak:#f6d5e3 !important;
    --fg-on-negative-weak:#922e58 !important;
    --bg-negative-weakest:#fbe5ee !important;
    --fg-on-negative-weakest:#922e58 !important;
    --border-warning-normal:#718bdb !important;
    --border-negative-normal:#c45b85 !important;
    --action-neutral-weak:#dce7f0 !important;
    --action-neutral-normal:#c8d9e8 !important;
    --action-neutral-strong:#afc7dc !important;
    --action-neutral-weak-hover:#d0e0ee !important;
    --action-neutral-normal-hover:#b9d0e3 !important;
    --bg-neutral-hover:#d4e4f1 !important;
    --bg-elevated-hover:#d4e4f1 !important;
    --fg-on-neutral-hover:#18384e !important;
    color-scheme:light;
    --fg-on-neutral-none:#18384e !important;
    --fg-on-neutral-weakest:#23465f !important;
    --fg-on-primary-weakest:#164d78 !important;
    --mod-transparent:#e4f1fa !important;
    --mod-ui-transparent:#f5faff !important;
    --mod-semi-transparant:#e4f1fa !important;
    --mod-uiblur:0px !important;
}
:root.mod-winter :is(.selector-option, sl-account-modal-tab, hmy-tab, [role="menuitem"], [role="option"], .dropdown-option):hover:not([aria-disabled="true"]) {
    background-color:#d4e4f1 !important;
    color:#18384e !important;
}
:root.mod-winter :is(.selector-option, sl-account-modal-tab, hmy-tab, [role="menuitem"], [role="option"], .dropdown-option):hover :is(span,label,i) {
    color:#18384e !important;
}
:root.mod-winter button:is(.quaternary,.tertiary,.action-neutral-normal):hover:not(:disabled) {
    background-color:#d4e4f1 !important;
    color:#18384e !important;
}
:root.mod-winter body { background:transparent !important; }
:root.mod-winter #mod-background, :root.mod-winter #mod-backgroundslide { display:none !important; }
#mod-winter-snow { position:fixed; inset:0; z-index:-1; pointer-events:none; overflow:hidden; background:radial-gradient(ellipse at 20% 15%,#d3eafa 0%,transparent 55%),linear-gradient(145deg,#9ec6e5,#cfe8f9 55%,#8eb7d9); }
#mod-winter-snow span { position:absolute; top:-16px; border-radius:50%; background:#fff; box-shadow:0 0 4px #fff,0 1px 3px #426e9a66; animation:mod-winter-fall linear infinite; }
@keyframes mod-winter-fall { from { transform:translate3d(0,-4vh,0); } to { transform:translate3d(45px,108vh,0); } }
:root.mod-winter sl-header, :root.mod-winter #mod-top-menu { background-color:#dce5ee !important; }
:root.mod-winter sl-home, :root.mod-winter sl-start, :root.mod-winter sl-main-content { background-color:transparent !important; }
:root.mod-winter .nieuw-bericht-form, :root.mod-winter .berichten-lijst, :root.mod-winter #mod-app-page .mod-app-tile, :root.mod-winter sl-account-modal { background-color:var(--bg-neutral-none) !important; }
.mod-winter-options > .container[role="radio"] { display:inline-flex !important; flex-direction:column; align-items:center; vertical-align:top; width:25% !important; max-width:25% !important; min-width:0 !important; box-sizing:border-box; padding:12px 8px !important; margin:0 !important; }
.mod-winter-options > .container[role="radio"] img { width:100% !important; max-width:100% !important; height:auto !important; aspect-ratio:280/208; object-fit:contain; }
.mod-winter-options > .container[role="radio"] input[type="radio"] { width:20px !important; height:20px !important; aspect-ratio:1; flex-shrink:0; }
.mod-winter-options > :not(.container[role="radio"]) { grid-column:1/-1; }
#mod-winter-option { cursor:pointer; position:relative; overflow:hidden; }
#mod-winter-option .mod-winter-ribbon {
    position:absolute; top:25px; right:-32px; width:120px;
    transform:rotate(45deg); background:#246fa8; color:#fff;
    font-size:11px; font-weight:600; line-height:20px;
    text-align:center; pointer-events:none; z-index:1;
}
#mod-winter-option img { width:100%; }
.mod-winter-selected > .container[role="radio"]:not(#mod-winter-option) input[type="radio"] { appearance:none !important; border:2px solid #a4b4c2 !important; border-radius:50% !important; background:transparent !important; box-shadow:none !important; }
.mod-winter-selected > .container[role="radio"]:not(#mod-winter-option) input[type="radio"]::before, .mod-winter-selected > .container[role="radio"]:not(#mod-winter-option) input[type="radio"]::after { display:none !important; }
#mod-winter-option[aria-checked="true"] input { appearance:none !important; border:2px solid #246fa8 !important; border-radius:50%; background:#246fa8 !important; box-shadow:inset 0 0 0 3px #fff !important; }
@media(max-width:600px) { .mod-winter-options > .container[role="radio"] { width:50% !important; max-width:50% !important; } }
@media(prefers-reduced-motion:reduce) { #mod-winter-snow span { animation:none; top:var(--snow-top); } }
:root.mod-winter sl-header, :root.mod-winter #mod-top-menu {
    background-color:#294d69 !important;
    --text-strong:#f2f8ff !important;
    --text-moderate:#dcebf7 !important;
    --text-weak:#c5dced !important;
    --fg-on-neutral-none:#f2f8ff !important;
    --fg-on-neutral-weak:#dcebf7 !important;
    color:#f2f8ff !important;
}
:root.mod-winter :is(sl-header,#mod-top-menu) :is(sl-tab-item, .menu-avatar, #mod-simple-apps-launcher) {
    color:#e0edf8 !important;
}
:root.mod-winter :is(sl-header,#mod-top-menu) :is(sl-tab-item, .menu-avatar, #mod-simple-apps-launcher) :is(span,i,svg,label) {
    color:inherit !important;
}
:root.mod-winter :is(sl-header,#mod-top-menu) :is(sl-tab-item, .menu-avatar, #mod-simple-apps-launcher):hover {
    background-color:#3c6483 !important;
    color:#fff !important;
}
:root.mod-winter :is(sl-header,#mod-top-menu) :is(sl-tab-item.active, sl-tab-item[aria-selected="true"], #mod-simple-apps-launcher.active) {
    color:#e0edf8 !important;
    border-bottom-color:#82d4ff !important;
}
:root.mod-winter .selector-option {
    color:#29475e !important;
    --text-strong:#29475e !important;
    --text-moderate:#36566d !important;
    --text-weak:#526e83 !important;
    --fg-on-neutral-none:#29475e !important;
}
:root.mod-winter .selector-option :is(span,label,i,svg,a) {
    color:inherit !important;
}
:root.mod-winter .selector-option:hover {
    background-color:#c6dbea !important;
    color:#173b58 !important;
}
:root.mod-winter.mod-winter {
    --text-strong:#101820 !important;
    --text-moderate:#18232c !important;
    --text-weak:#26333e !important;
    --text-weakest:#35434f !important;
    --fg-on-neutral-none:#101820 !important;
    --fg-on-neutral-weakest:#101820 !important;
    --fg-on-neutral-weak:#18232c !important;
    --fg-on-neutral-moderate:#18232c !important;
    --fg-on-neutral-strong:#101820 !important;
    --fg-on-neutral-strongest:#101820 !important;
    color:#101820;
}
:root.mod-winter :is(sl-main-content,sl-home,sl-account-modal) {
    color:#101820;
}
:root.mod-winter .selector-option {
    color:#101820 !important;
    --text-strong:#101820 !important;
    --text-moderate:#101820 !important;
    --text-weak:#18232c !important;
    --fg-on-neutral-none:#101820 !important;
}
:root.mod-winter .selector-option :is(span,label,a,i,svg) {
    color:#101820 !important;
}
:root.mod-winter .selector-option:not(#mod-ce-ideas-menu) i svg {
    fill:currentColor !important;
}
:root.mod-winter .selector-option:not(#mod-ce-ideas-menu) i svg [fill]:not([fill="none"]) {
    fill:#101820 !important;
}
:root.mod-winter .selector-option:not(#mod-ce-ideas-menu) i svg [stroke]:not([stroke="none"]) {
    stroke:#101820 !important;
}
:root.mod-winter :is(sl-header,#mod-top-menu) :is(sl-tab-item.active, sl-tab-item[aria-selected="true"], #mod-simple-apps-launcher.active) :is(span,i,svg,label) {
    color:#e0edf8 !important;
}
:root.mod-winter .tabs hmy-tab, :root.mod-winter .tabs hmy-tab :is(.container,.tab-naam,span,label,i) {
    color:#101820 !important;
}
:root.mod-winter #mod-ce-ideas-dialog {
    --mod-ce-ideas-text:#101820 !important;
    --mod-ce-ideas-info-bg:#dce5ee !important;
    --mod-ce-ideas-info-fg:#101820 !important;
    --mod-ce-ideas-cancel-bg:#edf4fa !important;
    color:#101820 !important;
}
:root.mod-winter #mod-ce-ideas-dialog :is(.titel,.omschrijving,.waarschuwing,.waarschuwing span,button) {
    color:#101820 !important;
}
:root.mod-winter #mod-ce-ideas-menu i svg { color:#0099ff !important; }
`;

function installOption() {
    const night = document.getElementById("mod-night-theme");
    const group = night?.parentElement;
    if (!night || !group || !winterAvailable) return;
    let option = group.querySelector<HTMLElement>("#mod-winter-option");
    if (!option) {
        option = night.cloneNode(true) as HTMLElement;
        option.id = "mod-winter-option";
        option.removeAttribute("data-gtm");
        option.setAttribute("aria-label", "Weergave winter");
        const image = option.querySelector("img");
        if (image) {
            image.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 208"><rect width="280" height="208" rx="10" fill="#a7cce5"/><rect x="70" y="65" width="210" height="143" rx="6" fill="#f0f9ff"/><text x="84" y="115" font-family="Arial,sans-serif" font-size="34" font-weight="bold" fill="#20445e">Aa</text><g fill="white"><circle cx="25" cy="28" r="4"/><circle cx="100" cy="35" r="3"/><circle cx="210" cy="20" r="4"/><circle cx="48" cy="110" r="3"/><circle cx="25" cy="175" r="4"/></g></svg>')}`;
            image.alt = "Winter";
        }
        const label = option.querySelector("label");
        if (label) {
            const logo = label.querySelector("svg")?.cloneNode(true);
            label.textContent = "Winter ";
            if (logo) label.append(logo);
        }
        const ribbon = document.createElement("span");
        ribbon.className = "mod-winter-ribbon";
        ribbon.textContent = "Tijdelijk";
        option.append(ribbon);
        const radio = option.querySelector("input");
        if (radio) {
            radio.value = "winter";
            radio.name = "mod-winter-theme";
            radio.checked = false;
        }
        group.classList.add("mod-winter-options");
        night.after(option);
        const select = (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            set("christmasTheme", false);
            set("winterTheme", true);
            christmasTheme();
            winterTheme();
            setBackground();
        };
        option.addEventListener("click", select);
        option.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") select(event);
        });
        group.addEventListener(
            "click",
            (event) => {
                if (
                    !(event.target instanceof Element) ||
                    event.target.closest("#mod-winter-option") ||
                    !event.target.closest('.container[role="radio"]') ||
                    !winterEnabled()
                )
                    return;
                set("winterTheme", false);
                winterTheme();
                setBackground();
            },
            true,
        );
    }
    const enabled = winterEnabled();
    option.setAttribute("aria-checked", String(enabled));
    const radio = option.querySelector("input");
    if (radio) radio.checked = enabled;
    group.classList.toggle("mod-winter-selected", enabled);
    if (enabled) {
        for (const native of group.querySelectorAll<HTMLElement>(
            '.container[role="radio"]:not(#mod-winter-option)',
        )) {
            if (native.getAttribute("aria-checked") !== "false")
                native.setAttribute("aria-checked", "false");
            const input = native.querySelector("input");
            if (input?.checked) input.checked = false;
        }
    }
}

export function winterTheme() {
    if (!document.getElementById("mod-winter-style")) {
        const style = document.createElement("style");
        style.id = "mod-winter-style";
        style.textContent = css;
        document.head.append(style);
    }
    const enabled = winterEnabled();
    document.documentElement.classList.toggle("mod-winter", enabled);
    if (enabled && !document.getElementById("mod-winter-snow")) {
        const layer = document.createElement("div");
        layer.id = "mod-winter-snow";
        layer.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 85; i++) {
            const flake = document.createElement("span");
            const size = 3 + Math.random() * 6;
            flake.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;opacity:${0.65 + Math.random() * 0.35};animation-duration:${12 + Math.random() * 18}s;animation-delay:-${Math.random() * 30}s;--snow-top:${Math.random() * 100}%`;
            layer.append(flake);
        }
        document.getElementById("somtoday-mod")?.append(layer);
    } else if (!enabled) {
        document.getElementById("mod-winter-snow")?.remove();
    }
    installOption();
}
