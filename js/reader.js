// Callbacks for reader.html
"use strict";
// globals: document, window, VP, URL, setTimeout, localStorage, chrome, setInterval

var RR = RR || {};
RR.readerPage = {};
RR.readerPage.activeItem = null;
RR.readerPage.itemIndex = 0;
RR.readerPage.visibleItems = [];
RR.readerPage.TEMPORARY_LIMIT = 40;

RR.readerPage.treeItemClick = function (aItem) {
    // Click on tree item
    RR.readerPage.activeItem = aItem;
    // show folder/feed with number of items (in upper right corner)
    var n, p, ri;
    n = aItem.items ? ' (' + RR.readerPage.tree.totalFeeds(aItem.items) + ')' : '';
    document.getElementById('main_heading').innerText = aItem.text + n;
    p = RR.readerPage.tree.parent(aItem);
    RR.readerPage.refreshFolders();
    document.getElementById('folder_select').value = p ? p.text : RR.readerPage.tree.data[0].text;
    document.getElementById('remove_sel').disabled = false;
    document.getElementById('edit_text').disabled = false;
    document.getElementById('edit_url').disabled = !aItem.url;
    // refresh interval
    ri = document.getElementById('refresh_interval');
    ri.disabled = !aItem.url;
    ri.url = aItem.url;
    ri.value = null;
    if (aItem.url) {
        ri.value = RR.rss.feeds.getInterval(aItem.url);
    }
    // last update
    if (aItem.lastUpdate) {
        document.getElementById('last_update').innerText = 'Last update: ' + VP.date.human(aItem.lastUpdate);
    } else {
        document.getElementById('last_update').innerText = ''; // Last update: ' + 'never';
    }
    // set hash (for bookmarking)
    document.location.hash = aItem.text;
    // refresh
    RR.readerPage.onRefreshCurrent();
};

RR.readerPage.splitterCallback = function (aSplitter, aNewWidth) {
    // remember resized splitter
    console.log(aSplitter);
    document.getElementById('main_content').style.marginLeft = aNewWidth;
    document.getElementById('main_footer').style.marginLeft = aNewWidth;
    RR.config.options.treeWidth = aNewWidth;
    RR.config.save();
};

RR.guessFeedName = function (aUrl) {
    // guess feed name from url
    var u = new URL(aUrl),
        s = u.hostname,
        t;
    if (u.pathname) {
        t = u.pathname.split('/').slice(-1)[0].split('.')[0];
        if (!t) {
            t = u.pathname.split('/').slice(-2)[0].split('.')[0];
        }
        s += ' ' + t;
    }
    return s.trim();
};

RR.readerPage.onAddNewFeed = function () {
    // add new feed (subscribe)
    var url, u, parent = RR.readerPage.tree.parent(RR.readerPage.activeItem), text;
    // if nothing is selected, add to root element
    if (!RR.readerPage.activeItem) {
        RR.readerPage.activeItem = RR.readerPage.tree.data[0];
    }
    // if folder is selected, add to folder, not it's parent
    if (RR.readerPage.activeItem.items) {
        parent = RR.readerPage.activeItem;
    }
    // ask for url
    url = prompt('Add new feed to "' + parent.text + '"', 'https://').trim();
    if (url) {
        // convert url of youtube channel to rss feed
        if (url.match(/https:\/\/www\.youtube\.com\/channel\/[a-zA-Z0-9_\-]+/)) {
            if (confirm('This looks like youtube channel (html page). Would you like to use RSS of this youtube channel instead?')) {
                url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + url.split('/').slice(-1)[0];
            }
        }

        // parse url
        try {
            u = new URL(url);
        } catch (e) {
            console.warn(e);
            alert('Invalid URL! URL must start with http:// or https://');
            return;
        }
        if (RR.readerPage.tree.urlExists(u.href)) {
            alert('This feed is already in the tree\n' + u.href);
            return false;
        }

        // label
        text = prompt('New feed label', RR.guessFeedName(url));
        if (text) {
            parent.items.push({ 'text': text, 'url': url });
            RR.readerPage.tree.renderAll();
            RR.config.save();
        }
    }
};

RR.readerPage.onAddNewFolder = function () {
    // add new folder
    var text,
        parent = RR.readerPage.tree.parent(RR.readerPage.activeItem);
    text = prompt('Add new folder to "' + (parent ? parent.text : '/') + '"', 'New folder');
    if (!text) {
        return false;
    }
    if (parent) {
        parent.items.push({ 'text': text, items: [], closed: false });
    } else {
        RR.readerPage.tree.data.push({ 'text': text, items: [], closed: false });
    }
    RR.readerPage.tree.renderAll();
    RR.config.save();
};

RR.readerPage.onRefreshAll = function () {
    // refresh tree
    RR.readerPage.tree.renderAll();
    RR.readerPage.refreshFolders();
};

RR.readerPage.onMeter = function (aRemaining, aMax) {
    // update progress meter
    document.body.style.cursor = aRemaining > 0 ? 'progress' : 'default';
    var meter = document.getElementById('meter');
    if (aMax) {
        meter.max = aMax;
    }
    meter.value = meter.max - aRemaining;
    if (aRemaining === 0) {
        meter.className = 'hide';
        if (document.getElementById('main_footer').innerText === 'Wait please...') {
            document.getElementById('main_footer').innerText = '';
        }
    } else {
        meter.className = 'show';
        document.getElementById('main_footer').innerText = 'Wait please...';
    }
};

RR.readerPage.onRender = function (aReceivedFeeds) {
    // render received feeds
    // console.log(aReceivedFeeds);
    var f, i, mc = document.getElementById('main_content'), old, mode = document.getElementById('mode').value,
        tree_title, tree_titles = {}, displayed_count = 0, ignored_count = 0;
    RR.readerPage.visibleItems = [];
    // all feeds
    for (f = 0; f < aReceivedFeeds.length; f++) {
        RR.readerPage.visibleItems.push(aReceivedFeeds[f]);
        // all items
        for (i = 0; i < aReceivedFeeds[f].items.length; i++) {
            old = RR.read.isOld(aReceivedFeeds[f].local.url, aReceivedFeeds[f].items[i].guid);
            if ((mode === 'all') || ((mode === 'unread') && (!old))) {
                // find title used in tree (may be different that title reported by feed itself) + caching
                tree_title = null;
                if (!tree_titles.hasOwnProperty(aReceivedFeeds[f].local.url)) {
                    tree_title = RR.readerPage.tree.findItemByUrl(aReceivedFeeds[f].local.url);
                    if (tree_title) {
                        tree_title = tree_title.text;
                        tree_titles[aReceivedFeeds[f].local.url] = tree_title;
                    } else {
                        console.log('This can happen when reading just-unsubscribed feed item');
                    }
                } else {
                    tree_title = tree_titles[aReceivedFeeds[f].local.url];
                }
                //console.log('tree_title=' + tree_title);
                //console.log(tree_title);
                if (displayed_count < RR.readerPage.TEMPORARY_LIMIT) {
                    displayed_count++;
                    RR.render(
                        mc,
                        aReceivedFeeds[f].items[i],
                        aReceivedFeeds[f].local.url,
                        tree_title,
                        old,
                        aReceivedFeeds[f].header.link
                    );
                } else {
                    ignored_count++;
                }
                //console.log(aReceivedFeeds[f].header);
            }
        }
    }
    document.getElementById('main_footer').innerText = 'First ' + displayed_count + ' items displayed, ' + ignored_count + ' items ignored';
};

RR.readerPage.onRefreshCurrent = function (event) {
    // refresh active part of tree
    //console.log('RR.readerPage.onRefreshCurrent', event);
    var i,
        urls = RR.readerPage.tree.urls(RR.readerPage.activeItem),
        mc = document.getElementById('main_content'),
        hours,
        interval,
        previous,
        f,
        delta,
        min_delta = 999,
        min_delta_url = '',
        seconds = 0;
    // custom refresh
    if (event && event.ctrlKey) {
        seconds = prompt('Refresh every X seconds', 60);
        if (seconds > 0) {
            seconds = parseInt(seconds, 10);
            setInterval(function () {
                console.log('Periodic refresh every', seconds, 'seconds');
                RR.readerPage.onRefreshCurrent({shiftKey: true});
            }, seconds * 1000);
            event = {shiftKey: true};
        }
    }
    // clear main content
    mc.innerHTML = '';
    // meter
    RR.readerPage.onMeter(urls.length, urls.length);
    // set receiving counter (will reach zero when everything will be received)
    RR.receive.remaining = urls.length;
    RR.receive.received = [];
    // request all feeds
    previous = [];
    for (i = 0; i < urls.length; i++) {
        hours = RR.rss.feeds.getHourAge(urls[i]);
        interval = RR.rss.feeds.getInterval(urls[i]);
        delta = interval - hours;
        if ((delta > 0) && (delta < min_delta)) {
            min_delta = delta;
            min_delta_url = urls[i];
        }
        //console.log('refresh: ' + urls[i] + ' last updated ' + hours + ' hours ago, desired interval is ' + interval);
        if ((hours >= interval) || (event && event.shiftKey)) {
            // actual refresh
            VP.ajax(urls[i], RR.receive.receiveXml,
                {
                    url: urls[i],
                    render: RR.readerPage.onRender,
                    meter: RR.readerPage.onMeter
                }, false);
            // update data
            RR.rss.feeds.setDate(urls[i], new Date());
        } else {
            // just show previous data
            RR.receive.remaining--;
            f = RR.rss.feeds.findByUrl(urls[i]);
            if (f) {
                previous.push(f);
            }
        }
    }
    // render previous data (may contain unread items)
    if (previous.length > 0) {
        RR.readerPage.onRender(previous);
        RR.readerPage.onMeter(0, urls.length);
    }
    //console.log('Next actual refresh will be in ' + min_delta.toFixed(2) + ' hours (' + min_delta_url + ')');
};

RR.readerPage.hasActiveItem = function () {
    // return true if any item is selected
    if (!RR.readerPage.activeItem) {
        alert('Select feed or folder first');
        return false;
    }
    return true;
};

RR.readerPage.onRemoveSel = function () {
    // remove selected item
    if (!RR.readerPage.hasActiveItem) {
        return false;
    }
    var
        parent = RR.readerPage.tree.parent(RR.readerPage.activeItem),
        n;
    n = RR.readerPage.activeItem.items ? '\n(' + RR.readerPage.tree.totalFeeds(RR.readerPage.activeItem.items) + ' feeds will be removed)' : '';
    if (confirm('Really remove "' + RR.readerPage.activeItem.text + '" from "' + parent.text + '"' + n)) {
        RR.readerPage.tree.remove(RR.readerPage.activeItem);
        RR.readerPage.tree.renderAll();
        RR.config.save();
    }
};

RR.readerPage.onEditText = function () {
    // rename item
    if (!RR.readerPage.hasActiveItem) {
        return false;
    }
    var s = prompt('Rename item', RR.readerPage.activeItem.text);
    if (s) {
        RR.readerPage.activeItem.text = s;
        RR.readerPage.tree.renderAll();
        RR.readerPage.refreshFolders();
        RR.config.save();
    }
};

RR.readerPage.onEditUrl = function () {
    // change item url
    if (!RR.readerPage.hasActiveItem) {
        return false;
    }
    if (!RR.readerPage.activeItem.url) {
        alert('Folders does not have URL');
        return false;
    }
    var s = prompt('Change URL', RR.readerPage.activeItem.url);
    if (s) {
        RR.readerPage.activeItem.url = s;
        RR.readerPage.tree.renderAll();
        RR.readerPage.refreshFolders();
        RR.config.save();
    }
};

RR.readerPage.refreshFolders = function () {
    // fill select with folders
    var fs = document.getElementById('folder_select'),
        i,
        opt,
        parent = RR.readerPage.tree.parent(RR.readerPage.activeItem),
        folders = RR.readerPage.tree.folders(RR.readerPage.tree.data[0], RR.readerPage.activeItem);
    fs.innerHTML = '';
    for (i = 0; i < folders.length; i++) {
        opt = document.createElement('option');
        opt.innerText = folders[i];
        if (folders[i] === parent.text) {
            opt.style.color = 'blue';
        }
        fs.appendChild(opt);
    }
    fs.disabled = false;
    if (folders.length === 0) {
        opt = document.createElement('option');
        opt.innerText = RR.readerPage.tree.data.length > 0 ? RR.readerPage.tree.data[0].text : '';
        fs.appendChild(opt);
        fs.disabled = true;
    }
};

RR.readerPage.onRefreshIntervalChange = function () {
    // change refresh interval for selected feed
    RR.rss.feeds.setInterval(this.url, this.value);
    RR.rss.feeds.save();
};

RR.readerPage.onFolderChange = function () {
    // move feed or folder to another folder
    var old, new_parent, tv = this.value;
    setTimeout(function () {
        var parent = RR.readerPage.tree.parent(RR.readerPage.activeItem);
        if (RR.readerPage.activeItem === RR.readerPage.tree.data[0]) {
            alert('Root item cannot be moved');
            return false;
        }
        if (confirm('Move feed(s) "' + RR.readerPage.activeItem.text + '" from "' + parent.text + '" to "' + tv + '"')) {
            // find parent item from folder name
            new_parent = RR.readerPage.tree.findItemByText(tv);
            if (!new_parent) {
                alert('Cannot find item "' + tv + '"');
                return false;
            }
            // remove from tree
            old = RR.readerPage.activeItem;
            RR.readerPage.tree.remove(RR.readerPage.activeItem);
            // insert into new parent
            new_parent.items.push(old);
            RR.readerPage.tree.renderAll();
            RR.readerPage.refreshFolders();
            RR.config.save();
        }
    }, 200);
};

RR.readerPage.onBodyKeyPress = function (event) {
    // handle shortcuts
    var inputs;
    //console.log(event.keyCode);
    // m = mark/unmark
    if (event.keyCode === 109) {
        inputs = document.getElementsByTagName('input');
        inputs[RR.readerPage.itemIndex].focus();
        inputs[RR.readerPage.itemIndex].checked = !inputs[RR.readerPage.itemIndex].checked;
    }
    // n = next item
    if (event.keyCode === 110) {
        RR.readerPage.itemIndex++;
        inputs = document.getElementsByTagName('input');
        if (RR.readerPage.itemIndex >= inputs.length) {
            RR.readerPage.itemIndex = inputs.length - 1;
        }
        inputs[RR.readerPage.itemIndex].parentNode.scrollIntoView();
        inputs[RR.readerPage.itemIndex].focus();
    }
    // p = previous item
    if (event.keyCode === 112) {
        RR.readerPage.itemIndex--;
        inputs = document.getElementsByTagName('input');
        if (RR.readerPage.itemIndex <= 0) {
            RR.readerPage.itemIndex = 0;
        }
        inputs[RR.readerPage.itemIndex].parentNode.scrollIntoView();
        inputs[RR.readerPage.itemIndex].focus();
    }
};

RR.readerPage.onMarkAllAsRead = function () {
    // mark all visible items as read
    var i, cnt = 0, chb;
    // if there is temporary limit use visual components
    if (RR.readerPage.TEMPORARY_LIMIT) {
        chb = document.getElementsByClassName('mark_as_read_checkbox');
        cnt = chb.length;
        // confirm
        if (confirm('Mark all ' + cnt + ' items items as read?')) {
            // mark all as read
            for (i = 0; i < chb.length; i++) {
                // check the checbox
                chb[i].checked = true;
                // call the event on it
                RR.renderMarkAsRead(chb[i]);
            }
            // refresh
            RR.readerPage.onRefreshCurrent();
        }
    } else {
        // find total amount of items visible
        for (i = 0; i < RR.readerPage.visibleItems.length; i++) {
            cnt += RR.readerPage.visibleItems[i].items.length;
        }
        // confirm
        if (confirm('Mark all ' + cnt + ' items in ' + RR.readerPage.visibleItems.length + ' feeds as read?')) {
            // mark all as read
            RR.read.markAllAsRead(RR.readerPage.visibleItems, true);
            RR.readerPage.onRefreshCurrent();
        }
    }
};

RR.readerPage.onShowExtra = function () {
    // show/hide extra
    var extra = document.getElementById('extra');
    if (extra.style.display === 'block') {
        extra.style.display = 'none';
    } else {
        extra.style.display = 'block';
    }
};

RR.readerPage.onLoad = function () {
    // initialization
    // close settings if open
    chrome.tabs.query({ url: 'chrome-extension://' + chrome.runtime.id + '/settings.html' },
        function (tabs) { if (tabs.length > 0) { chrome.tabs.remove(tabs[0].id); } });
    // restore mode
    document.getElementById('mode').value = localStorage.hasOwnProperty('mode') ? localStorage.getItem('mode') : 'unread';
    // load tree
    RR.readerPage.tree = new RR.Tree('tree', RR.readerPage.treeItemClick);
    RR.readerPage.tree.data = RR.config.tree;
    RR.readerPage.tree.renderAll();
    RR.readerPage.refreshFolders();
    RR.readerPage.splitter = new RR.Splitter('splitter', 'tree-container', RR.config.options.treeWidth || '300px', RR.readerPage.splitterCallback);
    document.getElementById('main_content').style.marginLeft = RR.config.options.treeWidth || '300px';
    document.getElementById('main_footer').style.marginLeft = RR.config.options.treeWidth || '300px';
    // tree font
    if (RR.config.options.treeFontName) {
        RR.readerPage.tree.root.style.fontFamily = RR.config.options.treeFontName;
    }
    if (RR.config.options.treeFontSize) {
        RR.readerPage.tree.root.style.fontSize = RR.config.options.treeFontSize;
    }
    // select first item
    if (document.location.hash) {
        var hi, h = document.location.hash.substr(1);
        //console.log('Location hash: ' + h);
        if (h) {
            RR.readerPage.tree.activateAfterRefresh(h);
        }
        try {
            hi = RR.readerPage.tree.findItemByText(h);
            if (!hi) {
                console.log('Location hash not found, using root');
                hi = RR.readerPage.tree.data[0];
            }
            RR.readerPage.treeItemClick(hi);
        } catch (e) {
            console.log('Location hash no longer exist');
            console.log(e);
        }
    } else {
        // selecting root item
        setTimeout(function () {
            RR.readerPage.treeItemClick(RR.readerPage.tree.data[0]);
        }, 300);
    }
    // button callbacks
    document.getElementById('add_new_feed').addEventListener('click', RR.readerPage.onAddNewFeed);
    document.getElementById('add_new_folder').addEventListener('click', RR.readerPage.onAddNewFolder);
    //document.getElementById('refresh_all').addEventListener('click', RR.readerPage.onRefreshAll);
    document.getElementById('refresh_current').addEventListener('click', RR.readerPage.onRefreshCurrent);
    document.getElementById('remove_sel').addEventListener('click', RR.readerPage.onRemoveSel);
    document.getElementById('edit_text').addEventListener('click', RR.readerPage.onEditText);
    document.getElementById('edit_url').addEventListener('click', RR.readerPage.onEditUrl);
    document.getElementById('mark_all_as_read').addEventListener('click', RR.readerPage.onMarkAllAsRead);
    document.getElementById('show_extra').addEventListener('click', RR.readerPage.onShowExtra);
    // folder select callback
    document.getElementById('folder_select').addEventListener('change', RR.readerPage.onFolderChange);
    // refresh interval callback
    document.getElementById('refresh_interval').addEventListener('change', RR.readerPage.onRefreshIntervalChange);
    // shortcuts
    document.body.addEventListener('keypress', RR.readerPage.onBodyKeyPress);
    // mode callback
    document.getElementById('mode').addEventListener('change', RR.readerPage.onRefreshCurrent);
};

// set onload callback
window.addEventListener("load", RR.readerPage.onLoad);

