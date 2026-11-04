// VERSION & SAVE MANAGEMENT
// This script is used to save data for both the Extension and the Userscript version. Also contains indexedDB and localStorage as fallback storage.

let versionJson: Record<string, any> = {};
try {
    const raw = window.getResourceAsText
        ? window.getResourceAsText("version_info.json")
        : "";
    if (raw) {
        versionJson = JSON.parse(raw);
    }
} catch {
    versionJson = {};
}

export const version: string = versionJson.version || "";
export const platform: string = versionJson.platform || "Chromium";
export const minified: boolean = versionJson.minified || false;
export const version_name: string =
    versionJson.version_name || versionJson.version;
export const contributors: Record<string, unknown> =
    versionJson.contributors || {};

export let data: Record<string, unknown> | null | undefined;
export const isExtension = platform !== "Userscript";
export const hasSettingsHash = window.location.hash === "#mod-settings";
export let storageMethod: string;

export let get: (key: string) => any;
export let set: (key: string, value: any) => void;

const storage =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local
        ? chrome.storage
        : typeof browser !== "undefined" &&
            browser.storage &&
            browser.storage.local
          ? browser.storage
          : null;

// Check if userscriptmanager allows storage access
if (typeof GM_getValue === "function" && typeof GM_setValue === "function") {
    storageMethod = "userscript";
    get = (key: string) => GM_getValue(key, null);
    set = (key: string, value: unknown) =>
        GM_setValue(key, value as Parameters<typeof GM_setValue>[1]);
    if (platform !== "Userscript") {
        setTimeout(
            console.warn.bind(
                console,
                "SOMTODAY MOD: Userscript storage is used while the platform is not set to Userscript.",
            ),
        );
    }
}
// Check if extension allows storage access
else if (storage) {
    storageMethod = "extension";
    const onDataLoaded = (result: any) => {
        data = result || {};
        (window as any).data = data;
    };
    try {
        const loadPromise = storage.local.get(null, onDataLoaded);
        if (loadPromise && typeof loadPromise.then === "function") {
            loadPromise.then(onDataLoaded).catch((err: unknown) => {
                console.error("SOMTODAY MOD: Error loading storage", err);
                onDataLoaded({});
            });
        }
    } catch {
        storage.local.get(null, onDataLoaded);
    }
    storage.onChanged?.addListener((changes: any) => {
        if (changes.enabled != null) {
            window.location.reload();
        }
    });

    get = (key: string) => {
        const currentData = data || (window as any).data;
        if (currentData == null) {
            return "";
        }
        if (currentData[key] == null) {
            return "";
        }
        return currentData[key];
    };
    set = (key: string, value: unknown) => {
        const obj: Record<string, unknown> = {};
        obj[key] = value;
        if (data != null) {
            data[key] = value;
        }
        if ((window as any).data != null) {
            (window as any).data[key] = value;
        }
        try {
            const res = storage.local.set(obj);
            if (res && typeof res.catch === "function") {
                res.catch((e: unknown) => {
                    setTimeout(
                        console.warn.bind(
                            console,
                            "SOMTODAY MOD: Couldn't save value. Somtoday Mod is probably updating right now.\nError: " +
                                e,
                        ),
                    );
                });
            }
        } catch (e) {
            setTimeout(
                console.warn.bind(
                    console,
                    "SOMTODAY MOD: Couldn't save value. Somtoday Mod is probably updating right now.\nError: " +
                        e,
                ),
            );
        }
    };
    if (!isExtension) {
        setTimeout(
            console.warn.bind(
                console,
                "SOMTODAY MOD: Extension storage is used while the platform is set to " +
                    platform +
                    ".",
            ),
        );
    }
}
// Check if indexedDB is supported
else if (window?.indexedDB) {
    storageMethod = "indexedDB";
    const DB_NAME = "app-storage";
    const STORE_NAME = "kv";
    const DB_VERSION = 1;

    const persistStorage = async (): Promise<boolean> => {
        if (!navigator.storage?.persist) {
            return false;
        }

        const alreadyPersisted = await navigator.storage.persisted();
        if (alreadyPersisted) {
            return true;
        }

        try {
            return await navigator.storage.persist();
        } catch {
            return false;
        }
    };

    const openDB = async (): Promise<IDBDatabase> => {
        const persistent = await persistStorage();
        if (!persistent) {
            setTimeout(
                console.warn.bind(
                    console,
                    "SOMTODAY MOD: Storage is not persistent.",
                ),
            );
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const realGetAllFromStore = async (): Promise<Record<string, unknown>> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);

            const valuesReq = store.getAll();
            const keysReq = store.getAllKeys();

            tx.oncomplete = () => {
                const map: Record<string, unknown> = {};
                keysReq.result.forEach((key, i) => {
                    map[String(key)] = valuesReq.result[i];
                });
                resolve(map);
            };

            tx.onerror = () => reject(tx.error);
        });
    };

    const getAllFromStore = async () => {
        data = await realGetAllFromStore();
    };

    const realSet = async (key: string, value: unknown): Promise<boolean> => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).put(value, key);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    };

    set = (key: string, value: unknown) => {
        if (data) {
            data[key] = value;
        }
        realSet(key, value);
    };

    get = (key: string) => {
        if (data == null) {
            return "";
        }
        if (data[key] == null) {
            return "";
        }
        return data[key];
    };

    getAllFromStore();
}
// Fallback to local storage
else if (window?.localStorage) {
    storageMethod = "localStorage";
    let messageShown = false;
    set = (key: string, value: unknown) => {
        try {
            localStorage.setItem(key, String(value));
        } catch {
            if (!messageShown) {
                if (
                    confirm(
                        "De LocalStorage-limiet is bereikt. Sommige instellingen zijn niet opgeslagen.\nControleer of je Somtoday Mod " +
                            (platform === "Userscript"
                                ? "GM_getValue en GM_setValue hebt gegrant"
                                : "toestemming hebt gegeven tot de storage") +
                            " als je meer opslagruimte wil.\nWil je de LocalStorage wissen?",
                    )
                ) {
                    localStorage.clear();
                    window.location.reload();
                }
                messageShown = true;
            }
        }
    };
    get = (key: string) => {
        return localStorage.getItem(key);
    };
    setTimeout(
        console.warn.bind(
            console,
            "SOMTODAY MOD: Could not find extension or userscript storage. Falling back to localstorage.",
        ),
    );
} else {
    throw new Error(
        "Somtoday Mod ERROR\nCould not find any place to store setting data.\nConsider updating your browser, or giving Somtoday Mod storage access.",
    );
}

// Remember to open settings if settings hash is present
if (hasSettingsHash) {
    set("opensettingsIntention", "1");
}

(window as any).get = get;
(window as any).set = set;
(window as any).data = data;
(window as any).storageMethod = storageMethod;
(window as any).version = version;
(window as any).platform = platform;
(window as any).isExtension = isExtension;
