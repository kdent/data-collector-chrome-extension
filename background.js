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

/*
 * The options script will send a message when config options are changed.
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

    if (request.messageType === "options-update") {
        console.log("request to update options received");
    } else if (request.messageType === "save-annotation") {
        saveAnnotation(sender.tab, request.annotation);
    }

    return true;
  }
);

function saveAnnotation(tab, annotation) {
    var labelOptions, categoryInfo, spreadsheetRow;

    /* Load label configuration */
    chrome.storage.sync.get("labels", (options) => {
        labelOptions = JSON.parse(options.labels);
        categoryInfo = labelOptions[annotation["class-label"]];
        spreadsheetRow = mapAnnotationToRow(categoryInfo, annotation);
        spreadsheet.id = categoryInfo["spreadsheet-id"];
        spreadsheet.range = categoryInfo["sheet-name"];
        spreadsheet.writeRow(spreadsheetRow, tab);

    });

}

function mapAnnotationToRow(categoryInfo, annotation) {
    var row;

    row = [];
    row.push("External");       // Source Category
    row.push("Observed");       // Data Type
    row.push(annotation["selected-text"]);
    row.push("FALSE");          // non-violating but review required

    /* For each subcateogry mark it true or false according to annotaiton. */
    categoryInfo["sub-categories"].forEach((subcat) => {
        if (annotation.subcategories.includes(subcat)) {
            row.push("TRUE");
        } else {
            row.push("FALSE");
        }
    });

    /* For each secondary label mark true or false according to annotaiton. */
    categoryInfo["secondary-labels"].forEach((secondary) => {
        if (annotation["secondary-labels"].includes(secondary)) {
            row.push("TRUE");
        } else {
            row.push("FALSE");
        }
    });

    row.push(annotation["checkstep-comments"]);
    row.push("");               // empty cell for customer comments. //
    row.push(annotation["source-url"]);
    row.push(annotation["page-title"]);

    return row;

}

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
            chrome.tabs.sendMessage(tab.id, {
                messageType: "alert",
                messageText: "You must specify a spreadsheet ID in options before saving data."
            });
            return false;
        }
        if ( ! spreadsheet.range) {
            chrome.tabs.sendMessage(tab.id, {
                messageType: "alert",
                messageText: "You must specify a sheet name in options before saving data."
            });
            return false;
        }

        range = "" + spreadsheet.range + "!A1:G1";

        var valueRangeBody = {
            "range": range,
            "majorDimension": "ROWS",
            "values": data
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
        }
    );

}

