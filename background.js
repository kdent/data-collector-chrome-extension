/*
 * Checkstep Data Collector
 */


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
            console.log(respData)
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
 * The options script will send a message when options are changed.
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("got pinged to update options.");
    loadValuesFromLocalStore();
  }
);


/*
 * Script starts here.
 */

/* As we are loaded, get values for target spreadsheet. */
loadValuesFromLocalStore();

/* Add self to context menu. */
chrome.contextMenus.create({
        "title": "Collect text example",
        "id": "checkstep-text-grabber-menu",
        "contexts": ["selection"],
});

chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
    console.log("got token: " + token);
    spreadsheet.token = token;
});


chrome.contextMenus.onClicked.addListener(selectionHandler);

function loadValuesFromLocalStore() {
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

function selectionHandler(clickData, tab) {

    curExample = new DataSample();
    curExample.content = clickData.selectionText;
    curExample.originalSource = tab.url;
    curExample.dateCollected = new Date(Date.now()).toUTCString();
    curExample.hate = true;

    spreadsheet.writeRow(curExample, tab);
}

