import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';

const log = getLogger('background');

/**
 * AttackHookSyncLogin is a subclass of AttackHook that simulates synchronous login behavior
 * for WebAuthn credential creation and retrieval. It responds to credential creation and
 * get requests by returning the original credential from the request message.
 *
 * @extends AttackHook
 */
export class AttackHookSyncLogin extends AttackHook {
    getName() {
        return 'attack-sync-login';
    }

    /**
     * Handles the creation of credentials in response to a WebAuthn request.
     *
     * @param {WebAuthnRequestMessage} msg - The incoming WebAuthn request message containing credential creation details.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, typically the Chrome extension runtime.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to a response message with the created credential or an error message.
     */
    async onCredentialCreate(msg, sender) {
        return {
            type: 'create_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        };
    }

    /**
     * Handles the retrieval of credentials for a WebAuthn request.
     *
     * @param {WebAuthnRequestMessage} msg - The incoming WebAuthn request message containing credential information.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, typically the Chrome extension runtime.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to either a WebAuthn response message or an error message.
     */
    async onCredentialGet(msg, sender) {
        return {
            type: 'sign_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        }
    }
}