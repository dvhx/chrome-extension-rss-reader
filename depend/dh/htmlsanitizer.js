// Minimalistic html sanitizer
"use strict";
// linter: ngspicejs-lint --browser
// global: DOMParser, NodeFilter, URL

var DH = DH || {};

DH.htmlSanitizer = (function () {
    // Minimalistic html sanitizer
    var self = {};
    self.removedElements = {};

    function whitelistAttributes(aElement, aAllowedNames) {
        // for aElement remove attributes that are not on the list of allowed attributes
        var i;
        for (i = aElement.attributes.length - 1; i >= 0; i--) {
            if (aAllowedNames.indexOf(aElement.attributes[i].name) < 0) {
                aElement.removeAttribute(aElement.attributes[i].name);
            }
        }
    }

    self.urlAbsolute = function (aUrlString, aDocumentUrl) {
        // convert relative url to absolute (url is not sanitized!)
        var u;
        // empty
        if (!aUrlString) {
            return '';
        }
        // if url string starts with / it's relative path from root of document url (/foo.html)
        if (aUrlString.substr(0, 1) === '/') {
            u = new URL(aDocumentUrl);
            // if url starts with // just add protocol
            if (aUrlString.substr(0, 2) === '//') {
                return u.protocol + aUrlString;
            }
            u.pathname = aUrlString;
            u.search = '';
            u.hash = '';
            return u.toString();
        }
        // if url has no protocol it's relative url (foo.html)
        if (!aUrlString.match(/^http[s]{0,1}:/)) {
            u = new URL(aDocumentUrl + aUrlString);
            return u.toString();
        }
        // absolute url
        return aUrlString;
    };

    self.urlSanitize = function (aUrlString, aDocumentUrl) {
        // sanitize url
        var u, a;
        // empty
        if (!aUrlString) {
            return '';
        }
        // make absolute url
        a = self.urlAbsolute(aUrlString, aDocumentUrl);
        // create url object
        try {
            u = (new URL(a.substr(0, 1000)));
        } catch (e) {
            console.warn('ignoring invalid url', aUrlString);
            return '';
        }
        // only allowed protocols
        if ((u.protocol === 'http:') || (u.protocol === 'https:')) {
            //console.warn('rrr', u.toString());
            return u.toString();
        }
        console.warn('ignoring url protocol', aUrlString, aDocumentUrl);
        return '';
    };

    self.colorSanitize = function (aColor) {
        var c = aColor.match(/^\#[0-9a-fA-F]{3,6}$/);
        if (c) {
            return c[0];
        }
        return '#000000';
    };

    self.sanitize = function (aHtml, aDocumentUrl) {
        // minimalistic html sanitizer based on DOMParser
        var p = new DOMParser(), d, e, walk, n, i, bad = [];

        // parse
        d = p.parseFromString(aHtml, 'text/html');
        e = d.getElementsByTagName('parsererror');
        if (e.length > 0) {
            //alert(e.innerHTML); // only for debugging
            console.error(e.innerHTML);
            throw e.innerHTML;
        }

        // walk through all nodes
        window.d = d;
        walk = d.createTreeWalker(d.body, NodeFilter.SHOW_ALL, null, false);
        n = walk.nextNode();
        while (n) {
            //console.log('n', n, n.nodeName);
            switch (n.nodeName) {
            case "#text":
                // text node cannot have attributes
                if (n.attributes) {
                    console.error('text node have attributes!', n);
                    throw "text node have attributes!";
                }
                // allow text node as is
                break;
            case "A":
                whitelistAttributes(n, ['href', 'title', 'alt']);
                //console.log('href', n.getAttribute('href').toString(), aDocumentUrl);
                n.href = self.urlSanitize(n.getAttribute('href'), aDocumentUrl);
                break;
            case "IMG":
                whitelistAttributes(n, ['src', 'alt', 'width', 'height', 'title']);
                n.src = self.urlSanitize(n.getAttribute('src'), aDocumentUrl);
                break;
            case "AUDIO":
                whitelistAttributes(n, ['src', 'controls']);
                n.src = self.urlSanitize(n.getAttribute('src'), aDocumentUrl);
                break;
            case "FONT":
                whitelistAttributes(n, ['color']);
                n.color = self.colorSanitize(n.getAttribute('color'));
                break;
            case "TIME":
                whitelistAttributes(n, ['datetime']);
                break;
            case "VIDEO":
                whitelistAttributes(n, ['src', 'controls', 'autoplay']);
                break;
            case "DETAILS":
            case "SUMMARY":
            case "EM":
            case "HEADER":
            case "B":
            case "UL":
            case "P":
            case "I":
            case "DIV":
            case "PRE":
            case "BLOCKQUOTE":
            case "CITE":
            case "CODE":
            case "SMALL":
            case "SPAN":
            case "OL":
            case "LI":
            case "HR":
            case "CAPTION":
            case "FIGCAPTION":
            case "FIGURE":
            case "LABEL":
            case "LEGEND":
            case "SAMP":
            case "TFOOT":
            case "THEAD":
            case "H1":
            case "H2":
            case "H3":
            case "H4":
            case "H5":
            case "H6":
            case "SUB":
            case "SUP":
            case "BIG":
            case "DD":
            case "DL":
            case "DT":
            case "ABBR":
            case "STRIKE":
            case "S":
            case "U":
            case "SECTION":
            case "ACRONYM":
            case "CENTER":
            case "TABLE":
            case "TBODY":
            case "TH":
            case "TD":
            case "TR":
            case "STRONG":
            case "BR":
                whitelistAttributes(n, []);
                break;
            default:
                // all other elements are removed
                //console.warn('removing', n.nodeName, n, 's[' + s.length + ']');
                bad.push(n);
                self.removedElements[n.nodeName] = {
                    url: aDocumentUrl,
                    code: n.outerHTML,
                    text: n.textContent
                };
            }
            n = walk.nextNode();
        }

        // remove all bad nodes
        for (i = bad.length - 1; i >= 0; i--) {
            bad[i].parentElement.removeChild(bad[i]);
        }

        return d.body.innerHTML;
    };

    self.trySanitize = function (aHtml, aDocumentUrl) {
        // try sanitize, show errors in console
        try {
            return self.sanitize(aHtml, aDocumentUrl);
        } catch (e) {
            console.error('sanitizer error: ' + e);
            throw e;
        }
    };

    return self;
}());

