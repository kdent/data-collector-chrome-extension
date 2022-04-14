/*
 * UI messaging functions.
 */
"use strict";


function displayNotification(msg) {
    var div, text_span;
    /* Create the element to display the message. */
    div = document.createElement("div");
    div.id = "popup";
    div.className = "show";
    text_span = document.createElement("span");

    div.appendChild(text_span);

    document.body.appendChild(div);

    text_span.textContent = msg;

    setTimeout( function(){
        div.className = div.className.replace("show", "");
        div.remove();
    }, 3000);

    return true;

}

function displayAlert(msg) {
    var errorDiv, textDiv, okayButton;

    errorDiv = document.createElement("div");
    errorDiv.id = "alert";
    textDiv = document.createElement("div");
    okayButton = document.createElement("button");
    okayButton.className = "alert-button";
    okayButton.innerHTML = "Ok";
    okayButton.onclick = function () {
        errorDiv.remove();
    };
    errorDiv.appendChild(textDiv);
    errorDiv.appendChild(okayButton);

    document.body.appendChild(errorDiv);
    textDiv.textContent = msg;

    return true;
}

function clearAlert() {
    var errorDiv;
    errorDiv = document.getElementById("alert");
    errorDiv.className.replace("show", "");
    errorDiv.remove();
    return true;
}


/*
 * Message listener.
 */
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

    if (request.messageType === "notification") {
        displayNotification(request.messageText, sendResponse);
        sendReponse(true);
    } else if (request.messageType === "alert") {
        displayAlert(request.messageText, sendResponse);
        sendResponse(true);
    } else {
        sendResponse(false);
    }

});

