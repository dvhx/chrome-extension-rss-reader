// saving and loading configuration to/from local storage
// linter: ngspicejs-lint --browser
// global: SC
"use strict";

var RR = RR || {};

RR.config = (function () {
    var self = {};
    self.tree = [];
    self.options = {
        treeWidth: '300px',
        treeFontSize: null,
        treeFontName: null
    };

    self.fromObject = function (aObject) {
        // get values from other object
        self.tree = aObject.tree;
        self.options = aObject.options;
    };

    self.save = function () {
        // save config to local storage
        var o = { 'tree': self.tree, 'options': self.options };
        localStorage.setItem('config', JSON.stringify(o));
    };

    self.load = function () {
        // load config from local storage
        var o;
        self.tree = [];
        if (localStorage.hasOwnProperty('config')) {
            o = JSON.parse(localStorage.getItem('config'));
            self.tree = o.tree;
            self.options = o.options || self.options;
        }
        // if empty use initial tree
        if (!self.tree.length) {
            console.log('Using initial RSS tree');
            self.tree = RR.initial.slice();
        }
    };

    self.export = function () {
        // export settings to external json file
        var tmp;
        tmp = {
            options: self.options,
            tree: self.tree,
            read: RR.read.read,
            feeds: RR.rss.feeds.all
        };
        return SC.download(JSON.stringify(tmp, undefined, 1), 'rssreader.json');
    };

    self.import = function () {
        // import configuration from external json file
        SC.chooseFiles(function (aFiles) {
            var j;
            try {
                j = JSON.parse(aFiles[0].data);
                self.fromObject(j);
                RR.read.read = j.read;
                RR.read.save();
                RR.rss.feeds.all = j.feeds;
                RR.rss.feeds.save();
                self.tree = j.tree;
                self.options = j.options;
                self.save();
                alert('Imported ' + Object.keys(RR.rss.feeds.all).length + ' feeds');
                return true;
            } catch (e) {
                console.error(j);
                console.error(e);
                alert('Import failed, invalid or incomplete data!\n' + e.message ? e.message : '');
                return false;
            }
        }, '.json', true);
    };

    self.load();

    return self;
}());
