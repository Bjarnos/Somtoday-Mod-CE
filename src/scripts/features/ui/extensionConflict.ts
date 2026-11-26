const conflictDialogId = "mod-ce-extension-conflict";

function showConflict() {
    if (document.getElementById(conflictDialogId)) return;
    const dialog = document.createElement("dialog");
    dialog.id = conflictDialogId;
    dialog.setAttribute("aria-labelledby", "mod-ce-conflict-title");
    dialog.innerHTML = `
        <style>
            #mod-ce-extension-conflict { box-sizing:border-box; width:432px; max-width:calc(100% - 32px); margin:auto; padding:24px; border:1px solid #39434d; border-radius:12px; background:#20262d; color:#e1e6eb; color-scheme:dark; font:inherit; animation:mod-conflict-enter .3s ease both; }
            #mod-ce-extension-conflict::backdrop { background:#0009; }
            #mod-ce-extension-conflict h2 { font-size:18px; text-align:center; color:inherit; }
            #mod-ce-extension-conflict p { font-size:14px; line-height:1.5; color:inherit; }
            #mod-ce-extension-conflict .conflict-icon { text-align:center; color:#ffd18a; font-size:42px; }
            #mod-ce-extension-conflict .conflict-info { background:#19354c; color:#c3e0ff; padding:12px; border-radius:6px; }
            #mod-ce-extension-conflict button { width:100%; min-height:40px; border:0; border-radius:6px; background:#66b2fa; color:#10283d; font:inherit; font-weight:600; cursor:pointer; transition:filter .15s,transform .15s; }
            #mod-ce-extension-conflict button:hover { filter:brightness(1.1); }
            #mod-ce-extension-conflict button:active { transform:scale(.98); }
            #mod-ce-extension-conflict button:disabled { opacity:.6; cursor:wait; }
            @keyframes mod-conflict-enter { from { opacity:0; transform:translateY(12px) scale(.97); } to { opacity:1; transform:none; } }
            @media(prefers-reduced-motion:reduce) { #mod-ce-extension-conflict { animation:none; } }
        </style>
        <div class="conflict-icon" aria-hidden="true">⚠</div>
        <h2 id="mod-ce-conflict-title">Dubbele Somtoday Mod gedetecteerd</h2>
        <p>De originele Somtoday Mod is nog actief. Schakel deze uit om conflicten met Somtoday Mod CE te voorkomen.</p>
        <p class="conflict-info">De originele extensie wordt niet verwijderd en je instellingen blijven behouden.</p>
        <p role="status" class="conflict-status"></p>
        <button type="button">Uitschakelen en doorgaan</button>`;
    const button = dialog.querySelector("button")!;
    const status = dialog.querySelector(".conflict-status")!;
    dialog.addEventListener("cancel", (event) => event.preventDefault());
    button.addEventListener("click", async () => {
        button.disabled = true;
        try {
            const result = await chrome.runtime.sendMessage({
                type: "mod-ce-conflict-disable",
            });
            if (result?.active === false) {
                location.reload();
                return;
            }
        } catch {}
        status.textContent =
            "Uitschakelen is niet gelukt. Schakel de originele Mod handmatig uit via chrome://extensions en probeer opnieuw.";
        button.disabled = false;
    });
    document.body.append(dialog);
    dialog.showModal();
}

async function checkConflict() {
    try {
        const result = await chrome.runtime.sendMessage({
            type: "mod-ce-conflict-check",
        });
        if (result?.active === true) showConflict();
        else if (
            result?.active === false &&
            document.getElementById(conflictDialogId)
        )
            location.reload();
    } catch {}
}

if (
    typeof chrome !== "undefined" &&
    chrome.runtime?.id &&
    /Chrome\//.test(navigator.userAgent) &&
    !/Edg\//.test(navigator.userAgent)
) {
    void checkConflict();
    window.setInterval(checkConflict, 3000);
    window.addEventListener("focus", checkConflict);
}
