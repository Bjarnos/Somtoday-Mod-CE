import { get, set } from "../../save_version_management";
import { BOOL_INDEX, id, n, tn, tryRemove } from "../../shorthand_functions";
import { startConfetti } from "./confetti";

// Show confetti when it is the users birthday or when the user uses Somtoday Mod for n years
export function congratulations() {
    const today = new Date();
    const dayInt = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();

    // Only activate it when enabled in settings and if it is the first time Somtoday is used on the current day (months are zero-based)
    if (
        get("bools").charAt(BOOL_INDEX.CONGRATULATIONS) == "1" &&
        `${year}-${month + 1}-${dayInt}` != get("lastused")
    ) {
        // Get years since first use
        const firstused = new Date(get("firstused"));
        const lastused = new Date(get("lastused"));
        const yeardifference = parseInt(
            (
                (lastused.getTime() - firstused.getTime()) /
                1000 /
                60 /
                60 /
                24 /
                365
            ).toString(),
            10,
        );
        // Get birthday date
        const birthdayday = parseInt(
            get("birthday").charAt(0) + get("birthday").charAt(1),
            10,
        );
        const birthdaymonth = parseInt(
            get("birthday").charAt(3) + get("birthday").charAt(4),
            10,
        );
        // Check if confetti should be shown
        let congratstext = [""];
        if (yeardifference > get("lastjubileum")) {
            congratstext = [
                "Bedankt" +
                    (n(get("username"))
                        ? n(get("realname"))
                            ? ""
                            : `, ${get("realname").replace(/ .*/, "")}`
                        : `, ${get("username").replace(/ .*/, "")}`) +
                    "!",
                "Je gebruikt Somtoday Mod nu al " +
                    yeardifference +
                    " jaar. Bedankt!",
            ];
            set("lastjubileum", yeardifference);
        }
        if (birthdayday == dayInt && birthdaymonth == month + 1) {
            const randomDescriptionArray = [
                "Maak er maar een mooie dag van!",
                "Gefeliciteerd! Je bent weer een jaartje dichterbij je afstuderen!",
                "Geniet ervan! Mogen al je dromen uitkomen!",
                "Jaja, je bent weer jarig! Van harte gefeliciteerd!",
                '"School is raar, hier is een schaar" ~ iemand die ooit jarig was',
            ];
            congratstext = [
                "Fijne verjaardag!",
                randomDescriptionArray[
                    Math.floor(Math.random() * randomDescriptionArray.length)
                ],
            ];
        }
        if (congratstext[1] != null) {
            // Confetti should be shown, so insert the confetti
            tn("body", 0).style.setProperty(
                "overflow-y",
                "hidden",
                "important",
            );
            tn("body", 0).insertAdjacentHTML(
                "afterbegin",
                '<style>#verjaardag{width:100%;height:100%;position:fixed;top:0;left:0;z-index:10000;background:var(--bg-elevated-none);text-align:center;transition:0.3s opacity ease;}#verjaardag div{top:50%;left:50%;transform:translate(-50%, -50%);position:absolute;}.bouncetext{animation:bounce 0.3s ease forwards;color:var(--action-primary-normal);}.bouncetext.small{font-size:0;animation:bouncesmall 0.5s ease forwards 0.3s;margin-top:35px;}@keyframes bouncesmall{0%{font-size:0px;}80%{font-size:29px;}100%{font-size:24px;}}@keyframes bounce{0%{font-size:0px;}80%{font-size:58px;}100%{font-size:48px;}}.verjaardagbtn{background:var(--action-primary-normal);padding:25px 40px;width:fit-content;color:var(--bg-elevated-none) !important;margin-top:50px;opacity:0;display:block;animation:2s fadein ease 0.6s forwards;font-size:16px;border-radius:16px;transition:0.3s background ease !important;}.verjaardagbtn:hover{cursor:pointer;background:var(--action-primary-strong);}@keyframes fadein{0%{opacity:0;}100%{opacity:1;}}</style><div id="verjaardag"><div><h2 class="bouncetext">' +
                    congratstext[0] +
                    '</h2><h2 class="bouncetext small">' +
                    congratstext[1] +
                    '</h2><center><a class="verjaardagbtn" id="congrats-continue">Doorgaan</a></center></div></div>',
            );
            id("congrats-continue").addEventListener("click", () => {
                set("lastused", `${year}-${month + 1}-${dayInt}`);
                id("confetti-canvas").style.opacity = "0";
                id("verjaardag").style.opacity = "0";
                setTimeout(() => {
                    tryRemove(id("confetti-canvas"));
                    tryRemove(id("verjaardag"));
                    tn("body", 0).style.setProperty(
                        "overflow-y",
                        "scroll",
                        "important",
                    );
                }, 350);
            });
            setTimeout(startConfetti, 500);
        } else {
            set("lastused", `${year}-${month + 1}-${dayInt}`);
        }
    } else {
        set("lastused", `${year}-${month + 1}-${dayInt}`);
    }
}
