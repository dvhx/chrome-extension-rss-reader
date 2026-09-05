// RSS/RDF parser
"use strict";

var RR = RR || {};
RR.rss = RR.rss || {};
RR.rss.recentXml = RR.rss.recentXml || null;

RR.rss.isRdf = function (aXml) {
    // return true if aXml looks like RSS RDF
    RR.rss.recentXml = aXml;
    var root = RR.rss.getRootNode(aXml, 'rss');
    if (!root) {
        root = RR.rss.getRootNode(aXml, 'rdf:RDF');
    }
    return root ? true : false;
    /*
    return aXml
        && (aXml.toString() === '[object XMLDocument]')
        && (aXml.firstChild.nodeName === 'rdf:RDF')
        && (aXml.firstChild.hasAttribute('xmlns:rdf'))
        && (aXml.firstChild.hasAttribute('xmlns'))
        && (aXml.firstChild.getAttribute('xmlns:rdf') === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
        && (aXml.firstChild.getAttribute('xmlns') === 'http://purl.org/rss/1.0/');
    */
};

RR.rss.parseRdf = function (aXml) {
    // parse RSS RDF
    RR.rss.recentXml = aXml;
    var channel, items, i, item, feed = RR.rss.feed('rss_rdf.js'), root, content;

    root = RR.rss.getRootNode(aXml, 'rss');
    if (!root) {
        root = RR.rss.getRootNode(aXml, 'rdf:RDF');
    }

    // <channel>
    channel = root.getElementsByTagName('channel');
    RR.rss.test(!channel, "Channel not found");
    RR.rss.test(channel.length !== 1, "Only single channel is supported");
    channel = channel[0];

    // header
    // <channel rdf:about="url">
    //   <title>title</title>
    //   <link>url</link>
    //   <description>description</description>
    // </channel>
    feed.header = RR.rss.header();
    feed.header.title = RR.rss.getSubNodeValue(channel, 'title');
    feed.header.description = RR.rss.getSubNodeValue(channel, 'description');
    feed.header.administrator = RR.rss.getSubNodeValue(channel, 'webMaster');
    feed.header.generator = RR.rss.getSubNodeValue(channel, 'generator');
    feed.header.link = RR.rss.getSubNodeValue(channel, 'link');
    //console.log(feed.header);

    // items
    items = root.getElementsByTagName('item');
    for (i = 0; i < items.length; i++) {
        if (items[i].nodeName === 'item') {
            // <item rdf:about="url">
            //   <title>title</title>
            //   <link>url</link>
            //   <dc:date>date</dc:date>
            // </item>^M
            item = RR.rss.item();
            item.guid = RR.rss.getSubNodeValue(items[i], 'guid');
            item.title = RR.rss.getSubNodeValue(items[i], 'title');
            item.link = RR.rss.getSubNodeValue(items[i], 'link');
            if (!item.link) {
                item.link = feed.header.link;
            }
            item.comments = RR.rss.getSubNodeValue(items[i], 'comments');
            item.category = RR.rss.getSubNodeValue(items[i], 'category');
            item.date = RR.rss.getSubNodeValue(items[i], 'date');
            if (!item.date) {
                item.date = RR.rss.getSubNodeValue(items[i], 'pubDate');
            }
            item.description = RR.rss.getSubNodeValue(items[i], 'description');

            // some feeds has full article in <content:encoded>
            content = RR.rss.getSubNodeValue(items[i], 'encoded');
            if (content && item.description && (content.length > item.description.length)) {
                item.description = content;
            }

            // <creator>john</creator>
            item.creator = item.creator || RR.rss.getSubNodeValue(items[i], 'creator');
            if (!item.creator) {
                item.creator = item.creator || RR.rss.getSubNode(items[i], 'author');
                if (item.creator) {
                    // <author><name>john</name></author>
                    item.creator = RR.rss.getSubNodeValue(item.creator, 'name');
                    // <author>john</author>
                    item.creator = item.creator || RR.rss.getSubNodeValue(items[i], 'author');
                }
            }
            if (!item.creator) {
                item.creator = undefined;
            }

            // if this feed does not have guid create fake guid
            if (!item.guid) {
                if (item.link + item.description !== '') {
                    item.guid = RR.rss.hash(item.link + item.description);
                } else {
                    item.guid = RR.rss.hash(item.title + item.link + item.description);
                }
            }
            //console.log(item);

            feed.items.push(item);
        }
    }
    return feed;
};

