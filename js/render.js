// Rendering feed items
"use strict";
// globals: document, VP, chrome

var RR = RR || {};

RR.renderMarkAsRead = function (aParameter) {
    // mark single item as read
    var chb = null;
    //console.log('aParameter:', aParameter);
    if (aParameter.hasOwnProperty('target') || aParameter.target) {
        chb = aParameter.target;
    } else {
        chb = aParameter;
    }
    //console.log('RR.renderMarkAsRead checked=' + chb.checked + ' url=' + chb.url + ' guid=' + chb.guid);
    RR.read.mark(chb.url, chb.guid, chb.checked === true);
};

RR.renderDebugItem = null;
RR.renderDebugElement = null;

RR.render = function (aParent, aItem, aFeedUrl, aFeedTitle, aOld, aWebsiteUrl) {
    // render one feed item into parent element
    var div, a, h2, h3, p, label, read, info, feedlink, xmllink, weblink, label_text;

    div = document.createElement('div');
    div.className = 'rss_feed_item';

    h2 = document.createElement('h2');
    h2.className = 'control';
    div.appendChild(h2);

    a = document.createElement('a');
    a.className = 'control';
    a.href = aItem.link;
    if (a.href.match('http://www.abclinuxu.cz')) {
        a.href = a.href.replace('http://', 'https://');
    }
    a.innerText = aItem.title.replace('&quot;', '"').replace('&amp;', '&');
    h2.appendChild(a);

    h3 = document.createElement('h3');
    h3.className = 'control';
    h3.innerText = (aItem.category || 'article') + (aItem.creator ? ' by ' + aItem.creator + ', ' : ', ') + VP.date.human(aItem.date);
    div.appendChild(h3);

    p = document.createElement('p');
    p.innerHTML = RR.sanitize.html(aItem.description || "", aFeedUrl);
    div.appendChild(p);

    label = document.createElement('label');
    label.style.backgroundColor = 'white';  // WTF: if I remove this line, there will be unclickable space between checkbox and label
    div.appendChild(label);

    read = document.createElement('input');
    read.type = 'checkbox';
    read.checked = aOld === true;
    read.id = aItem.guid;
    read.guid = aItem.guid;
    read.url = aFeedUrl;
    read.className = 'mark_as_read_checkbox';
    read.addEventListener('click', RR.renderMarkAsRead);
    label.appendChild(read);

    label_text = document.createTextNode('read');
    label.appendChild(label_text);

    feedlink = document.createElement('a');
    feedlink.innerText = 'f'; //ⓕ
    feedlink.title = aFeedTitle;
    feedlink.href = 'chrome-extension://' + chrome.runtime.id + '/reader.html#' + aFeedTitle;
    feedlink.className = 'feedlink ball';
    feedlink.addEventListener('click', function (event) { document.location = feedlink.href; document.location.reload(); event.cancelBubble = true; }, true);
    div.appendChild(feedlink);

    xmllink = document.createElement('a');
    xmllink.innerText = 'x'; // ⓧ
    xmllink.title = 'Original XML file of ' + aFeedTitle + ' at ' + aFeedUrl;
    xmllink.href = aFeedUrl;
    xmllink.className = 'xmllink ball';
    div.appendChild(xmllink);

    weblink = document.createElement('a');
    weblink.innerText = 'w'; // ⓦ
    weblink.title = 'Original website of ' + aFeedTitle + ' at ' + aWebsiteUrl;
    weblink.href = aFeedUrl;
    weblink.className = 'xmllink ball';
    div.appendChild(weblink);

    info = document.createElement('span');
    info.className = 'info ball';
    info.innerText = 'i'; // ⓘ
    info.title = 'Click to display item details';
    info.addEventListener('click', function () {
        RR.renderDebugItem = aItem;
        RR.renderDebugElement = p;
        console.log('see RR.renderDebugItem and RR.renderDebugElement');
        alert(JSON.stringify(aItem, undefined, 2));
    });
    div.appendChild(info);

    aParent.appendChild(div);

    return div;
};

