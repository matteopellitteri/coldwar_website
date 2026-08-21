function getCardFieldText(card, fieldName) {
    const fieldMap = {
        name: 'h3',
        author: '.card_info p:nth-of-type(1)',
        year: '.card_info p:nth-of-type(2)',
        place: '.card_info p:nth-of-type(3)'
    };

    const selector = fieldMap[fieldName] || fieldMap.name;
    const element = card.querySelector(selector);

    return element ? element.textContent.trim().toLowerCase() : '';
}

function applyCardFilters() {
    const cards = document.querySelectorAll('#myCards .card');
    if (!cards.length) {
        return;
    }

    const filters = {
        name: (document.getElementById('myName')?.value || '').trim().toLowerCase(),
        author: (document.getElementById('myAuthor')?.value || '').trim().toLowerCase(),
        year: (document.getElementById('myYear')?.value || '').trim().toLowerCase(),
        place: (document.getElementById('myPlace')?.value || '').trim().toLowerCase()
    };

    cards.forEach((card) => {
        const nameText = getCardFieldText(card, 'name');
        const authorText = getCardFieldText(card, 'author');
        const yearText = getCardFieldText(card, 'year');
        const placeText = getCardFieldText(card, 'place');

        const matches =
            (!filters.name || nameText.includes(filters.name)) &&
            (!filters.author || authorText.includes(filters.author)) &&
            (!filters.year || yearText.includes(filters.year)) &&
            (!filters.place || placeText.includes(filters.place));

        card.style.display = matches ? '' : 'none';
    });
}

function myFunctionName() {
    applyCardFilters();
}

function myFunctionAuthor() {
    applyCardFilters();
}

function myFunctionYear() {
    applyCardFilters();
}

function myFunctionPlace() {
    applyCardFilters();
}
