const conflictDialogId = "mod-ce-extension-conflict";

export function showConflict() {
    if (document.getElementById(conflictDialogId) || !document.body) return;
    const dark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.classList.contains("night");
    const dialog = document.createElement("dialog");
    dialog.id = conflictDialogId;
    dialog.setAttribute("aria-labelledby", "mod-ce-conflict-title");
    dialog.innerHTML = `
        <style>
            #mod-ce-extension-conflict { --cf-bg:var(--bg-elevated-none, ${dark ? "#20262d" : "#ffffff"}); --cf-border:var(--border-neutral-normal, ${dark ? "#39434d" : "#d8e0e8"}); --cf-text:${dark ? "#e1e6eb" : "#263746"}; --cf-muted:${dark ? "#b6c0cb" : "#566777"}; --cf-card:var(--bg-neutral-weakest, ${dark ? "#252d35" : "#f5f7f9"}); --cf-accent:var(--action-primary-normal, var(--fg-primary-normal, ${dark ? "#66b2fa" : "#006bc9"})); --cf-info-bg:color-mix(in srgb, var(--cf-accent) ${dark ? "18%" : "12%"}, transparent); box-sizing:border-box; width:432px; max-width:calc(100% - 32px); margin:auto; padding:24px; border:1px solid var(--cf-border); border-radius:12px; background:var(--cf-bg); color:var(--cf-text); color-scheme:${dark ? "dark" : "light"}; font:inherit; animation:mod-conflict-enter .3s ease both; }
            #mod-ce-extension-conflict::backdrop { background:#0009; }
            #mod-ce-extension-conflict h2 { font-size:18px; text-align:center; color:inherit; }
            #mod-ce-extension-conflict p { font-size:14px; line-height:1.5; color:inherit; }
            #mod-ce-extension-conflict .conflict-icon { text-align:center; color:${dark ? "#ffd18a" : "#c67600"}; font-size:42px; }
            #mod-ce-extension-conflict .conflict-info { background:var(--cf-info-bg); color:var(--cf-accent); padding:12px; border-radius:6px; font-weight:500; }
            #mod-ce-extension-conflict .conflict-actions { display:flex; gap:8px; margin-top:16px; }
            #mod-ce-extension-conflict button { flex:1; min-height:40px; border:1px solid var(--cf-border); border-radius:6px; font:inherit; font-weight:600; cursor:pointer; transition:filter .15s,transform .15s; }
            #mod-ce-extension-conflict .conflict-reload { border-color:transparent; background:var(--cf-accent); color:#ffffff; }
            #mod-ce-extension-conflict .conflict-close { background:var(--cf-card); color:var(--cf-text); }
            #mod-ce-extension-conflict button:hover { filter:brightness(1.08); }
            #mod-ce-extension-conflict button:active { transform:scale(.98); }
            @keyframes mod-conflict-enter { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:none; } }
            @media(prefers-reduced-motion:reduce) { #mod-ce-extension-conflict { animation:none; } }
        </style>
        <div class="conflict-icon" aria-hidden="true">⚠</div>
        <h2 id="mod-ce-conflict-title">Dubbele Somtoday Mod gedetecteerd</h2>
        <p>De originele Somtoday Mod is nog actief. De originele versie van Somtoday Mod ontvangt geen updates meer, en je hebt er niks aan hem actief te houden. Schakel deze uit in je extensies of userscript-manager om conflicten met Somtoday Mod CE te voorkomen.</p>
        <p class="conflict-info">De originele extensie wordt niet verwijderd en je instellingen blijven behouden.</p>
        <div class="conflict-actions">
            <button type="button" class="conflict-close">Alsnog doorgaan</button>
            <button type="button" class="conflict-reload">Pagina herladen</button>
        </div>`;
    dialog.addEventListener("close", () => dialog.remove());
    dialog
        .querySelector(".conflict-close")
        ?.addEventListener("click", () => dialog.close());
    dialog
        .querySelector(".conflict-reload")
        ?.addEventListener("click", () => location.reload());
    document.body.append(dialog);
    dialog.showModal();
}

export function checkConflict(): boolean {
    if (document.getElementById("somtoday-mod-active")) {
        showConflict();
        return true;
    }
    return false;
}

if (!checkConflict()) {
    window.setTimeout(checkConflict, 2000);
}
