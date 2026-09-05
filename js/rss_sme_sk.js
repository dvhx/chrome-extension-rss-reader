// Fake RSS parser for www.sme.sk (only for top stories in 3 days)
"use strict";
// globals: chrome, DOMParser

var RR = RR || {};
RR.rss = RR.rss || {};
RR.rss.recentXml = RR.rss.recentXml || null;

RR.rss.isSmeSk = function (aUrl) {
    // this parser is used per-url so we return true only for this string
    return aUrl === 'http://www.sme.sk/#3dni';
};

RR.rss.parseSmeSk = function (aText) {
    // parse SME.sk title page
    var feed, parser, doc, a, i, item;
    RR.rss.recentXml = aText;

    // header
    feed = new RR.rss.feed('rss_sme_sk.js');
    feed.header = RR.rss.header();
    feed.header.title = 'sme.sk 3 days top';
    feed.header.description = 'Top stories in last 3 days on www.sme.sk';
    feed.header.administrator = null;
    feed.header.generator = chrome.runtime.getManifest().name + '/RR.rss.parseRssSmeSk';
    feed.header.link = 'http://www.sme.sk/';

    // parse document
    parser = new DOMParser();
    doc = parser.parseFromString(aText, "text/html");
    a = doc.getElementById('tab1_3hod_content').getElementsByTagName('a');
    for (i = 0; i < a.length; i++) {
        item = RR.rss.item();
        item.title = a[i].innerText;
        item.link = a[i].getAttribute('href');
        // fix relative links
        if (item.link.match(/^\//)) {
            item.link = 'http://www.sme.sk' + item.link;
        }
        item.date = new Date();
        item.guid = RR.rss.hash(item.link);
        feed.items.push(item);
        // console.log(item.link + ' --> ' + item.title);
    }
    return feed;
};

