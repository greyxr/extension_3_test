import base64js from 'base64-js';

function ensureUint8Array(arg: ArrayBuffer | Uint8Array): Uint8Array {
    if (arg instanceof ArrayBuffer) {
        return new Uint8Array(arg);
    }
    return arg;
}

function base64UrlToMime(code: string): string {
    return code.replace(/-/g, '+').replace(/_/g, '/') + '===='.substring(0, (4 - (code.length % 4)) % 4);
}

function mimeBase64ToUrl(code: string): string {
    return code.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function fromByteArray(bytes: ArrayBuffer | Uint8Array): string {
    return mimeBase64ToUrl(base64js.fromByteArray(ensureUint8Array(bytes)));
}

export function toByteArray(code: string): Uint8Array {
    return base64js.toByteArray(base64UrlToMime(code));
} 