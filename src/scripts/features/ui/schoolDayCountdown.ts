import { get } from "../../save_version_management";

type Lesson = { start: number; end: number; cancelled: boolean };
let lessons: Lesson[] | null = null;
let loadedDate = "";
let initialized = false;
const cacheKey = "mod-school-day-countdown-v2";
let cacheChecked = "";

function enabled() {
    const value = get("schoolDayCountdownEnabled");
    return value !== false && value !== "false";
}

function dateKey() {
    return new Date().toDateString();
}

function restoreCache() {
    const date = dateKey();
    if (cacheChecked === date) return;
    cacheChecked = date;
    try {
        const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (cached?.date === date && Array.isArray(cached.lessons) && cached.lessons.every((lesson: Lesson) => Number.isFinite(lesson.start) && Number.isFinite(lesson.end) && lesson.start >= 0 && lesson.end > lesson.start && lesson.end <= 1440 && typeof lesson.cancelled === "boolean")) {
            lessons = cached.lessons;
            loadedDate = date;
        }
    } catch {}
}

function saveCache() {
    if (lessons === null || loadedDate !== dateKey()) return;
    try {
        const value = JSON.stringify({ date: loadedDate, lessons });
        if (sessionStorage.getItem(cacheKey) !== value) sessionStorage.setItem(cacheKey, value);
    } catch {}
}

function readRoster(doc: Document): boolean {
    const week = doc.querySelector("sl-rooster-week:not([aria-hidden='true'])");
    if (!week) return false;
    const days = Array.from(week.querySelectorAll<HTMLElement>("sl-rooster-dag"));
    const today = days.find(day => day.querySelector(".tijdlijn,.datum.vandaag") || day.matches(".vandaag,.today"));
    if (!today) return false;
    const items = Array.from(today.querySelectorAll<HTMLElement>("sl-rooster-item"));
    const result: Lesson[] = [];
    for (const item of items) {
        if (item.querySelector(".bovenregel hmy-pill[color='positive']") && !item.querySelector(".opacity-80")) continue;
        const label = item.getAttribute("aria-label") || "";
        const match = label.match(/\b(\d{1,2}):(\d{2})\s*(?:tot|–|-)\s*(\d{1,2}):(\d{2})\b/i);
        if (!match) return false;
        const start = Number(match[1]) * 60 + Number(match[2]);
        const end = Number(match[3]) * 60 + Number(match[4]);
        if (end <= start || end > 1440) return false;
        const cancelled = /\b(valt uit|uitval|vervallen)\b/i.test(label) || Array.from(item.querySelectorAll("hmy-pill")).some(pill => /^(valt uit|uitval|vervallen)$/i.test(pill.textContent?.trim() || ""));
        result.push({ start, end, cancelled });
    }
    lessons = result;
    loadedDate = dateKey();
    return true;
}

function updateCountdown() {
    const bar = document.getElementById("mod-school-day-countdown");
    if (!bar) return;
    const label = bar.querySelector(".mod-school-day-label");
    const value = bar.querySelector(".mod-school-day-value");
    if (!label || !value) return;
    let progress: number | null = null;
    let title = "Schooldag";
    let text = "Open eerst je rooster om de timer te laden.";
    if (loadedDate !== dateKey()) { lessons = null; restoreCache(); }
    if (lessons !== null) {
        const now = new Date();
        const minute = now.getHours() * 60 + now.getMinutes() + (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
        const active = lessons.filter(lesson => !lesson.cancelled);
        const end = Math.max(0, ...active.map(lesson => lesson.end));
        if (active.length) {
            const start = Math.min(...active.map(lesson => lesson.start));
            progress = Math.max(0, Math.min(100, (minute - start) / (end - start) * 100));
        }
        if (!active.length) { title = "Je hebt geen lessen vandaag"; text = ""; }
        else if (minute >= end) { title = "Je bent uit!"; text = "Fijne dag!"; }
        else if (lessons.some(lesson => lesson.cancelled && minute >= lesson.start && minute < lesson.end) && !active.some(lesson => minute >= lesson.start && minute < lesson.end)) { title = "Je hebt nu uitval"; text = ""; }
        else {
            title = "Je bent uit over";
            const remaining = Math.ceil(end - minute);
            const hours = Math.floor(remaining / 60);
            const minutes = remaining % 60;
            text = [hours ? hours + " uur" : "", minutes ? minutes + (minutes === 1 ? " minuut" : " minuten") : ""].filter(Boolean).join(" ");
        }
    }
    const progressRow = bar.querySelector<HTMLElement>(".mod-school-day-progress");
    const track = bar.querySelector<HTMLElement>(".mod-school-day-track");
    const fill = bar.querySelector<HTMLElement>(".mod-school-day-fill");
    const percentage = bar.querySelector<HTMLElement>(".mod-school-day-percent");
    if (progressRow && track && fill && percentage) {
        progressRow.hidden = progress === null;
        const phase = progress === null ? "blue" : progress >= 90 ? "green" : progress >= 75 ? "yellow" : progress >= 50 ? "orange" : "blue";
        if (bar.dataset.phase !== phase) bar.dataset.phase = phase;
        if (progress !== null) {
            const formatted = (progress === 100 ? 100 : Math.floor(progress * 100) / 100).toFixed(2);
            const width = progress + "%";
            if (fill.style.width !== width) fill.style.width = width;
            const display = formatted.replace(".", ",") + "%";
            if (percentage.textContent !== display) percentage.textContent = display;
            if (track.getAttribute("aria-valuenow") !== formatted) track.setAttribute("aria-valuenow", formatted);
        }
    }
    if (label.textContent !== title) label.textContent = title;
    if (value.textContent !== text) value.textContent = text;
}

export function schoolDayCountdown() {
    if (window.top !== window) return;
    if (!enabled()) {
        document.getElementById("mod-school-day-countdown")?.remove();
        lessons = null;
        cacheChecked = "";
        try { sessionStorage.removeItem(cacheKey); } catch {}
        return;
    }
    restoreCache();
    if (readRoster(document)) saveCache();
    const root = document.querySelector("sl-root") || document.body;
    const heading = Array.from(root.querySelectorAll<HTMLElement>("*")).find(el => el.children.length === 0 && el.textContent?.trim() === "Nieuwsberichten" && el.getClientRects().length > 0);
    if (!heading) { document.getElementById("mod-school-day-countdown")?.remove(); return; }
    let anchor: Element = heading;
    while (anchor.parentElement && anchor.parentElement !== root && !anchor.parentElement.textContent?.includes("Volgende les") && !anchor.parentElement.textContent?.includes("Laatste cijfer")) {
        anchor = anchor.parentElement;
    }
    if (!document.getElementById("mod-school-day-countdown")) {
        const bar = document.createElement("div");
        bar.id = "mod-school-day-countdown";
        bar.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mod-school-day-label"></span><strong class="mod-school-day-value"></strong><div class="mod-school-day-progress" hidden><div class="mod-school-day-track" role="progressbar" aria-label="Voortgang schooldag" aria-valuemin="0" aria-valuemax="100"><div class="mod-school-day-fill"></div></div><span class="mod-school-day-percent"></span></div>';
        anchor.before(bar);
    }
    if (!initialized) {
        initialized = true;
        const style = document.createElement("style");
        style.textContent = `
            #mod-school-day-countdown { display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 22px;margin:4px 0 24px;border-radius:10px;background:var(--bg-primary-weakest,#e2f1fc);color:var(--fg-on-neutral-none,#123654);width:100%;font-weight:600;box-sizing:border-box; }
            #mod-school-day-countdown svg {color:#006bc9;flex-shrink:0;padding-right:20px;border-right:1px solid #b6d7ef;box-sizing:content-box;}
            .mod-school-day-value {background:#c8e3f8;border-radius:12px;padding:6px 14px;font-size:1.15em;}
            :root.dark #mod-school-day-countdown {background:#263746;color:#e8f3ff;border:1px solid #40586d;}
            :root.dark #mod-school-day-countdown .mod-school-day-value {background:#364e63;color:#f1f7ff;}
            :root.dark #mod-school-day-countdown svg {color:#91ccff;border-color:#506a80;}
            :root.night #mod-school-day-countdown {background:#171b20;color:#e8f3ff;border:1px solid #303a45;}
            :root.night #mod-school-day-countdown .mod-school-day-value {background:#252f3a;color:#e8f3ff;}
            :root.night #mod-school-day-countdown svg {color:#83bfff;border-color:#384a5c;}
            :root.mod-winter #mod-school-day-countdown {background:linear-gradient(110deg,#edf7ff,#dceefa);color:#18384e;border:1px solid #a9cbe3;}
            :root.mod-winter #mod-school-day-countdown .mod-school-day-value {background:#c3dff3;color:#18384e;}
            :root.mod-winter #mod-school-day-countdown svg {color:#246fa8;border-color:#a9cbe3;}
        
            #mod-school-day-countdown {width:100%; min-height:56px; flex-shrink:0;}
            .mod-school-day-value:empty {display:none;}
            #mod-school-day-countdown {--countdown-fill:#1683db;row-gap:10px;}
            #mod-school-day-countdown .mod-school-day-progress {display:flex;align-items:center;gap:12px;flex:0 0 100%;min-width:0;}
            #mod-school-day-countdown .mod-school-day-progress[hidden] {display:none;}
            .mod-school-day-track {height:7px;flex:1;min-width:0;border-radius:99px;overflow:hidden;background:color-mix(in srgb,currentColor 15%,transparent);}
            .mod-school-day-fill {height:100%;width:0;border-radius:inherit;background:var(--countdown-fill);transition:width 1s linear,background-color .5s ease;}
            .mod-school-day-percent {font-size:12px;min-width:62px;text-align:right;font-variant-numeric:tabular-nums;}
            #mod-school-day-countdown .mod-school-day-value {transition:background-color .5s ease,color .5s ease;}
            #mod-school-day-countdown[data-phase="orange"] {--countdown-fill:#e58a25;--countdown-pill:#ffdfb5;--countdown-text:#754008;}
            #mod-school-day-countdown[data-phase="yellow"] {--countdown-fill:#d4ad19;--countdown-pill:#fff0aa;--countdown-text:#685000;}
            #mod-school-day-countdown[data-phase="green"] {--countdown-fill:#32a565;--countdown-pill:#ccefd9;--countdown-text:#185c35;}
            :root #mod-school-day-countdown:is([data-phase="orange"],[data-phase="yellow"],[data-phase="green"]) .mod-school-day-value {background:var(--countdown-pill);color:var(--countdown-text);}
            :root:is(.dark,.night):not(.mod-winter) #mod-school-day-countdown[data-phase="orange"] {--countdown-pill:#69441f;--countdown-text:#ffe1b9;}
            :root:is(.dark,.night):not(.mod-winter) #mod-school-day-countdown[data-phase="yellow"] {--countdown-pill:#62531c;--countdown-text:#fff0aa;}
            :root:is(.dark,.night):not(.mod-winter) #mod-school-day-countdown[data-phase="green"] {--countdown-pill:#244f39;--countdown-text:#ccefd9;}
            @media(prefers-reduced-motion:reduce) { .mod-school-day-fill,#mod-school-day-countdown .mod-school-day-value {transition:none;} }
        `;
        document.head.append(style);
        window.setInterval(() => { if (enabled() && document.getElementById("mod-school-day-countdown")) { updateCountdown(); } }, 1000);
    }
    updateCountdown();
}

window.addEventListener("somtoday-mod-countdown-setting-changed", schoolDayCountdown);
