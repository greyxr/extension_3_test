import * as CBOR from 'cbor'
import { base64ToByteArray, byteArrayToBase64 } from './utils';

// Generated with pseudo random values via
// https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
/*export const CKEY_ID = new Uint8Array([
    194547236, 76082241, 3628762690, 4137210381,
    1214244733, 1205845608, 840015201, 3897052717,
    4072880437, 4027233456, 675224361, 2305433287,
    74291263, 3461796691, 701523034, 3178201666,
    3992003567, 1410532, 4234129691, 1438515639,
]);*/

// export const CKEY_ID = new Uint8Array([
//     36, 65, 66, 13, 125, 104, 97, 45, 53, 176, 41, 199, 63, 83, 90, 66, 239, 228, 27, 183]);

// Copied from krypton
function counterToBytes(c: number): Uint8Array {
    const bytes = new Uint8Array(4);
    // Sadly, JS TypedArrays are whatever-endian the platform is,
    // so Uint32Array is not at all useful here (or anywhere?),
    // and we must manually pack the counter (big endian as per spec).
    bytes[0] = 0xFF & c >>> 24;
    bytes[1] = 0xFF & c >>> 16;
    bytes[2] = 0xFF & c >>> 8;
    bytes[3] = 0xFF & c;
    return bytes;
}

const coseEllipticCurveNames: { [s: number]: string } = {
    1: 'SHA-256',
    2: 'SHA-384',
    3: 'SHA-512',
};

const ellipticNamedCurvesToCOSE: { [s: string]: number } = {
    'P-256': -7,
    'P-384': -35,
    'P-512': -36,
};

interface ICOSECompatibleKey {
    algorithm: number;
    privateKey: CryptoKey;
    publicKey?: CryptoKey;
    generateClientData(challenge: ArrayBuffer, extraOptions: any): Promise<string>;
    generateAuthenticatorData(rpID: string, counter: number, rawId): Promise<Uint8Array>;
    // generateAuthenticatorData2(rpID: string, counter: number): Promise<Uint8Array>;
    sign(clientData: Uint8Array): Promise<any>;
    DER_encode_signature(signature): Promise<any>;
}

// interface DERCompatibleKey {
//     algorithm: number;
//     privateKey: CryptoKey;
//     publicKey?: CryptoKey;
//     generateClientData(challenge: ArrayBuffer, extraOptions: any): Promise<string>;
//     generateAuthenticatorData(rpID: string, counter: number, rawId): Promise<Uint8Array>;
//     sign(clientData: Uint8Array): Promise<any>;
// }


export const CKEY_ID2 = new Uint8Array([
    194547236, 76082241, 3628762690, 4137210381,
    1214244733, 1205845608, 840015201, 3897052717,
    4072880437, 4027233456, 675224361, 2305433287,
    74291263, 3461796691, 701523034, 3178201666,
    3992003567, 1410532, 4234129691, 1438515639,
]);

class ECDSA implements ICOSECompatibleKey {

    public static async fromKey(key: CryptoKey): Promise<ECDSA> {
        return new ECDSA(ellipticNamedCurvesToCOSE[(key.algorithm as EcKeyAlgorithm).namedCurve], key);
    }

    public static async fromCOSEAlgorithm(algorithm: number): Promise<ECDSA> {
        // Creating the key
        let namedCurve: string | null = null
        for (const k in ellipticNamedCurvesToCOSE) {
            if (ellipticNamedCurvesToCOSE[k] === algorithm) {
                namedCurve = k;
                break;
            }
        }
        if (!namedCurve) {
            throw new Error(`could not find a named curve for algorithm ${algorithm}`);
        }
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDSA', namedCurve },
            true,
            ['sign'],
        );
        return new ECDSA(algorithm, keyPair.privateKey, keyPair.publicKey);
    }

    /**
     * This maps a COSE algorithm ID https://www.iana.org/assignments/cose/cose.xhtml#algorithms
     * to its respective COSE curve ID // Based on https://tools.ietf.org/html/rfc8152#section-13.1.
     */
    private static ellipticCurveKeys: { [s: number]: number } = {
        [-7]: 1,
        [-35]: 2,
        [-36]: 3,
    };

    constructor(
        public algorithm: number,
        public privateKey: CryptoKey,
        public publicKey?: CryptoKey,
    ) {
        if (!(algorithm in ECDSA.ellipticCurveKeys)) {
            throw new Error(`unknown ECDSA algorithm ${algorithm}`);
        }
    }

    public async generateClientData(challenge: ArrayBuffer, extraOptions: any): Promise<string> {
        return JSON.stringify({
            challenge: byteArrayToBase64(Buffer.from(challenge), true),
            hashAlgorithm: coseEllipticCurveNames[ECDSA.ellipticCurveKeys[this.algorithm]],
            ...extraOptions,
        });
    }



// public async generateAuthenticatorData2(rpID: string, counter: number): Promise<Uint8Array> {
//         const rpIdDigest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpID));
//         const rpIdHash = new Uint8Array(rpIdDigest);

//         // CKEY_ID2 is a HAD-specific ID
//         let aaguid: Uint8Array;
//         let credIdLen: Uint8Array;
//         let encodedKey: Uint8Array;

//         let authenticatorDataLength = rpIdHash.length + 1 + 4;
//         if (this.publicKey) {
//             aaguid = CKEY_ID2.slice(0, 16);
//             // 16-bit unsigned big-endian integer.
//             credIdLen = new Uint8Array(2);
//             credIdLen[0] = (CKEY_ID2.length >> 8) & 0xff;
//             credIdLen[1] = CKEY_ID2.length & 0xff;
//             const coseKey = await this.toCOSE(this.publicKey);
//             encodedKey = new Uint8Array(CBOR.encode(coseKey));
//             authenticatorDataLength += aaguid.length
//                 + credIdLen.byteLength
//                 + CKEY_ID2.length
//                 + encodedKey.byteLength;
//         }

//         const authenticatorData = new Uint8Array(authenticatorDataLength);
//         let offset = 0;

//         // 32 bytes for the RP ID hash
//         authenticatorData.set(rpIdHash, 0);
//         offset += rpIdHash.length;

//         // 1 byte for flags
//         // user-presence flag goes on the right-most bit
//         authenticatorData[rpIdHash.length] = 1;
//         if (this.publicKey) {
//             // attestation flag goes on the 7th bit (from the right)
//             authenticatorData[rpIdHash.length] |= (1 << 6);
//             offset++;
//         }

//         // 4 bytes for the counter. big-endian uint32
//         // https://www.w3.org/TR/webauthn/#signature-counter
//         authenticatorData.set(counterToBytes(counter), offset);
//         offset += counterToBytes(counter).length;

//         if (!this.publicKey) {
//             return authenticatorData;
//         }

//         // 16 bytes for the Authenticator Attestation GUID
//         authenticatorData.set(aaguid, offset);
//         offset += aaguid.length;

//         // 2 bytes for the authenticator key ID length. 16-bit unsigned big-endian integer.
//         authenticatorData.set(credIdLen, offset);
//         offset += credIdLen.byteLength;

//         // Variable length authenticator key ID
//         authenticatorData.set(CKEY_ID2, offset);
//         offset += CKEY_ID2.length;

//         // Variable length public key
//         authenticatorData.set(encodedKey, offset);

//         return authenticatorData;
//     }

// All below need to be fixed
    public async generateAuthenticatorData(rpID: string, counter: number, rawId ): Promise<Uint8Array> {
        const rpIdDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpID));
        const CKEY_ID = new Uint8Array(rawId);
        const rpIdHash = new Uint8Array(rpIdDigest);

        // CKEY_ID is a HAD-specific ID
        let aaguid: Uint8Array | null = null
        let credIdLen: Uint8Array | null = null
        let encodedKey: Uint8Array | null = null

        let authenticatorDataLength = rpIdHash.length + 1 + 4;
        if (this.publicKey) {
            // aaguid = CKEY_ID.slice(0, 16);
            aaguid = new Uint8Array(16);
            // 16-bit unsigned big-endian integer.
            credIdLen = new Uint8Array(2);
            credIdLen[0] = (CKEY_ID.length >> 8) & 0xff;
            credIdLen[1] = CKEY_ID.length & 0xff;
            const coseKey = await this.toCOSE(this.publicKey);
            encodedKey = new Uint8Array(CBOR.encode(coseKey));
            authenticatorDataLength += aaguid.length
                + credIdLen.byteLength
                + CKEY_ID.length
                + encodedKey.byteLength;
        }

        const authenticatorData = new Uint8Array(authenticatorDataLength);
        let offset = 0;

        // 32 bytes for the RP ID hash
        authenticatorData.set(rpIdHash, 0);
        offset += rpIdHash.length;

        // 1 byte for flags
        // user-presence flag goes on the right-most bit
        authenticatorData[rpIdHash.length] = 1;
        if (this.publicKey) {
            // attestation flag goes on the 7th bit (from the right)
            authenticatorData[rpIdHash.length] |= (1 << 6);
        }
        offset++;

        // 4 bytes for the counter. big-endian uint32
        // https://www.w3.org/TR/webauthn/#signature-counter
        authenticatorData.set(counterToBytes(counter), offset);
        offset += counterToBytes(counter).length;

        if (!this.publicKey) {
            return authenticatorData;
        }

        // Previous branch should take care of not having an aaguid, but just for safety:
        // Remove this and replace with type assertions after testing
        if (!aaguid || !credIdLen || !encodedKey) {
            throw new Error("BROKEN FUNCTIONALITY IN CRYPTO")
        }

        // 16 bytes for the Authenticator Attestation GUID
        authenticatorData.set(aaguid, offset);
        offset += aaguid.length;

        // 2 bytes for the authenticator key ID length. 16-bit unsigned big-endian integer.
        authenticatorData.set(credIdLen, offset);
        offset += credIdLen.byteLength;

        // Variable length authenticator key ID
        authenticatorData.set(CKEY_ID, offset);
        offset += CKEY_ID.length;

        console.log('credId', credIdLen);
        console.log('CKEY_ID', CKEY_ID);

        // Variable length public key
        authenticatorData.set(encodedKey, offset);

        console.log('authenticator Data', byteArrayToBase64(authenticatorData));
        console.log('authenticator Data byte array', authenticatorData);

        return authenticatorData;
    }

    public async sign(data: Uint8Array): Promise<any> {
        if (!this.privateKey) {
            throw new Error('no private key available for signing');
        }
        const buffer = new Uint8Array(data).buffer;
        return crypto.subtle.sign(
            this.getKeyParams(),
            this.privateKey,
            buffer // data, // new TextEncoder().encode(data),
        );
    }

    public async DER_encode_signature(signature) {
        console.log('Uint signature 0', signature);
        signature = new Uint8Array(signature);

        console.log('Uint signature 1', signature);

        // Extract r & s and format it in ASN1 format.
        const signHex = Array.prototype.map.call(signature, function(x) {
          return ('00' + x.toString(16)).slice(-2);
        }).join('');
        let r = signHex.substring(0, 64);  // 64 Only going to workfor 256 bit keys.
        let s = signHex.substring(64);
        let rPre = true;
        let sPre = true;

        console.log('r is ', r);
        console.log('s is ', s);

        while (r.indexOf('00') === 0) {
          r = r.substring(2);
          rPre = false;
        }

        if (rPre && parseInt(r.substring(0, 2), 16) > 127) {
          r = '00' + r;
        }

        while (s.indexOf('00') === 0) {
          s = s.substring(2);
          sPre = false;
        }

        if (sPre && parseInt(s.substring(0, 2), 16) > 127) {
          s = '00' + s;
        }

        console.log('r2 is ', r);
        console.log('s2 is ', s);

        const payload = '02' + (r.length / 2).toString(16) + r +
                      '02' + (s.length / 2).toString(16) + s;
        const der = '30' + (payload.length / 2).toString(16) + payload;

        console.log('DER signature', der);
        const fromHexString = (hexString) =>
             new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
        const der_uint = fromHexString(der);
        console.log('DER signature uint8Array', der_uint);
        return der_uint;
    }

    private getKeyParams(): EcdsaParams {
        return { name: 'ECDSA', hash: coseEllipticCurveNames[ECDSA.ellipticCurveKeys[this.algorithm]] };
    }

    private async toCOSE(key: CryptoKey): Promise<Map<number, any>> {
        // In JWK the X and Y portions are Base64URL encoded (https://tools.ietf.org/html/rfc7517#section-3),
        // which is just the right type for COSE encoding (https://tools.ietf.org/html/rfc8152#section-7),
        // we just need to convert it to a byte array.
        const exportedKey = await crypto.subtle.exportKey('jwk', key);
        const attData = new Map();
        attData.set(1, 2); // EC2 key type
        attData.set(3, this.algorithm);
        attData.set(-1, ECDSA.ellipticCurveKeys[this.algorithm]);
        // Hopefully this assertion doesn't break
        attData.set(-2, base64ToByteArray(exportedKey.x as string, true));
        attData.set(-3, base64ToByteArray(exportedKey.y as string, true));
        return attData;
    }
}

// ECDSA w/ SHA-256
const defaultPKParams = { alg: -7, type: 'public-key' };
const coseAlgorithmToKeyName = {
    [-7]: 'ECDSA',
    [-35]: 'ECDSA',
    [-36]: 'ECDSA',
};

export const getCompatibleKey = (pkParams: PublicKeyCredentialParameters []): Promise<ICOSECompatibleKey> => {
    for (const params of (pkParams || [defaultPKParams])) {
        const algorithmName = coseAlgorithmToKeyName[params.alg];
        console.log('algo name in crypto get getCompatibleKey', params);
        if (!algorithmName) {
            continue;
        }
        switch (algorithmName) {
            case 'ECDSA':
                return ECDSA.fromCOSEAlgorithm(params.alg);
            default:
                throw new Error(`unsupported key algorithm ${algorithmName}`);
        }
    }
    throw new Error(`unable to get key`);
};

export const getCompatibleKeyFromCryptoKey = (key: CryptoKey): Promise<ICOSECompatibleKey> => {
    switch (key.algorithm.name) {
        case 'ECDSA':
            return ECDSA.fromKey(key);
        default:
            throw new Error(`unsupported key algorithm ${key.algorithm.name}`);
    }
};
