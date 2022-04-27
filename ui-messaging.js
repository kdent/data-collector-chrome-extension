/*
 * UI messaging functions.
 */
"use strict";

function displayNotification(msg) {
    var div, text_span, zIndex;

    /* Create the element to display the message. */
    div = document.createElement("div");
    div.id = "popup";
    div.className = "show";
    text_span = document.createElement("span");
    zIndex = utils.getHighestZValue();
    text_span.style.zIndex = zIndex + 1;

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
    var alertDiv, textDiv, okayButton, zIndex;

    alertDiv = document.createElement("div");
    alertDiv.id = "alert";
    textDiv = document.createElement("div");
    okayButton = document.createElement("button");
    okayButton.className = "alert-button";
    okayButton.innerHTML = "Ok";
    okayButton.onclick = function () {
        alertDiv.remove();
    };
    okayButton.focus();
    alertDiv.appendChild(textDiv);
    alertDiv.appendChild(okayButton);
    zIndex = utils.getHighestZValue();
    alertDiv.style.zIndex = zIndex + 1;
    console.log("z-order: " + (zIndex + 1));

    document.addEventListener("keyup", alertMsgKeyPressHandler);

    document.body.appendChild(alertDiv);
    textDiv.textContent = msg;

    return true;
}

function clearAlert() {
    var alertDiv;

    document.removeEventListener("keyup", alertMsgKeyPressHandler);
    alertDiv = document.getElementById("alert");
    alertDiv.remove();
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

function alertMsgKeyPressHandler(evt) {
    if (evt.key === "Enter") {
        evt.stopImmediatePropagation();
        clearAlert();
    }
}
