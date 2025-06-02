import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';

const log = getLogger('background');

export class AttackHookSyncLogin extends AttackHook {
    getName(): string {
        return 'attack-sync-login';
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