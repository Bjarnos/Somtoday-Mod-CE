const menuId = "mod-ce-ideas-menu";
const dialogId = "mod-ce-ideas-dialog";

function openIdeas() {
    if (document.getElementById(dialogId)) return;
    const dialog = document.createElement("dialog");
    dialog.id = dialogId;
    dialog.setAttribute("aria-labelledby", "mod-ce-ideas-title");
    dialog.innerHTML = `<div class="content"><sl-ideeenbord class="in-modal"><span class="titel" id="mod-ce-ideas-title">Naar het Mod CE ideeënbord</span><sl-ideeenbord-image>
        <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden="true">
            <rect x="12" y="35" width="88" height="65" rx="12" fill="#ed9a49"/>
            <rect x="27" y="44" width="58" height="8" rx="4" fill="#263746"/>
            <rect x="35" y="9" width="42" height="43" rx="5" fill="#ffe2b8"/>
            <path d="M45 22h22M45 30h22M45 38h14" stroke="#B87936" stroke-width="3" stroke-linecap="round"/>
            <rect x="12" y="67" width="88" height="33" rx="9" fill="#c66b27"/>
            <path d="M49 79h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        </svg></sl-ideeenbord-image>
        <span class="omschrijving">Heb je een idee voor Somtoday Mod CE? Deel jouw suggesties op ons eigen ideeënbord.</span>
        <div class="waarschuwing"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12 24a12 12 0 1 0 0-24 12 12 0 0 0 0 24M10 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zm0 10a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/></svg><span>Je opent het community-ideeënbord in een nieuw tabblad.</span></div>
        <div class="buttons"><hmy-button mode="quaternary"><button type="button" class="quaternary normal center mod-ce-ideas-cancel">Annuleren</button></hmy-button><hmy-button mode="secondary"><button type="button" class="secondary normal center mod-ce-ideas-primary">Naar Ideeënbord</button></hmy-button></div></sl-ideeenbord></div>`;
    const dark =
        document.documentElement.matches(".dark, .night") ||
        getComputedStyle(document.documentElement).colorScheme === "dark";
    dialog.style.setProperty(
        "--mod-ce-ideas-text",
        dark ? "#e1e6eb" : "#263746",
    );
    dialog.style.setProperty(
        "--mod-ce-ideas-info-bg",
        dark ? "#49321f" : "#fff0df",
    );
    dialog.style.setProperty(
        "--mod-ce-ideas-info-fg",
        dark ? "#ffd4a3" : "#884614",
    );
    dialog.style.setProperty(
        "--mod-ce-ideas-cancel-bg",
        dark ? "#171c20" : "#f5f7f9",
    );
    document.body.appendChild(dialog);
    dialog.addEventListener("close", () => dialog.remove());
    dialog
        .querySelector(".mod-ce-ideas-cancel")
        ?.addEventListener("click", () => dialog.close());
    dialog
        .querySelector(".mod-ce-ideas-primary")
        ?.addEventListener("click", () => {
            window.open(
                "https://smce.bjarnos.dev/",
                "_blank",
                "noopener,noreferrer",
            );
            dialog.close();
        });
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            const rect = dialog.getBoundingClientRect();
            if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            )
                dialog.close();
        }
    });
    dialog.showModal();
}

export function communityIdeas() {
    if (!document.getElementById("mod-ce-ideas-style")) {
        const style = document.createElement("style");
        style.id = "mod-ce-ideas-style";
        style.textContent = `
            #mod-ce-ideas-dialog { box-sizing:border-box; margin:auto; width:432px; max-width:calc(100% - 32px); padding:16px 16px 24px; border:1px solid var(--border-neutral-normal,#8885); border-radius:12px; background:var(--bg-elevated-none); color:var(--mod-ce-ideas-text); font:inherit; animation:mod-ce-ideas-in .2s ease-out; }
            #mod-ce-ideas-dialog::backdrop { background:#0009; }
            #mod-ce-ideas-dialog sl-ideeenbord { display:flex; flex-direction:column; gap:16px; color:inherit; }
            #mod-ce-ideas-dialog .titel { font-size:16px; font-weight:600; text-align:center; color:inherit; }
            #mod-ce-ideas-dialog sl-ideeenbord-image { display:flex; justify-content:center; margin:4px 0 8px; }
            #mod-ce-ideas-dialog .omschrijving { font-size:14px; line-height:1.4; text-align:left; color:inherit; }
            #mod-ce-ideas-dialog .waarschuwing { display:flex; align-items:center; gap:16px; padding:12px 16px; border-radius:6px; background:var(--mod-ce-ideas-info-bg); color:var(--mod-ce-ideas-info-fg); font-size:14px; font-weight:600; line-height:1.35; text-align:left; }
            #mod-ce-ideas-dialog .waarschuwing svg { flex-shrink:0; }
            #mod-ce-ideas-dialog .buttons { display:flex; gap:8px; }
            #mod-ce-ideas-dialog .buttons hmy-button { flex:1; min-width:0; }
            #mod-ce-ideas-dialog button { width:100%; min-height:40px; padding:8px; border:1px solid #8884; border-radius:6px; font:inherit; font-size:14px; font-weight:600; transition:filter .15s, transform .15s; }
            #mod-ce-ideas-dialog .mod-ce-ideas-primary { background:#006bc9; color:#fff; cursor:pointer; }
            #mod-ce-ideas-dialog .mod-ce-ideas-primary:hover { filter:brightness(1.12); }
            #mod-ce-ideas-dialog .mod-ce-ideas-primary:active { transform:scale(.98); }
            #mod-ce-ideas-dialog .mod-ce-ideas-cancel { background:var(--mod-ce-ideas-cancel-bg); color:inherit; cursor:pointer; }
            #mod-ce-ideas-dialog .mod-ce-ideas-cancel:hover { filter:brightness(1.15); }
            #mod-ce-ideas-dialog .mod-ce-ideas-cancel:active { transform:scale(.98); }
            #mod-ce-ideas-menu i { background:none !important; }
            #mod-ce-ideas-menu i svg { width:20px; height:20px; }
            @keyframes mod-ce-ideas-in { from { opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
            @media(prefers-reduced-motion:reduce) { #mod-ce-ideas-dialog { animation:none; } #mod-ce-ideas-dialog button { transition:none; } }
        `;
        document.head.appendChild(style);
    }
    const original = Array.from(
        document.querySelectorAll<HTMLElement>(
            "sl-header .selector-option, .selector-option",
        ),
    ).find(
        (element) => element.textContent?.trim().toLowerCase() === "ideeënbord",
    );
    if (!original || document.getElementById(menuId)) return;
    const item = original.cloneNode(true) as HTMLElement;
    item.id = menuId;
    item.removeAttribute("aria-selected");
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
        if (node.textContent?.trim().toLowerCase() === "ideeënbord")
            node.textContent = "Mod CE Ideeënbord";
        node = walker.nextNode();
    }
    item.setAttribute("aria-label", "Mod CE Ideeënbord");
    item.tabIndex = 0;
    const icon = item.querySelector("i");
    if (icon && typeof window.logo === "function") {
        icon.innerHTML = window.logo("mod-ce-ideas-logo", null, "#0099ff");
    }
    item.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openIdeas();
    });
    item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            openIdeas();
        }
    });
    original.after(item);
}
