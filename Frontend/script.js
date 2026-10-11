
const API_BASE = "http://127.0.0.1:8000";

const shortenForm = document.getElementById("shorten-form");
const longUrlInput = document.getElementById("long-url");
const shortenButton = document.getElementById("shorten-button");
const buttonText = document.getElementById("button-text");
const shortenMessage = document.getElementById("shorten-message");

const resultBox = document.getElementById("result");
const shortLinkElement = document.getElementById("short-link");
const copyButton = document.getElementById("copy-button");

const analyticsForm = document.getElementById("analytics-form");
const shortCodeInput = document.getElementById("short-code");
const analyticsButton = document.getElementById("analytics-button");
const analyticsMessage = document.getElementById("analytics-message");

const analyticsResult = document.getElementById("analytics-result");
const clickCountElement = document.getElementById("click-count");
const analyticsUrlElement = document.getElementById("analytics-url");


function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}


function hideResult(element) {
    element.classList.add("hidden");
}


function makeShortUrl(shortCode) {
    return `${API_BASE}/${encodeURIComponent(shortCode)}`;
}


// Create a short URL
shortenForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const originalUrl = longUrlInput.value.trim();

    showMessage(shortenMessage, "");
    hideResult(resultBox);

    shortenButton.disabled = true;
    buttonText.textContent = "Creating link...";

    try {
        const response = await fetch(`${API_BASE}/urls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                url: originalUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const detail = Array.isArray(data.detail)
                ? data.detail.map(item => item.msg).join(", ")
                : data.detail;

            throw new Error(detail || "Could not create the short URL.");
        }

        if (!data.short_code) {
            throw new Error("The backend did not return a short code.");
        }

        const shortUrl = makeShortUrl(data.short_code);

        shortLinkElement.textContent = shortUrl;
        shortLinkElement.href = shortUrl;

        // Fill the analytics form with the newly created short code.
        shortCodeInput.value = data.short_code;

        resultBox.classList.remove("hidden");

        showMessage(
            shortenMessage,
            "Short URL created successfully.",
            "success"
        );

    } catch (error) {
        showMessage(
            shortenMessage,
            error.message === "Failed to fetch"
                ? "Cannot connect to the backend. Check that FastAPI is running and CORS is configured."
                : error.message,
            "error"
        );

    } finally {
        shortenButton.disabled = false;
        buttonText.textContent = "Generate short link";
    }
});


// Copy the generated short URL
copyButton.addEventListener("click", async function () {
    const shortUrl = shortLinkElement.href;

    try {
        await navigator.clipboard.writeText(shortUrl);

        copyButton.textContent = "Copied!";

        setTimeout(() => {
            copyButton.textContent = "Copy link";
        }, 1500);

    } catch (error) {
        // Fallback for browsers that do not allow clipboard access.
        window.prompt("Copy your short URL:", shortUrl);
    }
});


// Get analytics for a short code
analyticsForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const shortCode = shortCodeInput.value.trim();

    showMessage(analyticsMessage, "");
    hideResult(analyticsResult);

    if (!shortCode) {
        showMessage(
            analyticsMessage,
            "Please enter a short code.",
            "error"
        );
        return;
    }

    analyticsButton.disabled = true;
    analyticsButton.textContent = "Loading...";

    try {
        const response = await fetch(
            `${API_BASE}/analytics/${encodeURIComponent(shortCode)}`
        );

        const data = await response.json();

        if (!response.ok) {
            const detail = Array.isArray(data.detail)
                ? data.detail.map(item => item.msg).join(", ")
                : data.detail;

            throw new Error(detail || "Could not retrieve analytics.");
        }

        clickCountElement.textContent = data.click_count;

        analyticsUrlElement.textContent = data.original_url;
        analyticsUrlElement.href = data.original_url;

        analyticsResult.classList.remove("hidden");

        showMessage(
            analyticsMessage,
            "Analytics loaded successfully.",
            "success"
        );

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
        analyticsButton.textContent = "Check stats";
    }
});
