import { AttackHook } from './attack_hook';
import { getLogger } from '../logging';
import { byteArrayToBase64, getOriginFromUrl, prepareWebauthnCreateRequest, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';
import { AttackHookNone } from './attack_hook_none';
import { DoubleBindingImplementationJavaTestServer } from './double_binding_implementations/double_binding_implementation_java_test_server';
import { AttackHookDoubleBinding } from './attack_hook_double_binding';
import { AttackHookMisBindingAllowLogin } from './attack_hook_mis_binding_allow_login';
import { incrementCounter } from '../storage';

const log = getLogger('background');

export class AttackHookCloneDetection extends AttackHookMisBindingAllowLogin {
    keyCount = 0;
    errorShown = false;

    getName() {
        return 'attack-clone-detection';
    }

    async onCredentialGet(msg, sender) {
        if(!this.errorShown) {
            console.log("Innnn ifff of keyCount");
            const opts = webauthnParse(msg.options);
            
            // From webauthn.ts:128
            const requestedCredential = opts.publicKey.allowCredentials[0];
            // From webauthn.ts:130
            const keyIDArray = requestedCredential.id;
            // From webauthn.ts:132
            const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);

            await incrementCounter(keyID, '9999', -1);
            this.errorShown = true;
        }

        return await super.onCredentialGet(msg, sender);
    }
}
