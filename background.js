// background.js
chrome.runtime.onInstalled.addListener(function() {
    console.log("Finmap Bot Extension installed");
  });
  
  // Keep track of the active tab
  chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      if (tab.url && tab.url.includes('https://my.finmap.online/log')) {
        chrome.action.setIcon({path: "images/icon48.png"});
      } else {
        chrome.action.setIcon({path: "images/icon48.png"});
      }
    });
  });
  
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('https://my.finmap.online/log')) {
      chrome.action.setIcon({path: "images/icon48.png"});
    } else if (changeInfo.status === 'complete') {
      chrome.action.setIcon({path: "images/icon48.png"});
    }
  });