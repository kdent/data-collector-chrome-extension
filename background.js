/*
 * Checkstep Data Collector
 */
"use strict";

const LABEL_CONFIG_PATH = 'config/labels.json';
const ANNOTATION_HTML_PATH = "annotation.html";

/*
 * Events and actions at installation.
 */
chrome.runtime.onInstalled.addListener(handleOnInstalled);

/*
 * Handler for onInstalled event.
 */
function handleOnInstalled() {
    var labelConfigUrl, annotationHTMLUrl;

    /* Add self to context menu. */
    chrome.contextMenus.create({
      "title": "Collect text example",
      "id": "checkstep-text-grabber-menu",
      "contexts": ["selection"],
    });

    /* Read initial label configuration from JSON file and store it. */
    labelConfigUrl = chrome.runtime.getURL(LABEL_CONFIG_PATH);
    fetch(labelConfigUrl)
        .then((response) => response.json())
        .then((json) => storeLabelConfig(json));

    /* Get the HTML for display annotation screen. Store it for content scripts to use. */
    annotationHTMLUrl = chrome.runtime.getURL(ANNOTATION_HTML_PATH);
    fetch(annotationHTMLUrl)
        .then((response) => storeAnnotationHTML(response));
}

function storeLabelConfig(labelConfigJson) {
    var str = JSON.stringify(labelConfigJson);
    chrome.storage.sync.set({'labels': JSON.stringify(labelConfigJson)},
      function() {
        console.log("storing annotations label information: " + JSON.stringify(labelConfigJson));
      }
    );
}

function storeAnnotationHTML(htmlContents) {
    chrome.storage.sync.set({'html': htmlContents},
      function() {
        console.log("storing HTML for annotations screen");
        console.log(htmlContents);
      }
    );
}


/*
 * Events and actions at startup time.
 */

// Add handler for when extension is invoked from the context menu.
chrome.contextMenus.onClicked.addListener(annotateRequestHandler);

// Get token needed for access to Google docs.
chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
    console.log("got token: " + token);
    spreadsheet.token = token;
});

/* As we are loaded, get configuration information. */
loadConfigFromLocalStore();

/*
 * The options script will send a message when config options are changed.
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.messageType === "options-update") {
        console.log("request to update options received");
        loadConfigFromLocalStore();
    } else if (request.messageType === "save-annotation") {
        console.log("time to save the annotation");
    }
  }
);


/*
 * Data objects.
 */

let curClassLabel = null;

function DataSample() {
    this.sourceCategory = 'External';
    this.dataType = 'Observed';
    this.content = '';
    this.hate = '';
    this.hateViolentSpeech = '';
    this.hateDehumanizingComparisions = '';
    this.hateNegativeGeneralisation = '';
    this.hateExcludeSegregateCurse = ''; 
    this.hateSlurs = '';
    this.bullying = '';
    this.commentCheckstep = '';
    this.checkedByHopin = '';
    this.useForExample = '';
    this.hopinVerificationDate = '';
    this.commentHopin = '';
    this.link = '';
    this.originalSource = '';
    this.dateCollected = '';
}

let spreadsheet = {
    id: null,
    range: null,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    token: "",

    writeRow: function(data, tab) {
        var range;

        if ( ! spreadsheet.id) {
            let msg = {
                messageType: "alert",
                messageText: "You must specify a spreadsheet ID in options before saving data."
            };
            chrome.tabs.sendMessage(tab.id, msg);
            console.log("spreadsheet ID is null.");
            return false;
        }
        if ( ! spreadsheet.range) {
            msg = {
                messageType: "alert",
                messageText: "You must specify a sheet name in options before saving data."
            };
            chrome.tabs.sendMessage(tab.id, msg);
            console.log("sheet name is null.");
            return false;
        }

        range = "" + spreadsheet.range + "!A1:G1";

        var valueRangeBody = {
            "range": range,
            "majorDimension": "ROWS",
            "values": [ Object.values(data) ]
        };

        console.log("passing array: " + Object.values(data));

        let init = {
            method: 'POST',
            headers: {
            Authorization: 'Bearer ' + spreadsheet.token, 'Content-Type': 'application/json'
            },
            body: JSON.stringify(valueRangeBody)
        };

        let url = "https://sheets.googleapis.com/v4/spreadsheets/" + spreadsheet.id + "/values/" + range + ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

        fetch(url, init)
          .then((response) => response.json())
          .then(function(respData) {
            console.log(respData);
            if (respData.error) {
                let msg = {
                    messageType: "alert",
                    messageText: "Error saving data: "
                };
                if (respData.error.message.startsWith("Requested entity was not found")) {
                    msg.messageText += "unknown spreadsheet ID.";
                } else if (respData.error.message.startsWith("Unable to parse range")) {
                    msg.messageText += "unknown sheet name.";
                } else {
                    msg.messageText += respData.error.message;
                }
                chrome.tabs.sendMessage(tab.id, msg);
            } else {
                let msg = {
                    messageType: "notification",
                    messageText: "Data saved to Google Sheet."
                };
                chrome.tabs.sendMessage(tab.id, msg);
            }
          });

    }
}

function loadConfigFromLocalStore() {
    chrome.storage.local.get("spreadsheetId", ({ spreadsheetId }) => {
        console.log("current spreadsheet id val: " + spreadsheetId);
        spreadsheet.id = spreadsheetId;
    });
    chrome.storage.local.get("sheetName", ({ sheetName }) => {
        console.log("current sheet name: " + sheetName);
        spreadsheet.range = sheetName;
    });
    chrome.storage.local.get("classLabel", ({ classLabel }) => {
        curClassLabel = classLabel;
    });
}

/*
 * Handler for when a user has selected the menu item to collect a data
 * example and annotate it.
 */
function annotateRequestHandler(clickData, tab) {
    var curExample;

    console.log("received request to annotate data example");
    curExample = new DataSample();
    curExample.content = clickData.selectionText;
    curExample.originalSource = tab.url;
    curExample.dateCollected = new Date(Date.now()).toUTCString();
    curExample.hate = true;

    chrome.tabs.sendMessage(tab.id,
        {
         messageType: "show-annotation-screen",
         selectedText: clickData.selectionText
        },
        function(response) { 
//        spreadsheet.writeRow(curExample, tab);
            console.log("sending annotate request to content script");
            if ( response === true ) {
                console.log("now imma write thate dude");
            }
        }
    );

}

