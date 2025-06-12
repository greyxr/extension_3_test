import * as CBOR from 'cbor';
import { getCompatibleKey, getCompatibleKeyFromCryptoKey} from './crypto';
// import { getLogger } from './logging';
import { fetchCounter, fetchKey, incrementCounter, keyExists, saveKey } from './storage';
import { base64ToByteArray, byteArrayToBase64, getDomainFromOrigin } from './utils';

// const log = getLogger('webauthn');

const DIRECT_ATTESTATION_ERROR = 'We are being requested to create a key with "direct" attestation\nWe can only perform self-attestation, therefore we will not be provisioning any keys';
const NO_KEYS_REQUESTED_ERROR = 'No keys requested';

function logHelper(...msg: any[]): void {
    console.log('[Webauthn] ', msg);
}

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


export const generateRegistrationKeyAndAttestation = async (
    origin: string,
    publicKeyCreationOptions: PublicKeyCredentialCreationOptions,
    pin: string,
    main_id,
    rawId,
): Promise<PublicKeyCredential> => {
    if (publicKeyCreationOptions.attestation === 'direct') {
        logHelper(DIRECT_ATTESTATION_ERROR);
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
    logHelper('key ID', keyID);
    logHelper('key ID type', typeof keyID);
    logHelper('pub key cred params', publicKeyCreationOptions.pubKeyCredParams);
    const compatibleKey = await getCompatibleKey(publicKeyCreationOptions.pubKeyCredParams);

    const authenticatorData = await compatibleKey.generateAuthenticatorData(rpID, 10, rawId);
    const clientData = await compatibleKey.generateClientData(
        publicKeyCreationOptions.challenge as ArrayBuffer,
        { origin, type: 'webauthn.create', crossOrigin: false },
    );

    logHelper('client Data', clientData);
    logHelper('rpID passed to crypto function', rpID);

    const clientDataDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    // const clientDataHash = new TextDecoder("utf-8").decode(new Uint8Array(clientDataDigest));
    const clientDataHash = new Uint8Array(clientDataDigest);

    logHelper('original hash', clientDataHash);
    logHelper('authenticator Data', Buffer.from(authenticatorData).toString('hex'));
    logHelper('authenticator Data', new TextDecoder('utf-8').decode(authenticatorData));
    logHelper('authenticator Data uint8', authenticatorData);

    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    logHelper('merged Data uint8', mergedArray);

    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

    const attestationObject_buffer = CBOR.encode({
        attStmt: {
            // alg: compatibleKey.algorithm,
            // sig: Buffer.from(signature),
        },
        authData: Buffer.from(authenticatorData),
        fmt: 'none',
    });
    console.log('stepp 6');

    // .buffer might break this
    const attestationObject = new Uint8Array(attestationObject_buffer.buffer);
    logHelper('raw attestation object', attestationObject);

    // Now that we have built all we need, let's save the key
    await saveKey(keyID, compatibleKey.privateKey, pin);

    return {
        getClientExtensionResults: () => ({}),
        id: keyID,
        rawId: base64ToByteArray(keyID, true),
        response: {
            attestationObject,
            clientDataJSON: base64ToByteArray(btoa(clientData), true),
        },
        type: 'public-key',
    } as unknown as PublicKeyCredential;
};

export const generateKeyRequestAndAttestation = async (
    origin: string,
    publicKeyRequestOptions: PublicKeyCredentialRequestOptions,
    pin: string,
    originalCredential: string | null = null
): Promise<Credential> => {
    logHelper('In authentication function1');
    if (!publicKeyRequestOptions.allowCredentials) {
        logHelper(NO_KEYS_REQUESTED_ERROR);
        throw new NoKeysRequestedError();
    }

    let keyID;
    if (originalCredential) {
        // Ignore allowCredentials as it will be a passkey
        logHelper("Passkey route with original credential", originalCredential)
        const originalCredentialObject = JSON.parse(originalCredential)
        logHelper("Original credential", originalCredentialObject)
        // const keyIDArray: ArrayBuffer = originalCredentialObject.id as ArrayBuffer;
        keyID = byteArrayToBase64(new Uint8Array(originalCredentialObject.id))
        logHelper("keyID", keyID)
    } else {
        logHelper("U2F route")
        // For now we will only worry about the first entry
        const requestedCredential = publicKeyRequestOptions.allowCredentials[0];
        logHelper(requestedCredential);
        const keyIDArray: ArrayBuffer = requestedCredential.id as ArrayBuffer;
        logHelper('In authentication function1.2', keyIDArray);
        const keyID = byteArrayToBase64(new Uint8Array(keyIDArray), true);
        logHelper('In authentication function1.3', keyID);
    }
    const keyIDArray = new ArrayBuffer(keyID) // Hacky but will work for now
    const key = await fetchKey(keyID, pin);

    logHelper('In authentication function2');

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
    logHelper('In authentication function3');

    const rpID = publicKeyRequestOptions.rpId || getDomainFromOrigin(origin);
    const authenticatorData = await compatibleKey.generateAuthenticatorData(
      rpID,
      await fetchCounter(keyID, pin),
      Array.from(keyID),
    );
    const clientDataDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientData));
    const clientDataHash = new Uint8Array(clientDataDigest);

    // Increment counter
    await incrementCounter(keyID, pin);

    const mergedArray = new Uint8Array(authenticatorData.length + clientDataHash.length);
    mergedArray.set(authenticatorData);
    mergedArray.set(clientDataHash, authenticatorData.length);
    logHelper('merged array', mergedArray);

    const signature = await compatibleKey.DER_encode_signature(await compatibleKey.sign(mergedArray));

    return {
        id: keyID,
        rawId: keyIDArray,
        response: {
            authenticatorData,
            clientDataJSON: base64ToByteArray(btoa(clientData), true),
            signature,
            // userHandle: new ArrayBuffer(0), // This should be nullable
            userHandle: null
        },
        type: 'public-key',
    } as Credential;
};
