// New HTML sanitizer
"use strict";
// globals: document, window, DH

var RR = RR || {};

RR.sanitize = RR.sanitize || {};

RR.sanitize.html = function (aHtml, aFeedUrl) {
    var s = DH.htmlSanitizer.sanitize(aHtml, aFeedUrl);
    //console.warn('sanitize2', s, 'original', aHtml);
    return s;
};

