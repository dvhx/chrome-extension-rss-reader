// Return estimated size of an object
"use strict";

function roughSizeOfObject(aObject, aHuman) {
    // return estimated size of an object
    var bytes = JSON.stringify(aObject).length, unit;
    if (aHuman) {
        unit = ' B';
        if (bytes > 1000) {
            bytes /= 1000;
            unit = ' kB';
        }
        if (bytes > 1000) {
            bytes /= 1000;
            unit = ' MB';
        }
        bytes = bytes.toFixed(0) + unit;
    }
    return bytes;
}
