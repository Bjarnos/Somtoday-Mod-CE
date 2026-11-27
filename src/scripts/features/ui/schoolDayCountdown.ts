const cacheKey = "mod-school-day-end";
let timerStarted = false;

function dateKey() {
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()].join("-");
}

function readRoster() {
    const week = document.querySelector("sl-rooster-week:not([aria-hidden='true'])");
    if (!week) return;
    const days = Array.from(week.querySelectorAll<HTMLElement>("sl-rooster-dag"));
    const today = days.find(day => day.querySelector(".tijdlijn") || day.matches(".vandaag,.today") || day.querySelector(".datum.vandaag"));
    if (!today) return;
    const items = Array.from(today.querySelectorAll<HTMLElement>("sl-rooster-item"));
    if (!items.length) return;
    let end = 0;
    let recognized = false;
    for (const item of items) {
        const label = item.getAttribute("aria-label") || "";
        const pills = Array.from(item.querySelectorAll("hmy-pill"));
        if (pills.some(pill => /^(valt uit|uitval|vervallen)$/i.test(pill.textContent?.trim() || ""))) continue;
        if (pills.some(pill => pill.getAttribute("color") === "positive") && !item.querySelector(".opacity-80")) continue;
        const match = label.match(/\b(\d{1,2}):(\d{2})\s*(?:tot|–|-)\s*(\d{1,2}):(\d{2})\b/i);
        if (!match) continue;
        const minutes = Number(match[3]) * 60 + Number(match[4]);
        if (minutes > 0 && minutes < 1440) {
            recognized = true;
            end = Math.max(end, minutes);
        }
    }
    if (recognized) sessionStorage.setItem(cacheKey, JSON.stringify({ date: dateKey(), end }));
}

function updateCountdown() {
    const bar = document.getElementById("mod-school-day-countdown");
    if (!bar) return;
    const label = bar.querySelector<HTMLElement>(".mod-school-day-label");
    const value = bar.querySelector<HTMLElement>(".mod-school-day-value");
    if (!label || !value) return;
    let title = "Schooldag";
    let text = "Open je rooster om de aftelling te laden";
    try {
        const data = JSON.parse(sessionStorage.getItem(cacheKey) || "null");
        if (data?.date === dateKey() && Number.isFinite(data.end)) {
            const now = new Date();
            const remaining = Math.max(0, Math.ceil(data.end - now.getHours() * 60 - now.getMinutes() - now.getSeconds() / 60));
            title = remaining ? "Je bent uit over" : "Je bent uit!";
            const hours = Math.floor(remaining / 60);
            const minutes = remaining % 60;
            text = remaining ? [hours ? hours + " uur" : "", minutes ? minutes + (minutes === 1 ? " minuut" : " minuten") : ""].filter(Boolean).join(" ") : "Fijne dag!";
        }
    } catch {}
    if (label.textContent !== title) label.textContent = title;
    if (value.textContent !== text) value.textContent = text;
}

export function schoolDayCountdown() {
    readRoster();
    const heading = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4")).find(el => el.textContent?.trim() === "Nieuwsberichten");
    if (!heading || !document.querySelector("sl-laatsteresultaten")) return;
    if (!document.getElementById("mod-school-day-countdown")) {
        const bar = document.createElement("div");
        bar.id = "mod-school-day-countdown";
        bar.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="mod-school-day-label"></span><strong class="mod-school-day-value"></strong>';
        heading.before(bar);
    }
    if (!timerStarted) {
        timerStarted = true;
        const style = document.createElement("style");
        style.textContent = `
            #mod-school-day-countdown { display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px 22px;margin:12px 0 24px;border-radius:10px;background:linear-gradient(110deg,#e2f1fc,#dceefa);color:#123654;font-weight:600;box-sizing:border-box; }
            #mod-school-day-countdown svg {color:#006bc9;flex-shrink:0;padding-right:20px;border-right:1px solid #b6d7ef;box-sizing:content-box;}
            .mod-school-day-value {background:#c8e3f8;border-radius:12px;padding:6px 14px;font-size:1.15em;}
            :root:is(.dark,.night) #mod-school-day-countdown {background:#233d53;color:#e6f3ff;}
            :root:is(.dark,.night) .mod-school-day-value {background:#345873;}
            :root:is(.dark,.night) #mod-school-day-countdown svg {color:#91ccff;}
        `;
        document.head.append(style);
        window.setInterval(updateCountdown, 1000);
    }
    updateCountdown();
}
