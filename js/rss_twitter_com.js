// Convert RSS feed (e.g. https://twitter.com/nasa_dawn) to RSS feed
"use strict";
// globals: chrome, DOMParser

var RR = RR || {};
RR.rss = RR.rss || {};
RR.rss.recentXml = RR.rss.recentXml || null;

RR.rss.isTwitterCom = function (aUrl) {
    // this parser is used only for twitter urls
    return aUrl.match(/^https:\/\/twitter\.com\//) !== null;
};

RR.rss.parseTwitterCom = function (aText) {
    // parse twitter page
    var feed, parser, doc, content, c, text, images, i, large, html, item, permalink;
    RR.rss.recentXml = aText;

    // header
    feed = new RR.rss.feed('rss_twitter_com.js');
    feed.header = RR.rss.header();
    feed.header.title = 'Twitter RSS feed';
    feed.header.description = 'Twitter feed converted to RSS feed';
    feed.header.administrator = null;
    feed.header.generator = chrome.runtime.getManifest().name + '/RR.rss.parseRssTwitterCom';
    feed.header.link = 'https://twitter.com/';

    // parse document
    parser = new DOMParser();
    doc = parser.parseFromString(aText, "text/html");

    // extract data
    content = doc.getElementsByClassName('content');
    for (c = 0; c < content.length; c++) {
        // text
        try {
            text = content[c].getElementsByClassName('tweet-text')[0].innerHTML; //Text.trim();
        } catch (e) {
            continue;
        }
        html = '<div>' + text + '</div>';

        // images
        images = content[c].getElementsByClassName('js-media-img-placeholder');
        for (i = 0; i < images.length; i++) {
            large = images[i].getAttribute('data-img-src');
            html += '<a href="' + large + ':large"><img src="' + large + '"></a>';
        }

        // find permalink for this tweet
        permalink = 'https://twitter.com/';
        try {
            permalink += content[c].parentNode.getAttribute('data-permalink-path');
        } catch (ignore) {
        }

        // add RSS item
        item = RR.rss.item();
        item.title = 'New tweet';
        item.link = permalink;
        item.date = new Date();
        item.guid = RR.rss.hash(html);
        item.description = html;
        feed.items.push(item);
    }
    return feed;
};

