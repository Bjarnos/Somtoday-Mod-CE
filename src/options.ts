// MANAGE OPTIONS PAGE AND CHECK IF USERSCRIPTS ARE AVAILABLE
(() => {
    const setElementHtml = (id: string, messageKey: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = chrome.i18n.getMessage(messageKey);
        }
    };

    setElementHtml("name", "extName");
    setElementHtml("version", "extVersion");
    setElementHtml("activetext", "activeText");
    setElementHtml("btn-1", "btnOne");
    setElementHtml("btn-2", "btnTwo");
    setElementHtml("new-1", "newOne");
    setElementHtml("new-2", "newTwo");
    setElementHtml("new-3", "newThree");
    setElementHtml("whats-new", "whatsNew");
    setElementHtml("new-header", "whatsNewHeader");
    setElementHtml("back", "back");

    document.getElementById("whats-new")?.addEventListener("click", () => {
        const activated = document.getElementById("activated");
        if (activated) {
            activated.style.display = "none";
        }
        const newRelease = document.getElementById("new-in-this-release");
        if (newRelease) {
            newRelease.style.display = "block";
        }
    });

    document.getElementById("back")?.addEventListener("click", () => {
        const activated = document.getElementById("activated");
        if (activated) {
            activated.style.display = "block";
        }
        const newRelease = document.getElementById("new-in-this-release");
        if (newRelease) {
            newRelease.style.display = "none";
        }
    });

    // Color functions
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

    const rgbToHex = ([r, g, b]: [number, number, number]): string =>
        "#" +
        [r, g, b]
            .map((x) => {
                const hex = x.toString(16);
                return hex.length === 1 ? `0${hex}` : hex;
            })
            .join("");

    const getRelativeLuminance = (rgb: [number, number, number]): number =>
        Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);

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

    function toBrightnessValue(color: string, target: number): string {
        let resultColor = color;
        for (let i = 1; i <= 10; i++) {
            const brightness = Math.round(
                getRelativeLuminance(hexToRgb(resultColor)),
            );
            resultColor = adjust(resultColor, target - brightness);
        }
        return resultColor;
    }

    function adjustColorChannel(
        channel: 0 | 1 | 2,
        hex: string,
        value: number,
    ): string {
        const rgb = hexToRgb(hex);
        rgb[channel] = rgb[channel] + value;
        return rgbToHex(rgb);
    }

    // Insert custom styles based on user settings
    chrome.storage.local
        .get(["primarycolor", "fontname"])
        .then((result: { primarycolor?: string; fontname?: string }) => {
            let color = result.primarycolor;
            let font = result.fontname;
            if (!color) {
                color = "#0067c2";
                font = "Gabarito";
            }
            const body = document.getElementsByTagName("body")[0];
            if (body) {
                if (font === "Bebas Neue" || font === "Oswald") {
                    body.style.letterSpacing = "1px";
                }
                body.style.fontFamily = font || "Gabarito";
            }

            const rgbcolor = hexToRgb(color);
            let background = toBrightnessValue(color, 245);
            let bordercolor = toBrightnessValue(color, 220);
            let borderhover = toBrightnessValue(color, 200);

            // Color is mostly blue
            if (rgbcolor[2] > rgbcolor[0] && rgbcolor[2] > rgbcolor[1]) {
                const factor = -Math.min(
                    Math.round(
                        (rgbcolor[2] -
                            rgbcolor[0] +
                            (rgbcolor[2] - rgbcolor[1])) /
                            10,
                    ),
                    25,
                );
                background = adjustColorChannel(
                    1,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 245),
                        factor,
                    ),
                    factor,
                );
                bordercolor = adjustColorChannel(
                    1,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 220),
                        factor,
                    ),
                    factor,
                );
                borderhover = adjustColorChannel(
                    1,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 200),
                        factor,
                    ),
                    factor,
                );
            }
            // Color is mostly red
            else if (rgbcolor[0] > rgbcolor[2] && rgbcolor[0] > rgbcolor[1]) {
                const factor = -Math.min(
                    Math.round(
                        (rgbcolor[0] -
                            rgbcolor[2] +
                            (rgbcolor[0] - rgbcolor[1])) /
                            10,
                    ),
                    25,
                );
                background = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        1,
                        toBrightnessValue(color, 245),
                        factor,
                    ),
                    factor,
                );
                bordercolor = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        1,
                        toBrightnessValue(color, 220),
                        factor,
                    ),
                    factor,
                );
                borderhover = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        1,
                        toBrightnessValue(color, 200),
                        factor,
                    ),
                    factor,
                );
            }
            // Color is mostly green
            else if (rgbcolor[1] > rgbcolor[0] && rgbcolor[1] > rgbcolor[2]) {
                const factor = -Math.min(
                    Math.round(
                        (rgbcolor[1] -
                            rgbcolor[0] +
                            (rgbcolor[1] - rgbcolor[2])) /
                            10,
                    ),
                    25,
                );
                background = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 245),
                        factor,
                    ),
                    factor,
                );
                bordercolor = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 220),
                        factor,
                    ),
                    factor,
                );
                borderhover = adjustColorChannel(
                    2,
                    adjustColorChannel(
                        0,
                        toBrightnessValue(color, 200),
                        factor,
                    ),
                    factor,
                );
            }

            document.documentElement.style.setProperty(
                "--button-background-color",
                background,
            );
            document.documentElement.style.setProperty(
                "--button-border-color",
                bordercolor,
            );
            document.documentElement.style.setProperty(
                "--button-border-hover-color",
                borderhover,
            );
            document.documentElement.style.setProperty(
                "--button-color",
                toBrightnessValue(color, 80),
            );
        });
})();
