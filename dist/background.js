// Initialize counter when extension is installed
// chrome.runtime.onInstalled.addListener(() => {
//     chrome.storage.local.set({ callCount: 0 });
//     console.log('[Background] Extension installed');
// });
import { AttackHookNone } from './attacks/attack_hook_none';
// import { getLogger } from './logging.js';
// const log = getLogger('background');
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed');
});
// Needs to be stored in local
let attackType = null; // Initialize as null
// Initialize attack type when service worker starts. Put in on message receive, because I know the service will start up then if it is idle, but there might be a better way.
// async function refreshAttackType() {
//     chrome.storage.local.get(['attackType'], (result) => {
//         if (result.attackType) {
//             convertAttackToHook(result.attackType);
//         } else {
//             // Default to none if nothing in storage
//             attackType = new AttackHookNone();
//             chrome.storage.local.set({ attackType: 'none' });
//         }
//     });
// }
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
//         console.log(details.url);
//         if (details.url === "https://testbank.com:8443/api/v1/authenticate/finish") {
//             console.log("Request sent to the specified URL:", details.url);
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
//               console.log("Detected 2FAA URL");
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
    console.log('In create');
    if (!sender.tab || !sender.tab.id) {
        console.log('received create event without a tab ID');
        return;
    }
    if (!attackType) {
        await getAttackType();
    }
    return await attackType.onCredentialCreate(msg, sender);
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
    // if (!sender.tab || !sender.tab.id) {
    //     console.log('received sign event without a tab ID');
    //     return;
    // }
    // if (!attackType) {
    //     await getAttackType();
    // }
    // return await attackType!.onCredentialGet(msg, sender);    
};
function convertAttackToHook(attackName) {
    // switch(attackName) {
    //     case 'attack-mis-binding':
    //         attackType = new AttackHookNone();
    //         break;
    //     case 'attack-double-binding1':
    //         attackType = new AttackHookNone();
    //         break;
    //     case 'attack-double-binding2':
    //         attackType = new AttackHookNone();
    //         break;
    //     case 'attack-clone-detection':
    //         attackType = new AttackHookNone();
    //         break;
    //     case 'attack-sync-login':
    //         attackType = new AttackHookNone();
    //         break;
    //     default:
    //         attackType = new AttackHookNone();
    //         break;
    // }
}
async function setAttackImpl(attackName) {
    convertAttackToHook(attackName);
    // Save to local storage
    await setAttackType(attackName);
    // This may change passToOrig depending on attack type. Send message to the back if needed
    await sendPassToOrigValue();
}
async function sendPassToOrigValue() {
    // let passToOrig = true;
    // if (!attackType) {
    //     await getAttackType();
    // }
    // console.log("SEND FUNCT", attackType!.getName());
    // if (attackType!.getName() === 'attack-double-binding2') {
    //     passToOrig = false;
    //     console.log("INFAAAAAAAAAAAAAAALLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLSSSSSSSSSSSSEEEEEEEE");
    // }
    // console.log("value of passToOrig passed from back", passToOrig)
    // chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    //     var activeTab = tabs[0];
    //     if (activeTab.id) {
    //         chrome.tabs.sendMessage(activeTab.id, { message: 'passToOrig', val: passToOrig});
    //     } else {
    //         console.log("BROKEN FUNCTIONALITY")
    //     }
    // });
}
function getAttackType() {
    // return new Promise((resolve) => {
    //     if (attackType) {
    //         resolve(attackType);
    //     } else {
    //         chrome.storage.local.get(['attackType'], (attackName) => {
    //             if (attackName) {
    //                 convertAttackToHook(attackName);
    //             } else {
    //                 attackType = new AttackHookNone();
    //                 chrome.storage.local.set({ attackType: 'none' });
    //             }
    //             resolve(attackType);
    //         });
    //     }
    // });
}
async function setAttackType(attackName) {
    await chrome.storage.local.set({ attackType: attackName });
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log('Received form data:', msg);
    try {
        attackType = new AttackHookNone();
        console.log('Successfully created AttackHookNone instance');
    }
    catch (error) {
        console.error('Error creating AttackHookNone:', error);
    }
    // (async () => { await refreshAttackType(); })();
    // console.log('Attack type:', attackType?.getName());
    (async () => {
        switch (msg.type) {
            case 'attack-type-change':
                // Use IIFE (listeners can't be async)
                await setAttackImpl(msg.newAttackType);
                break;
            case 'attack-type-get':
                // Make sure attackType is available in memory
                await getAttackType();
                sendResponse({
                    type: 'attack-type-get-response',
                    // attackType: attackType!.getName()
                });
                break;
            case 'create':
                create(msg, sender).then(sendResponse);
                break;
            case 'sign':
                sign(msg, sender).then(sendResponse);
                break;
            case 'getPassToOrig':
                sendPassToOrigValue();
                break;
            default:
                sendResponse(null);
        }
    })();
    return true;
});
