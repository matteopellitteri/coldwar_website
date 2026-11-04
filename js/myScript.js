const searchbar = document.querySelector(".searchbar");

if (searchbar) {
    let previousScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - previousScrollY;

        if (currentScrollY <= 0) {
            searchbar.classList.remove("is-hidden");
        } else if (Math.abs(scrollDifference) > 8) {
            searchbar.classList.toggle("is-hidden", scrollDifference > 0);
        }

        previousScrollY = currentScrollY;
    }, { passive: true });
}

const searchPages = [
    { title: "Home — Cold War", path: "index.html", keywords: ["home", "cold war"] },
    { title: "Persons", path: "persons.html", keywords: ["people", "person", "biographies", "biography"] },
    { title: "Winston Churchill", path: "persons.html", keywords: ["churchill", "prime minister"] },
    { title: "Joseph Stalin", path: "persons.html", keywords: ["stalin"] },
    { title: "Nikita Khrushchev", path: "persons.html", keywords: ["khrushchev", "nikita"] },
    { title: "Mikhail Gorbachev", path: "persons.html", keywords: ["gorbachev", "mikhail"] },
    { title: "Ronald Reagan", path: "persons.html", keywords: ["reagan"] },
    { title: "John F. Kennedy", path: "persons.html", keywords: ["kennedy", "jfk"] },
    { title: "Photos", path: "photos.html", keywords: ["images", "pictures", "photographs"] },
    { title: "Winston Churchill photos", path: "photos.html", keywords: ["churchill photo", "churchill images"] },
    { title: "Speeches", path: "speechs.html", keywords: ["speech", "speechs", "speeches"] },
    { title: "The Sinews of Peace", path: "sinewsofpeace.html", keywords: ["iron curtain", "churchill speech"] },
    { title: "On the Cult of Personality and Its Consequences", path: "speechs.html", keywords: ["khrushchev speech", "cult of personality"] },
    { title: "Ich bin ein Berliner", path: "speechs.html", keywords: ["kennedy speech", "berliner"] },
    { title: "Remarks on East-West Relations at the Brandenburg Gate", path: "speechs.html", keywords: ["reagan speech", "brandenburg gate"] },
    { title: "Address to the United Nations General Assembly", path: "speechs.html", keywords: ["gorbachev speech", "united nations"] }
];

function normalizeSearchText(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function findSearchResults(query) {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) {
        return [];
    }

    return searchPages
        .map((page) => {
            const title = normalizeSearchText(page.title);
            const keywords = page.keywords.map(normalizeSearchText);
            const matches = [title, ...keywords].some((value) => value.includes(normalizedQuery));

            if (!matches) {
                return null;
            }

            const rank = title === normalizedQuery
                ? 0
                : keywords.includes(normalizedQuery)
                    ? 1
                    : title.startsWith(normalizedQuery)
                        ? 2
                        : keywords.some((keyword) => keyword.startsWith(normalizedQuery))
                            ? 3
                            : title.includes(normalizedQuery)
                                ? 4
                                : 5;

            return { ...page, rank };
        })
        .filter((page) => page !== null)
        .sort((first, second) => first.rank - second.rank || first.title.localeCompare(second.title))
        .slice(0, 6);
}

document.querySelectorAll(".searchbar form").forEach((form, formIndex) => {
    const input = form.querySelector('input[type="text"]');
    if (!input) {
        return;
    }

    const suggestions = document.createElement("div");
    suggestions.className = "search-suggestions";
    suggestions.id = `search-suggestions-${formIndex}`;
    suggestions.setAttribute("role", "listbox");
    suggestions.hidden = true;
    form.append(suggestions);

    input.setAttribute("aria-label", "Search site pages");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", suggestions.id);
    input.setAttribute("aria-expanded", "false");

    let results = [];
    let activeIndex = -1;

    function closeSuggestions() {
        suggestions.hidden = true;
        input.setAttribute("aria-expanded", "false");
        input.removeAttribute("aria-activedescendant");
        activeIndex = -1;
    }

    function navigateTo(page) {
        window.location.href = page.path;
    }

    function renderSuggestions() {
        results = findSearchResults(input.value);
        activeIndex = -1;
        input.removeAttribute("aria-activedescendant");
        suggestions.replaceChildren();

        if (!input.value.trim()) {
            closeSuggestions();
            return;
        }

        if (!results.length) {
            const message = document.createElement("p");
            message.className = "search-no-results";
            message.textContent = "No matching page found.";
            suggestions.append(message);
        } else {
            results.forEach((page, index) => {
                const option = document.createElement("button");
                option.type = "button";
                option.id = `${suggestions.id}-option-${index}`;
                option.className = "search-suggestion";
                option.setAttribute("role", "option");
                option.setAttribute("aria-selected", "false");

                const title = document.createElement("span");
                title.textContent = page.title;
                const destination = document.createElement("span");
                destination.className = "search-suggestion-destination";
                destination.textContent = page.path.replace(".html", "");

                option.append(title, destination);
                option.addEventListener("click", () => navigateTo(page));
                suggestions.append(option);
            });
        }

        suggestions.hidden = false;
        input.setAttribute("aria-expanded", "true");
    }

    function setActiveSuggestion(index) {
        if (!results.length) {
            return;
        }

        activeIndex = (index + results.length) % results.length;
        suggestions.querySelectorAll('[role="option"]').forEach((option, optionIndex) => {
            const isActive = optionIndex === activeIndex;
            option.setAttribute("aria-selected", String(isActive));
            if (isActive) {
                input.setAttribute("aria-activedescendant", option.id);
            }
        });
    }

    input.addEventListener("input", renderSuggestions);

    input.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown" && results.length) {
            event.preventDefault();
            setActiveSuggestion(activeIndex + 1);
        } else if (event.key === "ArrowUp" && results.length) {
            event.preventDefault();
            setActiveSuggestion(activeIndex < 0 ? results.length - 1 : activeIndex - 1);
        } else if (event.key === "Escape") {
            closeSuggestions();
        } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            navigateTo(results[activeIndex]);
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const [bestMatch] = findSearchResults(input.value);
        if (bestMatch) {
            navigateTo(bestMatch);
        } else {
            renderSuggestions();
            input.focus();
        }
    });

    document.addEventListener("click", (event) => {
        if (!form.contains(event.target)) {
            closeSuggestions();
        }
    });
});
