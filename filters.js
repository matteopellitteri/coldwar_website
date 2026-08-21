function getFilterValue(id) {
    var input = document.getElementById(id);
    return input ? input.value.trim().toUpperCase() : "";
}

function getCardText(card) {
    var title = card.querySelector("h3");
    var paragraphs = card.querySelectorAll("p");
    var linkTitle = card.querySelector("a");

    var titleText = title ? (title.textContent || title.innerText) : "";
    var paragraphText = Array.from(paragraphs).map(function (paragraph) {
        return paragraph.textContent || paragraph.innerText || "";
    }).join(" ");
    var linkText = linkTitle ? (linkTitle.getAttribute("title") || "") : "";

    return (titleText + " " + paragraphText + " " + linkText).toUpperCase();
}

function myFunction() {
    var nameFilter = getFilterValue("name");
    var authorFilter = getFilterValue("author");
    var yearFilter = getFilterValue("year");
    var placeFilter = getFilterValue("place");
    var cards = document.querySelectorAll("#myCards .card");

    cards.forEach(function (card) {
        var text = getCardText(card);
        var matchesName = !nameFilter || text.indexOf(nameFilter) > -1;
        var matchesAuthor = !authorFilter || text.indexOf(authorFilter) > -1;
        var matchesYear = !yearFilter || text.indexOf(yearFilter) > -1;
        var matchesPlace = !placeFilter || text.indexOf(placeFilter) > -1;

        card.style.display = (matchesName && matchesAuthor && matchesYear && matchesPlace) ? "" : "none";
    });
}

function myFunctionName() {
    myFunction();
}

function myFunctionAuthor() {
    myFunction();
}

function myFunctionYear() {
    myFunction();
}

function myFunctionPlace() {
    myFunction();
}