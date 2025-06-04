import { fromByteArray, toByteArray } from './lib/base64url.js';
// We need to construct the originalCredentialObject explicitly
// https://stackoverflow.com/a/75318025
export function publicKeyCredentialToObject(c) {
    let response = {
        clientDataJSON: c.response.clientDataJSON
    };
    if (c.response instanceof AuthenticatorAssertionResponse) {
        response = {
            ...response,
            authenticatorData: c.response.authenticatorData,
            signature: c.response.signature,
            userHandle: c.response.userHandle
        };
    }
    else if (c.response instanceof AuthenticatorAttestationResponse) {
        response = {
            ...response,
            attestationObject: c.response.attestationObject
        };
    }
    return {
        type: c.type,
        id: c.id,
        rawId: c.rawId,
        response
    };
}
// Instead of re-writing all of the webauthn types, handle byte arrays manually
export function webauthnStringify(o) {
    return JSON.stringify(o, (k, v) => {
        if (v) {
            if (v.constructor.name === 'ArrayBuffer') {
                // Because Buffer.from(ArrayBuffer) was not working on firefox
                v = new Uint8Array(v);
            }
            if (v.constructor.name === 'Uint8Array') {
                return {
                    data: Buffer.from(v).toString('base64'),
                    kr_ser_ty: 'Uint8Array',
                };
            }
        }
        return v;
    });
}
export function webauthnParse(j) {
    return JSON.parse(j, (k, v) => {
        if (v && v.kr_ser_ty === 'Uint8Array') {
            return Uint8Array.from(Buffer.from(v.data, 'base64'));
        }
        if (v && v.kr_ser_ty === 'ArrayBuffer') {
            return Buffer.from(v.data, 'base64').buffer;
        }
        return v;
    });
}
// Converts byte data for a webauthn create request into base64url
export function prepareWebauthnCreateRequest(keyResp) {
    return {
        type: 'public-key',
        id: keyResp.id,
        rawId: keyResp.id,
        authenticatorAttachment: null,
        clientExtensionResults: {},
        response: {
            attestationObject: fromByteArray(keyResp.response.attestationObject),
            clientDataJSON: fromByteArray(keyResp.response.clientDataJSON),
            transports: [],
        }
    };
}
// authenticatorAttachment: null,
//         getClientExtensionResults: () => ({}),
//         id: keyID,
//         rawId: base64ToByteArray(keyID, true),
//         response: {
//             attestationObject,
//             clientDataJSON: base64ToByteArray(window.btoa(clientData), true),
//             transports:[],
//         },
//         type: 'public-key',
// Parse the base64url data in the response
export function parseWebauthnCreateResponse(resp) {
    let respCopy = JSON.parse(JSON.stringify(resp)); // TODO: Replace with structuredClone
    respCopy.user.id = toByteArray(respCopy.user.id);
    respCopy.challenge = toByteArray(respCopy.challenge);
    return respCopy;
}
export function concatenate(...arrays) {
    const totalLength = arrays.map(({ length }) => length).reduce((v1, v2) => v1 + v2, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
// Copyright 2014 Google Inc. All rights reserved
//
// Use of this source code is governed by a BSD-style
// license that can be found at
// https://developers.google.com/open-source/licenses/bsd
/**
 * Gets the scheme + origin from a web url.
 * @param {string} url Input url
 * @return {?string} Scheme and origin part if url parses
 */
export function getOriginFromUrl(url) {
    const re = new RegExp('^(https?://)[^/]+/?');
    const originarray = re.exec(url);
    if (originarray == null) {
        return null;
    }
    let origin = originarray[0];
    while (origin.charAt(origin.length - 1) === '/') {
        origin = origin.substring(0, origin.length - 1);
    }
    return origin;
}
export function getDomainFromOrigin(origin) {
    return origin.replace(new RegExp('^https?://'), '')
        .replace(new RegExp(':[0-9]+$'), '');
}
export function byteArrayToBase64(arr, urlEncoded = false) {
    const result = btoa(String.fromCharCode(...arr));
    if (urlEncoded) {
        return result.replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    }
    return result;
}
export function base64ToByteArray(str, urlEncoded = false) {
    let rawInput = str;
    if (urlEncoded) {
        rawInput = padString(rawInput)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
    }
    return Uint8Array.from(atob(rawInput), (c) => c.charCodeAt(0));
}
function padString(input) {
    let result = input;
    while (result.length % 4) {
        result += '=';
    }
    return result;
}
