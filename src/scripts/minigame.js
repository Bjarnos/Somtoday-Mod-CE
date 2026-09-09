// MINIGAME
// Platformer minigame
function errorPage() {
    if (tn("hmy-button", 0)) {
        tn("hmy-button", 0).insertAdjacentHTML(
            "afterend",
            '<a id="mod-play-game">Of speel een game</a>',
        );

        id("mod-play-game").addEventListener("click", () => {
            startTheEscape();
        });

        const hashGame = window.location.hash.replace("#mod-play=", "");
        const params = new URLSearchParams(window.location.search);
        const queryGame = params.get("mod-play");
        const autoGame = hashGame || queryGame;

        if (autoGame || window.location.hash === "#mod-play") {
            startTheEscape();
            if (window.location.hash === "#mod-play") {
                history.replaceState(
                    "",
                    document.title,
                    window.location.pathname + window.location.search,
                );
            }
        }
    }
}
