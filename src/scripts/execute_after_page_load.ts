// EXECUTE MOD AFTER PAGE LOAD
// This script is executed after the page is loaded
async function autoLogin(): Promise<void> {
    if (n(get("loginschool")) || get("logincredentialsincorrect") === "1") {
        return;
    }

    // Wait until school input field is loaded
    const schoolField = await waitForElement(
        "#organisatieSearchField, #organisatieInput",
    );

    if (cn("feedbackPanelERROR", 0)) {
        set("logincredentialsincorrect", "1");
        return;
    } else if (!schoolField) {
        return;
    }

    // Fill in the school name
    const orgSearch = id("organisatieSearchField") as HTMLInputElement | null;
    if (orgSearch) {
        orgSearch.value = String(get("loginschool") || "");
        // Always use this school
        const checkbox = cn(
            "form--checkbox checkbox-label",
            0,
        ) as HTMLElement | null;
        if (checkbox && checkbox.getAttribute("aria-checked") === "false") {
            checkbox.click();
        }
    }

    if (n(get("loginname"))) {
        return;
    }

    // Wait for event to be added to next button
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Proceed to next step
    const nextBtn = cn(
        "button--stpanel primary-button",
        0,
    ) as HTMLElement | null;
    if (nextBtn) {
        nextBtn.click();
    }

    // Wait until username input field is loaded
    const usernameField = await waitForElement("#usernameField");

    if (cn("feedbackPanelERROR", 0)) {
        set("logincredentialsincorrect", "1");
        return;
    } else if (!usernameField) {
        return;
    }

    // Fill in the username (and password if set)
    const userField = id("usernameField") as HTMLInputElement | null;
    if (userField) {
        userField.value = String(get("loginname") || "");
    }

    const passField = id("password-field") as HTMLInputElement | null;
    if (passField) {
        // If password is not set but password field is present, DO NOT click the login button!
        if (n(get("loginpass"))) {
            return;
        }
        passField.value = String(get("loginpass") || "");
    }
    // Remember username
    const rememberCheckbox = cn(
        "form--checkbox checkbox-label",
        0,
    ) as HTMLElement | null;
    if (
        rememberCheckbox &&
        rememberCheckbox.getAttribute("aria-checked") === "false"
    ) {
        rememberCheckbox.click();
    }

    // Wait until submit button event is added
    const submitButton = await waitForElement(
        ".button--stpanel.primary-button",
    );
    if (!submitButton) {
        return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50)); // Small delay for event listeners

    // Login
    (cn("button--stpanel primary-button", 0) as HTMLElement | null)?.click();

    // Check if credentials were correct
    setTimeout(() => {
        if (cn("feedbackPanelERROR", 0)) {
            set("logincredentialsincorrect", "1");
        }
    }, 1000);
}

async function waitForPageLoad(): Promise<void> {
    const storageTimeout = Date.now() + 3000;
    const getStorageMethod = () =>
        typeof storageMethod !== "undefined"
            ? storageMethod
            : (window as any).storageMethod;
    const getData = () =>
        typeof data !== "undefined" && data != null
            ? data
            : (window as any).data;

    while (
        (getStorageMethod() === "extension" ||
            getStorageMethod() === "indexedDB") &&
        getData() == null &&
        Date.now() < storageTimeout
    ) {
        await new Promise((resolve) => setTimeout(resolve, 25));
    }

    // Remember to open settings if settings hash is present
    if (hasSettingsHash) {
        set("opensettingsIntention", "1");
    }
    // If user has explicitly disabled Somtoday Mod in popup, return
    const activeData = getData();
    if (isExtension && activeData?.enabled === false) {
        return;
    }
    // Autologin user if enabled
    else if (window.location.origin.indexOf("inloggen") !== -1) {
        execute([autoLogin]);
        return;
    }
    // Redirect user to login page if enabled
    else if (window.location.origin.indexOf("som.today") !== -1) {
        if (
            get("bools") == null ||
            (get("bools") as string).charAt(BOOL_INDEX.REDIRECT_ELO) === "1"
        ) {
            window.location.replace("https://inloggen.somtoday.nl");
        }
        return;
    }

    // Apply theme immediately to documentElement to prevent flash of light theme
    const theme = get("theme");
    if (
        (theme === "light" || theme === "dark" || theme === "night") &&
        get("autotheme") !== "true"
    ) {
        document.documentElement.classList.remove("light", "dark", "night");
        document.documentElement.classList.add(theme);
    }

    // Wait for Somtoday to load
    const loadedElement = await waitForElement(
        'sl-home > *:nth-child(2), sl-header, sl-sidebar-page, sl-main-content, sl-error, .errorTekst, iframe[src="https://som.today/updaten/"]',
        10000,
    );

    if (loadedElement && loadedElement.tagName === "IFRAME") {
        return;
    }

    const initFn =
        typeof modInit === "function" ? modInit : (window as any).modInit;
    if (initFn) {
        execute([initFn]);
    }
}

execute([waitForPageLoad]);
