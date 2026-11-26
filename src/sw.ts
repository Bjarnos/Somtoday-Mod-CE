// SERVICE WORKER
chrome.runtime.onInstalled.addListener(
    ({ reason }: chrome.runtime.InstalledDetails) => {
        if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
            chrome.runtime.openOptionsPage();
            chrome.storage.local.set({ enabled: true });
        }
    },
);
// TODO: Replace with our own Somtoday Mod CE website
chrome.runtime.setUninstallURL("https://jonazwetsloot.nl/somtoday-mod-bye");

const legacyModId = "gehilkhfalphnhpidceocgmdijplpkbn";

chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (!chrome.management || !sender.tab || !sender.url) return;
    const url = new URL(sender.url);
    if (
        !(
            url.hostname === "somtoday.nl" ||
            url.hostname.endsWith(".somtoday.nl") ||
            url.hostname === "som.today"
        )
    )
        return;
    if (
        message?.type !== "mod-ce-conflict-check" &&
        message?.type !== "mod-ce-conflict-disable"
    )
        return;
    (async () => {
        let legacy: chrome.management.ExtensionInfo;
        try {
            legacy = await chrome.management.get(legacyModId);
        } catch {
            respond({ active: false });
            return;
        }
        if (message.type === "mod-ce-conflict-disable" && legacy.enabled) {
            await chrome.management.setEnabled(legacyModId, false);
            legacy = await chrome.management.get(legacyModId);
        }
        respond({ active: legacy.enabled });
    })().catch(() => respond({ error: true }));
    return true;
});
