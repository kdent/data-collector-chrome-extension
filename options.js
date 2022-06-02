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

    displayLabelConfig: function (labelName, labelConfig, parentElement) {
        var labelDiv, srcCatSpan, dataTypeSpan, labelSpan, contentSpan, nonViolSpan;

        labelDiv = document.createElement("div");

        srcCatSpan = document.createElement("span");
        srcCatSpan.innerHTML = "Source Category";
        labelDiv.appendChild(srcCatSpan);

        dataTypeSpan = document.createElement("span");
        dataTypeSpan.innerHTML = "Data Type";
        labelDiv.appendChild(dataTypeSpan);

        labelSpan = document.createElement("span");
        labelSpan.innerHTML = labelName;
        labelDiv.appendChild(labelSpan);

        contentSpan = document.createElement("span");
        contentSpan.innerHTML = "Content";
        labelDiv.appendChild(contentSpan);

        nonViolSpan = document.createElement("span");
        nonViolSpan.innerHTML = "Non-violating but review required";
        labelDiv.appendChild(nonViolSpan);


        parentElement.appendChild(labelDiv);
    }


};

options.main();
