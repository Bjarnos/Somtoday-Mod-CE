import {
    contributors,
    platform,
    version_name,
} from "../../save_version_management";

// Write message in the console
export function consoleMessage() {
    setTimeout(
        console.log.bind(
            console,
            "%cSomtoday Mod is geactiveerd!",
            "color:#0067c2;font-weight:bold;font-family:Arial;font-size:26px;",
        ),
    );
    setTimeout(
        console.log.bind(
            console,
            "%cGeniet van je betere versie van Somtoday.\n\nMet dank aan " +
                Object.keys(contributors).join(", ") +
                "\nVersie " +
                version_name +
                " van Somtoday Mod " +
                platform,
            "color:#0067c2;font-weight:bold;font-family:Arial;font-size:16px;",
        ),
    );
}
