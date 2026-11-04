// MANAGE ENABLE CHECKBOX IN POPUP
(() => {
    let somtodayEnabled = false;

    // Update checkbox state
    function updateCheckbox(): void {
        chrome.action.setBadgeText({ text: somtodayEnabled ? "on" : "off" });
        const iconChecked = document.getElementById("icon-checked");
        if (iconChecked) {
            iconChecked.style.display = somtodayEnabled
                ? "inline-block"
                : "none";
        }
        const iconUnchecked = document.getElementById("icon-unchecked");
        if (iconUnchecked) {
            iconUnchecked.style.display = somtodayEnabled
                ? "none"
                : "inline-block";
        }
    }

    // Initialize state
    const initialChecked = document.getElementById("icon-checked");
    if (initialChecked) {
        initialChecked.style.display = "none";
    }
    const initialConfirmation = document.getElementById("confirmation");
    if (initialConfirmation) {
        initialConfirmation.style.display = "none";
    }

    chrome.storage.local.get(["enabled"]).then((result) => {
        somtodayEnabled = result.enabled !== false;
        updateCheckbox();
    });

    // Initialize text
    const setText = (id: string, messageKey: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = chrome.i18n.getMessage(messageKey);
        }
    };

    setText("txt-enable-disable", "enableDisable");
    setText("txt-to-somtoday", "toSomtoday");
    setText("txt-reset-all", "resetAll");
    setText("txt-confirm", "confirmReset");

    const yesEl = document.getElementById("yes");
    if (yesEl) {
        yesEl.innerHTML = `<p>${chrome.i18n.getMessage("yes")}</p>`;
    }
    const noEl = document.getElementById("no");
    if (noEl) {
        noEl.innerHTML = `<p>${chrome.i18n.getMessage("no")}</p>`;
    }

    // Show reset save data confirmation
    document.getElementById("reset-all")?.addEventListener("click", () => {
        const settings = document.getElementById("settings");
        if (settings) {
            settings.style.display = "none";
        }
        document.getElementById("confirmation")?.removeAttribute("style");
    });

    // Confirm save data reset
    document.getElementById("yes")?.addEventListener("click", () => {
        chrome.storage.local.clear();
        chrome.storage.local.set({ enabled: true });
        somtodayEnabled = true;
        updateCheckbox();
        document.getElementById("settings")?.removeAttribute("style");
        const confirmation = document.getElementById("confirmation");
        if (confirmation) {
            confirmation.style.display = "none";
        }
    });

    // Cancel save data reset
    document.getElementById("no")?.addEventListener("click", () => {
        document.getElementById("settings")?.removeAttribute("style");
        const confirmation = document.getElementById("confirmation");
        if (confirmation) {
            confirmation.style.display = "none";
        }
    });

    // Toggle extension disabled/enabled
    document.getElementById("enable-disable")?.addEventListener("click", () => {
        somtodayEnabled = !somtodayEnabled;
        updateCheckbox();
        chrome.storage.local.set({ enabled: somtodayEnabled });
    });
})();
