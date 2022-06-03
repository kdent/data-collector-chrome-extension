"use strict";

let options = {

    main:  function () {
        var configFrame, annotationConfig, labelNames;

        // Load annotation configuration and display it.
        chrome.storage.sync.get("labels", (options) => {
            annotationConfig = JSON.parse(options.labels);

            configFrame = document.getElementById("config-frame");

            labelNames = Object.keys(annotationConfig).sort();
            labelNames.forEach((label) => {
                this.displayLabelConfig(label, annotationConfig[label], configFrame);
            });

        });
    },

    /*
     * Display configuration items for a single category/label.
     */
    displayLabelConfig: function (labelName, labelConfig, parentElement) {

        let labelDiv = document.createElement("div");
        labelDiv.id = labelName;
        labelDiv.className = "annotation-container";

        let labelNameDiv = document.createElement("div");
        labelNameDiv.id = "label-name";
        labelNameDiv.innerHTML = labelName;
        labelDiv.appendChild(labelNameDiv);

        let spreadsheetId = document.createElement("div");
        spreadsheetId.id = "spreadsheet-id";
        spreadsheetId.innerHTML = "<b>Spreadsheet ID</b>:&nbsp;&nbsp;" + labelConfig["spreadsheet-id"];
        labelDiv.appendChild(spreadsheetId);

        let sheetName = document.createElement("div");
        sheetName.id = "sheet-name";
        sheetName.innerHTML = "<b>Sheet Name</b>:&nbsp;&nbsp;" + labelConfig["sheet-name"];
        labelDiv.appendChild(sheetName);

        let columnNameContainer = document.createElement("div");
        columnNameContainer.id = "column-name-container";
        labelDiv.appendChild(columnNameContainer);

        let srcCatCol = document.createElement("div");
        srcCatCol.className = "column-name";
        srcCatCol.innerHTML = "Source Category";
        columnNameContainer.appendChild(srcCatCol);

        let dataTypeCol = document.createElement("div");
        dataTypeCol.className = "column-name";
        dataTypeCol.innerHTML = "Data Type";
        columnNameContainer.appendChild(dataTypeCol);

        let contentCol = document.createElement("div");
        contentCol.className = "column-name";
        contentCol.innerHTML = "Content";
        columnNameContainer.appendChild(contentCol);

        let nonViolCol = document.createElement("div");
        nonViolCol.className = "column-name";
        nonViolCol.innerHTML = "Non-violating but review required";
        columnNameContainer.appendChild(nonViolCol);

        let labelCol = document.createElement("div");
        labelCol.className = "column-name";
        labelCol.innerHTML = labelName;
        columnNameContainer.appendChild(labelCol);

        labelConfig['sub-categories'].forEach((subCat) => {
            let subCatCol = document.createElement("div");
            subCatCol.className = "column-name";
            subCatCol.innerHTML = subCat;
            columnNameContainer.appendChild(subCatCol);
        });

        labelConfig['secondary-labels'].forEach((secondaryLabel) => {
            let secondaryLabelCol = document.createElement("div");
            secondaryLabelCol.className = "column-name";
            secondaryLabelCol.innerHTML = secondaryLabel;
            columnNameContainer.appendChild(secondaryLabelCol);
        });

        let checkstepCommentsCol = document.createElement("div");
        checkstepCommentsCol.className = "column-name";
        checkstepCommentsCol.innerHTML = "Comment - Checkstep";
        columnNameContainer.appendChild(checkstepCommentsCol);

        let customerCommentsCol = document.createElement("div");
        customerCommentsCol.className = "column-name";
        customerCommentsCol.innerHTML = "Comment - Customer";
        columnNameContainer.appendChild(customerCommentsCol);

        let sourceUrlCol = document.createElement("div");
        sourceUrlCol.className = "column-name";
        sourceUrlCol.innerHTML = "Source URL";
        columnNameContainer.appendChild(sourceUrlCol);

        let dateCollectedCol = document.createElement("div");
        dateCollectedCol.className = "column-name";
        dateCollectedCol.innerHTML = "Date Collected";
        columnNameContainer.appendChild(dateCollectedCol);

        parentElement.appendChild(labelDiv);
    }


};

options.main();
