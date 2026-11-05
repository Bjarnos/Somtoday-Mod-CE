import { cn, id, n, tn, tryRemove } from "../../shorthand_functions";
import { closeModMessage, modMessage } from "../extras/modMessage";

export function downloadGrades() {
    const cijferoverzicht = tn("sl-cijfer-overzicht", 0);
    if (n(tn("sl-resultaat-item", 0)) || cijferoverzicht) {
        download();
    } else {
        modMessage(
            "Hoeveel cijfers wil je downloaden?",
            'Kies het aantal cijfers dat je wil downloaden (1-25).<div class="br"></div><input id="mod-grades-amount" type="number" min="1" max="25" step="1" onkeyup="if (this.value != \'\') { this.value = Math.floor(this.value); } if (this.value < 1 && this.value != \'\') { this.value = 1; } else if (this.value > 25) { this.value = 25; }"/>',
            "Doorgaan",
            "Annuleren",
        );
        id("mod-message-action1").addEventListener("click", download);
        id("mod-message-action2").addEventListener("click", closeModMessage);
    }
    tn("sl-root", 0).removeAttribute("inert");
    async function download() {
        const darkmode =
            tn("html", 0)?.classList.contains("dark") ||
            tn("html", 0)?.classList.contains("night");
        const items: any[] = [];
        let number: any;
        let totalWidth = 36 * 2 + 600;
        // Get information from grade overview
        if (cijferoverzicht) {
            let i = 0;
            // First of all, get information about the different sections
            // This is used to later determine which grades should be placed in which section
            // These sections might be year quarters (1-4), or in case of exam year categories ("Grades" and "Averages")
            for (const section of cn("periode-header")) {
                totalWidth +=
                    22 + // gap between sections
                    15 * 2; // section padding
                if (!section.classList.contains("open")) {
                    section.click();
                }
                const count = parseInt(
                    section.style.getPropertyValue("--aantal-items"),
                    10,
                );
                const category = section.getAttribute("aria-label");
                for (let j = 0; j < count; j++) {
                    items[i + j] = {
                        index: i + j,
                        category: category,
                    };
                }
                i += count;
            }
            let category: any;
            // Then, get some intel about the columns
            const columns = cn("vak-gemiddelde-header")[0].getElementsByTagName(
                "th",
            );
            for (i = 1; i < columns.length; i++) {
                items[i - 1].column = columns[i].innerHTML.trim();
                items[i - 1].gemiddelde =
                    columns[i].classList.contains("gemiddelde");
                items[i - 1].last = columns[i].classList.contains("last");
                if (items[i - 1].category != category) {
                    category = items[i - 1].category;
                } else {
                    totalWidth += 15;
                }
                if (items[i - 1].gemiddelde) {
                    totalWidth += 150; // Gemiddelden zijn breder omdat deze vaak formaat 0.00 hebben
                } else {
                    totalWidth += 120; // Cijfers zijn smaller omdat deze vaak formaat 0.0 hebben
                }
            }
            number = cn("vak-row").length;
        } else {
            totalWidth = 1000;
            number = tn("sl-resultaat-item", 0)
                ? Math.min(
                      Math.round(parseFloat(id("mod-grades-amount").value)),
                      tn("sl-resultaat-item").length,
                  )
                : tn("sl-vakgemiddelde-item").length;
            if (Number.isNaN(number)) {
                number = 1;
            }
        }

        const cijferOverzichtPeriod = tn("sl-dropdown", 0)?.ariaLabel
            ? tn("sl-dropdown", 0).ariaLabel
            : "Cijferoverzicht";

        // Show a loading message
        modMessage(
            "Downloaden...",
            "Somtoday Mod is bezig met het genereren van je afbeelding. Dit kan even duren...",
        );
        // Construct HTML
        const font = "Kanit, Arial, sans-serif, Tahoma";
        const headerBackground = darkmode ? "#2b3c63" : "#0099ff";
        const headerText = cijferoverzicht
            ? cijferOverzichtPeriod
            : n(tn("sl-vakgemiddelde-item", 0))
              ? "Mijn cijfers"
              : "Laatste rapportcijfers";
        let html = `
            <div style="
                width: ${totalWidth}px;
                height: 218px;
                background-color: ${headerBackground};
                display: flex;
                align-items: center;
                padding: 0 44px;
                box-sizing: border-box;
                font-family: ${font};
                font-weight: 400;
                margin-bottom: -42px;
	                padding-bottom: 42px;
            ">
                <svg style="flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" width="368" height="60" viewBox="0 0 300 49" fill="none">
                    <path d="M44.6819 17.3781H43.3148C41.7353 17.3781 40.4606 16.1316 40.4606 14.5871V11.9045C40.4606 10.36 39.1859 9.11355 37.6064 9.11355H32.6184C31.0389 9.11355 29.7642 7.8671 29.7642 6.32258V2.79097C29.7642 1.24645 28.4895 0 26.91 0H22.153C20.5734 0 19.2987 1.24645 19.2987 2.79097V6.32258C19.2987 7.8671 18.024 9.11355 16.4445 9.11355H11.4566C9.87706 9.11355 8.60236 10.36 8.60236 11.9045V14.5871C8.60236 16.1316 7.32766 17.3781 5.74814 17.3781H4.38107C2.80155 17.3781 1.52686 18.6245 1.52686 20.169V28.5058C1.52686 30.0503 2.80155 31.2968 4.38107 31.2968H5.72967C7.30918 31.2968 8.58388 32.5432 8.58388 34.0877V37.1768C8.58388 38.7213 9.85858 39.9677 11.4381 39.9677C13.0176 39.9677 14.2923 41.2142 14.2923 42.7587V46.209C14.2923 47.7535 15.567 49 17.1465 49H20.2132C21.7927 49 23.0674 47.7535 23.0674 46.209V41.4039C23.0674 40.609 23.7232 39.9768 24.5269 39.9768C25.3305 39.9768 25.9863 40.6181 25.9863 41.4039V46.209C25.9863 47.7535 27.261 49 28.8405 49H31.9072C33.4867 49 34.7614 47.7535 34.7614 46.209V42.7587C34.7614 41.2142 36.0361 39.9677 37.6156 39.9677C39.1951 39.9677 40.4698 38.7213 40.4698 37.1768V34.0877C40.4698 32.5432 41.7445 31.2968 43.324 31.2968H44.6726C46.2522 31.2968 47.5269 30.0503 47.5269 28.5058V20.169C47.5269 18.6245 46.2522 17.3781 44.6726 17.3781H44.6819ZM37.902 26.4465C37.006 29.3368 35.0108 31.7123 32.2859 33.1394C30.5863 34.0245 28.7297 34.4761 26.8453 34.4761C25.7184 34.4761 24.5823 34.3135 23.4738 33.9794C22.7995 33.7806 22.4208 33.0852 22.624 32.4348C22.8273 31.7755 23.5385 31.4052 24.2128 31.6039C26.522 32.2903 28.9606 32.0555 31.0943 30.9445C33.2188 29.8335 34.7799 27.9819 35.4819 25.7239C35.6851 25.0645 36.3963 24.7032 37.0706 24.8929C37.7449 25.0916 38.1236 25.7871 37.9204 26.4465H37.902Z" fill="white" />
                    <path d="M78.6921 18.0352C77.0176 18.0352 75.7302 18.4777 75.7302 19.5882C75.7302 20.473 76.3064 20.78 77.6298 21.1412L81.6901 22.1615C86.1105 23.3533 87.4339 25.6647 87.4339 28.7616C87.4339 33.2761 83.9048 36.2917 77.8098 36.2917C73.7495 36.2917 70.5265 35.1812 68.7079 34.2963L70.0764 28.4907C72.1921 29.6013 74.9379 30.6577 77.2787 30.6577C79.1332 30.6577 80.1506 30.3056 80.1506 29.2853C80.1506 28.5359 79.2683 28.0935 77.8548 27.7323L74.0556 26.712C70.2564 25.6466 68.4019 23.5248 68.4019 20.0216C68.4019 15.4168 72.4171 12.2748 78.8722 12.2748C81.9151 12.2748 85.6693 13.1145 87.4879 13.9542L85.5883 19.8862C83.4276 18.7305 80.8618 18.0262 78.7011 18.0262L78.6921 18.0352Z" fill="white" />
                    <path d="M90.6208 24.2833C90.6208 17.2407 95.8785 12.0581 103.027 12.0581C110.175 12.0581 115.442 17.2407 115.442 24.2833C115.442 31.3258 110.184 36.5084 103.027 36.5084C95.8695 36.5084 90.6208 31.3258 90.6208 24.2833ZM108.329 24.2833C108.329 21.2315 106.169 18.8388 103.027 18.8388C99.8848 18.8388 97.7691 21.2315 97.7691 24.2833C97.7691 27.3351 99.8848 29.7277 103.027 29.7277C106.169 29.7277 108.329 27.3351 108.329 24.2833Z" fill="white" />
                    <path d="M127.361 14.9744C129.036 13.295 131.377 12.2296 134.339 12.2296C138.003 12.2296 140.344 13.5117 141.541 16.1753C143.179 13.8729 145.871 12.2748 149.49 12.2748C155.45 12.2748 157.881 16.8344 157.881 22.5045V27.9129C157.881 29.0686 158.106 30.0347 159.204 30.0347C159.871 30.0347 160.708 29.7728 161.455 29.4117L161.761 35.2985C160.564 35.7861 158.313 36.2736 156.198 36.2736C152.578 36.2736 150.454 34.4588 150.454 29.6735V23.7415C150.454 20.771 149.085 19.1367 146.564 19.1367C144.62 19.1367 143.296 20.3286 142.675 21.6197V35.8403H135.257V23.7054C135.257 20.78 133.979 19.1458 131.458 19.1458C129.342 19.1458 128.01 20.3827 127.352 21.71V35.8403H119.934V12.672H127.352V14.9744H127.361Z" fill="white" />
                    <path d="M173.951 12.6721H181.946V18.4325H173.951V26.2245C173.951 28.879 174.924 29.8541 176.643 29.8541C178.363 29.8541 179.956 29.0144 181.018 28.256L183.269 33.9262C180.973 35.3437 177.921 36.2737 174.257 36.2737C169.486 36.2737 166.533 33.3483 166.533 27.7684V18.4235H162.599V12.663H166.749L167.676 6.77618H173.951V12.663V12.6721Z" fill="white" />
                    <path d="M185.394 24.2833C185.394 17.2407 190.651 12.0581 197.8 12.0581C204.948 12.0581 210.215 17.2407 210.215 24.2833C210.215 31.3258 204.957 36.5084 197.8 36.5084C190.642 36.5084 185.394 31.3258 185.394 24.2833ZM203.102 24.2833C203.102 21.2315 200.942 18.8388 197.8 18.8388C194.658 18.8388 192.542 21.2315 192.542 24.2833C192.542 27.3351 194.658 29.7277 197.8 29.7277C200.942 29.7277 203.102 27.3351 203.102 24.2833Z" fill="white" />
                    <path d="M241.833 35.3076C240.68 35.7951 238.475 36.2827 236.314 36.2827C233.757 36.2827 231.894 35.3979 231.056 33.1406C229.598 35.0006 227.347 36.2827 223.944 36.2827C217.669 36.2827 213.303 31.2355 213.303 24.2381C213.303 17.2407 217.678 12.2748 223.944 12.2748C226.726 12.2748 228.977 13.2499 230.525 14.6674V4.39252H237.944V27.9129C237.944 29.1047 238.205 30.0347 239.357 30.0347C239.978 30.0347 240.725 29.7728 241.563 29.4117L241.824 35.2985L241.833 35.3076ZM230.525 28.1747V20.4279C229.373 19.3625 227.743 18.7485 226.105 18.7485C222.927 18.7485 220.847 20.8703 220.847 24.2381C220.847 27.6059 222.882 29.818 226.105 29.818C227.824 29.818 229.553 29.0234 230.525 28.1747Z" fill="white" />
                    <path d="M270.282 30.0347C271.164 30.0347 271.83 29.7728 272.532 29.4117L272.793 35.2985C271.56 35.7861 269.48 36.2737 267.275 36.2737C264.628 36.2737 262.809 35.2534 262.017 32.951C260.468 34.811 258.038 36.2285 254.95 36.2285C248.63 36.2285 244.308 31.2716 244.308 24.3103C244.308 17.349 248.639 12.2657 254.95 12.2657C257.822 12.2657 260.027 13.1506 261.486 14.7036V12.663H268.904V27.9039C268.904 29.0596 269.165 30.0257 270.273 30.0257L270.282 30.0347ZM257.074 29.809C258.704 29.809 260.342 29.1408 261.495 28.1296V20.4189C260.568 19.4889 258.803 18.7395 257.074 18.7395C253.851 18.7395 251.862 20.9064 251.862 24.3194C251.862 27.7323 253.896 29.809 257.074 29.809Z" fill="white" />
                    <path d="M300 12.6721L290.817 35.5243C288.341 41.8174 285.865 44.6074 280.392 44.6074C278.357 44.6074 276.286 43.858 275.089 43.0544L276.151 37.3842C277.259 37.9621 278.753 38.5851 280.257 38.5851C282.111 38.5851 282.904 37.6551 283.66 36.0118L284.056 35.0367L273.766 12.6721H281.976L287.234 27.7323L292.537 12.6721H300Z" fill="white" />
                </svg>
                <h3 style="
                    letter-spacing: 2.2px;
                    font-size: 44px;
                    margin-left: 50px;
                    color: #fff;
                    font-family: ${font};
                    font-weight: 400;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    flex-grow: 1;
                    flex-shrink: 1;
                    text-align: right;
                ">${headerText}</h3>
            </div>`;
        const containerBackground = darkmode ? "#1a1b29" : "#e7e8f0";
        const containerHeight =
            2 * 52 + // container padding top+bottom
            (Math.max(number, 1) - 1) * 22 + // gap between container items
            Math.max(number, 1) * 140 + // container item height
            (cijferoverzicht ? 60 + 22 : 0); // cijferoverzicht top row
        html += `
            <div style="
                width: ${totalWidth}px;
                height: ${containerHeight}px;
                display: flex;
                padding: 52px 36px;
                flex-direction: column;
                gap: 22px;
                background-color: ${containerBackground};
                box-sizing: border-box;
            	border-top-left-radius: 42px;
            	border-top-right-radius: 42px;
            ">`;
        const subjectBackground = darkmode ? "#31354b" : "#fff";
        const subjectIconBackground = darkmode ? "#414768" : "#0002";
        const subjectColor = darkmode ? "#fff" : "#393950";
        const fadedColor = darkmode ? "#a2a2db" : "#6f6f9b";
        if (cijferoverzicht) {
            const sectionStyle = `
            	display: flex;
            	align-items: center;
            	height: 140px;
            	box-sizing: border-box;
            	background-color: ${subjectBackground};
            	border-radius: 35px;
            	padding: 0 15px;
            	gap: 15px;
            	corner-shape: squircle;
            `;

            const firstSectionStyle =
                sectionStyle +
                `
            	padding: 0 30px;
            	width: 600px;
            `;

            const h3Style = `
                color: ${subjectColor};
                font-size: 42px;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
                width: 390px;
                margin: 0;
                font-family: ${font};
            	font-weight: 400;
            `;

            const gemiddeldeBackground = darkmode ? "#2c2d42" : "#f2f3f9";
            const gemiddeldeStyle = `
            	background-color: ${gemiddeldeBackground};
            	font-weight: 600;
            `;
            const gemiddeldeLastStyle = `
            	background-color: ${containerBackground};
            	font-weight: 600;
            `;

            // Column information
            html += `
            <div style="
            	display: flex;
            	gap: 22px;
            ">
                <div style="
                    ${firstSectionStyle}
                    background-color: transparent;
                    height: 60px;
                ">
                    <h3 style="${h3Style}">Vakken</h3>
                </div>`;
            let category: any;
            for (const item of items) {
                const width = item.gemiddelde ? "150px" : "120px";

                let content = "";
                if (item.category != category) {
                    category = item.category;
                    // Close previous section (not needed at start)
                    if (item.index != 0) {
                        html += `</div>`;
                    }
                    html += `<div style="
                        ${sectionStyle}
                        background-color: transparent;
                        height: 60px;
                    ">`;
                    content = item.category.replace("Periode: ", "Periode ");
                }
                if (
                    item.column &&
                    item.column.replace(/\s/g, "") != "" &&
                    item.column.length <= 3
                ) {
                    content = item.column;
                }

                html += `
                <p style="
                    color: ${fadedColor};
                    font-size: 2em;
                    width: ${width};
                    white-space: nowrap;
                	font-family: ${font};
                	font-weight: 400;
                ">${content}</p>`;
                // Close last section (only needed at end)
                if (item.index == items.length - 1) {
                    html += `</div>`;
                }
            }
            html += `</div>`;

            const vakken = cn("vak-row");
            for (const vak of vakken) {
                // Insert subject icon + name
                html += `
                <div style="
                	display: flex;
                	gap: 22px;
                ">
                    <div style="${firstSectionStyle}">
                        <svg style="
                            padding: 18px;
                            border-radius: 50%;
                            background-color: ${subjectIconBackground};
                            height: 36px;
                            width: 36px;
                            flex-shrink: 0;
                            overflow: visible;
                        " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${vak.getElementsByTagName("svg")[0].innerHTML}</svg>
                        <h3 style="${h3Style}">${vak.getElementsByClassName("naam")[0].innerHTML.trim()}</h3>
                    </div>`;

                // Insert all grades in their sections
                for (const item of items) {
                    const averageStyle =
                        item.last && item.gemiddelde
                            ? gemiddeldeLastStyle
                            : item.gemiddelde
                              ? gemiddeldeStyle
                              : "";
                    const width = item.gemiddelde ? "150px" : "120px";
                    if (item.category != category) {
                        category = item.category;
                        // Close previous section (not needed at start)
                        if (item.index != 0) {
                            html += `</div>`;
                        }
                        html += `<div style="${sectionStyle}">`;
                    }

                    const el = vak.getElementsByTagName("td")[item.index + 1];

                    const red = el.classList.contains("onvoldoende");
                    const green = el.classList.contains("ruimvoldoende");
                    const grey = el.classList.contains("neutraal");
                    const gradeColor = red
                        ? darkmode
                            ? "#f08080"
                            : "#ca1a1a"
                        : green
                          ? darkmode
                              ? "#80f0a2"
                              : "#22a816"
                          : grey
                            ? darkmode
                                ? "#a1a5c2"
                                : "#8d90aa"
                            : subjectColor;

                    html += `
                <p style="
                	color: ${gradeColor};
                	font-size: 52px;
                	height: 114px;
                	border-radius: 26px;
                    corner-shape: squircle;
                	width: ${width};
                	text-align: center;
                	font-family: ${font};
                	font-weight: 400;
                	display: flex;
                	align-items: center;
                	justify-content: center;
                    ${averageStyle}
                ">${el.innerHTML.trim()}</p>`;
                    // Close last section (only needed at end)
                    if (item.index == items.length - 1) {
                        html += `</div>`;
                    }
                }
                html += `</div>`;
            }
        } else {
            for (let i = 0; i < number; i++) {
                let averagePageGradeIndex = 0;
                if (tn("sl-vakgemiddelde-item", i)) {
                    averagePageGradeIndex =
                        tn("sl-vakgemiddelde-item", i).getElementsByClassName(
                            "cijfer",
                        ).length - 1;
                }
                const subjectIcon = n(tn("sl-resultaat-item", 0))
                    ? tn("sl-vakgemiddelde-item", i).getElementsByTagName(
                          "svg",
                      )[0].innerHTML
                    : tn("sl-resultaat-item", i).getElementsByTagName("svg")[0]
                          .innerHTML;
                const subjectName = n(tn("sl-resultaat-item", 0))
                    ? tn("sl-vakgemiddelde-item", i).getElementsByTagName(
                          "span",
                      )[0].innerHTML
                    : tn("sl-resultaat-item", i).getElementsByClassName(
                          "titel",
                      )[0].innerHTML;
                let grade = n(tn("sl-resultaat-item", 0))
                    ? n(
                          tn("sl-vakgemiddelde-item", i).getElementsByClassName(
                              "cijfer",
                          )[averagePageGradeIndex],
                      )
                        ? ""
                        : tn("sl-vakgemiddelde-item", i).getElementsByClassName(
                              "cijfer",
                          )[averagePageGradeIndex].innerHTML
                    : tn("sl-resultaat-item", i).getElementsByClassName(
                          "cijfer",
                      )[0].innerHTML;
                const gradeWeight =
                    tn("sl-resultaat-item", i)?.getElementsByClassName(
                        "weging ng-star-inserted",
                    )[0]?.innerHTML ?? null;
                const gradeWeightHTML = gradeWeight
                    ? `<p style="
                        font-size: 32px;
                        color: ${fadedColor};
                        font-family: ${font};
                        font-weight: 400;
                    ">${gradeWeight}</p>`
                    : "";
                const gradeDescription =
                    tn("sl-resultaat-item", i)?.getElementsByClassName(
                        "subtitel ng-star-inserted",
                    )[0]?.innerHTML ?? null;
                const gradeDescriptionHTML = gradeDescription
                    ? `<p style="
                        margin: 0;
                        color: ${fadedColor};
                        font-family: ${font};
                        font-weight: 400;
                        overflow: hidden;
                        white-space: nowrap;
                        text-overflow: ellipsis;
                        min-width: 0;
                        font-size: 24px;
                    ">${gradeDescription}</p>`
                    : "";
                const red =
                    (tn("sl-resultaat-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[0] &&
                        tn("sl-resultaat-item", i)
                            .getElementsByClassName("cijfer")[0]
                            .classList.contains("onvoldoende")) ||
                    (tn("sl-vakgemiddelde-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[averagePageGradeIndex] &&
                        tn("sl-vakgemiddelde-item", i)
                            .getElementsByClassName("cijfer")
                            [averagePageGradeIndex].classList.contains(
                                "onvoldoende",
                            ));
                const green =
                    (tn("sl-resultaat-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[0] &&
                        tn("sl-resultaat-item", i)
                            .getElementsByClassName("cijfer")[0]
                            .classList.contains("ruimvoldoende")) ||
                    (tn("sl-vakgemiddelde-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[averagePageGradeIndex] &&
                        tn("sl-vakgemiddelde-item", i)
                            .getElementsByClassName("cijfer")
                            [averagePageGradeIndex].classList.contains(
                                "ruimvoldoende",
                            ));
                let grey =
                    (tn("sl-resultaat-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[0] &&
                        tn("sl-resultaat-item", i)
                            .getElementsByClassName("cijfer")[0]
                            .classList.contains("neutraal")) ||
                    (tn("sl-vakgemiddelde-item", i)?.getElementsByClassName(
                        "cijfer",
                    )[averagePageGradeIndex] &&
                        tn("sl-vakgemiddelde-item", i)
                            .getElementsByClassName("cijfer")
                            [averagePageGradeIndex].classList.contains(
                                "neutraal",
                            ));
                if (!grade || grade.replace(/\s/g, "") == "") {
                    grade = "-";
                    grey = true;
                }
                const gradeColor = red
                    ? darkmode
                        ? "#f08080"
                        : "#ca1a1a"
                    : green
                      ? darkmode
                          ? "#80f0a2"
                          : "#22a816"
                      : grey
                        ? darkmode
                            ? "#a1a5c2"
                            : "#8d90aa"
                        : subjectColor;
                html += `
                <div style="
                    display: flex;
                    align-items: center;
                    height: 140px;
                    box-sizing: border-box;
                    background-color: ${subjectBackground};
                    border-radius: 35px;
                    padding: 0 44px;
                    gap: 22px;
                    corner-shape: squircle;
                ">
                    <svg style="
                        padding: 18px;
                        border-radius: 50%;
                        background-color: ${subjectIconBackground};
                        height: 36px;
                        width: 36px;
                        flex-shrink: 0;
                        overflow: visible;
                    " xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${subjectIcon}</svg>
                    <div style="
                        flex-shrink: 1;
                        flex-grow: 1;
                        min-width: 0;
                    ">
                        <h3 style="
                            color: ${subjectColor};
                            font-size: 42px;
                            overflow: hidden;
                            white-space: nowrap;
                            text-overflow: ellipsis;
                            font-family: ${font};
                            font-weight: 400;
                            min-width: 0;
                            margin: 0;
                        ">${subjectName}</h3>
                        ${gradeDescriptionHTML}
                    </div>
                    ${gradeWeightHTML}
                    <p style="
                        color: ${gradeColor};
                        font-size: 52px;
                        font-weight: 600;
                        margin-left: auto;
                        flex-shrink: 0;
                        font-family: ${font};
                        font-weight: 400;
                    ">${grade}</p>
                </div>`;
            }
            if (
                n(tn("sl-resultaat-item", 0)) &&
                n(tn("sl-vakgemiddelde-item", 0))
            ) {
                html += `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 140px;
                    box-sizing: border-box;
                    background-color: ${subjectBackground};
                    border-radius: 35px;
                    padding: 0 44px;
                    gap: 22px;
                    corner-shape: squircle;
                ">
                    <h3 style="
                        color: ${subjectColor};
                        font-size: 42px;
                        font-family: ${font};
                        font-weight: 400;
                        ">Er zijn geen cijfers voor deze periode</h3>
                </div>`;
            }
        }
        html += `</div>`;
        const totalHeight = containerHeight + 176; // add header height
        // Insert canvas
        tn("body", 0).insertAdjacentHTML(
            "beforeend",
            `<canvas id="mod-grade-canvas" width="${totalWidth}" height="${totalHeight}" style="display:none;"></canvas>`,
        );
        const canvas = id("mod-grade-canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // Use data urls for font in SVG
        const kanit = await window.getResourceAsBase64(
            "fonts/Kanit-ExtraLight.woff2",
        );
        // Add SVG with HTML to the canvas
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            canvas.width +
            '" height="' +
            canvas.height +
            '"><defs><style type="text/css">@font-face{font-family:Kanit;src:url(\'' +
            kanit +
            '\')}</style></defs><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">' +
            html +
            "</div></foreignObject></svg>";
        const svgObjectUrl = `data:image/svg+xml; charset=utf8, ${encodeURIComponent(svg)}`;
        const tempImg = new Image();
        tempImg.addEventListener("load", () => {
            ctx.drawImage(tempImg, 0, 0);
            URL.revokeObjectURL(svgObjectUrl);
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = cijferoverzicht
                ? "cijferoverzicht-" +
                  cijferOverzichtPeriod
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-") +
                  ".png"
                : n(tn("sl-resultaat-item", 0))
                  ? "laatste-rapportcijfers.png"
                  : "cijfers.png";
            a.dispatchEvent(new MouseEvent("click"));
            tryRemove(id("mod-grade-canvas"));
            if (id("mod-message")) {
                closeModMessage();
            }
        });
        tempImg.addEventListener("error", (e) => {
            console.log(e);
            tryRemove(id("mod-grade-canvas"));
            if (id("mod-message")) {
                closeModMessage();
            }
        });
        tempImg.src = svgObjectUrl;
        tn("sl-root", 0).removeAttribute("inert");
    }
}
