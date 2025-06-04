export class AttackHook {
    onNetwork(details) {
        return { cancel: false };
    }
    async onCredentialCreate(msg, sender) {
        throw new Error('onCredentialCreate not implemented');
    }
    async onCredentialGet(msg, sender) {
        throw new Error('onCredentialGet not implemented');
    }
    getName() {
        throw new Error('getName not implemented');
    }
}
