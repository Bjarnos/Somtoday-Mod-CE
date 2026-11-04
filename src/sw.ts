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
