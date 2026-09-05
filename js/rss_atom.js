// RSS atom parser (e.g. code.google.com)
"use strict";

var RR = RR || {};
RR.rss = RR.rss || {};
RR.rss.recentXml = RR.rss.recentXml || null;

RR.rss.isAtom = function (aXml) {
    // return true if aXml looks like RSS ATOM
    RR.rss.recentXml = aXml;
    var root = RR.rss.getRootNode(aXml, 'feed');
    return aXml
        && root
        && (aXml.toString() === '[object XMLDocument]')
        && (root.hasAttribute('xmlns'))
        && (root.getAttribute('xmlns') === 'http://www.w3.org/2005/Atom');
};

RR.rss.parseAtom = function (aXml) {
    // parse RSS ATOM
    RR.rss.recentXml = aXml;
    var items, i, item, feed = RR.rss.feed('rss_atom.js'), root, summary;

    // find root node
    root = RR.rss.getRootNode(aXml, 'feed');

    // header
    // <feed xmlns="http://www.w3.org/2005/Atom">
    //    <updated>date</updated>
    //    <id>url</id>
    //    <title>title</title>
    //    <link rel="alternate" type="text/html" href="url"/>
    //    <link rel="self" type="application/atom+xml;type=feed" href="url"/>
    feed.header = RR.rss.header();
    feed.header.title = RR.rss.getSubNodeValue(root, 'title');
    //feed.header.description =
    //feed.header.administrator =
    //feed.header.generator =
    feed.header.link = RR.rss.getSubNodeAttribute(root, 'link', 'href');
    //console.log(feed.header);

    // items
    items = root.getElementsByTagName('entry');
    //console.log(root);
    //console.log(items.length);
    for (i = 0; i < items.length; i++) {
        // <entry>
        //     <updated>date</updated>
        //     <id>url</id>
        //     <link rel="alternate" type="text/html" href="url" />
        //     <title>title</title>
        //     <author>
        //         <name>username</name>
        //     </author>
        //     <content type="html">some content</content>
        // </entry>
        item = RR.rss.item();
        item.guid = RR.rss.getSubNodeValue(items[i], 'id');
        item.title = RR.rss.getSubNodeValue(items[i], 'title');
        item.link = RR.rss.getSubNodeAttribute(items[i], 'link', 'href');
        //item.comments = RR.rss.getSubNodeValue(items[i], 'comments');
        //item.category = RR.rss.getSubNodeValue(items[i], 'category');
        item.date = RR.rss.getSubNodeValue(items[i], 'updated');
        item.description = RR.rss.getSubNodeValue(items[i], 'content');
        summary = RR.rss.getSubNodeValue(items[i], 'summary');
        if (!item.descripion && summary) {
            item.description = summary;
        }
        item.creator = RR.rss.getSubNode(items[i], 'author');
        if (item.creator) {
            item.creator = RR.rss.getSubNodeValue(item.creator, 'name');
        }
        // if link is empty, use header link
        if (!item.link) {
            item.link = feed.header.link;
        }
        //console.log(item);
        feed.items.push(item);
    }
    return feed;
};

