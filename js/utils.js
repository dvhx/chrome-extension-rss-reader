// Utility functions
"use strict";
// globals: sha256, chrome, unescape, Uint8Array, window, document

var VP = VP || {};

VP.extensionId = function () {
    // return chrome extension id
    // current chrome
    if (chrome.runtime && chrome.runtime.id) {
        return chrome.runtime.id;
    }
    // old chrome v12
    if (chrome.extension) {
        return chrome.extension.getURL().split('/')[2];
    }
    return null;
};

VP.sha256 = function (aText) {
    // return sha256 hash of utf-8 string and return it in hexa form
    var ascii = unescape(encodeURIComponent(aText)),
        a = new Uint8Array(ascii.length),
        h,
        hex = '',
        i;
    for (i = 0; i < ascii.length; i++) {
        a[i] = ascii.charCodeAt(i);
    }
    h = sha256(a);
    for (i = 0; i < h.length; i++) {
        hex += ('0' + (h[i].toString(16)).toString(16)).substr(-2);
    }
    return hex.toUpperCase();
};

VP.pbkdf2 = function (aPassword, aSalt, aRounds, aLength) {
    // return PBKDF2 (password based key derivation function 2) hashed password
    sha256.pbkdf2(aPassword, aSalt, aRounds, aLength);
};

VP.isExtension = function () {
    // return true if this code is executed in extension
    return window.chrome && chrome.runtime && chrome.runtime.id;
};

VP.isPopup = function () {
    // return true if this is popup, false if this is tab
    return document.location.toString().match('^chrome-extension://' + VP.extensionId() + '/popup.html\\?topic=') === null;
};

VP.chromeVersion = function () {
    // return chrome version, e.g, 37
    return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
};

VP.getHashFromUser = function () {
    // ask user for url and display its hash, mostly for debugging
    var h, u = prompt('URL', document.location);
    if (u) {
        h = prompt('Press Ctrl+C to copy hash to clipboard', VP.sha1(u));
    }
    return h;
};



