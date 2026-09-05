// Displaying normal or human date with fallback if moment library (300kB) is not used
"use strict";
// globals: moment, navigator

var VP = VP || {};

VP.date = (function () {
    var self = {};

    self.yyyymmdd = function (a) {
        // return date in yyyy-mm-dd format
        var yyyy, mm, dd;
        if (a && a.getFullYear) {
            yyyy = a.getFullYear().toString();
            mm = (a.getMonth() + 1).toString(); // getMonth() is zero-based
            dd  = a.getDate().toString();
            return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]); // padding
        }
        return a;
    };

    self.hhmmss = function (a) {
        // return time in HH:MM:SS format
        var hh, mm, ss;
        if (a && a.getHours) {
            hh = a.getHours().toString();
            mm = a.getMinutes().toString();
            ss = a.getSeconds().toString();
            return (hh.length === 2 ? hh : '0' + hh) + ':' +
                (mm.length === 2 ? mm : '0' + mm) + ':' +
                (ss.length === 2 ? ss : '0' + ss);
        }
        return a;
    };

    self.human = function (a) {
        // return human readable date using moment library or fallback
        var m, ymd, ymda;
        if (typeof a === 'string') {
            try {
                a = new Date(a);
            } catch (ignore) {
            }
        }
        if (VP.config) {
            if (!VP.config.humanReadableDate) {
                return VP.date.yyyymmdd(a) + ' ' + VP.date.hhmmss(a);
            }
        }
        if (typeof moment === 'function') {
            m = moment(typeof a === 'string' ? new Date(a) : a);
            m.locale(navigator.language);
            return m.fromNow();
        }
        // show date as time if today, date if elsewhere
        if (a && a.getFullYear) {
            ymd = VP.date.yyyymmdd(new Date());
            ymda = VP.date.yyyymmdd(a);
            if (ymd === ymda) {
                return VP.date.hhmmss(a);
            }
            return ymda;
        }
        if (a && a.getFullYear) {
            return VP.date.yyyymmdd(a);
        }
        // show datetime as is
        return a || '-';
    };

    return self;
}());
