
let spreadSheetIdElement = document.getElementById("spreadsheet-id");
let sheetElement = document.getElementById("sheet-name");
let optionsButton = document.getElementById("options-button");

optionsButton.addEventListener("click", async () => {
    chrome.storage.local.set({"spreadsheetId": spreadSheetIdElement.value});
    chrome.storage.local.set({"sheetName": sheetElement.value});
    // Send message to background script to reload values.
    chrome.runtime.sendMessage({messageType: "options-update"});
    console.log("message sent");
    window.close();
});

chrome.storage.local.get("spreadsheetId", ({ spreadsheetId }) => {
  if ( ! spreadsheetId ) {
    spreadSheetIdElement.value = "";
  } else {
    spreadSheetIdElement.value = spreadsheetId;
  }
});

chrome.storage.local.get("sheetName", ({ sheetName }) => {
  if ( ! sheetName ) {
    sheetElement.value = "";
  } else {
    sheetElement.value = sheetName;
  }
});

