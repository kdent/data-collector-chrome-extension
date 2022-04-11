
let html = `
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
    <button id="button-save">Save</button>
    <button id="button-cancel">Cancel</button>
  </div>
</div>


</form>
`

function displayAnnotateScreen(sendResponse) {

    div = document.createElement("div");
    div.id = "annotation-popup";
    div.className = "show";
    div.innerHTML = html;

    document.body.appendChild(div);

}


chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

    if (request.messageType === "annotate") {
        displayAnnotateScreen(sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

