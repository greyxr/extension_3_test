import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';

const log = getLogger('background');

/**
 * AttackHookDoubleBinding1 is a subclass of AttackHook that simulates a double-binding attack
 * by returning the original credential in both credential creation and assertion flows.
 *
 * @class AttackHookDoubleBinding1
 * @extends AttackHook
 *
 * @method getName
 * @returns {string} The unique name of the attack hook.
 *
 * @method onCredentialCreate
 * @async
 * @param {WebAuthnRequestMessage} msg - The WebAuthn request message.
 * @param {chrome.runtime.MessageSender} sender - The sender of the message.
 * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} The response message containing the original credential.
 *
 * @method onCredentialGet
 * @async
 * @param {WebAuthnRequestMessage} msg - The WebAuthn request message.
 * @param {chrome.runtime.MessageSender} sender - The sender of the message.
 * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} The response message containing the original credential.
 */
export class AttackHookDoubleBinding1 extends AttackHook {
    getName() {
        return 'attack-double-binding1';
    }

    async onCredentialCreate(msg, sender) {
        return {
            type: 'create_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        };
    }

    async onCredentialGet(msg, sender) {
        return {
            type: 'sign_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        }
    }
}