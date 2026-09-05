// ajax request
"use strict";
// globals: XMLHttpRequest

var VP = VP || {};

VP.ajaxRequests = [];
VP.ajaxFailed = 0;
VP.ajaxTime = {};

VP.ajaxTimeStats = function () {
    // show ajax requests stats
    var a = [], key;
    for (key in VP.ajaxTime) {
        if (VP.ajaxTime.hasOwnProperty(key)) {
            a.push(('0000000' + (VP.ajaxTime[key].end - VP.ajaxTime[key].start)).substr(-8) + ' ' + key);
        }
    }
    a.sort();
    return a;
};

VP.ajax = function (url, callback, callbackParameters, asXml) {
    // make ajax request
    VP.ajaxTime[url] = {};
    VP.ajaxTime[url].start = new Date();
    VP.ajaxTime[url].end = null;
    //console.log('ajax: url=' + url);
    //console.log('      par=' + JSON.stringify(callbackParameters));
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            xhr.finished = true;
            VP.ajaxTime[url].end = new Date();
            if (callback) {
                if (asXml) {
                    callback(xhr.responseXML, callbackParameters, xhr.status, xhr.statusText);
                } else {
                    callback(xhr.responseText, callbackParameters, xhr.status, xhr.statusText);
                }
            }
        }
        if (xhr.readyState === 4 && xhr.status !== 200) {
            VP.ajaxFailed++;
            xhr.finished = true;
            VP.ajaxTime[url].end = new Date();
            if (callback) {
                callback(null, callbackParameters, xhr.status, xhr.statusText);
            }
        }
    };
    VP.ajaxRequests.push({'url': url, 'xhr': xhr});
    xhr.open("GET", url, true);
    xhr.send(null);
};

VP.ajaxAbort = function () {
    // abort all xhr requests
    var i;
    //VP.ajaxPending -= VP.ajaxRequests.length;
    for (i = 0; i < VP.ajaxRequests.length; i++) {
        if (!VP.ajaxRequests[i].xhr.finished) {
            console.warn('Interrupting: ' + VP.ajaxRequests[i].url);
            VP.ajaxRequests[i].xhr.abort();
        }
    }
    VP.ajaxRequests = [];
};

