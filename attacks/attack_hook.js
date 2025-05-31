// export abstract class AttackHook {
//     onNetwork(details: chrome.webRequest.WebRequestBodyDetails): chrome.webRequest.BlockingResponse {
//         return { cancel: false };
//     }

//     abstract onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>;

//     abstract onCredentialGet(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender): Promise<WebAuthnResponseMessage | WebAuthnErrorMessage>;

//     abstract getName(): string;
// }