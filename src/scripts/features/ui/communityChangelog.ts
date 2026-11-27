import changelog from "../../../changelog.json";
import {
    data,
    get,
    isExtension,
    set,
    storageMethod,
    version,
} from "../../save_version_management";

const seenKey = "communityChangelogSeenVersion";
type Release = {
    title: string;
    intro: string;
    changes: { icon: string; title: string; description: string }[];
};
const releases: Record<string, Release> = changelog;

const icons: Record<string, string> = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    calendar:
        '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-13 5h3m3 0h3"/>',
    chart: '<path d="M12 3v9h9A9 9 0 1 1 12 3Z"/><path d="M16 3a9 9 0 0 1 5 5h-5Z"/>',
    idea: '<path d="M9 18h6m-5 3h4M8 15c0-2-3-3-3-7a7 7 0 0 1 14 0c0 4-3 5-3 7Z"/>',
    snowflake:
        '<path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M3.5 10l4.1-1.1-1.1-4.1M17.5 19.2l-1.1-4.1 4.1-1.1M3.5 14l4.1 1.1-1.1 4.1M17.5 4.8l-1.1 4.1 4.1 1.1"/>',
    spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
};

function icon(name: string) {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Object.hasOwn(icons, name) ? icons[name] : icons.spark}</svg>`;
}

let pending = false;
let shown = false;

export function showChangelog(manual = false) {
    if (!version || document.getElementById("mod-ce-changelog")) return;
    if (!manual && (shown || get(seenKey) === version)) return;
    if (
        !manual &&
        document.querySelector(
            "#mod-welcome, #mod-message, sl-modal, dialog[open]",
        )
    ) {
        window.setTimeout(showChangelog, 500);
        return;
    }
    const dark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.classList.contains("night");
    const dialog = document.createElement("dialog");
    dialog.id = "mod-ce-changelog";
    dialog.setAttribute("aria-labelledby", "mod-ce-changelog-title");
    const release = releases[version];
    const entries = release?.changes ?? [];
    dialog.innerHTML = `
        <style>
            #mod-ce-changelog { --cl-bg:var(--bg-elevated-none, ${dark ? "#20262d" : "#ffffff"}); --cl-border:var(--border-neutral-normal, ${dark ? "#39434d" : "#d8e0e8"}); --cl-text:${dark ? "#e1e6eb" : "#263746"}; --cl-muted:${dark ? "#b6c0cb" : "#566777"}; --cl-card:var(--bg-neutral-weakest, ${dark ? "#252d35" : "#f5f7f9"}); --cl-accent:var(--action-primary-normal, var(--fg-primary-normal, ${dark ? "#66b2fa" : "#006bc9"})); --cl-icon:color-mix(in srgb, var(--cl-accent) ${dark ? "18%" : "12%"}, transparent); box-sizing:border-box; width:432px; max-width:calc(100% - 32px); max-height:calc(100% - 32px); margin:auto; padding:16px 16px 24px; border:1px solid var(--cl-border); border-radius:12px; background:var(--cl-bg); color:var(--cl-text); color-scheme:${dark ? "dark" : "light"}; font:inherit; overflow:auto; user-select:none; -webkit-user-select:none; animation:cl-enter .3s cubic-bezier(.2,.8,.2,1); }
            #mod-ce-changelog { scrollbar-width:thin; scrollbar-color:var(--cl-border) var(--cl-bg); overscroll-behavior:contain; }
            #mod-ce-changelog::-webkit-scrollbar { width:8px; }
            #mod-ce-changelog::-webkit-scrollbar-track { background:var(--cl-bg); border-radius:12px; }
            #mod-ce-changelog::-webkit-scrollbar-thumb { background:var(--cl-border); border:2px solid var(--cl-bg); border-radius:12px; }
            #mod-ce-changelog::-webkit-scrollbar-thumb:hover { background:var(--cl-muted); }
            #mod-ce-changelog::-webkit-scrollbar-corner { background:var(--cl-bg); }
            #mod-ce-changelog * { user-select:none; -webkit-user-select:none; }
            #mod-ce-changelog::backdrop { background:#0009; animation:cl-backdrop .25s ease both; }
            #mod-ce-changelog .content { display:flex; flex-direction:column; gap:16px; }
            #mod-ce-changelog .cl-header { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; }
            #mod-ce-changelog .titel { font-size:16px; font-weight:600; color:inherit; }
            #mod-ce-changelog .cl-logo { display:grid; place-items:center; width:112px; height:100px; margin:6px 0; background:transparent; color:var(--cl-accent); animation:cl-logo .55s cubic-bezier(.2,.8,.2,1) both; }
            #mod-ce-changelog .cl-logo svg { width:100px; height:100px; }
            #mod-ce-changelog .cl-version { display:inline-block; border-radius:6px; padding:4px 10px; background:var(--cl-icon); color:var(--cl-accent); font-size:13px; font-weight:600; animation:cl-row .3s .12s both; }
            #mod-ce-changelog .omschrijving { margin:0; color:inherit; font-size:14px; line-height:1.4; animation:cl-row .3s .1s both; }
            #mod-ce-changelog .cl-entries { display:flex; flex-direction:column; gap:8px; }
            #mod-ce-changelog .cl-entry { display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--cl-border); border-radius:6px; background:var(--cl-card); animation:cl-row .35s both; animation-delay:calc(100ms + var(--cl-index) * 65ms); transition:background .18s, border-color .18s, translate .18s; }
            #mod-ce-changelog .cl-entry:hover { translate:0 -2px; border-color:var(--cl-accent); }
            #mod-ce-changelog .cl-icon { display:grid; place-items:center; flex:0 0 40px; height:40px; border-radius:6px; background:var(--cl-icon); color:var(--cl-accent); transition:transform .2s; }
            #mod-ce-changelog .cl-entry:hover .cl-icon { transform:scale(1.09) rotate(-4deg); }
            #mod-ce-changelog .cl-entry strong { display:block; font-size:14px; margin-bottom:4px; color:inherit; }
            #mod-ce-changelog .cl-entry p { margin:0; font-size:13px; line-height:1.4; color:var(--cl-muted); }
            #mod-ce-changelog .buttons { display:flex; animation:cl-row .3s .2s both; }
            #mod-ce-changelog .buttons hmy-button { flex:1; min-width:0; }
            #mod-ce-changelog .cl-done { width:100%; min-height:40px; padding:8px; border:1px solid transparent; border-radius:6px; background:var(--cl-accent); color:#ffffff; font:inherit; font-size:14px; font-weight:600; cursor:pointer; transition:filter .15s,transform .15s; }
            #mod-ce-changelog .cl-done:hover { filter:brightness(1.1); }
            #mod-ce-changelog .cl-done:active { transform:scale(.98); }
            #mod-ce-changelog.cl-closing { animation:cl-exit .18s ease both; pointer-events:none; }
            #mod-ce-changelog.cl-closing::backdrop { animation:cl-backdrop .18s reverse both; }
            @keyframes cl-enter { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:none; } }
            @keyframes cl-exit { to { opacity:0; transform:translateY(8px) scale(.98); } }
            @keyframes cl-backdrop { from { opacity:0; } to { opacity:1; } }
            @keyframes cl-logo { from { opacity:0; transform:scale(.75) rotate(-12deg); } 70% { transform:scale(1.05) rotate(2deg); } to { opacity:1; transform:none; } }
            @keyframes cl-row { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
            #mod-ce-changelog .cl-entry.cl-winter { position:relative; isolation:isolate; overflow:hidden; border-color:#79bde9; background:linear-gradient(115deg,#18354d,#315e7e,#203e5b,#18354d); background-size:300% 100%; animation:cl-row .35s both, cl-frost 8s ease-in-out infinite; animation-delay:calc(100ms + var(--cl-index) * 65ms),0s; }
            #mod-ce-changelog .cl-winter::before { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none; background:radial-gradient(circle at 15% 25%,#d7f4ff99 0 1px,transparent 2px),radial-gradient(circle at 75% 65%,#d7f4ff88 0 1.5px,transparent 2.5px); background-size:57px 51px,83px 71px; animation:cl-snow 9s linear infinite; opacity:.55; }
            #mod-ce-changelog .cl-winter .cl-icon { background:#173a55; color:#d9f5ff; box-shadow:0 0 12px #8bd8ff44; }
            #mod-ce-changelog .cl-winter strong { display:flex; flex-wrap:wrap; align-items:center; gap:6px; color:#f4fbff; }
            #mod-ce-changelog .cl-winter p { color:#e0effa; }
            #mod-ce-changelog .cl-winter-tag { display:inline-block; padding:2px 7px; border:1px solid #9edaff88; border-radius:5px; background:#b9e7ff; color:#18354d; font-size:10px; font-weight:600; line-height:1.4; }
            @keyframes cl-frost { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
            @keyframes cl-snow { from { background-position:0 0,0 0; } to { background-position:57px 102px,-83px 142px; } }
            @media(prefers-reduced-motion:reduce) { #mod-ce-changelog, #mod-ce-changelog *, #mod-ce-changelog::backdrop { animation:none !important; transition:none !important; } }
        </style>
        <div class="content">
            <div class="cl-header"><span class="titel" id="mod-ce-changelog-title">Nieuw in Somtoday Mod CE</span><div class="cl-logo"><svg viewBox="0 0 112 112" aria-hidden="true"><rect x="14" y="30" width="84" height="72" rx="9" fill="#59a9e5"/><rect x="24" y="10" width="64" height="74" rx="7" fill="#d0eaff"/><path d="M36 30h40M36 43h40M36 56h24" stroke="#4289c1" stroke-width="5" stroke-linecap="round"/><circle cx="80" cy="81" r="22" fill="#19354c"/><path d="m70 81 7 7 13-15" stroke="#8dcaff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="cl-version"></span></div>
            <span class="omschrijving cl-intro"></span>
            <div class="cl-entries"></div>
            <div class="buttons"><hmy-button mode="secondary"><button type="button" class="secondary normal center cl-done">Verder naar Somtoday</button></hmy-button></div>
        </div>`;
    const versionEl = dialog.querySelector(".cl-version");
    if (versionEl) versionEl.textContent = `Versie ${version}`;
    const titleEl = dialog.querySelector("#mod-ce-changelog-title");
    if (titleEl)
        titleEl.textContent = release?.title ?? "Nieuw in Somtoday Mod CE";
    const introEl = dialog.querySelector(".cl-intro");
    if (introEl) {
        introEl.textContent =
            release?.intro ??
            "Bedankt dat je Somtoday Mod Community Edition gebruikt!";
    }
    const list = dialog.querySelector(".cl-entries");
    if (list) {
        entries.forEach((entry, index) => {
            const row = document.createElement("div");
            row.className = "cl-entry";
            row.style.setProperty("--cl-index", String(index));

            const iconWrap = document.createElement("div");
            iconWrap.className = "cl-icon";
            iconWrap.innerHTML = icon(entry.icon);

            const body = document.createElement("div");
            const strong = document.createElement("strong");
            strong.textContent = entry.title;
            if (entry.icon === "snowflake") {
                row.classList.add("cl-winter");
                const tag = document.createElement("span");
                tag.className = "cl-winter-tag";
                tag.textContent = "Tijdelijk";
                strong.append(tag);
            }
            const desc = document.createElement("p");
            desc.textContent = entry.description;
            body.append(strong, desc);

            row.append(iconWrap, body);
            list.append(row);
        });
        if (!entries.length) {
            list.textContent =
                "Voor deze versie zijn nog geen release-notities toegevoegd.";
        }
    }
    dialog.addEventListener("close", () => dialog.remove());
    const close = () => {
        if (dialog.classList.contains("cl-closing")) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            dialog.close();
            return;
        }
        dialog.classList.add("cl-closing");
        window.setTimeout(() => dialog.close(), 180);
    };
    dialog.querySelector(".cl-done")?.addEventListener("click", close);
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close();
    });
    document.body.append(dialog);
    dialog.showModal();
    const doneButton = dialog.querySelector(".cl-done");
    if (manual && doneButton) doneButton.textContent = "Sluiten";
    shown = true;
    set(seenKey, version);
}

export function communityChangelog() {
    if (!isExtension || pending || !version) return;
    if (
        (storageMethod === "extension" || storageMethod === "indexedDB") &&
        !data
    )
        return;
    if (get(seenKey) === version) return;
    pending = true;
    window.setTimeout(showChangelog, 700);
}
