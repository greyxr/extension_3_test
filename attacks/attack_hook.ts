import { WebAuthnRequestMessage, WebAuthnResponseMessage, WebAuthnErrorMessage } from "../types/types";

export class AttackHook {
    onNetwork(details): chrome.webRequest.BlockingResponse {
        return { cancel: false };
    }

    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        throw new Error('onCredentialCreate not implemented');
    }

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        throw new Error('onCredentialGet not implemented');
    }

    getName(): string {
        throw new Error('getName not implemented');
    }
}