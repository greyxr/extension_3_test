"use strict";
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);
// Listen for messages from the injected script
window.addEventListener('message', function (event) {
    // Only accept messages from the same window
    if (event.source !== window)
        return;
    if (event.data) {
        // Relay the message to the background script
        chrome.runtime.sendMessage(event.data);
    }
});
