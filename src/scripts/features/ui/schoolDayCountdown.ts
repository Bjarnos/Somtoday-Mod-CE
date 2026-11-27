type Lesson = { start: number; end: number; cancelled: boolean };
let lessons: Lesson[] | null = null;
let loadedDate = "";
let frame: HTMLIFrameElement | null = null;
let lastRequest = 0;
let initialized = false;

function dateKey() {
    return new Date().toDateString();
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

function loadRoster() {
    if (frame || Date.now() - lastRequest < 60000) return;
    const link = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]")).find(a => /^(rooster|ga naar rooster)$/i.test(a.textContent?.trim() || ""));
    if (!link || new URL(link.href).origin !== location.origin || link.href === location.href) return;
    lastRequest = Date.now();
    const iframe = document.createElement("iframe");
    frame = iframe;
    iframe.title = "Roostergegevens laden";
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    iframe.style.cssText = "position:fixed;left:-20000px;top:0;width:1200px;height:800px;pointer-events:none;visibility:hidden";
    iframe.src = link.href;
    document.body.append(iframe);
    let attempts = 0;
    let ready = 0;
    const poll = window.setInterval(() => {
        attempts++;
        try {
            if (iframe.contentDocument && readRoster(iframe.contentDocument)) ready++;
            else ready = 0;
        } catch { ready = 0; }
        if (ready >= 3 || attempts >= 40) {
            clearInterval(poll);
            iframe.remove();
            frame = null;
            updateCountdown();
        }
    }, 500);
}

function updateCountdown() {
    const bar = document.getElementById("mod-school-day-countdown");
    if (!bar) return;
    const label = bar.querySelector(".mod-school-day-label");
    const value = bar.querySelector(".mod-school-day-value");
    if (!label || !value) return;
    let title = "Schooldag";
    let text = "Rooster laden…";
    if (loadedDate !== dateKey()) lessons = null;
    if (lessons !== null) {
        const now = new Date();
        const minute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        const active = lessons.filter(lesson => !lesson.cancelled);
        const end = Math.max(0, ...active.map(lesson => lesson.end));
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
    } else if (lastRequest && !frame) text = "Rooster nog niet beschikbaar";
    if (label.textContent !== title) label.textContent = title;
    if (value.textContent !== text) value.textContent = text;
}

export function schoolDayCountdown() {
    if (window.top !== window) return;
    readRoster(document);
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
        bar.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mod-school-day-label"></span><strong class="mod-school-day-value"></strong>';
        anchor.before(bar);
    }
    if (!initialized) {
        initialized = true;
        const style = document.createElement("style");
        style.textContent = `
            #mod-school-day-countdown { display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 22px;margin:12px 0 24px;border-radius:10px;background:var(--bg-primary-weakest,#e2f1fc);color:var(--fg-on-neutral-none,#123654);width:100%;font-weight:600;box-sizing:border-box; }
            #mod-school-day-countdown svg {color:#006bc9;flex-shrink:0;padding-right:20px;border-right:1px solid #b6d7ef;box-sizing:content-box;}
            .mod-school-day-value {background:#c8e3f8;border-radius:12px;padding:6px 14px;font-size:1.15em;}
            :root:is(.dark,.night) #mod-school-day-countdown {background:#233d53;color:#e6f3ff;}
            :root:is(.dark,.night) .mod-school-day-value {background:#345873;}
            :root:is(.dark,.night) #mod-school-day-countdown svg {color:#91ccff;}
        
            #mod-school-day-countdown {width:100%; min-height:56px; flex-shrink:0;}
            .mod-school-day-value:empty {display:none;}
        `;
        document.head.append(style);
        window.setInterval(() => { if (document.getElementById("mod-school-day-countdown")) { loadRoster(); updateCountdown(); } }, 1000);
    }
    loadRoster();
    updateCountdown();
}
