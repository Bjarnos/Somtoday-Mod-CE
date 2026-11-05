import { get, set } from "../../save_version_management";
import { cn, id, n } from "../../shorthand_functions";

export let themeCount = 0;

export function resetThemeCount(): void {
    themeCount = 0;
}

export function addSlider(
    name: string,
    property: string,
    min: any,
    max: any,
    unit: any,
    defaultValue: any,
) {
    let value = get(property);
    if (
        get(property) == null ||
        get(property) == "" ||
        Number.isNaN(parseInt(get(property), 10))
    ) {
        value = defaultValue + unit;
    }
    return (
        '<div class="mod-slider"><p>' +
        name +
        '</p><input id="' +
        property +
        '" title="' +
        name +
        '" data-property="' +
        property +
        '" data-unit="' +
        unit +
        '" type="range" min="' +
        min +
        '" max="' +
        max +
        '" step="' +
        (property == "blur" ? 0.25 : 1) +
        '" value="' +
        value.match(/\d+(\.\d+)?/)[0] +
        '" /><p>' +
        value +
        "</p></div>"
    );
}

// Constructs HTML code for the setting page
export function addSetting(
    name?: any,
    description?: any,
    key?: any,
    type?: any,
    value?: any,
    param1?: any,
    param2?: any,
    param3?: any,
    param4?: any,
    param5?: any,
    param6?: any,
) {
    if (get(key) == null && !key.startsWith("bools")) {
        set(key, value);
    }
    let code =
        "<div>" +
        (n(name) ? "" : `<h3>${name}</h3>`) +
        (n(description) || type == "checkbox"
            ? ""
            : `<div><p>${description}</p></div>`);
    if (type == "checkbox") {
        if (key.startsWith("bools")) {
            code +=
                '<label tabindex="0" class="switch" for="' +
                key +
                '"><input title="' +
                name +
                '" class="mod-custom-setting" type="checkbox" ' +
                (get("bools").charAt(
                    parseInt(key.charAt(5) + key.charAt(6), 10),
                ) == "1"
                    ? "checked"
                    : "") +
                ' oninput="this.classList.add(\'mod-modified\');" id="' +
                key +
                '"/><div class="slider round"></div></label>';
        } else {
            code +=
                '<label tabindex="0" class="switch" for="' +
                key +
                '"><input title="' +
                name +
                '" class="mod-custom-setting" type="checkbox" ' +
                (get(key) ? "checked" : "") +
                ' oninput="this.classList.add(\'mod-modified\');" id="' +
                key +
                '"/><div class="slider round"></div></label>';
        }
        code += n(description) ? "" : `<p>${description}</p>`;
    } else if (type == "range") {
        code +=
            '<div class="mod-range-preview">' +
            window.getIcon(
                param5,
                null,
                "var(--fg-on-primary-weak)",
                'style="' +
                    (param6 == "opacity"
                        ? "opacity:" +
                          (
                              (100 -
                                  (param4 != null
                                      ? Number(value)
                                      : Number(get(key)))) /
                              100
                          ).toString()
                        : "filter:" +
                          param6 +
                          "(" +
                          (
                              (param4 != null
                                  ? Number(value)
                                  : Number(get(key))) / 4
                          ).toString() +
                          "px)") +
                    '"',
            ) +
            '</div><input title="' +
            name +
            '" class="mod-custom-setting" id="' +
            key +
            '" type="range" value="' +
            (param4 != null ? value : get(key)) +
            '" min="' +
            param1 +
            '" max="' +
            param2 +
            '" step="' +
            param3 +
            "\" oninput=\"this.classList.add('mod-modified');this.parentElement.children[4].innerHTML=this.value;this.parentElement.getElementsByClassName('mod-range-preview')[0].children[0].setAttribute('style', '" +
            (param6 == "opacity"
                ? "opacity:'+parseFloat((100 - this.value) / 100).toString()+'"
                : "filter:" +
                  param6 +
                  "('+parseFloat(this.value / 4).toString()+'px)") +
            "');\"/><p>" +
            (param4 != null ? value : get(key)) +
            "</p><p>%</p>";
    } else if (type == "text" || type == "password") {
        code +=
            '<input title="' +
            name +
            '" class="mod-custom-setting" id="' +
            key +
            '" type="' +
            type +
            '" placeholder="' +
            param1 +
            '" value="' +
            get(key)
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;") +
            '">';
    } else if (type == "number") {
        code +=
            '<div class="br"></div><input title="' +
            name +
            '" class="mod-custom-setting" id="' +
            key +
            '" type="number" placeholder="' +
            param1 +
            '" value="' +
            get(key) +
            '">';
    } else if (type == "color") {
        code += `
        <div class="br"></div>
        <div class="br"></div>
        <input
            type="color"
            title="${name ?? "Kleur kiezen"}"
            class="mod-custom-setting"
            value="${n(get(key)) ? value : get(key)}"
            id="${key}"
            oninput="
                this.classList.add('mod-modified');
                this.nextElementSibling.getElementsByClassName('mod-color')[0].style.background = this.value;
                this.nextElementSibling.getElementsByClassName('mod-color-textinput')[0].value = this.value;
                this.nextElementSibling.getElementsByClassName('mod-color-textinput')[0].style.color = 'var(--fg-on-primary-weak)';
            "
        >
        <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
        <label tabindex="0" class="mod-color" for="${key}" style="background: ${n(get(key)) ? value : get(key)}">
            <p>Kies een kleur</p>
        </label>
        <input
            class="mod-color-textinput"
            title="Voer een hex kleurencode in"
            value="${n(get(key)) ? value : get(key)}"
            oninput="
                if (/^#?([a-fA-F0-9]{6})$/.test(this.value)) {
                    this.parentElement.previousElementSibling.value = this.value;
                    this.style.color = 'var(--fg-on-primary-weak)';
                    this.parentElement.getElementsByClassName('mod-color')[0].style.background = this.value;
                } else if (/^#?([a-fA-F0-9]{3})$/.test(this.value)) {
                    const sixDigitCode = '#' + this.value.charAt(1) + this.value.charAt(1) + this.value.charAt(2) + this.value.charAt(2) + this.value.charAt(3) + this.value.charAt(3);
                    this.parentElement.previousElementSibling.value = sixDigitCode;
                    this.style.color = 'var(--fg-on-primary-weak)';
                    this.parentElement.getElementsByClassName('mod-color')[0].style.background = sixDigitCode;
                } else {
                    this.style.color = 'darkred';
                }
            "
            onblur="
                this.parentElement.previousElementSibling.dispatchEvent(new Event('input'));
            "
        >
        </div>
        `;
    } else if (type == "file") {
        code += `
        <input
            ${n(param2) ? "" : ` title="${name}" data-size="${param2}"`}
            class="mod-file-input mod-custom-setting"
            type="file"
            accept="${param1}" id="${key}"
            oninput="
                const fileLabel = this.nextElementSibling.getElementsByClassName('mod-file-label')[0];
                fileLabel.classList.remove('mod-active');
                if (this.files.length != 0) {
                    const name = this.files[0].name.toLowerCase();
                    if (
                        (this.accept == 'image/*' && this.files[0]['type'].startsWith('image/')) ||
                        (this.accept == 'image/*, video/*' && (this.files[0]['type'].startsWith('image/') || this.files[0]['type'].startsWith('video/'))) ||
                        (this.accept != 'image/*, video/*' && this.accept != 'image/*')
                    ) {
                        for (const btn of this.nextElementSibling.getElementsByClassName('mod-active')) {
                            btn.classList.remove('mod-active');
                        }
                        fileLabel.children[1].innerText = name;
                        fileLabel.classList.add('mod-active');
                    } else {
                        fileLabel.children[1].innerText = 'Kies een bestand';
                        this.value = null;
                    }
                } else {
                    fileLabel.children[1].innerText = 'Kies een bestand';
                }
            "
        >
        <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            <label tabindex="0" class="mod-file-label" for="${key}">
                ${window.getIcon("upload", null, "var(--fg-on-primary-weak)")}
                <span>Kies een bestand</span>
            </label>
            <div tabindex="0" class="mod-button mod-file-reset" data-key="${key}">${window.getIcon("rotate-left", null, "var(--text-moderate)")}<span>Reset</span></div>
            ${param3 ?? ""}
        </div>
        `;
    } else if (type == "textarea") {
        code +=
            '<textarea title="' +
            name +
            '" class="mod-custom-setting" id="' +
            key +
            '" placeholder="' +
            (param1 || "") +
            '" rows="' +
            (param2 || "10") +
            '">' +
            get(key).replace(/</g, "&lt;").replace(/>/g, "&gt;") +
            "</textarea>";
    }
    code += "</div>";
    return code;
}

// Add a theme to the modsettings. Can only be called at the modsettings page.
export function addTheme(
    name: string,
    url: string,
    primaryColor: string,
    secondaryColor: string,
) {
    if (n(id("theme-wrapper"))) {
        return;
    }
    themeCount++;

    // URL can be a URL to an image, but also a Pexels ID.
    let smallimg = url;
    let bigimg = url;
    let preview: any;
    if (!Number.isNaN(parseInt(url, 10))) {
        smallimg =
            "https://images.pexels.com/photos/" +
            url +
            "/pexels-photo-" +
            url +
            ".jpeg?auto=compress&cs=tinysrgb&w=250";
        bigimg =
            "https://images.pexels.com/photos/" +
            url +
            "/pexels-photo-" +
            url +
            ".jpeg?auto=compress&cs=tinysrgb&w=1600";
    }
    let themeclass = "";
    if (get("preset") == name) {
        if (get("primarycolor") == primaryColor) {
            themeclass = " theme-selected-set";
        } else {
            set("theme", "");
        }
    }
    // Set empty image as theme background if no url is given
    if (url) {
        preview = `<img src="${smallimg}" alt="Achtergrondafbeelding: ${name}" loading="lazy">`;
    } else {
        preview = "<span></span>";
    }
    const hidden = themeCount > 10 ? 'style="display: none;"' : "";
    id("theme-wrapper").insertAdjacentHTML(
        "beforeend",
        `
        <div ${hidden} tabindex="0" class="theme${themeclass}" id="${name}" data-name="${name}"${bigimg ? ` data-url="${bigimg}"` : ""} data-color="${primaryColor}" data-secondary-color="${secondaryColor}">
            ${preview}
            <h3>
                <div style="background:${primaryColor};" title="${primaryColor}"></div>
                ${name}
            </h3>
        </div>
    `,
    );
    id(name).addEventListener("click", () => {
        for (const element of cn("theme")) {
            element.classList.remove("theme-selected-set");
            element.classList.remove("theme-selected");
        }
        id(name).classList.add("theme-selected");
    });
}
