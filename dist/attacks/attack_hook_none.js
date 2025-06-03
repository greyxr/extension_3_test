import { AttackHook } from './attack_hook.js';
export class AttackHookNone extends AttackHook {
    getName() {
        return 'attack-none';
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
        };
    }
}
