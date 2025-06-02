import * as CBOR from 'cbor';
import { getCompatibleKey, getCompatibleKeyFromCryptoKey} from './crypto';
import { getLogger } from './logging';
import { fetchCounter, fetchKey, incrementCounter, keyExists, saveKey } from './storage';
import { base64ToByteArray, byteArrayToBase64, getDomainFromOrigin } from './utils';

const log = getLogger('webauthn');

const DIRECT_ATTESTATION_ERROR = 'We are being requested to create a key with "direct" attestation\nWe can only perform self-attestation, therefore we will not be provisioning any keys';
const NO_KEYS_REQUESTED_ERROR = 'No keys requested';

export class DirectAttestationError extends Error {
    constructor() {
        super(DIRECT_ATTESTATION_ERROR);
    }
}

export class NoKeysRequestedError extends Error {
    constructor() {
        super(NO_KEYS_REQUESTED_ERROR);
    }
}


// export const generateRegistrationKeyAndAttestation2 = async (
//     origin: string,
//     publicKeyCreationOptions: PublicKeyCredentialCreationOptions,
//     pin: string,
// ): Promise<PublicKeyCredential> => {
//     if (publicKeyCreationOptions.attestation === 'direct') {
//         log.warn('We are being requested to create a key with "direct" attestation');
//         log.warn(`We can only perform self-attestation, therefore we will not be provisioning any keys`);
//         return null;
//     }
//     const rp = publicKeyCreationOptions.rp;
//     const rpID = rp.id || getDomainFromOrigin(origin);
//     const user = publicKeyCreationOptions.user;
//     const userID = byteArrayToBase64(new Uint8Array(user.id as ArrayBuffer));
//     // Generate a random string
//     const randomString = Math.random().toString(36).substr(2, 8);
//     const keyID = window.btoa(`${userID}@${rpID}_${randomString}`);

//     // First check if there is already a key for this rp ID
//     if (await keyExists(keyID)) {
//         throw new Error(`key with id ${keyID} already exists`);
//     }
//     log.debug('key ID', keyID);
//     const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);

//     // TODO Increase key counter
//     const authenticatorData = await compatibleKey.generateAuthenticatorData2(rpID, 10);
//     const clientData = await compatibleKey.generateClientData(
//         publicKeyCreationOptions.challenge as ArrayBuffer,
//         { origin, type: 'webauthn.create' },
//     );
    

//     log.debug('client Data', clientData);
//     log.debug('rpID passed to crypto function', rpID);

//     const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
//     // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
//     const clientDataHash = new Uint8Array(clientDataDigest);

//     log.debug('original hash', clientDataHash);
//     log.debug('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
//     log.debug('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
//     log.debug('authenticator Data uint8', authenticatorData);

//     const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
//     mergedArray.set(authenticatorData);
//     mergedArray.set(clientDataHash, authenticatorData.length);
//     log.debug('merged Data uint8', mergedArray);

//     const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

//     const attestationObject = CBOR.encodeCanonical({
//         attStmt: {
//             alg: compatibleKey.algorithm,
//             sig: signature,
//         },
//         authData: authenticatorData,
//         fmt: 'packed',
//     }).buffer;

//     // Now that we have built all we need, let's save the key
//     await saveKey(keyID, compatibleKey.privateKey, pin);

//     return {
//         getClientExtensionResults: () => ({}),
//         id: keyID,
//         rawId: base64ToByteArray(keyID),
//         response: {
//             attestationObject,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData)),
//         },
//         type: 'public-key',
//     } as PublicKeyCredential;
// };


export const generateRegistrationKeyAndAttestation = async (
    origin: string,
    publicKeyCreationOptions: PublicKeyCredentialCreationOptions,
    pin: string,
    main_id,
    rawId,
): Promise<PublicKeyCredential> => {
    if (publicKeyCreationOptions.attestation === 'direct') {
        log.warn(DIRECT_ATTESTATION_ERROR);
	    throw new DirectAttestationError();
    }

    const CKEY_ID = new Uint8Array(rawId); // new Uint8Array([
                    // 36, 65, 66, 13, 125, 104, 97, 45, 53, 176, 41, 199, 63, 83, 90, 66, 239, 228, 27, 183]);

    const rp = publicKeyCreationOptions.rp;
    const rpID = rp.id || getDomainFromOrigin(origin);
    const user = publicKeyCreationOptions.user;
    const userID = byteArrayToBase64(new Uint8Array(user.id as ArrayBuffer), true);

    const keyID = byteArrayToBase64(CKEY_ID, true);

    // First check if there is already a key for this rp ID
    if (await keyExists(keyID)) {
        throw new Error(`key with id ${keyID} already exists`);
    }
    log.debug('key ID', keyID);
    log.debug('key ID type', typeof keyID);
    log.debug('pub key cred params', publicKeyCreationOptions.pubKeyCredParams);
    const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);

    const authenticatorData = await compatibleKey.generateAuthenticatorData(rpID, 10, rawId);
    const clientData = await compatibleKey.generateClientData(
        publicKeyCreationOptions.challenge as ArrayBuffer,
        { origin, type: 'webauthn.create' },
    );

    log.debug('client Data', clientData);
    log.debug('rpID passed to crypto function', rpID);

    const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
    const clientDataHash = new Uint8Array(clientDataDigest);

    log.debug('original hash', clientDataHash);
    log.debug('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
    log.debug('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
    log.debug('authenticator Data uint8', authenticatorData);

    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    log.debug('merged Data uint8', mergedArray);

    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

    const attestationObject_buffer = CBOR.encodeCanonical({
        attStmt: {
            alg: compatibleKey.algorithm,
            sig: signature,
        },
        authData: authenticatorData,
        fmt: 'packed',
    });
    log.debug('stepp 6');

    const attestationObject = new Uint8Array(attestationObject_buffer);
    log.debug('raw attestation object', attestationObject);

    // Now that we have built all we need, let's save the key
    await saveKey(keyID, compatibleKey.privateKey, pin);

    return {
        getClientExtensionResults: () => ({}),
        id: keyID,
        rawId: base64ToByteArray(keyID, true),
        response: {
            attestationObject,
            clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
        },
        type: 'public-key',
    } as PublicKeyCredential;
};

// function str2ab(str) {
//   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
//   var bufView = new Uint16Array(buf);
//   for (var i=0, strLen=str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }

export const generateKeyRequestAndAttestation = async (
    origin: string,
    publicKeyRequestOptions: PublicKeyCredentialRequestOptions,
    pin: string,
): Promise<Credential> => {
    log.debug('In authentication function1');
    if (!publicKeyRequestOptions.allowCredentials) {
        log.debug(NO_KEYS_REQUESTED_ERROR);
        throw new NoKeysRequestedError();
    }
    // For now we will only worry about the first entry
    const requestedCredential = publicKeyRequestOptions.allowCredentials[0];
    log.debug(requestedCredential);
    const keyIDArray: ArrayBuffer = requestedCredential.id as ArrayBuffer;
    log.debug('In authentication function1.2', keyIDArray);
    const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);
    log.debug('In authentication function1.3', keyID);
    const key = await fetchKey(keyID, pin);

    log.debug('In authentication function2');

    if (!key) {
        throw new Error(`key with id ${keyID} not found`);
    }
    const compatibleKey = await getCompatibleKeyFromCryptoKey(key);
    const clientData = await compatibleKey.generateClientData(
        publicKeyRequestOptions.challenge as ArrayBuffer,
        {
            origin,
            type: 'webauthn.get',
        },
    );
    log.debug('In authentication function3');

    const rpID = publicKeyRequestOptions.rpId || getDomainFromOrigin(origin);
    const authenticatorData = await compatibleKey.generateAuthenticatorData(
      rpID,
      await fetchCounter(keyID, pin),
      Array.from(new Uint8Array(keyIDArray)),
    );
    const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    const clientDataHash = new Uint8Array(clientDataDigest);

    // Increment counter
    await incrementCounter(keyID, pin);

    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    log.debug('merged array', mergedArray);

    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

    return {
        id: keyID,
        rawId: keyIDArray,
        response: {
            authenticatorData,
            clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
            signature,
            // userHandle: new ArrayBuffer(0), // This should be nullable
            userHandle: null
        },
        type: 'public-key',
    } as Credential;
};
