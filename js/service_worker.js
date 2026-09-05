// Background script
// linter: ngspicejs-lint --browser
// global: chrome
"use strict";

function openOrFocusExtensionPage(pagePath) {
    const fullUrl = chrome.runtime.getURL(pagePath);
    //console.log(fullUrl);
    chrome.tabs.query({
        url: fullUrl + '*'
    }, (tabs) => {
        //console.log(tabs);
        if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {
                active: true
            });
            chrome.windows.update(tabs[0].windowId, {
                focused: true
            });
        } else {
            chrome.tabs.create({
                url: pagePath
            });
        }
    });
}

chrome.action.onClicked.addListener(() => {
    openOrFocusExtensionPage('reader.html');
});
