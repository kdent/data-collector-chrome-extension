"use strict";

const POPUP_ID = "annotation-popup";
const LABEL_CONFIG_PATH = 'config/labels.json';
let annotationOptions = undefined;
let currentCategory = undefined;
let annotationHTML = undefined;

/*
 * Receive message to start annotating currently selected text.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.messageType === "show-annotation-screen") {
        console.log("show annotation screen request received");
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
            console.log(options.labels);
            annotationOptions = JSON.parse(options.labels);
            if (! annotationOptions ) {
                throw "Annotation config is empty";
            }
        });
    }

    /*
     * Set up the annotation popup window if it hasn't been invoked
     * already.
     */
    annotationDiv = document.getElementById(POPUP_ID);
    if (! annotationDiv ) {
        annotationURL = chrome.runtime.getURL("annotation.html");
        fetch(annotationURL).then(function(response) {
            return response.text();
        }).then(function(html) {
            annotationHTML = html;
            console.log("initializing and displaying annotation screen");
            annotationDiv = initializeAnnotationScreen();
            displaySelectedText(selectedText);
            displayCategories(annotationOptions);
            annotationDiv.style.visibility = "visible";
            positionAnnotationBox();
        });
    } else {
        console.log("displaying annotation screen");
        displaySelectedText(selectedText);
        displayCategories(annotationOptions);
        annotationDiv.style.visibility = "visible";
        positionAnnotationBox();
    }

}

function initializeAnnotationScreen() {
    var annotationDiv;

    /* Set up screen */
    annotationDiv = document.createElement("div");
    annotationDiv.id = POPUP_ID;
    annotationDiv.innerHTML = annotationHTML;
    document.body.appendChild(annotationDiv);

    document.addEventListener("keyup", function(evt) {
        keyPressHandler(evt, annotationDiv);
    });

    document.addEventListener("click", function(evt) {
        mouseClickHandler(evt, annotationDiv);
    });

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

    /*
     * Sub-category checkboxes.
     */
    if (currentCategory) {
        displaySubcategoryCheckboxes(currentCategory);
        displaySecondaryLabelCheckboxes(currentCategory);
    }
 
    document.getElementById('category-select').innerHTML = categorySelectHTML;
}

function keyPressHandler(evt, popupScreen) {
    var comments;

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
        let elementId = subcat.toLowerCase().replace(" ", "-");
        subCategoryHTML += '<div class="sub-category">';
        subCategoryHTML += '<input type="checkbox" id="' + elementId + '">';
        subCategoryHTML += '<label for="' + elementId + '">';
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

    secondaryLabelsElement = document.getElementById('secondary-labels-list');

    secondaryLabelsList = annotationOptions[currentCategory]["secondary-labels"];
    if (! secondaryLabelsList || secondaryLabelsList.length == 0) {
        secondaryLabelsElement.innerHTML = "";
        return;
    }

    secondaryLabelsHTML = "";
    secondaryLabelsList.forEach((label) => {
        let labelId = label.toLowerCase().replace(" ", "-");
        secondaryLabelsHTML += '<input type="checkbox" id="' + labelId + '">';
        secondaryLabelsHTML += '<label for="' + labelId + '">';
        secondaryLabelsHTML += ' ' + label + '</label>';
    });
    secondaryLabelsElement.innerHTML = secondaryLabelsHTML;

}

function positionAnnotationBox() {
    var annotationBox, posX, posY;

    annotationBox = document.getElementById(POPUP_ID);
    posY = Math.round(window.innerHeight/2 - annotationBox.offsetHeight/2);
    posX = Math.round(window.innerWidth/2 - annotationBox.offsetWidth/2);
    posY = posY + window.scrollY;
    posX = posX + window.scrollX;
    annotationBox.style.left = posX + "px";
    annotationBox.style.top = posY + "px";
    
}

function mouseClickHandler(evt, popupScreen) {
    var comments, isClickInWindow;

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
        evt.stopPropagation();  // TODO: this doesn't seem to work as expected
    }
}

function saveAnnotation(evt) {
    displayAlert("Record will be saved when implemented", () => {});
    console.log("saving data example");
}

function cancelAnnotation(evt) {
    var annotationDiv;

    annotationDiv = document.getElementById(POPUP_ID);
    annotationDiv.style.visibility = "hidden";
    console.log("canceling annotation");
}

