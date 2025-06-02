import { AttackHook } from './attack_hook';
// import { disabledIcons, enabledIcons } from '../constants';
import { getLogger } from '../logging';
import { byteArrayToBase64, getOriginFromUrl, prepareWebauthnCreateRequest, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';
import { AttackHookNone } from './attack_hook_none';
import { DoubleBindingImplementationJavaTestServer } from './double_binding_implementations/double_binding_implementation_java_test_server';
import { AttackHookDoubleBinding } from './attack_hook_double_binding';
import { AttackHookMisBindingAllowLogin } from './attack_hook_mis_binding_allow_login';
import { incrementCounter } from '../storage';
import { WebAuthnErrorMessage, WebAuthnRequestMessage, WebAuthnResponseMessage } from '../types';

const log = getLogger('background');

export class AttackHookCloneDetection extends AttackHookMisBindingAllowLogin {
    keyCount = 0;
    errorShown = false;

    getName(): string {
        return 'attack-clone-detection';
    }

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        if(!this.errorShown) {
            console.log("Innnn ifff of keyCount");
            const opts = webauthnParse(msg.options);
            
            // From webauthn.ts:128
            const requestedCredential = opts.publicKey.allowCredentials[0];
            // From webauthn.ts:130
            const keyIDArray: ArrayBuffer = requestedCredential.id as ArrayBuffer;
            // From webauthn.ts:132
            const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);

            await incrementCounter(keyID, '9999', -1);
            this.errorShown = true;
        }

        return await super.onCredentialGet(msg, sender);
    }
}
