import { cn } from "../../shorthand_functions";

export function editGrades() {
    // Change to true to be able to edit your grades. Not added by default to prevent students from misleading their parents.
    // If you see this, you are smart enough to know how inspect element works, so just enable it if you want to.
    const allowEditGrades = false;
    if (allowEditGrades) {
        for (const element of cn("cijfer")) {
            element.contentEditable = true;
            element.addEventListener(
                "click",
                function (this: HTMLElement, event: Event) {
                    this.focus();
                    event.stopPropagation();
                },
            );
        }
    }
}
