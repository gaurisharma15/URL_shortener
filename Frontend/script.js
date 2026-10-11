
const API_BASE = "http://127.0.0.1:8000";

const shortenForm = document.getElementById("shorten-form");
const longUrlInput = document.getElementById("long-url");
const shortenButton = document.getElementById("shorten-button");
const buttonText = document.getElementById("button-text");
const shortenMessage = document.getElementById("shorten-message");

const resultBox = document.getElementById("result");
const shortLink = document.getElementById("short-link");
const copyButton = document.getElementById("copy-button");

const analyticsForm = document.getElementById("analytics-form");
const shortCodeInput = document.getElementById("short-code");
const analyticsButton = document.getElementById("analytics-button");
const analyticsMessage = document.getElementById("analytics-message");

const analyticsResult = document.getElementById("analytics-result");
const clickCount = document.getElementById("click-count");
const analyticsUrl = document.getElementById("analytics-url");

function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}

function makeShortUrl(code) {
    return `${API_BASE}/${encodeURIComponent(code)}`;
}

// Shorten a URL
shortenForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const url = longUrlInput.value.trim();

    showMessage(shortenMessage, "");
    resultBox.classList.add("hidden");

    shortenButton.disabled = true;
    buttonText.textContent = "Creating...";

    try {
        const response = await fetch(`${API_BASE}/urls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Could not create the short URL."
            );
        }

        if (!data.short_code) {
            throw new Error("No short code received from the backend.");
        }

        const shortUrl = makeShortUrl(data.short_code);

        shortLink.href = shortUrl;
        shortLink.textContent = shortUrl;

        shortCodeInput.value = data.short_code;
        resultBox.classList.remove("hidden");

        showMessage(shortenMessage, "Short URL created successfully.", "success");

    } catch (error) {
        showMessage(
            shortenMessage,
            error.message === "Failed to fetch"
                ? "Cannot connect to the backend. Check that FastAPI is running."
                : error.message,
            "error"
        );
    } finally {
        shortenButton.disabled = false;
        buttonText.textContent = "Shorten URL";
    }
});

// Copy the short URL
copyButton.addEventListener("click", async function () {
    try {
        await navigator.clipboard.writeText(shortLink.href);
        copyButton.textContent = "Copied!";
    } catch {
        window.prompt("Copy this URL:", shortLink.href);
    }
});

// Check click statistics
analyticsForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const code = shortCodeInput.value.trim();

    showMessage(analyticsMessage, "");
    analyticsResult.classList.add("hidden");

    if (!code) {
        showMessage(analyticsMessage, "Enter a short code.", "error");
        return;
    }

    analyticsButton.disabled = true;
    analyticsButton.textContent = "Loading...";

    try {
        const response = await fetch(
            `${API_BASE}/analytics/${encodeURIComponent(code)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Could not retrieve statistics."
            );
        }

        clickCount.textContent = data.click_count;
        analyticsUrl.textContent = data.original_url;
        analyticsUrl.href = data.original_url;

        analyticsResult.classList.remove("hidden");
        showMessage(analyticsMessage, "Statistics loaded.", "success");

    } catch (error) {
        showMessage(
            analyticsMessage,
            error.message === "Failed to fetch"
                ? "Cannot connect to the backend. Check that FastAPI is running."
                : error.message,
            "error"
        );
    } finally {
        analyticsButton.disabled = false;
        analyticsButton.textContent = "Check Clicks";
    }
});
