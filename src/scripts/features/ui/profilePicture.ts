import { get } from "../../save_version_management";
import { id, n, tn, tryRemove } from "../../shorthand_functions";

export let profilePictureChanged = false;

export function profilePicture() {
    // Change all profile pictures if custom one is set
    if (!n(get("profilepic"))) {
        profilePictureChanged = true;
        tryRemove(id("mod-profile-picture"));
        tn("head", 0).insertAdjacentHTML(
            "beforeend",
            '<style id="mod-profile-picture">hmy-avatar>.container{border-radius:var(--border-radius);background:url(\'' +
                get("profilepic") +
                "') center / cover !important;}.foto, .initials{opacity:0 !important;}</style>",
        );
    }
    // Reset all profile pictures when profile picture is reset
    else if (profilePictureChanged) {
        profilePictureChanged = false;
        tryRemove(id("mod-profile-picture"));
    }
}
