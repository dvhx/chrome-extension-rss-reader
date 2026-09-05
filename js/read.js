// Remember what user already marked as read
"use strict";
// globals: localStorage

var RR = RR || {};

RR.read = (function () {
    var self = {};
    self.read = {};

    self.isOld = function (aFeed, aGuid) {
        // return true if feed item has been read
        if (!self.read.hasOwnProperty(aFeed)) {
            return false;
        }
        if (!self.read[aFeed].hasOwnProperty(aGuid)) {
            return false;
        }
        return self.read[aFeed][aGuid].read;
    };

    self.mark = function (aFeed, aGuid, aRead) {
        // mark feed item as read
        //console.log('RR.read.mark(' + aFeed + ', ' + aGuid + ', ' + aRead + ')');
        if (typeof aRead !== 'boolean') {
            throw "RR.read.mark - third parameter must be boolean!";
        }
        // new feed?
        if (!self.read.hasOwnProperty(aFeed)) {
            self.read[aFeed] = {};
        }
        // mark as read
        self.read[aFeed][aGuid] = { read: aRead, date: new Date() };
        self.save();
    };

    self.markAllAsRead = function (aFeeds, aRead) {
        // mark all items in one feed as read
        console.log('RR.read.markAllAsRead(' + aFeeds + ', ' + aRead + ')');
        if (typeof aRead !== 'boolean') {
            throw "RR.read.markAllAsRead - second parameter must be boolean!";
        }
        var f, i;
        for (f = 0; f < aFeeds.length; f++) {
            // new feed?
            if (!self.read.hasOwnProperty(aFeeds[f].local.url)) {
                self.read[aFeeds[f].local.url] = {};
            }
            // mark as read
            for (i = 0; i < aFeeds[f].items.length; i++) {
                self.read[aFeeds[f].local.url][aFeeds[f].items[i].guid] = { read: aRead, date: new Date() };
            }
        }
        self.save();
    };

    self.load = function () {
        // save to local storage
        self.read = {};
        if (localStorage.hasOwnProperty('read')) {
            self.read = JSON.parse(localStorage.getItem('read'));
        }
    };

    self.save = function () {
        // save to local storage
        localStorage.setItem('read', JSON.stringify(self.read));
    };

    self.load();
    return self;
}());
