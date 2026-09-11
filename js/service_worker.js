// Background script
// linter: ngspicejs-lint --browser
// global: chrome
"use strict";

let myPageTabId = null;

chrome.action.onClicked.addListener(async () => {
    if (myPageTabId !== null) {
        try {
          await chrome.tabs.update(myPageTabId, { active: true });
          const tab = await chrome.tabs.get(myPageTabId);
          await chrome.windows.update(tab.windowId, { focused: true });
          return;
        } catch (e) {
          myPageTabId = null;
        }
    }
    const tab = await chrome.tabs.create({
        url: chrome.runtime.getURL("reader.html")
    });
    myPageTabId = tab.id;
});
