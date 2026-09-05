// Receive all RSS feeds and manage them
"use strict";

var RR = RR || {};

RR.receive = (function () {
    var self = {};
    self.lastData = null;
    self.lastParams = null;
    self.lastFeed = null;
    self.currentFeeds = {};
    self.remaining = 0;
    self.received = [];

    self.receiveXml = function (aData, aParams) {
        // receive xml from one feed
        var url = aParams.url,
            render = aParams.render,
            meter = aParams.meter,
            feed;

        // meter
        self.remaining--;
        if (meter) {
            meter(self.remaining);
        }

        self.lastData = aData;
        self.lastParams = aParams;
        //console.log('RR.receive.receiveXml: url=' + url);

        // parse RSS feed
        if (aData) {
            feed = RR.rss.parseText(aData, url);
            feed.local.url = url;
            feed.local.date = new Date();
            self.lastFeed = feed;
            //console.log(feed);
            self.currentFeeds[url] = feed;
            // merge and save
            RR.rss.feeds.merge(feed);
            RR.rss.feeds.save();
            self.received.push(feed);

            // render
            if (self.remaining <= 0) {
                if (!render) {
                    throw "Undefined renderer";
                }
                render(self.received);
            }
        } else {
            // no data
            console.log('No data received from: ' + url);
        }
    };

    return self;
}());

