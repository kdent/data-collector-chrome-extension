/*
 * UI messaging functions.
 */


function displayNotification(msg) {
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

}

function displayAlert(msg) {
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
}

function clearAlert() {
    errorDiv = document.getElementById("alert");
    errorDiv.className.replace("show", "");
    errorDiv.remove();
}


/*
 * Message listener.
 */
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {

    console.log("message: " + request.messageText);
    if (request.messageType === "notification") {
        displayNotification(request.messageText);
    } else if (request.messageType === "alert") {
        displayAlert(request.messageText);
    }

});

