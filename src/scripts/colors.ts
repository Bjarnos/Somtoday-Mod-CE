// COLORS

// Adjust color with specified amount (make color brighter or darker)
const adjust = (col: string, amt: number): string => {
    let normalized = col.replace(/^#/, "");
    if (normalized.length === 3) {
        normalized =
            normalized[0] +
            normalized[0] +
            normalized[1] +
            normalized[1] +
            normalized[2] +
            normalized[2];
    }
    const matches = normalized.match(/.{2}/g) || ["00", "00", "00"];
    const r = Math.max(
        Math.min(255, parseInt(matches[0], 16) + amt),
        0,
    ).toString(16);
    const g = Math.max(
        Math.min(255, parseInt(matches[1], 16) + amt),
        0,
    ).toString(16);
    const b = Math.max(
        Math.min(255, parseInt(matches[2], 16) + amt),
        0,
    ).toString(16);
    const rr = (r.length < 2 ? "0" : "") + r;
    const gg = (g.length < 2 ? "0" : "") + g;
    const bb = (b.length < 2 ? "0" : "") + b;
    return `#${rr}${gg}${bb}`;
};

// Convert hex to rgb
const hexToRgb = (hex: string): [number, number, number] => {
    const normalized = hex
        .replace(
            /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`,
        )
        .substring(1);
    const matches = normalized.match(/.{2}/g) || ["00", "00", "00"];
    return [
        parseInt(matches[0], 16),
        parseInt(matches[1], 16),
        parseInt(matches[2], 16),
    ];
};

// Convert rgb to hex
const rgbToHex = ([r, g, b]: [number, number, number] | number[]): string =>
    "#" +
    [r, g, b]
        .map((x) => {
            const hex = x.toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
        })
        .join("");

// Get brightness of color
const getRelativeLuminance = (
    rgb: [number, number, number] | number[],
): number => Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);

// Change specific color channel
function adjustColorChannel(
    channel: 0 | 1 | 2,
    hex: string,
    value: number,
): string {
    const rgb = hexToRgb(hex);
    rgb[channel] = Math.min(Math.max(rgb[channel] + value, 0), 255);
    return rgbToHex(rgb);
}

// Change color brightness level
function toBrightnessValue(color: string, target: number | string): string {
    let resultColor = color;
    const startColor = color;
    const targetNum = typeof target === "number" ? target : parseFloat(target);
    for (let i = 1; i <= 5; i++) {
        const brightness = Math.round(
            getRelativeLuminance(hexToRgb(resultColor)),
        );
        resultColor = adjust(resultColor, targetNum - brightness);
    }
    // Some colors are very bright on one channel (such as default blue)
    // When the target brightness is too high, these colors will look weird (eg default blue looks too green)
    // This code lowers the 2 other color channels to make sure the color looks good
    const rgbcolor = hexToRgb(startColor);
    const factor = Math.round(targetNum * -0.15);
    if (
        rgbcolor[2] > rgbcolor[0] &&
        rgbcolor[2] > rgbcolor[1] &&
        rgbcolor[2] + 50 > rgbcolor[0] + rgbcolor[1]
    ) {
        resultColor = adjustColorChannel(
            1,
            adjustColorChannel(0, resultColor, factor),
            factor,
        );
    } else if (
        rgbcolor[0] > rgbcolor[2] &&
        rgbcolor[0] > rgbcolor[1] &&
        rgbcolor[0] + 50 > rgbcolor[1] + rgbcolor[2]
    ) {
        resultColor = adjustColorChannel(
            2,
            adjustColorChannel(1, resultColor, factor),
            factor,
        );
    } else if (
        rgbcolor[1] > rgbcolor[0] &&
        rgbcolor[1] > rgbcolor[2] &&
        rgbcolor[1] + 50 > rgbcolor[0] + rgbcolor[2]
    ) {
        resultColor = adjustColorChannel(
            2,
            adjustColorChannel(0, resultColor, factor),
            factor,
        );
    }
    return resultColor;
}

function addNightTheme(): void {
    if (id("mod-night-theme")) {
        return;
    }

    const toggle = cn("toggle-systeemvoorkeur", 0) as HTMLElement | null;
    if (toggle) {
        // Update system preferences state (might be unset or outdated otherwise)
        set(
            "autotheme",
            toggle.getAttribute("aria-checked") === "true" ? "true" : "false",
        );

        toggle.addEventListener("click", function (this: HTMLElement) {
            // We need to disable the night theme if follow system preference is enabled
            if (this.getAttribute("aria-checked") === "true") {
                set("autotheme", "true");
                // Enable dark, since this is the current preference
                if (
                    window.matchMedia?.("(prefers-color-scheme: dark)").matches
                ) {
                    const darkContainer = cn(
                        "container dark",
                        0,
                    ) as HTMLElement | null;
                    if (
                        darkContainer &&
                        darkContainer.getAttribute("aria-checked") === "false"
                    ) {
                        darkContainer.click();
                        this.click();
                    }
                }
                // Enable light, since this is the current preference
                else {
                    const lightContainer = cn(
                        "container light",
                        0,
                    ) as HTMLElement | null;
                    if (
                        lightContainer &&
                        lightContainer.getAttribute("aria-checked") === "false"
                    ) {
                        lightContainer.click();
                        this.click();
                    }
                }
            }
            // Follow system preferences is disabled
            else {
                set("autotheme", "false");
            }

            // Update checkbox state to make it match the now visually active theme
            updateTheme();
        });
    }

    // Insert night mode option
    const blokDiv = document.querySelector("div.blok");
    const darkDiv = blokDiv?.querySelector(
        'div[data-gtm="instellingen-weergave-theme-dark-mode"]',
    );
    const darkImage = darkDiv?.getElementsByTagName("img")[0];
    if (!darkDiv) return;

    const nightDiv = darkDiv.cloneNode(true) as HTMLElement;
    nightDiv.id = "mod-night-theme";
    const nightLabel = nightDiv.getElementsByTagName("label")[0];
    if (nightLabel) {
        nightLabel.title = "Toegevoegd door Somtoday Mod";
        const logoFn = window.logo;
        nightLabel.innerHTML =
            "Night " +
            (logoFn
                ? logoFn(
                      undefined,
                      undefined,
                      "#0099ff",
                      "height:1em;width:fit-content;margin-left:5px;transform:translateY(2px);",
                  )
                : "");
    }
    const nightInput = nightDiv.getElementsByTagName(
        "input",
    )[0] as HTMLInputElement | null;
    if (nightInput) {
        nightInput.value = "night";
        nightInput.checked = get("theme") === "night";
    }
    nightDiv.setAttribute("aria-label", "Weergave nacht");
    // The dark-mode image uses #111111 as bg color, which is already pretty dark, and does not match the real bg color used
    // This means that instead of giving night-mode a new image, we modify the image used for dark-mode to use #20262D as bg color
    if (darkImage && window.getResource) {
        darkImage.src = window.getResource("images/dark-mode.svg");
    }
    darkDiv.insertAdjacentElement("afterend", nightDiv);

    // Since we've added the night div now, we need to properly set the selected item
    // We do so based on the html classList, which is up-to-date (handled by initTheme() in main_functions.ts)
    const allRadios = blokDiv.querySelectorAll<HTMLInputElement>(
        'input[type="radio"][name="thema"]',
    );
    const html = document.documentElement;
    const currentTheme = ["light", "dark", "night"].find((t) =>
        html.classList.contains(t),
    );
    if (currentTheme) {
        const activeRadio = Array.from(allRadios).find(
            (r) => r.value === currentTheme,
        );
        if (activeRadio) {
            activeRadio.checked = true;
        }
    }

    // Whenever the user clicks a theme, we need to update the state
    function updateTheme() {
        const docHtml = document.documentElement;
        allRadios.forEach((r) => {
            r.parentElement?.setAttribute(
                "aria-checked",
                r.checked ? "true" : "false",
            );
        });
        docHtml.classList.remove("light", "dark", "night");
        const checkedRadio = Array.from(allRadios).find((r) => r.checked);
        if (
            checkedRadio &&
            (checkedRadio.value === "light" ||
                checkedRadio.value === "dark" ||
                checkedRadio.value === "night")
        ) {
            // Save theme value, and update html classList to also display theme
            docHtml.classList.add(checkedRadio.value);
            set("theme", checkedRadio.value);

            // If night is selected, we're not following system preferences anymore
            const sysToggle = cn(
                "toggle-systeemvoorkeur",
                0,
            ) as HTMLElement | null;
            if (
                checkedRadio.value === "night" &&
                sysToggle &&
                sysToggle.getAttribute("aria-checked") === "true"
            ) {
                sysToggle.click();
            }
        }
    }
    updateTheme();
    allRadios.forEach((r) => {
        const div = r.parentElement;
        div?.addEventListener("click", () => {
            r.checked = true;
            updateTheme();
        });
    });
}

const waitForTabs = new MutationObserver(() => {
    const tabs = document.querySelectorAll("sl-account-modal-tab");
    for (const tab of tabs) {
        const span = tab.querySelector("span");
        if (span?.innerText.trim() === "Weergave") {
            if (tab.classList.contains("active")) {
                addNightTheme();
            }

            const tabObserver = new MutationObserver(() => {
                if (tab.classList.contains("active")) {
                    addNightTheme();
                    tabObserver.disconnect();
                }
            });
            tabObserver.observe(tab, { attributes: true });
        }
    }
});
const target = document.body || document.documentElement || document;
waitForTabs.observe(target, { childList: true, subtree: true });
