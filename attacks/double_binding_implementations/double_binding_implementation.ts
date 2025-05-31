export abstract class DoubleBindingImplementation {
    abstract onNetwork(details: chrome.webRequest.WebRequestBodyDetails);
    abstract onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender, createdCredential: Credential);

    static jsonFromRequest(details: chrome.webRequest.WebRequestBodyDetails): any {
        if(!details.requestBody) {
            return { cancel: false };
        }

        if(!details.requestBody.raw) {
            return { cancel: false };
        }

        const text = new TextDecoder().decode(details.requestBody.raw[0].bytes);

        try {
            return JSON.parse(text);
        } catch(e) {
            // Error parsing JSON
            return {};
        }
    }
}