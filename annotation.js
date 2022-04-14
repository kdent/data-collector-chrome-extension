"use strict";

const POPUP_ID = "annotation-popup";
const LABEL_CONFIG_PATH = 'config/labels.json';
let annotationsOptions;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.messageType === "show-annotation-screen") {
        console.log("show annotation screen request received");
        displayAnnotateScreen(sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

function displayAnnotateScreen(sendResponse) {
    var annotationDiv, save_button, cancel_button;

    /*
     * Set up the annotation popup window if it hasn't been invoked
     * already.
     */
    annotationDiv = document.getElementById(POPUP_ID);
    if (! annotationDiv ) {
        annotationDiv = initializeAnnotationScreen();
    }

    console.log("displaying annotation screen");
    annotationDiv.style.visibility = "visible";

}

function initializeAnnotationScreen() {
    var annotationDiv;

    /* Set up screen */
    annotationDiv = document.createElement("div");
    annotationDiv.id = POPUP_ID;
    annotationDiv.innerHTML = annotation_screen_html;
    document.body.appendChild(annotationDiv);

    document.addEventListener("keyup", function(evt) {
        keyPressHandler(evt, annotationDiv);
    });

    document.addEventListener("click", function(evt) {
        mouseClickHandler(evt, annotationDiv);
    });

    document.getElementById('checkstep-button-save').addEventListener("click", saveAnnotation);
    document.getElementById('checkstep-button-cancel').addEventListener("click", cancelAnnotation);

    /* Read annotation label info. */
    chrome.storage.sync.get('labels', (options) => {
        console.log(options.labels);
        annotationsOptions = JSON.parse(options.labels);
        writeHTMLForCategories(annotationsOptions);
    });

    return annotationDiv;
}

function writeHTMLForCategories(annotationOptions) {
    var categorySelectHTML, subCategoryHTML;

    categorySelectHTML = "<option></option>";
    subCategoryHTML = "<ul>";
    annotationsOptions.forEach((obj) => {

        categorySelectHTML += '<option>' + obj['category'] + '</option>';

        if (obj['category'] === "Hate") {
            obj['sub-categories'].forEach((subcat) => {
                let elementId = subcat.toLowerCase().replace(" ", "-");
                subCategoryHTML += '<div class="sub-category">';
                subCategoryHTML += '<input type="checkbox" id="' + elementId + '">';
                subCategoryHTML += '<label for="' + elementId + '">';
                subCategoryHTML += ' ' + subcat + '</label>';
                subCategoryHTML += '</div>';
            });
        }
    });
    subCategoryHTML += "</ul>";

    document.getElementById('category-select').innerHTML = categorySelectHTML;
    document.getElementById('subcategory-list').innerHTML = subCategoryHTML;
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
        <option></option>
        <option>Hate</option>
        <option>Adult/explicit</option>
        <option>Bullying</option>
        <option>CSAM</option>
        <option>Terrorism</option>
    </select>
  </div>
</div>  

<div class="field-row">
  <div class="label-container"><label>Sub-category:</label></div>
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
