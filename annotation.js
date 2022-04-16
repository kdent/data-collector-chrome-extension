"use strict";

const POPUP_ID = "annotation-popup";
const LABEL_CONFIG_PATH = 'config/labels.json';
let annotationsOptions = undefined;
let currentCategory = undefined;
let annotationHTML = undefined;

/*
 * Receive message to start annotating currently selected text.
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.messageType === "show-annotation-screen") {
        console.log("show annotation screen request received");
        displayAnnotateScreen(sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

/*
 * Display the popup box for annotating selected text.
 */
function displayAnnotateScreen(sendResponse) {
    var annotationURL, annotationDiv, save_button, cancel_button;

    /*
     * Load annotation config if it's not already available.
     */
    if (! annotationsOptions ) {
        chrome.storage.sync.get('labels', (options) => {
            console.log(options.labels);
            annotationsOptions = JSON.parse(options.labels);
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
            console.log("displaying annotation screen");
            annotationDiv = initializeAnnotationScreen();
            drawCategories(annotationsOptions);
            annotationDiv.style.visibility = "visible";
        });
    } else {
        console.log("displaying annotation screen");
        annotationDiv.style.visibility = "visible";
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

function drawCategories(annotationsOptions) {
    var categoryList, categorySelectHTML, subCategoryHTML;

    categoryList = Object.keys(annotationsOptions).sort();

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
        drawSubcategoryCheckboxes(currentCategory);
    }
 
    document.getElementById('category-select').innerHTML = categorySelectHTML;
}

function keyPressHandler(evt, popupScreen) {
    if (popupScreen.style.visibility !== "visible") {
        return;
    }

    if (evt.key === "Escape") {
        cancelAnnotation(evt);
    } else if (evt.key === "Enter") {
        saveAnnotation(evt);
    }
}

function categorySelectionHandler(evt) {
    var categorySelectList;

    categorySelectList = document.getElementById('category-select');
    currentCategory = categorySelectList.options[categorySelectList.selectedIndex].text;
    drawSubcategoryCheckboxes(currentCategory);
}

function drawSubcategoryCheckboxes(currentCategory) {
    var subCategoryHTML;

    if (! currentCategory ) {
        return;
    }

    subCategoryHTML = "<ul>";
    annotationsOptions[currentCategory]['sub-categories'].forEach((subcat) => {
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

function mouseClickHandler(evt, popupScreen) {
    var isClickInWindow;

    if (popupScreen.style.visibility !== "visible") {
        return;
    }

    isClickInWindow = popupScreen.contains(evt.target);
    if (! isClickInWindow) {
        cancelAnnotation(evt);
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

let annotation_screen_html = `
<form class="annotate-form">
 
<div class="field-row">
  <div class="label-container"><label>Category:</label></div>
  <div class="field-container">
    <select id="category-select">
        <!-- to be filled in dynamically -->
    </select>
  </div>
</div>  

<div class="field-row">
  <div class="label-container"><label>Sub-categories:</label></div>
  <div class="field-container">

  <div id="subcategory-list">
  </div>

  </div>
</div>

<div class="field-row">
  <div class="label-container"><label>Comment:</label></div>
  <div class="field-container">
    <textarea class="checkstep-textarea" id="checkstep-comments" rows="4" cols="60"></textarea>
  </div>
</div>

<div class="field-row">
  <div class="label-container">&nbsp;</div>
  <div class="field-container">
    <button class="checkstep-button" type="button" id="checkstep-button-save">Save</button>
    <button class="checkstep-button" type="button" id="checkstep-button-cancel">Cancel</button>
  </div>
</div>


</form>
`
