// Initialize counter when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ callCount: 0 });
    console.log('[Background] Extension installed');
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('onMessage', message);
    // Handle credential API calls
    if (message.type === 'CREDENTIAL_API_CALL') {
        // Get current count from storage and increment
        chrome.storage.local.get(['callCount'], (result) => {
            const newCount = (result.callCount || 0) + 1;
            // Update storage
            chrome.storage.local.set({ callCount: newCount }, () => {
                // Update badge
                chrome.action.setBadgeText({
                    text: newCount.toString()
                });
                chrome.action.setBadgeBackgroundColor({
                    color: '#4CAF50'
                });
            });
        });
    }
    // Handle log messages
    else if (message.type === 'LOG') {
        const source = sender.tab ? 'Content' : 'Popup';
        console.log(`[${source}]`, message.message);
    }
}); 