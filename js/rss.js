// Common code for RSS parsers (and factory for actual parsers)
"use strict";
// globals: window, VP, DH, localStorage, document, DOMParser

var RR = RR || {};
RR.rss = RR.rss || {};
RR.rss.recentXml = RR.rss.recentXml || null;

RR.rss.hash = function (aText) {
    // hash text for guid purposes
    // UGLY
    if (typeof window.sha256 === 'function') {
        return VP.sha256(aText); // sha256 is binary, VP.sha256() is text but require sha256() to exist
    }
    if (typeof DH.sha1 === 'function') {
        return DH.sha1(aText);
    }
    return aText;
};

RR.rss.header = function () {
    // create empty RSS header
    return {
        title: null,
        description: null,
        administrator: null,
        generator: null,
        link: null
    };
};

RR.rss.local = function (aParser) {
    // create empty RSS local data (not from server but needed to manage feed)
    return {
        interval: 2,
        date: null,
        url: null,
        parser: aParser
    };
};

RR.rss.item = function () {
    // create empty RSS item
    return {
        guid: null,
        title: null,
        link: null,
        comments: null,
        category: null,
        date: null,
        description: null,
        creator: null,
        read: false
    };
};

RR.rss.feed = function (aParser) {
    // create empty RSS feed (header, local, items)
    return {
        header: RR.rss.header(),
        local: RR.rss.local(aParser),
        items: []
    };
};

RR.rss.findGuidIndex = function (aItems, aGuid) {
    // return index of item with such guid, -1 if not found
    var i;
    for (i = 0; i < aItems.length; i++) {
        if (aItems[i].guid === aGuid) {
            return i;
        }
    }
    return -1;
};

RR.rss.feeds = (function () {
    // all feeds
    var self = {};
    self.all = {};
    self.day = VP.date.yyyymmdd(new Date());
    self.oldDay = localStorage.hasOwnProperty('day') ? localStorage.getItem('day') : self.day;

    self.load = function () {
        // load all feeds from localStorage
        self.all = {};
        if (localStorage.hasOwnProperty('feeds')) {
            // once a day erase all data
            if (self.day === self.oldDay) {
                self.all = JSON.parse(localStorage.getItem('feeds'));
            } else {
                console.log('Erasing all feeds data');
            }
        }
    };

    self.save = function () {
        // save all feeds to localStorage
        localStorage.setItem('day', self.day);
        localStorage.setItem('feeds', JSON.stringify(self.all));
    };

    self.merge = function (aNew) {
        // merge two feeds (adds new items to old items)
        // find old feed
        var old = self.all.hasOwnProperty(aNew.local.url) ? self.all[aNew.local.url] : null,
            i,
            oi;
        if (!old) {
            // no old feed, keeping new as whole
            self.all[aNew.local.url] = aNew;
            return;
        }
        // merging new into old
        // sometimes RSS feeds can change header, just show it as warning
        if ((old.header.title !== aNew.header.title)
                    || (old.header.description !== aNew.header.description)
                    || (old.header.link !== aNew.header.link)
                    || (old.header.administrator !== aNew.header.administrator)) {
            //console.warn('RSS feed header changed');
            console.log(old.header);
            console.log(aNew.header);
        }
        // also merge header
        old.header = aNew.header;
        // merge new into old
        for (i = 0; i < aNew.items.length; i++) {
            oi = RR.rss.findGuidIndex(old.items, aNew.items[i].guid);
            //console.log('oi=' + oi);
            if (oi >= 0) {
                //console.log('  merged');
                // only some values are merged
                // not merged: guid, read
                old.items[oi].title = aNew.items[i].title;
                old.items[oi].link  = aNew.items[i].link;
                old.items[oi].comments = aNew.items[i].comments;
                old.items[oi].category = aNew.items[i].category;
                old.items[oi].date = aNew.items[i].date;
                old.items[oi].description = aNew.items[i].description;
                old.items[oi].creator = aNew.items[i].creator;
            } else {
                // add item from new to old (FIXME: perhaps "old" should be renamed to "current")
                old.items.push(aNew.items[i]);
            }
        }
    };

    self.findByUrl = function (aUrl) {
        // return age of feed
        if (self.all.hasOwnProperty(aUrl)) {
            return RR.rss.feeds.all[aUrl];
        }
        return null;
    };

    self.getInterval = function (aUrl) {
        // return desired interval (in hours) of a feed
        if (self.all.hasOwnProperty(aUrl)) {
            return RR.rss.feeds.all[aUrl].local.interval || 2;
        }
        return 2;
    };

    self.setInterval = function (aUrl, aHours) {
        // set feed interval
        if (self.all.hasOwnProperty(aUrl)) {
            RR.rss.feeds.all[aUrl].local.interval = parseFloat(aHours);
            return true;
        }
        console.warn('No such feed: ' + aUrl);
        return false;
    };

    self.setDate = function (aUrl, aDate) {
        // set feed date
        if (self.all.hasOwnProperty(aUrl)) {
            RR.rss.feeds.all[aUrl].local.date = aDate || (new Date());
            return true;
        }
        console.log('First refresh of feed: ' + aUrl);
        return false;
    };

    self.getHourAge = function (aUrl) {
        // return age of feed
        if (self.all.hasOwnProperty(aUrl)) {
            return parseFloat((((new Date()) - new Date(RR.rss.feeds.all[aUrl].local.date)) / 3600000).toFixed(1), 10);
        }
        return 365 * 24;
    };

    self.load();
    return self;
}());

RR.rss.test = function (aBoolean, aError) {
    // auxiliary function for tests
    if (aBoolean) {
        console.trace();
        throw aError;
    }
};

RR.rss.getSubNode = function (aItem, aNodeName) {
    // return value of subnode
    var a = aItem.getElementsByTagName(aNodeName);
    if (a.length >= 1) {
        return a[0];
    }
    return null;
};

RR.rss.getSubNodeValue = function (aItem, aNodeName, aDefaultValue) {
    // return value of subnode
    var a = aItem.getElementsByTagName(aNodeName), html = '';
    if (a.length >= 1) {
        // unescape html from xml
        html = a[0].innerHTML;
        // <![CDATA[some_html_here]]>
        if (html.substr(0, 9) === "<![CDATA[") {
            html = html.substr(9);
            html = html.substr(0, html.length - 3);
        } else {
            // unescape html from xml element
            html = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        }
        return html;
    }
    return aDefaultValue;
};

RR.rss.getSubNodeAttribute = function (aItem, aNodeName, aNodeAttribute, aDefaultValue) {
    // return value of subnode
    var a = aItem.getElementsByTagName(aNodeName);
    if (a.length >= 1) {
        // unescape html from xml
        if (a[0].hasAttribute(aNodeAttribute)) {
            return a[0].getAttribute(aNodeAttribute);
        }
        return aDefaultValue;
    }
    return aDefaultValue;
};

RR.rss.getRootNode = function (aXml, aNodeName) {
    // find root rss node (at the begining there can be stylesheets, comments etc)
    var i;
    if (!aXml) {
        return null;
    }
    for (i = 0; i < aXml.childNodes.length; i++) {
        if ((aXml.childNodes[i].nodeName === aNodeName) && (aXml.childNodes[i].nodeType === document.ELEMENT_NODE)) {
            // console.warn('ROOT NODE: ' + aXml.childNodes[i].nodeName);
            return aXml.childNodes[i];
        }
    }
    return null;
};

RR.rss.parse = function (aData, aUrl) {
    // determine RSS feed type and parse
    if (RR.rss.isAtom(aData)) {
        //console.log('Parsing as ATOM');
        return RR.rss.parseAtom(aData, aUrl);
    }
    if (RR.rss.isRdf(aData)) {
        //console.log('Parsing as RDF');
        return RR.rss.parseRdf(aData, aUrl);
    }
    return null;
    //console.log(aData);
    //throw "Unsupported feed type";
};

RR.rss.parseText = function (aData, aUrl) {
    // parse text
    var e, parser, xml, pe, r;
    // empty feed
    if ((!aData) || (aData.trim() === '')) {
        e = RR.rss.feed();
        e.header.title = 'Empty feed';
        e.header.link = aUrl;
        e.header.description = '0 bytes was received from this feed!';
        return e;
    }
    // string parsers
    if (RR.rss.isSmeSk(aUrl)) {
        return RR.rss.parseSmeSk(aData);
    }
    if (RR.rss.isTwitterCom(aUrl)) {
        return RR.rss.parseTwitterCom(aData);
    }
    // xml parsers
    //console.log('url:  ' + aUrl);
    //console.log('data.length: ' + aData.length);
    parser = new DOMParser();
    xml = parser.parseFromString(aData, "text/xml");
    pe = xml.getElementsByTagName('parsererror');
    if (pe.length > 0) {
        console.warn(pe.innerHTML);
    }
    // console.log(xml);
    r = RR.rss.parse(xml, aUrl);
    if (r) {
        return r;
    }
    // use fallback parser
    return RR.rss.parseNone(aData, aUrl);
};

