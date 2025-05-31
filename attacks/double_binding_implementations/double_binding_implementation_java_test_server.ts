import { fromByteArray, toByteArray } from '../../lib/base64url.js';
import { getOriginFromUrl, parseWebauthnCreateResponse, prepareWebauthnCreateRequest } from "../../utils";
import { generateRegistrationKeyAndAttestation } from "../../webauthn";
import { DoubleBindingImplementation } from "./double_binding_implementation";

const ID_SUFFIX = 'DD';

class RegisterRequestDetails {
    formData;

    constructor(formData) {
        this.formData = formData;
    }
}

export class DoubleBindingImplementationJavaTestServer extends DoubleBindingImplementation {
    static MATCH_DOMAIN = 'localhost';

    registerRequests = [];

    onNetwork(details: chrome.webRequest.WebRequestBodyDetails) {
        const url = new URL(details.url);

        if(url.pathname === '/api/v1/register') {
            this.registerRequests.push(new RegisterRequestDetails(details.requestBody.formData));
        }

        if(url.pathname === '/api/v1/register/finish') {
            this.registerRequests[this.registerRequests.length - 1].formData.sessionToken = DoubleBindingImplementation.jsonFromRequest(details).sessionToken;
        }
    }

    
    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender, createdCredential: any) {
        const lastRegisterRequest = this.registerRequests.pop();

        let baseUrl = new URL(sender.url);
        baseUrl.pathname = '';
        
        // Start the authentication flow
        let startURL = new URL(baseUrl.toString());
        startURL.pathname = '/api/v1/register';

        let startParams = new URLSearchParams();
        for(const [k, v] of Object.entries(lastRegisterRequest.formData)) {
            startParams.append(k, `${v}`);
        }

        const startResponse = await fetch(startURL.href, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: startParams.toString() });
        const startResponseJSON = await startResponse.json();

        const requestId = startResponseJSON.request.requestId;
        const sessionToken = startResponseJSON.request.sessionToken;
        const creationOptions = parseWebauthnCreateResponse(startResponseJSON.request.publicKeyCredentialCreationOptions);

        

        // Create the credential
        const origin = getOriginFromUrl(sender.url);

        const id = createdCredential.id + ID_SUFFIX;
        const rawId = Array.from(toByteArray(id));
        const credential = await generateRegistrationKeyAndAttestation(
            origin,
            creationOptions,
            '9999',
            id,
            rawId,
        );

        const to_send = {
            credential: prepareWebauthnCreateRequest(credential),
            requestId,
            sessionToken
        }

        // Send the credential
        const result = await fetch(startResponseJSON.actions.finish, {
            method: 'POST',
            body: JSON.stringify(to_send),
            headers: { 'Content-Type': 'application/json' }
        });
    }    
}