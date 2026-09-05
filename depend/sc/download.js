// Download piece of data using blob
// linter: ngspicejs-lint --browser
"use strict";

var SC = window.SC || {};

SC.download = function (aData, aFileName) {
    // Download piece of data using blob
    if (typeof aData !== 'string') {
        throw "SC.download(data) data must be string";
    }
    var blob = new Blob([aData], { type: "text/plain" }),
        a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = aFileName || 'data.txt';
    a.click();
};

