"use strict";

const POPUP_ID = "annotation-popup";
const BACKGROUND_ID = "annotation-background";
const LABEL_CONFIG_PATH = 'config/labels.json';
let annotationOptions = undefined;
let currentCategory = undefined;
let annotationHTML = undefined;

let annotation = {
    "selected-text": "",
    "class-label":  "",
    "non-violating": false,
    "subcategories": [],
    "checkstep-comments": "",
    "secondary-labels": [],
    "source-url": "",
    "collected-date": ""
};

/*
 * Listener to receive message to start annotating currently selected text.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.messageType === "show-annotation-screen") {
        console.log("show annotation screen request received");
        // TODO: add code here to handle getting Twitter posts that include emojis.
        document.getSelection().getRangeAt(0).cloneContents().childNodes.forEach((node, nbr) => {
            console.log("node: " + node);
        });
        displayAnnotateScreen(request.selectedText, sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

/*
 * Display the popup box for annotating selected text.
 */
function displayAnnotateScreen(selectedText, clientX, clientY, sendResponse) {
    var annotationURL, annotationDiv, save_button, cancel_button;

    /*
     * Load annotation config if it's not already available.
     */
    if (! annotationOptions ) {
        chrome.storage.sync.get('labels', (options) => {
            annotationOptions = JSON.parse(options.labels);
            if (! annotationOptions ) {
                throw "Annotation config is empty";
            }
            /* Initialize the annotation popup window. */
            annotationDiv = document.getElementById(POPUP_ID);
            annotationURL = chrome.runtime.getURL("annotation.html");
            fetch(annotationURL).then((response) => {
                return response.text();
            }).then(function(html) {
                annotationHTML = html;
                console.log("initializing annotation screen");
                annotationDiv = createAnnotationScreen();
                displayAnnotationScreen(annotationDiv, selectedText);
            });
        });
    } else {
        console.log("displaying annotation screen");
        annotationDiv = document.getElementById(POPUP_ID);
        displayAnnotationScreen(annotationDiv, selectedText);
    }
}

function displayAnnotationScreen(annotationDiv, selectedText) {
    var backgroundElement, maxZValue;

    maxZValue = utils.getHighestZValue();
    backgroundElement = document.getElementById(BACKGROUND_ID);
    backgroundElement.style.display = "block";
    backgroundElement.style.zIndex = maxZValue + 1;

    displaySelectedText(selectedText);
    displayCategories(annotationOptions);
    document.getElementById("checkstep-comments").value = "";
    document.getElementById("non-violating-checkbox").checked = false;
    document.addEventListener("keyup", keyPressHandler);
    document.addEventListener("click", mouseClickHandler);
    annotationDiv.style.visibility = "visible";
    annotationDiv.style.zIndex = maxZValue + 2;
    positionAnnotationBox();
}

function createAnnotationScreen() {
    var annotationDiv, backgroundElement;

    /* Create background */
    backgroundElement = document.createElement("div");
    backgroundElement.id = BACKGROUND_ID;
    document.body.appendChild(backgroundElement);

    /* Set up screen */
    annotationDiv = document.createElement("div");
    annotationDiv.id = POPUP_ID;
    annotationDiv.innerHTML = annotationHTML;
    document.body.appendChild(annotationDiv);

    document.getElementById('category-select').addEventListener("change", categorySelectionHandler);
    document.getElementById('checkstep-button-save').addEventListener("click", saveAnnotation);
    document.getElementById('checkstep-button-cancel').addEventListener("click", cancelAnnotation);

    return annotationDiv;
}

function displaySelectedText(selectedText) {
    var textElement;

    textElement = document.getElementById("checkstep-selected-text");
    textElement.innerHTML = selectedText;
}

function displayCategories(annotationOptions) {
    var categoryList, categorySelectHTML, subCategoryHTML;

    categoryList = Object.keys(annotationOptions).sort();

    /*
     * Top-level category selection.
     */
    categorySelectHTML = "";
    categoryList.forEach( (item) => {
        if (item === currentCategory) {
            categorySelectHTML += '<option selected>' + item + '</option>';
        } else {
            categorySelectHTML += '<option>' + item + '</option>';
        }
    });

    /* If the currentCategory isn't set, use the first name in the list. */
    if (! currentCategory) {
        currentCategory = categoryList[0];
    }

    /*
     * Sub-category checkboxes.
     */
    displaySubcategoryCheckboxes(currentCategory);
    displaySecondaryLabelCheckboxes(currentCategory);
 
    document.getElementById('category-select').innerHTML = categorySelectHTML;
}

function keyPressHandler(evt) {
    var comments, popupScreen;

    popupScreen = document.getElementById(POPUP_ID);

    if (popupScreen.style.visibility !== "visible") {
        return;
    }

    if (evt.key === "Escape") {
        cancelAnnotation(evt);
    } else if (evt.key === "Enter") {
        comments = document.getElementById("checkstep-comments");
        if (comments.contains(evt.target)) {
            return;
        }
        saveAnnotation(evt);
    }
}

function categorySelectionHandler(evt) {
    var categorySelectList;

    categorySelectList = document.getElementById('category-select');
    currentCategory = categorySelectList.options[categorySelectList.selectedIndex].text;
    displaySubcategoryCheckboxes(currentCategory);
    displaySecondaryLabelCheckboxes(currentCategory);
}

function displaySubcategoryCheckboxes(currentCategory) {
    var subCategoryHTML;

    if (! currentCategory ) {
        return;
    }

    subCategoryHTML = "<ul>";
    annotationOptions[currentCategory]['sub-categories'].forEach((subcat) => {
        subCategoryHTML += '<div class="sub-category">';
        subCategoryHTML += '<input type="checkbox" id="' + subcat + '"' +
            ' class="checkstep-checkbox">';
        subCategoryHTML += '<label for="' + subcat + '">';
        subCategoryHTML += ' ' + subcat + '</label>';
        subCategoryHTML += '</div>';
    });
    subCategoryHTML += "</ul>";
    document.getElementById('subcategory-list').innerHTML = subCategoryHTML;
}

function displaySecondaryLabelCheckboxes(currentCategory) {
    var secondaryLabelsHTML, secondaryLabelsList, secondaryLabelsElement;

    if (! currentCategory) {
        return;
    }

    secondaryLabelsElement = document.getElementById('secondary-labels');

    secondaryLabelsList = annotationOptions[currentCategory]["secondary-labels"];
    if (! secondaryLabelsList || secondaryLabelsList.length == 0) {
        secondaryLabelsElement.innerHTML = "";
        return;
    }

    secondaryLabelsHTML = "";
    secondaryLabelsList.forEach((label) => {
        secondaryLabelsHTML += '<input type="checkbox" id="' + label + '"' +
            ' class="checkstep-checkbox">';
        secondaryLabelsHTML += '<label for="' + label + '">';
        secondaryLabelsHTML += ' ' + label + '</label>';
    });
    secondaryLabelsElement.innerHTML = secondaryLabelsHTML;

}

function positionAnnotationBox() {
    var annotationBox, halfWidth, halfHeight, midPointWidth, midPointHeight;

    annotationBox = document.getElementById(POPUP_ID);

    halfWidth = parseInt(annotationBox.offsetWidth/2);
    midPointWidth = parseInt(window.innerWidth/2);
    annotationBox.style.left = (midPointWidth - halfWidth) + "px";

    halfHeight = parseInt(annotationBox.offsetHeight/2);
    midPointHeight = parseInt(window.innerHeight/2);
    annotationBox.style.top = (midPointHeight - halfHeight) + "px";

}

function mouseClickHandler(evt) {
    var comments, popupScreen, isClickInWindow;

    popupScreen = document.getElementById(POPUP_ID);

    if (popupScreen.style.visibility !== "visible") {
        return;
    }

    /* If in the comments textarea let the mouse click pass through. */
    comments = document.getElementById("checkstep-comments");
    if (comments.contains(evt.target)) {
        return;
    }

    isClickInWindow = popupScreen.contains(evt.target);
    if (! isClickInWindow) {
        cancelAnnotation(evt);
    }
}

function saveAnnotation(evt) {
    var subcatList, secondaryLabelsList, msg;

    clearAnnotationScreen();

    annotation["selected-text"] = document.getElementById("checkstep-selected-text").textContent;
    annotation["class-label"] = document.getElementById("category-select").selectedOptions[0].label;

    annotation["non-violating"] = document.getElementById("non-violating-checkbox").checked;

    annotation["subcategories"] = [];
    subcatList = document.querySelectorAll("div.sub-category input[type=\"checkbox\"]");
    for (let i = 0; i < subcatList.length; i++) {
        if (subcatList[i].checked) {
            annotation["subcategories"].push(subcatList[i].id);
        }
    }

    annotation["checkstep-comments"] = document.getElementById("checkstep-comments").value;

    annotation["secondary-labels"] = [];
    secondaryLabelsList = document.querySelectorAll("div#secondary-labels input[type=\"checkbox\"]");
    for (let i = 0; i < secondaryLabelsList.length; i++) {
        if (secondaryLabelsList[i].checked) {
            annotation["secondary-labels"].push(secondaryLabelsList[i].id);
        }
    }

    annotation["source-url"] = window.location.toString();
    annotation["collected-date"] = new Date(Date.now()).toUTCString();

    msg = {
        messageType: "save-annotation",
    };
    msg.annotation = annotation;
    chrome.runtime.sendMessage(msg);

    console.log("saving data example");
}

function cancelAnnotation(evt) {
    console.log("canceling annotation");
    clearAnnotationScreen();
}

function clearAnnotationScreen() {
    var annotationDiv, annotationBackground;

    annotationBackground = document.getElementById(BACKGROUND_ID);
    annotationBackground.style.display = "none";

    document.removeEventListener("keyup", keyPressHandler);
    document.removeEventListener("click", mouseClickHandler);
    annotationDiv = document.getElementById(POPUP_ID);
    annotationDiv.style.visibility = "hidden";
}


