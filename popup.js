// Helper function to send logs to background script
function log(message) {
    chrome.runtime.sendMessage({
        type: 'LOG',
        message: message
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the counter display and reset button
    const counterDisplay = document.getElementById('counter');
    const resetBtn = document.getElementById('resetBtn');
    const radioButtons = document.querySelectorAll('input[name="attackType"]');

    // Update counter display from storage
    chrome.storage.local.get(['callCount', 'attackType'], (result) => {
        counterDisplay.textContent = result.callCount || 0;
        
        // Set the saved attack type if it exists
        if (result.attackType) {
            const radio = document.querySelector(`input[value="${result.attackType}"]`);
            if (radio) {
                radio.checked = true;
                log(`Current attack type: ${result.attackType}`);
            }
        }
    });

    // Handle reset button click
    resetBtn.addEventListener('click', function() {
        chrome.storage.local.set({ callCount: 0 }, () => {
            counterDisplay.textContent = '0';
            chrome.action.setBadgeText({ text: '0' });
            log('Counter reset to 0');
        });
    });

    // Handle radio button changes
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.storage.local.set({ attackType: e.target.value }, () => {
                    log(`Attack type changed to: ${e.target.value}`);
                });
            }
        });
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.callCount) {
                counterDisplay.textContent = changes.callCount.newValue;
                log(`Counter updated to: ${changes.callCount.newValue}`);
            }
            if (changes.attackType && changes.attackType.newValue !== changes.attackType.oldValue) {
                const radio = document.querySelector(`input[value="${changes.attackType.newValue}"]`);
                if (radio) radio.checked = true;
            }
        }
    });
});