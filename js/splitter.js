// Splitter (allow resize elements using mouse)
// NOTE: not really the splitter I wanted but for now it is good enough
"use strict";
// globals: document

var RR = RR || {};

RR.Splitter = function (aIdOrElement, aTargetIdOrElement, aDefaultWidth, aCallback) {
    var self = {};
    self.splitter = typeof aIdOrElement === 'string' ? document.getElementById(aIdOrElement) : aIdOrElement;
    self.splitter.innerHTML = '&nbsp;';
    self.splitter.style.height = (document.body.clientHeight - 20) + 'px';
    self.target = typeof aTargetIdOrElement === 'string' ? document.getElementById(aTargetIdOrElement) : aTargetIdOrElement;
    self.target.style.width = aDefaultWidth;

    self.onMouseDown = function () {
        var w = self.target.style.width || self.target.clientWidth + 'px',
            nw = prompt('New width (e.g. 200px, 20%)', w);
        if (nw) {
            self.target.style.width = nw;
            aCallback(self, nw);
        }
    };

    self.splitter.addEventListener('mousedown', self.onMouseDown);
    return self;
};

