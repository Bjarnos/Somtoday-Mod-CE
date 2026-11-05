import { get, set } from "../../save_version_management";
import { cn, n } from "../../shorthand_functions";

export let filesProcessed = 0;

export function incrementFilesProcessed(): void {
    filesProcessed++;
}

export function resetFilesProcessed(): void {
    filesProcessed = 0;
}

type ReloadCallback = () => void;
const reloadCallbacks: ReloadCallback[] = [];

export function registerReloadCallback(cb: ReloadCallback): void {
    reloadCallbacks.push(cb);
}

// Remove all old slideshow backgrounds
export function removeSlideshowBackgrounds() {
    let i = 0;
    while (!n(get(`background${i}`))) {
        set(`background${i}`, "");
        i++;
    }
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

// Save all new slideshow backgrounds
export function saveSlideshowBackground(element: any, i: number) {
    set(`background${i}`, element.src);
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

export function saveReload(loadAnyway = false) {
    if (loadAnyway || filesProcessed >= cn("mod-file-input").length + 1) {
        for (const cb of reloadCallbacks) {
            try {
                cb();
            } catch (e) {
                console.error(e);
            }
        }
        setTimeout(() => {
            filesProcessed = 0;
        }, 100);
    }
}
