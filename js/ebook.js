// Ebook rendering (convert export of unread items to single html file suitable for ebook)
"use strict";
// globals: document

var RR = RR || {};

RR.ebookData = null;

RR.ebook = function (aExportData) {
    // render unread items to single HTML file for ebook reader
    //return "<html><body><textarea>" + JSON.stringify(aExportData, undefined, 4);
    RR.ebookData = aExportData;
    var html = document.createElement('div'), h1, h2, p, f, items, i, n = 0, added, a, header;
    for (f in RR.ebookData.feeds) {
        if (RR.ebookData.feeds.hasOwnProperty(f)) {
            //console.log(RR.ebookData.feeds[f].header.title, RR.ebookData.feeds[f].header);
            // header
            h1 = document.createElement('h1');
            h1.innerText = RR.ebookData.feeds[f].header.title || RR.ebookData.feeds[f].header.link;
            html.appendChild(h1);
            // unread items
            added = 0;
            items = RR.ebookData.feeds[f].items;
            for (i = 0; i < items.length; i++) {
                // only unread item
                if (!RR.ebookData.read.hasOwnProperty(f) || !RR.ebookData.read[f][items[i].guid] || !RR.ebookData.read[f][items[i].guid].read) {
                    // title
                    n++;
                    added++;
                    h2 = document.createElement('h2');
                    h2.innerText = '#' + n + ': ' + items[i].title;
                    html.appendChild(h2);
                    // description
                    p = document.createElement('p');
                    p.innerHTML = RR.sanitize.html(items[i].description, items[i].link);
                    html.appendChild(p);
                    // link
                    a = document.createElement('a');
                    a.href = items[i].link;
                    a.innerText = items[i].link;
                    a.style.display = 'block';
                    html.appendChild(a);
                }
            }
            // remove empty feed
            if (added === 0) {
                html.removeChild(h1);
            }
        }
    }
    header = [
        '<html>',
        '<head>',
        '<title>RSS Reader ebook export</title>',
        '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">',
        '</head>',
        '<body>'];
    return header.join('\n') + html.innerHTML + '</body></html>';
};
