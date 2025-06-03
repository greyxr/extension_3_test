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

    // Initialize popup state
    chrome.runtime.sendMessage({ type: 'attack-type-get-2' }, (response) => {
        if (response && response.attackType) {
            const radio = document.querySelector(`input[value="${response.attackType}"]`);
            if (radio) {
                radio.checked = true;
                log(`Current attack type: ${response.attackType}`);
            }
        }
    });

    // Update counter display from storage
    chrome.storage.local.get(['callCount'], (result) => {
        counterDisplay.textContent = result.callCount || 0;
    });

    // Handle radio button changes
    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                chrome.runtime.sendMessage(
                    { 
                        type: 'attack-type-change', 
                        newAttackType: e.target.value 
                    }, 
                    (response) => {
                        if (response && response.success) {
                            log(`Attack type changed to: ${e.target.value}`);
                        } else {
                            log(`Error changing attack type: ${response?.error || 'unknown error'}`);
                        }
                    }
                );
            }
        });
    });

    // Handle reset button if it exists
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: 'reset-counter' }, (response) => {
                if (response && response.success) {
                    counterDisplay.textContent = '0';
                    log('Counter reset to 0');
                }
            });
        });
    }

    // Listen for storage changes (for counter updates from other contexts)
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.callCount) {
                counterDisplay.textContent = changes.callCount.newValue;
                log(`Counter updated to: ${changes.callCount.newValue}`);
            }
        }
    });
});