// Return all elements with defined id all in one object
// linter: ngspicejs-lint --browser
"use strict";

var SC = window.SC || {};

SC.elementsWithId = function () {
    // Return all elements with defined id, if id is set, it is assumed they will be used so we can have them all at once
    function acceptNode() {
        return window.NodeFilter.FILTER_ACCEPT;
    }
    var w = document.createTreeWalker(document.body, window.NodeFilter.SHOW_ELEMENT, acceptNode, false),
        n = w.nextNode(),
        o = {};
    while (n) {
        if (n.id) {
            o[n.id] = n;
        }
        n = w.nextNode();
    }
    return o;
};

