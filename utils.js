"use strict"; 

let utils = {

    maxZValue: 0,

    getHighestZValue: function () {
        var nodeList;

        nodeList = document.querySelectorAll("body *");
        utils.walkDom(nodeList[0]);
        return utils.maxZValue;
    },

    walkDom: function (currentNode) {
        var computedStyle, z;

        if (currentNode) {
            if (currentNode instanceof Element) {
                computedStyle = window.getComputedStyle(currentNode);
                if (computedStyle) {
                    z = parseInt(computedStyle.getPropertyValue("z-index"));
                    if (z && (z > utils.maxZValue)) {
                        utils.maxZValue = z;
                    }
                }

            }
        }

        if (currentNode.firstChild) {
            utils.walkDom(currentNode.firstChild);
        }

        if (currentNode.nextSibling) {
            utils.walkDom(currentNode.nextSibling);
        }
    }

};
