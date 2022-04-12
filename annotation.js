"use strict";

const POPUP_ID = "annotation-popup";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.messageType === "show-annotation-screen") {
        displayAnnotateScreen(sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

function displayAnnotateScreen(sendResponse) {
    var annotation_div, save_button, cancel_button;

    annotation_div = document.getElementById(POPUP_ID);
    if (! annotation_div ) {
        annotation_div = document.createElement("div");
        annotation_div.id = POPUP_ID;
        annotation_div.innerHTML = annotation_screen_html;

        document.addEventListener("keyup", function(evt) {

            if (annotation_div.style.visibility !== "visible") {
                return;
            }

            if (evt.key === "Escape") {
                cancelAnnotation(evt);
            } else if (evt.key === "Enter") {
                saveAnnotation(evt);
            }
        });
    }
    annotation_div.style.visibility = "visible";

    document.body.appendChild(annotation_div);
    save_button = document.getElementById('button-save');
    cancel_button = document.getElementById('button-cancel');
    save_button.addEventListener("click", saveAnnotation);
    cancel_button.addEventListener("click", cancelAnnotation);

}

function saveAnnotation(evt) {
    displayAlert("Record will be saved when implemented", () => {});
}

function cancelAnnotation(evt) {
    var annotation_div;

    annotation_div = document.getElementById(POPUP_ID);
    annotation_div.style.visibility = "hidden";
//    annotation_div.style.display = "none";
}

let annotation_screen_html = `
<form class="annotate-form">
 
<div class="field-row">
  <div class="label-container"><label>Category:</label></div>
  <div class="field-container">
    <select>
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


    <div class="sub-category">
      <input type="checkbox" id="violent-speech">
      <label for="violent-speech">Violent speech</label>
    </div>

    <div class="sub-category">
      <input type="checkbox" id="dehumanizing-comparisons">
      <label for="dehumanizing-comparisons">Dehumanizing comparisons</label>
    </div>

    <div class="sub-category">
      <input type="checkbox" id="negative-generalization">
      <label for="negative-generalization">Negative generalization</label>
    </div>

    <div class="sub-category">
      <input type="checkbox" id="exclude-segregate-curse">
      <label for="exclude-segregate-curse">Exclude, segregate, curse</label>
    </div>

    <div class="sub-category">
      <input type="checkbox" id="slur">
      <label for="slur">Slur</label>
    </div>


  </div>
</div>

<div class="field-row">
  <div class="label-container"><label>Comment:</label></div>
  <div class="field-container">
    <textarea id="comments" rows="4" cols="60"></textarea>
  </div>
</div>

<div class="field-row">
  <div class="label-container">&nbsp;</div>
  <div class="field-container">
    <button type="button" id="button-save">Save</button>
    <button type="button" id="button-cancel">Cancel</button>
  </div>
</div>


</form>
`
