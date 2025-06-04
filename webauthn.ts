import * as CBOR from 'cbor';
import { getCompatibleKey, getCompatibleKeyFromCryptoKey} from './crypto';
// import { fetchCounter, fetchKey, incrementCounter, keyExists, saveKey } from './storage';
import { keyExists, saveKey } from './storage';
import { base64ToByteArray, byteArrayToBase64, getDomainFromOrigin } from './utils';

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
//         console.log('We are being requested to create a key with "direct" attestation');
//         console.log(`We can only perform self-attestation, therefore we will not be provisioning any keys`);
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
//     console.log('key ID', keyID);
//     const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);

//     // TODO Increase key counter
//     const authenticatorData = await compatibleKey.generateAuthenticatorData2(rpID, 10);
//     const clientData = await compatibleKey.generateClientData(
//         publicKeyCreationOptions.challenge as ArrayBuffer,
//         { origin, type: 'webauthn.create' },
//     );
    

//     console.log('client Data', clientData);
//     console.log('rpID passed to crypto function', rpID);

//     const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
//     // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
//     const clientDataHash = new Uint8Array(clientDataDigest);

//     console.log('original hash', clientDataHash);
//     console.log('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
//     console.log('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
//     console.log('authenticator Data uint8', authenticatorData);

//     const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
//     mergedArray.set(authenticatorData);
//     mergedArray.set(clientDataHash, authenticatorData.length);
//     console.log('merged Data uint8', mergedArray);

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
        console.log(DIRECT_ATTESTATION_ERROR);
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
    console.log('key ID', keyID);
    console.log('key ID type', typeof keyID);
    console.log('pub key cred params', publicKeyCreationOptions.pubKeyCredParams);
    const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);

    const authenticatorData = await compatibleKey.generateAuthenticatorData(rpID, 10, rawId);
    const clientData = await compatibleKey.generateClientData(
        publicKeyCreationOptions.challenge as ArrayBuffer,
        { origin, type: 'webauthn.create' },
    );

    console.log('client Data', clientData);
    console.log('rpID passed to crypto function', rpID);

    const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
    const clientDataHash = new Uint8Array(clientDataDigest);

    console.log('original hash', clientDataHash);
    console.log('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
    console.log('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
    console.log('authenticator Data uint8', authenticatorData);

    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    console.log('merged Data uint8', mergedArray);

    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

    const attestationObject_buffer = CBOR.encodeCanonical({
        attStmt: {
            alg: compatibleKey.algorithm,
            sig: signature,
        },
        authData: authenticatorData,
        fmt: 'packed',
    });
    console.log('stepp 6');

    // .buffer might break this
    const attestationObject = new Uint8Array(attestationObject_buffer.buffer);
    console.log('raw attestation object', attestationObject);

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
    } as unknown as PublicKeyCredential;
};

// function str2ab(str) {
//   var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
//   var bufView = new Uint16Array(buf);
//   for (var i=0, strLen=str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }

// export const generateKeyRequestAndAttestation = async (
//     origin: string,
//     publicKeyRequestOptions: PublicKeyCredentialRequestOptions,
//     pin: string,
// ): Promise<Credential> => {
//     console.log('In authentication function1');
//     if (!publicKeyRequestOptions.allowCredentials) {
//         console.log(NO_KEYS_REQUESTED_ERROR);
//         throw new NoKeysRequestedError();
//     }
//     // For now we will only worry about the first entry
//     const requestedCredential = publicKeyRequestOptions.allowCredentials[0];
//     console.log(requestedCredential);
//     const keyIDArray: ArrayBuffer = requestedCredential.id as ArrayBuffer;
//     console.log('In authentication function1.2', keyIDArray);
//     const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);
//     console.log('In authentication function1.3', keyID);
//     const key = await fetchKey(keyID, pin);

//     console.log('In authentication function2');

//     if (!key) {
//         throw new Error(`key with id ${keyID} not found`);
//     }
//     const compatibleKey = await getCompatibleKeyFromCryptoKey(key);
//     const clientData = await compatibleKey.generateClientData(
//         publicKeyRequestOptions.challenge as ArrayBuffer,
//         {
//             origin,
//             type: 'webauthn.get',
//         },
//     );
//     console.log('In authentication function3');

//     const rpID = publicKeyRequestOptions.rpId || getDomainFromOrigin(origin);
//     const authenticatorData = await compatibleKey.generateAuthenticatorData(
//       rpID,
//       await fetchCounter(keyID, pin),
//       Array.from(new Uint8Array(keyIDArray)),
//     );
//     const clientDataDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
//     const clientDataHash = new Uint8Array(clientDataDigest);

//     // Increment counter
//     await incrementCounter(keyID, pin);

//     const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
//     mergedArray.set(authenticatorData);
//     mergedArray.set(clientDataHash, authenticatorData.length);
//     console.log('merged array', mergedArray);

//     const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

//     return {
//         id: keyID,
//         rawId: keyIDArray,
//         response: {
//             authenticatorData,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
//             signature,
//             // userHandle: new ArrayBuffer(0), // This should be nullable
//             userHandle: null
//         },
//         type: 'public-key',
//     } as Credential;
// };
