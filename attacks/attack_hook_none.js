import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';

const log = getLogger('background');

/**
 * An implementation of the AttackHook interface that performs no attack or modification.
 * This class simply passes through the original credentials in response to WebAuthn requests.
 *
 * @extends AttackHook
 */
export class AttackHookNone {
    getName() {
        return 'attack-none';
    }

    /**
     * Handles the creation of credentials in response to a WebAuthn request.
     *
     * @param {WebAuthnRequestMessage} msg - The incoming WebAuthn request message.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to a WebAuthn response or error message.
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
     * @param {WebAuthnRequestMessage} msg - The incoming WebAuthn request message.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to a WebAuthn response or error message.
     */
    async onCredentialGet(msg, sender) {
        return {
            type: 'sign_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        }
    }
}