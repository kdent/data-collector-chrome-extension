/*
 * Checkstep Data Collector
 */
"use strict";

const LABEL_CONFIG_PATH = 'config/labels.json';
const ANNOTATION_HTML_PATH = "annotation.html";


// Get token needed for access to Google docs.
chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
    console.log("got token: " + token);
    googleSheet.token = token;
});

/*
 * Add listeners.
 */
chrome.runtime.onInstalled.addListener(handleOnInstalled);
chrome.contextMenus.onClicked.addListener(annotateRequestHandler);

/* Listener for when options change. */
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


/*
 * Event handlers.
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
}


/*
 * Handler for when a user has selected the menu item to collect a data
 * example and annotate it.
 */
function annotateRequestHandler(clickData, tab) {
    var curExample;

    chrome.tabs.sendMessage(tab.id,
        {
         messageType: "show-annotation-screen",
         selectedText: clickData.selectionText
        }
    );

}


/*
 * Read label configuration file and store it in Chrome's extension store.
 */
function storeLabelConfig(labelConfigJson) {
    var str = JSON.stringify(labelConfigJson);
    chrome.storage.sync.set({'labels': JSON.stringify(labelConfigJson)});
}


function saveAnnotation(tab, annotation) {
    var labelOptions, categoryInfo, spreadsheetRow;

    /* Load label configuration */
    chrome.storage.sync.get("labels", (options) => {
        labelOptions = JSON.parse(options.labels);
        categoryInfo = labelOptions[annotation["class-label"]];
        spreadsheetRow = mapAnnotationToRow(categoryInfo, annotation);
        googleSheet.id = categoryInfo["spreadsheet-id"];
        googleSheet.sheetName = categoryInfo["sheet-name"];
        googleSheet.writeRow(spreadsheetRow, tab);

    });

}

/*
 * Maps categoryInfo json object to an array to insert into the
 * Google sheet.
 *
 * Returns the row as an array.
 */
function mapAnnotationToRow(categoryInfo, annotation) {
    var row;

    /*
     * Expected Columns:
     *
     * - Source Category ("External")
     * - Data Type ("Observed")
     * - Collected Text
     * - Non-violating but review required
     * - Label
     * - Sub-categories(+)
     * - Secondary Labels(+)
     * - Checkstep Comments
     * - Source URL
     * - Page Title
     * - Date of Collection
     */

    row = [];
    row.push("External");       // Source Category
    row.push("Observed");       // Data Type
    row.push(annotation["selected-text"]);
    row.push(false);            // non-violating but review required
    // Set current label as true or false.
    if (annotation["non-violating"]) {
        row.push(false);
    } else {
        row.push(true);
    }

    /* For each subcateogry mark it true or false according to annotaiton. */
    categoryInfo["sub-categories"].forEach((subcat) => {
        if (annotation.subcategories.includes(subcat)) {
            row.push(true);
        } else {
            row.push(false);
        }
    });

    /* For each secondary label mark true or false according to annotaiton. */
    categoryInfo["secondary-labels"].forEach((secondary) => {
        if (annotation["secondary-labels"].includes(secondary)) {
            row.push(true);
        } else {
            row.push(true);
        }
    });

    row.push(annotation["checkstep-comments"]);
    row.push("");               // empty cell for customer comments. //
    row.push(annotation["source-url"]);
    row.push(annotation["page-title"]);
    row.push(annotation["collected-date"]);

    return row;
}


let googleSheet = {
    id: null,
    sheetName: null,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    token: "",

    writeRow: function(data, tab) {
        var range;

        if ( ! googleSheet.id) {
            chrome.tabs.sendMessage(tab.id, {
                messageType: "alert",
                messageText: "You must specify a spreadsheet ID in options before saving data."
            });
            return false;
        }
        if ( ! googleSheet.sheetName) {
            chrome.tabs.sendMessage(tab.id, {
                messageType: "alert",
                messageText: "You must specify a sheet name in options before saving data."
            });
            return false;
        }

        range = "" + googleSheet.sheetName + "!A:G";

        var valueRangeBody = {
            "range": range,
            "majorDimension": "ROWS",
            "values": [ Object.values(data) ]
        };

        console.log("passing array: " + Object.values(data));

        let init = {
            method: 'POST',
            headers: {
            Authorization: 'Bearer ' + googleSheet.token, 'Content-Type': 'application/json'
            },
            body: JSON.stringify(valueRangeBody)
        };

        let url = "https://sheets.googleapis.com/v4/spreadsheets/" + googleSheet.id + "/values/" + range + ":append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

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
                console.log("Google Sheet Response: " + JSON.stringify(respData));
                let msg = {
                    messageType: "notification",
                    messageText: "Data saved to Google Sheet."
                };
                chrome.tabs.sendMessage(tab.id, msg);
            }
          });

    }
}

