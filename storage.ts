import { ivLength, keyExportFormat, saltLength } from './constants';
import { base64ToByteArray, byteArrayToBase64, concatenate } from './utils';

function logHelper(...msg: any[]): void {
    console.log('[Storage] ', msg);
}

export const keyExists = (key: string): Promise<boolean> => {
    return new Promise<boolean>(async (res, rej) => {
        chrome.storage.sync.get(key, (resp) => {
            if (!!chrome.runtime.lastError) {
                rej(chrome.runtime.lastError);
            } else {
                res(!!resp[key]);
            }
        });
    });
};

// export const deleteKey = (key: string) => {
//     return new Promise(async (res, _) => {
//         chrome.storage.sync.remove(key);
//         res();
//     });
// };

const getWrappingKey = async (pin: string, salt: Uint8Array): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const derivationKey = await crypto.subtle.importKey(
        'raw',
        enc.encode(pin),
        { name: 'PBKDF2', length: 256 },
        false,
        ['deriveBits', 'deriveKey'],
    );
    const buffer = new Uint8Array(salt).buffer;
    const pbkdf2Params: Pbkdf2Params = {
        hash: 'SHA-256',
        iterations: 100000,
        name: 'PBKDF2',
        salt: buffer,
    };
    return crypto.subtle.deriveKey(
        pbkdf2Params,
        derivationKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey'],
    );
};

export const fetchKey = async (key: string, pin: string): Promise<any> => {
    try {
        const response = await chrome.storage.sync.get(key)
        if (!!chrome.runtime.lastError) {
            throw (chrome.runtime.lastError);
        }
        logHelper("Retrieved key:", response)
        const payload = base64ToByteArray(response[key].key, true);
        const saltByteLength = payload[0];
        const ivByteLength = payload[1];
        const keyAlgorithmByteLength = payload[2];
        const wrappedKeyLength = payload[3];
        let offset = 4;
        const salt = payload.subarray(offset, offset + saltByteLength);
        offset += saltByteLength;
        const iv = payload.subarray(offset, offset + ivByteLength);
        offset += ivByteLength;
        const keyAlgorithmBytes = payload.subarray(offset, offset + keyAlgorithmByteLength);
        offset += keyAlgorithmByteLength;
        const keyBytes = payload.subarray(offset, offset + wrappedKeyLength);
        offset += wrappedKeyLength;
        const counter = payload[offset];
        logHelper('In authentication function1.3.3');
        const wrappingKey = await getWrappingKey(pin, salt);
        const wrapAlgorithm: AesGcmParams = {
            iv,
            name: 'AES-GCM',
        };
        const unwrappingKeyAlgorithm = await JSON.parse(new TextDecoder().decode(keyAlgorithmBytes));
        const unwrappedKey = await crypto.subtle.unwrapKey(
            keyExportFormat,
            keyBytes,
            wrappingKey,
            wrapAlgorithm,
            unwrappingKeyAlgorithm,
            true,
            ['sign'],
        )
        return {key: unwrappedKey, userId: base64ToByteArray(response[key].userId, true)}
    } catch (e) {
        logHelper("Error caught in fetchKey!")
        throw e
    }
    // return new Promise<CryptoKey>(async (res, rej) => {
    //     chrome.storage.sync.get(key, async (resp) => {
    //         const payload = base64ToByteArray(resp[key], true);
    //         const saltByteLength = payload[0];
    //         const ivByteLength = payload[1];
    //         const keyAlgorithmByteLength = payload[2];
    //         const wrappedKeyLength = payload[3];
    //         let offset = 4;
    //         const salt = payload.subarray(offset, offset + saltByteLength);
    //         offset += saltByteLength;
    //         const iv = payload.subarray(offset, offset + ivByteLength);
    //         offset += ivByteLength;
    //         const keyAlgorithmBytes = payload.subarray(offset, offset + keyAlgorithmByteLength);
    //         offset += keyAlgorithmByteLength;
    //         const keyBytes = payload.subarray(offset, offset + wrappedKeyLength);
    //         offset += wrappedKeyLength;
    //         const counter = payload[offset];

    //         logHelper('In authentication function1.3.3');
    //         const wrappingKey = await getWrappingKey(pin, salt);
    //         const wrapAlgorithm: AesGcmParams = {
    //             iv,
    //             name: 'AES-GCM',
    //         };
    //         const unwrappingKeyAlgorithm = JSON.parse(new TextDecoder().decode(keyAlgorithmBytes));
    //         crypto.subtle.unwrapKey(
    //             keyExportFormat,
    //             keyBytes,
    //             wrappingKey,
    //             wrapAlgorithm,
    //             unwrappingKeyAlgorithm,
    //             true,
    //             ['sign'],
    //         ).then(res, rej);
    //     });
    // });
};

export const incrementCounter = async (key: string, pin: string, userId: Uint8Array, incrementValue: number = 1,): Promise<void> => {

    try {
        const response = await chrome.storage.sync.get(key)
        if (!!chrome.runtime.lastError) {
            throw (chrome.runtime.lastError);
        }
        let payload = base64ToByteArray(response[key].key, true);
        const saltByteLength = payload[0];
        const ivByteLength = payload[1];
        const keyAlgorithmByteLength = payload[2];
        const wrappedKeyLength = payload[3];
        let offset = 4;
        offset += saltByteLength;
        offset += ivByteLength;
        offset += keyAlgorithmByteLength;
        offset += wrappedKeyLength;
        // Update the counter
        payload[offset] = payload[offset] + incrementValue;
        chrome.storage.sync.set({ [key]: {"key": byteArrayToBase64(payload, true), "userId": byteArrayToBase64(userId)} })
    } catch (e) {
        logHelper("Error in incrementCounter");
        throw e;
    }
    // return new Promise(async (res, rej) => {
    //     chrome.storage.sync.get(key, async (resp) => {
    //         if (!!chrome.runtime.lastError) {
    //             rej(chrome.runtime.lastError);
    //             return;
    //         }

    //         let payload = base64ToByteArray(resp[key].key, true);
    //         const saltByteLength = payload[0];
    //         const ivByteLength = payload[1];
    //         const keyAlgorithmByteLength = payload[2];
    //         const wrappedKeyLength = payload[3];
    //         let offset = 4;
    //         offset += saltByteLength;
    //         offset += ivByteLength;
    //         offset += keyAlgorithmByteLength;
    //         offset += wrappedKeyLength;

    //         // Update the counder
    //         payload[offset] = payload[offset] + incrementValue;

    //         chrome.storage.sync.set({ [key]: {"key": byteArrayToBase64(payload, true), "userId": userId} }, () => {
    //             if (!!chrome.runtime.lastError) {
    //                 rej(chrome.runtime.lastError);
    //             } else {
    //                 res();
    //             }
    //         });
    //     });
    // });
}

export const fetchCounter = async (key: string, pin: string): Promise<number> => {
    return new Promise<number>(async (res, rej) => {
        chrome.storage.sync.get(key, async (resp) => {
            if (!!chrome.runtime.lastError) {
                rej(chrome.runtime.lastError);
                return;
            }
            const payload = base64ToByteArray(resp[key].key, true);
            const saltByteLength = payload[0];
            const ivByteLength = payload[1];
            const keyAlgorithmByteLength = payload[2];
            const wrappedKeyLength = payload[3];
            let offset = 4;
            offset += saltByteLength;
            offset += ivByteLength;
            offset += keyAlgorithmByteLength;
            offset += wrappedKeyLength;
            const counter = payload[offset];
            
            res(counter);
        });
    });
}

export const saveKey = (key: string, privateKey: CryptoKey, pin: string, userId: Uint8Array): Promise<void> => {
    return new Promise<void>(async (res, rej) => {
        if (!pin) {
            rej('no pin provided');
            return;
        }
        const salt = crypto.getRandomValues(new Uint8Array(saltLength));
        const wrappingKey = await getWrappingKey(pin, salt);
        const iv = crypto.getRandomValues(new Uint8Array(ivLength));
        const wrapAlgorithm: AesGcmParams = {
            iv,
            name: 'AES-GCM',
        };

        const wrappedKeyBuffer = await crypto.subtle.wrapKey(
            keyExportFormat,
            privateKey,
            wrappingKey,
            wrapAlgorithm,
        );
        const wrappedKey = new Uint8Array(wrappedKeyBuffer);
        const keyAlgorithm = new TextEncoder().encode(JSON.stringify(privateKey.algorithm));
        const counter = 11;
        const payload = concatenate(
            Uint8Array.of(saltLength, ivLength, keyAlgorithm.length, wrappedKey.length),
            salt,
            iv,
            keyAlgorithm,
            wrappedKey,
            Uint8Array.from([counter]));
            logHelper("key:", payload);
        chrome.storage.sync.set({ [key]: {"key": byteArrayToBase64(payload, true), "userId": byteArrayToBase64(userId, true)} }, () => {
            if (!!chrome.runtime.lastError) {
                rej(chrome.runtime.lastError);
            } else {
                res();
            }
        });
    });
};
