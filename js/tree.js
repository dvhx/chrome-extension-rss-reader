// Hierarchical tree and its rendering in HTML list
"use strict";
// globals: document

var RR = RR || {};

RR.Tree = function (aRoot, aItemClick) {
    var self = {};
    self.root = typeof aRoot === 'string' ? document.getElementById(aRoot) : aRoot;
    self.clickTimeStamp = null;
    self.itemClick = aItemClick; // function (aItem)
    self.data = [];

    self.onItemClick = function (event) {
        // click on item or folder
        // console.log(this.item);
        event.cancelBubble = true;
        // remove "active" from previous and set new active
        var a = document.getElementsByClassName('active');
        if (a.length) {
            a[0].classList.remove('active');
        }
        this.classList.add('active');
        // call user callback
        self.itemClick(this.item);
    };

    self.onItemDblClick = function (event) {
        // double click on item or folder
        console.log('Tree.onItemDblClick: ' + this.item.text);
        event.cancelBubble = true;
        this.item.closed = !this.item.closed;
        self.renderAll();
        RR.config.save();
        //self.itemDblClick(this.item);
    };

    self.renderIndex = 0;

    self.totalFeeds = function (aItems) {
        // return total number of feeds in items (recursively)
        var t = 0, i;
        for (i = 0; i < aItems.length; i++) {
            if (aItems[i].items) {
                t += self.totalFeeds(aItems[i].items);
            } else {
                t += 1;
            }
        }
        return t;
    };

    self.findItemByText = function (aText, aItems) {
        // find item by text
        var i, r;
        aItems = aItems || self.data;
        for (i = 0; i < aItems.length; i++) {
            //console.log(aItems[i].text);
            if (aItems[i].text === aText) {
                return aItems[i];
            }
            if (aItems[i].items) {
                r = self.findItemByText(aText, aItems[i].items);
                if (r) {
                    return r;
                }
            }
        }
        return null;
    };

    self.findItemByUrl = function (aUrl, aItems) {
        // find item by text
        var i, r;
        aItems = aItems || self.data;
        for (i = 0; i < aItems.length; i++) {
            //console.log(aItems[i].text);
            if (aItems[i].url === aUrl) {
                return aItems[i];
            }
            if (aItems[i].items) {
                r = self.findItemByUrl(aUrl, aItems[i].items);
                if (r) {
                    return r;
                }
            }
        }
        return null;
    };

    self.urls = function (aItem) {
        // return just the urls (search recursively but return flat)
        var t = [], i, j, l;
        if (aItem.url) {
            t.push(aItem.url);
        }
        if (aItem.items) {
            for (i = 0; i < aItem.items.length; i++) {
                if (aItem.items[i].items) {
                    l = self.urls(aItem.items[i]);
                    for (j = 0; j < l.length; j++) {
                        t.push(l[j]);
                    }
                } else {
                    t.push(aItem.items[i].url);
                }
            }
        }
        return t;
    };

    self.folders = function (aItem, aSkipItem) {
        // return just the folders (search recursively but return flat)
        var t = [], i, j, l;
        aItem = aItem || self.data[0];
        if (!aItem) {
            return t;
        }
        //console.log('item='+aItem+' skipitem='+aSkipItem+' match='+(aItem === aSkipItem));
        if (aItem === aSkipItem) {
            //console.log('skip: '+aItem);
            return t;
        }
        if (aItem.items) {
            t.push(aItem.text);
        }
        if (aItem.items) {
            for (i = 0; i < aItem.items.length; i++) {
                if (aItem.items[i].items) {
                    l = self.folders(aItem.items[i], aSkipItem);
                    for (j = 0; j < l.length; j++) {
                        t.push(l[j]);
                    }
                }
            }
        }
        return t;
    };

    self.urlExists = function (aUrl) {
        // return true if URL already exists
        return self.urls(self.data[0]).indexOf(aUrl) >= 0;
    };

    function parentFolder(aItem, aItems, aParent) {
        // return first parent folder
        var i, r;
        aItems = aItems || self.data;
        for (i = 0; i < aItems.length; i++) {
            if (aItems[i] === aItem) {
                //console.log('--> found '+aItem.text);
                return aParent;
            }
            if (aItems[i].items) {
                //console.log('folder "'+aItems[i].text+'"');
                r = parentFolder(aItem, aItems[i].items, aItems[i]);
                if (r) {
                    return r;
                }
            }
        }
        return r;
    }

    self.parent = function (aItem) {
        // return parent or root
        return parentFolder(aItem) || self.data[0];
    };

    self.remove = function (aItem) {
        // remove item from tree
        var i, p = self.parent(aItem);
        if (!p.items) {
            throw "Parent has no items or item not found";
        }
        for (i = 0; i < p.items.length; i++) {
            if (p.items[i] === aItem) {
                return p.items.splice(i, 1);
            }
        }
        throw "Item not found";
    };

    self.render = function (aItems, aParent) {
        // render HTML tree using ul and li
        var i, li, ul;
        aParent = aParent || self.root;

        aParent.innerHTML = '';
        for (i = 0; i < aItems.length; i++) {
            li = document.createElement('li');
            self.renderIndex++;
            li.id = 'tree_li_' + self.renderIndex;
            li.text = aItems[i].text;
            li.url = aItems[i].url;
            li.item = aItems[i];
            li.innerText = aItems[i].text + (aItems[i].value ? ' (' + aItems[i].value + ')' : '');
            li.title = aItems[i].url;
            li.addEventListener('dblclick', self.onItemDblClick, false);
            li.addEventListener('click', self.onItemClick, false);
            li.style.fontWeight = 'normal';
            if (aItems[i].value) {
                li.style.fontWeight = 'bold';
            }
            aParent.appendChild(li);
            // subitems
            if (aItems[i].items) {
                li.url = null;
                if (aItems[i].closed) {
                    li.className = 'folder';
                } else {
                    li.className = 'folder open';
                    //li.onclick = self.onFolderClick;
                    //li.addEventListener('click', self.onFolderClick, false);
                    ul = document.createElement('ul');
                    li.appendChild(ul);
                    self.render(aItems[i].items, ul);
                }
            }
        }
    };

    self.renderAll = function () {
        self.render(self.data);
    };

    self.activateAfterRefresh = function (aText) {
        // after refresh, this restore selected item to be "active"
        var
            li = self.root.getElementsByTagName('li'),
            i;
        for (i = 0; i < li.length; i++) {
            if (li[i].text === aText) {
                li[i].classList.add('active');
            }
        }
    };

    return self;
};

