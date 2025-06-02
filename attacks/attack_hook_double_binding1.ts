import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';

const log = getLogger('background');

export class AttackHookDoubleBinding1 extends AttackHook {
    getName(): string {
        return 'attack-double-binding1';
    }

    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        return {
            type: 'create_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        };
    }

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        return {
            type: 'sign_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        }
    }
}