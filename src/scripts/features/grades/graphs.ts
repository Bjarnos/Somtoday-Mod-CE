import { Chart } from "chart.js/auto";
import { hexToRgb, toBrightnessValue } from "../../colors";
import { get } from "../../save_version_management";
import { cn, hide, id, n, parseJSON, tn } from "../../shorthand_functions";

export function gradeGraphs(recapData: any) {
    if (!n(recapData)) {
        let recapChart = Chart.getChart("recap-chart");
        if (recapChart) {
            recapChart.destroy();
        }
        Chart.defaults.color = "#fff";
        const recapCanvas = document.getElementById(
            "recap-chart",
        ) as HTMLCanvasElement;
        const recapCtx = recapCanvas?.getContext("2d");
        if (!recapCtx) return;
        const recapGradient = recapCtx.createLinearGradient(0, 0, 0, 300);
        recapGradient.addColorStop(0, "#fff");
        recapGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        const recapPoints = [];
        const recapDates = [];
        for (const grade of recapData.grades) {
            if (!Number.isNaN(grade.cijfer)) {
                recapPoints.unshift(grade.cijfer);
                recapDates.push("Mysterieus vak");
            }
        }
        const recapChartData = {
            labels: recapDates,
            datasets: [
                {
                    label: "Mysterieus vak",
                    lineTension: 0,
                    backgroundColor: recapGradient,
                    fill: true,
                    borderColor: "#fff",
                    data: recapPoints.reverse(),
                    pointStyle: "circle",
                    pointRadius: 3,
                    pointHoverRadius: 7,
                    hitRadius: 500,
                },
            ],
        };
        recapChart = new Chart(recapCtx, {
            type: "line",
            data: recapChartData,
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 11,
                        ticks: {
                            autoSkip: true,
                            callback: (value: any, index: any, values: any) =>
                                index == values.length - 1 ? undefined : value,
                        },
                    },
                    x: {
                        ticks: {
                            display: false,
                        },
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
        return;
    }
    if (
        n(document.getElementById("mod-chart-1")) ||
        n(document.getElementById("mod-chart-2"))
    ) {
        return;
    }

    let modChart1 = Chart.getChart("mod-chart-1");
    if (modChart1) {
        modChart1.destroy();
    }
    let modChart2 = Chart.getChart("mod-chart-2");
    if (modChart2) {
        modChart2.destroy();
    }

    const isDarkMode =
        tn("html", 0)?.classList.contains("dark") ||
        tn("html", 0)?.classList.contains("night");
    Chart.defaults.color = isDarkMode ? "#fff" : "#000";
    let canvas = document.getElementById("mod-chart-1") as HTMLCanvasElement;
    let ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const points = [];
    const weight = [];
    const dates = [];
    const dateObjects = [];
    const color = toBrightnessValue(get("primarycolor"), 150);
    const endcolor = hexToRgb(color);
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color);
    gradient.addColorStop(
        1,
        `rgba(${endcolor[0]},${endcolor[1]},${endcolor[2]},0)`,
    );
    const year = new Date().getFullYear();
    for (const element of tn("sl-resultaat-item")) {
        if (
            !n(element.getElementsByClassName("cijfer")[0]) &&
            !n(element.getElementsByClassName("cijfer")[0].children[0])
        ) {
            if (
                element
                    .getElementsByClassName("weging")[0]
                    .innerHTML.replace(",", ".")
                    .match(/[0-9]+(\.[0-9]+)?/) == null
            ) {
                continue;
            }
            const weging = parseFloat(
                element
                    .getElementsByClassName("weging")[0]
                    .innerHTML.replace(",", ".")
                    .match(/[0-9]+(\.[0-9]+)?/)[0],
            );
            let grade = parseFloat(
                element
                    .getElementsByClassName("cijfer")[0]
                    .children[0].innerHTML.replace(",", "."),
            );

            let dateObject: any;
            const dateString = n(element.getElementsByClassName("subtitel")[0])
                ? ""
                : element.getElementsByClassName("subtitel")[0].innerHTML;
            if (dateString.indexOf("Vandaag") != -1) {
                dateObject = Date.now();
            } else if (dateString.indexOf("Gisteren") != -1) {
                dateObject = new Date(Date.now() - 86400000);
            } else {
                // Make string date parsable with Date.parse()
                // First change month abbreviations to English
                let englishDateString = dateString
                    .replace("mrt", "mar")
                    .replace("mei", "may")
                    .replace("mei", "may")
                    .replace("okt", "oct");
                // Then add the year if not present
                if (englishDateString.match(".*?[0-9]{4}") == null) {
                    englishDateString += ` ${year}`;
                }
                dateObject = Date.parse(englishDateString);
            }

            if (Number.isNaN(grade) && weging != 0) {
                const letterbeoordelingen = parseJSON(
                    get("letterbeoordelingen"),
                );
                const letter = element
                    .getElementsByClassName("cijfer")[0]
                    .children[0].innerHTML.replace(",", ".");
                if (
                    letterbeoordelingen == null ||
                    letterbeoordelingen[letter] == null
                ) {
                    // Letter value is not set, user should set it in modsettings if they want to count it
                    continue;
                } else if (Number.isNaN(letterbeoordelingen[letter])) {
                    // Letter should be ignored if set to "-" (or if non-numeric in general)
                    continue;
                } else {
                    // Letter value is numeric and set
                    grade = letterbeoordelingen[letter];
                }
            }

            if (!Number.isNaN(grade)) {
                if (dateObjects.length == 0) {
                    points.push(grade);
                    dates.push(dateString);
                    dateObjects.push(dateObject);
                    weight.push(weging);
                } else {
                    // Keep array sorted by date
                    for (let i = 0; i < dateObjects.length; i++) {
                        if (dateObject <= dateObjects[i]) {
                            points.splice(i, 0, grade);
                            dates.splice(i, 0, dateString);
                            dateObjects.splice(i, 0, dateObject);
                            weight.splice(i, 0, weging);
                            break;
                        } else if (i >= dateObjects.length - 1) {
                            points.push(grade);
                            dates.push(dateString);
                            dateObjects.push(dateObject);
                            weight.push(weging);
                            break;
                        }
                    }
                }
            }
        }
    }
    // Calculate average and suggestions
    let totalWeight = 0;
    let weightedSum = 0;
    for (let i = 0; i < points.length; i++) {
        let w = weight[i];
        if (w > 50) w = 1;
        totalWeight += w;
        weightedSum += points[i] * w;
    }
    let suggestionText =
        "Er zijn nog niet genoeg cijfers om een analyse te maken.";
    if (totalWeight > 0) {
        const average = weightedSum / totalWeight;
        const roundedAverage = (Math.round(average * 10) / 10)
            .toString()
            .replace(".", ",");
        // Trend analysis (laatste 3 cijfers)
        let trend = "stabiel";
        if (points.length >= 2) {
            let recentSum = 0;
            let recentWeight = 0;
            let count = 0;
            for (let i = points.length - 1; i >= 0 && count < 3; i--) {
                let wRecent = weight[i];
                if (wRecent > 50) wRecent = 1;
                recentSum += points[i] * wRecent;
                recentWeight += wRecent;
                count++;
            }
            if (recentWeight > 0) {
                const recentAverage = recentSum / recentWeight;
                if (recentAverage > average + 0.3) trend = "stijgend";
                else if (recentAverage < average - 0.3) trend = "dalend";
            }
        }
        let advice = "";
        if (average < 5.5) {
            const needed = 5.5 * (totalWeight + 1) - weightedSum;
            advice = `Je staat helaas onvoldoende (${roundedAverage}). Probeer een <b>${Math.ceil(needed * 10) / 10}</b> of hoger te halen voor je volgende toets (1x wegend) om weer voldoende te staan. Zet 'm op!`;
        } else if (average < 6.5) {
            advice = `Je staat een voldoende (${roundedAverage}), maar het kan altijd beter! Blijf goed opletten in de les.`;
        } else if (average < 7.5) {
            advice = `Lekker bezig! Je staat een mooie ${roundedAverage}. Ga zo door!`;
        } else {
            advice = `Wauw! Je staat een ${roundedAverage}! Jij bent echt goed bezig!`;
        }
        let trendText = "";
        if (trend == "stijgend")
            trendText = " <br>🚀 Je laatste cijfers zitten in de lift!";
        else if (trend == "dalend")
            trendText =
                " <br>📉 Pas op, je laatste cijfers zijn wat lager dan gemiddeld.";
        suggestionText = advice + trendText;
    }
    if (id("mod-grade-suggestions")) {
        id("mod-grade-suggestions").innerHTML = suggestionText;
    }
    if (points.length < 2) {
        hide(id("mod-grades-graphs"));
        return;
    }
    let chartdata = {
        labels: dates,
        datasets: [
            {
                label:
                    n(cn("vaknaam", 0)) ||
                    n(cn("vaknaam", 0).getElementsByTagName("span")[0])
                        ? ""
                        : cn("vaknaam", 0).getElementsByTagName("span")[0]
                              .innerHTML,
                lineTension: 0,
                backgroundColor: gradient,
                fill: true,
                borderColor: color,
                data: points,
                pointStyle: "circle",
                pointRadius: 3,
                pointHoverRadius: 7,
                hitRadius: 500,
            },
        ],
    };
    modChart1 = new Chart(ctx, {
        type: "line",
        data: chartdata,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 11,
                    ticks: {
                        autoSkip: true,
                        callback: (value: any, index: any, values: any) =>
                            index == values.length - 1 ? undefined : value,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });
    canvas = document.getElementById("mod-chart-2") as HTMLCanvasElement;
    ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const values = [];
    let totalGrades = 0;
    let rollingTotalWeight = 0;
    for (let i = 0; i < points.length; i++) {
        let wRolling = weight[i];
        if (wRolling > 50) wRolling = 1;
        totalGrades += points[i] * wRolling;
        rollingTotalWeight += wRolling;
        values.push(Math.floor((totalGrades / rollingTotalWeight) * 100) / 100);
    }
    chartdata = {
        labels: dates,
        datasets: [
            {
                label:
                    n(cn("vaknaam", 0)) ||
                    n(cn("vaknaam", 0).getElementsByTagName("span")[0])
                        ? ""
                        : cn("vaknaam", 0).getElementsByTagName("span")[0]
                              .innerHTML,
                lineTension: 0,
                backgroundColor: gradient,
                fill: true,
                borderColor: color,
                data: values,
                pointStyle: "circle",
                pointRadius: 3,
                pointHoverRadius: 7,
                hitRadius: 500,
            },
        ],
    };
    modChart2 = new Chart(ctx, {
        type: "line",
        data: chartdata,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 11,
                    ticks: {
                        autoSkip: true,
                        callback: (value: any, index: any, values: any) =>
                            index == values.length - 1 ? undefined : value,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
            },
        },
    });
}
