// Settings
"use strict";
// globals: document, DH, roughSizeOfObject, chrome

var RR = RR || {};
RR.pageSettings = {};

RR.pageSettings.onTreeWidthChange = function () {
    // save new tree width
    RR.config.options.treeWidth = document.getElementById('tree_width').value;
    RR.config.save();
};

RR.pageSettings.onTreeFontChange = function () {
    // update font preview
    //console.log('RR.pageSettings.onTreeFontChange');
    var
        fn = document.getElementById('tree_font_name').value,
        fs = document.getElementById('tree_font_size').value,
        ee = document.getElementById('tree_font_test');
    ee.style.fontSize = fs;
    ee.style.fontFamily = fn;
    RR.config.options.treeFontSize = fs;
    RR.config.options.treeFontName = fn;
    RR.config.save();
};

RR.pageSettings.onExport = function () {
    // export
    RR.config.export();
};

RR.pageSettings.onEbook = function () {
    // export ebook
    var data = {"feeds": RR.rss.feeds.all, "read": RR.read.read},
        html = RR.ebook(data);
    SC.download(html, 'rssreader-ebook.html');
};

RR.pageSettings.onImport = function () {
    // import
    RR.pageSettings.isExtensionPageOpen(
        'reader.html',
        function (page, tab) {
            alert('Before import you must close tab #' + (tab.index + 1) + ' (' + page + ')');
        },
        function (page, tab) {
            console.log(page);
            console.log(tab);
            RR.config.import();
            RR.pageSettings.onLoad();
            RR.pageSettings.showSizes();
        }
    );
};

RR.pageSettings.onClear = function () {
    // clear all data
    if (!confirm("Are you sure you want to erase saved data?")) {
        return;
    }
    if (document.getElementById('clear_state').checked) {
        console.log('Clearing state');
        RR.read.read = {};
        RR.read.save();
    }
    if (document.getElementById('clear_data').checked) {
        console.log('Clearing data');
        RR.rss.feeds.all = {};
        RR.rss.feeds.save();
    }
    if (document.getElementById('clear_tree').checked) {
        console.log('Clearing tree');
        RR.config.tree[0].items = [];
        RR.config.save();
    }
    document.location.reload();
};

RR.pageSettings.showSizes = function () {
    // Show size of partial objects next to checkbox
    document.getElementById('clear_data_size').innerText = ' (' + roughSizeOfObject(RR.rss.feeds.all, true) + ')';
    document.getElementById('clear_state_size').innerText = ' (' + roughSizeOfObject(RR.read.read, true) + ')';
    document.getElementById('clear_tree_size').innerText = ' (' + roughSizeOfObject(RR.config.tree[0].items, true) + ')';
};

RR.pageSettings.onLoad = function () {
    // close reader if it is open
    chrome.tabs.query({ url: 'chrome-extension://' + chrome.runtime.id + '/reader.html' },
        function (tabs) { if (tabs.length > 0) { chrome.tabs.remove(tabs[0].id); } });
    // load config to components
    document.getElementById('tree_width').value = RR.config.options.treeWidth;
    document.getElementById('tree_font_size').value = RR.config.options.treeFontSize || null;
    document.getElementById('tree_font_name').value = RR.config.options.treeFontName || null;
    // callbacks
    document.getElementById('tree_width').addEventListener('change', RR.pageSettings.onTreeWidthChange);
    document.getElementById('tree_font_size').addEventListener('change', RR.pageSettings.onTreeFontChange);
    document.getElementById('tree_font_name').addEventListener('change', RR.pageSettings.onTreeFontChange);
    document.getElementById('clear').addEventListener('click', RR.pageSettings.onClear);
    document.getElementById('export').addEventListener('click', RR.pageSettings.onExport);
    document.getElementById('import').addEventListener('click', RR.pageSettings.onImport);
    document.getElementById('ebook').addEventListener('click', RR.pageSettings.onEbook);
    // size of data
    RR.pageSettings.showSizes();
    // update font preview
    RR.pageSettings.onTreeFontChange();
};

RR.pageSettings.isExtensionPageOpen = function (aPage, aIsOpenCallback, aNotOpenCallback) {
    // test if extension page is open
    chrome.tabs.query({}, function (tabs) {
        var i, id = chrome.runtime.id, o = false;
        for (i = 0; i < tabs.length; i++) {
            if (tabs[i].url === 'chrome-extension://' + id + '/' + aPage) {
                o = true;
                if (aIsOpenCallback) {
                    aIsOpenCallback(aPage, tabs[i]);
                }
            }
        }
        if ((!o) && aNotOpenCallback) {
            aNotOpenCallback(aPage, tabs[i]);
        }
    });
};

document.addEventListener('DOMContentLoaded', RR.pageSettings.onLoad);
