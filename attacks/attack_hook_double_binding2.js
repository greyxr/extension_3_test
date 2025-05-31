import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';
import { getOriginFromUrl, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';

const log = getLogger('background');

export class AttackHookDoubleBinding2 extends AttackHook {
    getName() {
        return 'attack-double-binding2';
    }

    /**
     * Handles network requests and performs actions based on the request URL.
     * Specifically, if the request is made to the '/u2f/registrations' endpoint,
     * it sends a message to the active tab's content script to reload the page.
     *
     * @param {chrome.webRequest.WebRequestBodyDetails} details - The details of the intercepted web request.
     * @returns {chrome.webRequest.BlockingResponse} An object indicating whether the request should be blocked or not.
     */
    onNetwork(details) {
        const url = new URL(details.url);

        if(url.pathname === '/u2f/registrations') {
            console.log("FOUnd rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
            console.log("telling content_script to reload page");
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                var activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, { message: 'reloadPage'});
            });

            // const formData = details.requestBody.formData;
            // Retrieve the desired value from the FormData
            // this.registerAuthenticityToken = details.requestBody.formData["authenticity_token"][0];
            // this.registerAuthenticityToken = details.registerAuthenticityToken;
        }
        return { cancel: false };
    }

    /**
     * Handles the creation of a WebAuthn credential with a randomly modified ID.
     *
     * This function receives a WebAuthn credential creation request, mutates a base credential ID
     * by replacing a random character with a different random character, encodes it, and uses it
     * to generate a registration key and attestation. It returns the credential response or an error message.
     *
     * @async
     * @param {WebAuthnRequestMessage} msg - The WebAuthn credential creation request message.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, containing the origin URL.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} The response message containing the credential or an error message.
     */
    async onCredentialCreate(msg, sender) {
        const origin = getOriginFromUrl(sender.url);

        const base_id = "AnIB9pkhUNufJjJTZlqDR8GRnb5da3EyPhpjKziRD-kko5s6UApVD8XhslDULfRXlBtvDocwbPCHoEo2wzBSww";
       
        // Generate a random index within the length of the string
        const randomIndex = Math.floor(Math.random() * base_id.length);
        // Get the character at the random index
        const originalCharacter = base_id.charAt(randomIndex);
        // Generate a random replacement character different from the original
        let replacementCharacter;
        do {
          replacementCharacter = String.fromCharCode(Math.floor(Math.random() * 256));
        } while (replacementCharacter === originalCharacter); // Ensure the replacement is different from the original
        // Replace the character at the random index with the replacement character
        const id = base_id.slice(0, randomIndex) + replacementCharacter + base_id.slice(randomIndex + 1);
        // Create a TextEncoder instance
        const textEncoder = new TextEncoder();

        const rawId = textEncoder.encode(id) //Array.from(new Uint8Array(id));

        try {
            const opts = webauthnParse(msg.options);
            log.debug(msg);
            const credential = await generateRegistrationKeyAndAttestation(
                origin,
                opts.publicKey,
                '9999',
                id,
                rawId,
            );

            log.debug('create credential');
            log.debug(credential);
            log.debug(webauthnStringify(credential));
            log.debug('RE PARSE ', webauthnParse(webauthnStringify(credential)));
            return {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'create_response',
            };
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                log.error('failed to import key due to DOMException', { code, message, name }, e);
            } else {
                log.error('failed to import key', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e.toString()
            };
        }
    }

    /**
     * Handles a WebAuthn credential get (sign) request.
     *
     * @async
     * @param {WebAuthnRequestMessage} msg - The message containing WebAuthn request options and metadata.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, including tab and URL information.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to a WebAuthn response message or an error message.
     */
    async onCredentialGet(msg, sender) {
        const origin = getOriginFromUrl(sender.url);
        const opts = webauthnParse(msg.options);

        log.debug(opts);
        // const pin = await requestPin(sender.tab.id, origin);
        log.debug('Origin in background sign function', origin);

        try {
            const credential = await generateKeyRequestAndAttestation(origin, opts.publicKey, `9999`);
            const authenticatedResponseData = {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'sign_response',
            };
            log.debug(msg);
            log.debug('auth credential');
            log.debug(credential);
            log.debug(webauthnStringify(credential));
            return authenticatedResponseData;
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                log.error('failed to sign due DOMException', { code, message, name }, e);
            } else {
                log.error('failed to sign', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e.toString()
            };
        }
    }
}